import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import moment from 'moment';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { gsap } from 'gsap';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import NotificationItem from '../../libs/components/notification/NotificationItem';
import {
	NotificationCategoryKey,
	isNotificationCategory,
	notificationCategories,
} from '../../libs/components/notification/notificationMeta';
import { MOTION_QUERY } from '../../libs/components/homepage/homeMotion';
import { GET_MY_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT } from '../../apollo/user/query';
import { MARK_ALL_NOTIFICATIONS_READ, MARK_NOTIFICATION_READ } from '../../apollo/user/mutation';
import { liveNotificationVar, userVar } from '../../apollo/store';
import { Notification } from '../../libs/types/notification/notification';
import { NotificationStatus } from '../../libs/enums/notification.enum';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 20;

/** "Today", "Yesterday" or the date, for the day headings **/
const dayLabel = (date: Date) => {
	const day = moment(date);
	if (day.isSame(moment(), 'day')) return 'Today';
	if (day.isSame(moment().subtract(1, 'day'), 'day')) return 'Yesterday';
	return day.format('DD MMM YYYY');
};

const Notifications: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const live = useReactiveVar(liveNotificationVar);
	const signedIn = Boolean(user?._id);
	const rootRef = useRef<HTMLDivElement>(null);

	const category: NotificationCategoryKey = isNotificationCategory(router.query.category) ? router.query.category : 'all';
	const unreadOnly = router.query.unread === '1';
	const typeList = notificationCategories.find((entry) => entry.key === category)?.types;

	const [page, setPage] = useState(1);
	const [items, setItems] = useState<Notification[]>([]);
	const [total, setTotal] = useState(0);
	const [busyId, setBusyId] = useState<string | null>(null);
	const itemsRef = useRef<Notification[]>([]);
	itemsRef.current = items;

	/** APOLLO REQUESTS — the caller's own notifications only (the receiver comes from the token) **/
	const { data: countData } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, { skip: !signedIn, fetchPolicy: 'cache-first' });
	const unread: number = countData?.getUnreadNotificationCount ?? 0;

	const { data, loading, error, refetch } = useQuery(GET_MY_NOTIFICATIONS, {
		skip: !signedIn || !router.isReady,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		variables: { input: { page, limit: PAGE_SIZE, search: { typeList, unreadOnly } } },
	});
	const [markRead] = useMutation(MARK_NOTIFICATION_READ, { refetchQueries: ['GetUnreadNotificationCount'] });
	const [markAll, { loading: markingAll }] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
		refetchQueries: ['GetUnreadNotificationCount'],
	});

	/** LIFECYCLES **/
	// A new filter starts again from page 1
	useEffect(() => {
		setPage(1);
		setItems([]);
	}, [category, unreadOnly, signedIn]);

	useEffect(() => {
		const result = data?.getMyNotifications;
		if (!result) return;
		setTotal(result.metaCounter?.[0]?.total ?? 0);
		setItems((current) => {
			if (page === 1) return result.list;
			const seen = new Set(current.map((entry) => entry._id));
			return [...current, ...result.list.filter((entry: Notification) => !seen.has(entry._id))];
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	// Live arrivals that belong to the current view go on top
	useEffect(() => {
		if (!live) return;
		if (typeList && !typeList.includes(live.notificationType)) return;
		if (itemsRef.current.some((entry) => entry._id === live._id)) return;
		setItems((current) => (current.some((entry) => entry._id === live._id) ? current : [live, ...current]));
		setTotal((count) => count + 1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [live]);

	// The page's one load moment: the headline rises out of its masks
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			gsap.from(root.querySelectorAll('.gv-nc-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
		});
		return () => mm.revert();
	}, []);

	/** HANDLERS **/
	const setFilter = (next: { category?: NotificationCategoryKey; unread?: boolean }) => {
		const nextCategory = next.category ?? category;
		const nextUnread = next.unread ?? unreadOnly;
		const query: Record<string, string> = {};
		if (nextCategory !== 'all') query.category = nextCategory;
		if (nextUnread) query.unread = '1';
		router.push({ pathname: '/notifications', query }, undefined, { scroll: false, shallow: true });
	};

	const markLocal = (predicate: (entry: Notification) => boolean) =>
		setItems((current) =>
			unreadOnly
				? current.filter((entry) => !predicate(entry))
				: current.map((entry) =>
						predicate(entry) ? { ...entry, notificationStatus: NotificationStatus.READ, readAt: new Date() } : entry,
				  ),
		);

	const markOne = async (notification: Notification) => {
		if (notification.notificationStatus !== NotificationStatus.WAIT) return;
		setBusyId(notification._id);
		try {
			await markRead({ variables: { notificationId: notification._id } });
			markLocal((entry) => entry._id === notification._id);
			if (unreadOnly) setTotal((count) => Math.max(0, count - 1));
		} catch {
			/* the error link already reports it */
		} finally {
			setBusyId(null);
		}
	};

	const markEverything = async () => {
		try {
			await markAll();
			markLocal((entry) => entry.notificationStatus === NotificationStatus.WAIT);
			if (unreadOnly) setTotal(0);
		} catch {
			/* the error link already reports it */
		}
	};

	/** PRESENTATION **/
	const groups = useMemo(() => {
		const byDay: { label: string; entries: Notification[] }[] = [];
		items.forEach((entry) => {
			const label = dayLabel(entry.createdAt);
			const last = byDay[byDay.length - 1];
			if (last?.label === label) last.entries.push(entry);
			else byDay.push({ label, entries: [entry] });
		});
		return byDay;
	}, [items]);

	const firstLoad = loading && !items.length;
	const remaining = Math.max(0, total - items.length);
	const categoryLabel = notificationCategories.find((entry) => entry.key === category)?.label ?? 'All';

	return (
		<div className="gv-catalog gv-nc" ref={rootRef}>
			<Head>
				<title>{unread ? `(${unread}) ` : ''}Notifications | Gameverse</title>
			</Head>

			{/** 00 INBOX — night: headline and live readout **/}
			<section className="gv-nc-hero" aria-labelledby="nc-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					<img src="/img/gameverse/hero.svg" alt="" />
					<span className="gv-cat-hero__tint" />
					<span className="gv-cat-hero__grain" />
				</div>
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>

				<div className="gv-nc-hero__inner">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>00</span>Inbox
					</p>
					<h1 className="gv-nc-hero__title" id="nc-title">
						<span className="gv-nc-hero__line">
							<span className="gv-nc-hero__mask">
								<span className="gv-nc-hero__word">What’s</span>
							</span>
						</span>
						<span className="gv-nc-hero__line gv-nc-hero__line--2">
							<span className="gv-nc-hero__mask">
								<span className="gv-nc-hero__word">new</span>
							</span>
						</span>
						<span className="gv-visually-hidden">: notifications</span>
					</h1>
					<p className="gv-nc-hero__readout" aria-live="polite">
						{signedIn ? (
							<>
								<span>{unread ? `${unread} unread` : 'All caught up'}</span>
								{data && (
									<span>
										{total} {category === 'all' ? '' : `${categoryLabel.toLowerCase()} `}
										{unreadOnly ? 'unread ' : ''}
										{total === 1 ? 'notification' : 'notifications'}
									</span>
								)}
							</>
						) : (
							<span>Sign in to see yours</span>
						)}
					</p>
				</div>
			</section>

			{/** 01 FEED — paper: categories, unread toggle, the list by day **/}
			<section className="gv-nc-desk" aria-label="Notifications">
				<div className="gv-nc-desk__inner">
					{!signedIn ? (
						<div className="gv-nc-gate">
							<p className="gv-chapter" aria-hidden>
								<span>01</span>Signed out
							</p>
							<h2 className="gv-nc-gate__title">Sign in to see your notifications</h2>
							<p>Likes, comments, new followers, support replies and announcements are kept here for you.</p>
							<Link href="/account/join" className="gv-nc-cta gv-nc-cta--solid">
								Log in / Register
							</Link>
						</div>
					) : (
						<>
							<div className="gv-nc-bar">
								<div className="gv-nc-tabs" role="tablist" aria-label="Notification categories">
									{notificationCategories.map((entry) => (
										<button
											key={entry.key}
											type="button"
											role="tab"
											aria-selected={category === entry.key}
											aria-controls="nc-feed"
											className={`gv-nc-tab ${category === entry.key ? 'is-active' : ''}`}
											onClick={() => setFilter({ category: entry.key })}
										>
											{entry.label}
										</button>
									))}
								</div>
								<div className="gv-nc-actions">
									<button
										type="button"
										className={`gv-nc-toggle ${unreadOnly ? 'is-on' : ''}`}
										aria-pressed={unreadOnly}
										onClick={() => setFilter({ unread: !unreadOnly })}
									>
										<span className="gv-nc-toggle__box" aria-hidden />
										Unread only
									</button>
									<button
										type="button"
										className="gv-nc-cta gv-nc-cta--solid"
										onClick={markEverything}
										disabled={!unread || markingAll}
									>
										Mark all read
									</button>
								</div>
							</div>

							<div className="gv-nc-feed" id="nc-feed" role="tabpanel" aria-busy={loading}>
								{firstLoad ? (
									<ul className="gv-note-list" aria-hidden>
										{[0, 1, 2, 3].map((index) => (
											<li key={index} className="gv-note gv-note--page gv-note--skeleton">
												<span className="gv-note__glyph" />
												<div className="gv-note__body">
													<span className="gv-note__bar" />
													<span className="gv-note__bar gv-note__bar--short" />
												</div>
											</li>
										))}
									</ul>
								) : error && !items.length ? (
									<div className="gv-nc-state">
										<p className="gv-nc-state__title">Couldn’t load your notifications</p>
										<p>Check your connection and try again.</p>
										<button type="button" className="gv-nc-cta" onClick={() => refetch().catch(() => undefined)}>
											Try again
										</button>
									</div>
								) : !items.length ? (
									<div className="gv-nc-state">
										<p className="gv-nc-state__title">
											{unreadOnly ? 'No unread notifications' : category === 'all' ? 'Nothing here yet' : `No ${categoryLabel.toLowerCase()} yet`}
										</p>
										<p>
											{unreadOnly
												? 'You’re all caught up.'
												: 'Likes, comments, new followers, support replies and announcements show up here as they happen.'}
										</p>
										{(unreadOnly || category !== 'all') && (
											<button type="button" className="gv-nc-cta" onClick={() => setFilter({ category: 'all', unread: false })}>
												Show everything
											</button>
										)}
									</div>
								) : (
									<>
										{groups.map((group) => (
											<section key={group.label} className="gv-nc-day" aria-label={group.label}>
												<h2 className="gv-nc-day__label">{group.label}</h2>
												<ul className="gv-note-list">
													{group.entries.map((notification) => (
														<NotificationItem
															key={notification._id}
															notification={notification}
															variant="page"
															onOpen={markOne}
															onMarkRead={markOne}
															busy={busyId === notification._id}
														/>
													))}
												</ul>
											</section>
										))}
										{remaining > 0 && (
											<button
												type="button"
												className="gv-nc-cta gv-nc-more"
												disabled={loading}
												onClick={() => setPage((value) => value + 1)}
											>
												{loading ? 'Loading…' : `Load more (${remaining})`}
											</button>
										)}
									</>
								)}
							</div>
						</>
					)}
				</div>
			</section>
		</div>
	);
};

export default withLayoutCatalog(Notifications);
