import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Popover, useMediaQuery } from '@mui/material';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { GET_MY_NOTIFICATIONS } from '../../../apollo/user/query';
import { MARK_ALL_NOTIFICATIONS_READ, MARK_NOTIFICATION_READ } from '../../../apollo/user/mutation';
import { liveNotificationVar } from '../../../apollo/store';
import { Notification } from '../../types/notification/notification';
import { NotificationStatus } from '../../enums/notification.enum';
import NotificationItem from './NotificationItem';

const MENU_LIMIT = 8;
const badgeText = (count: number) => (count > 9 ? '9+' : String(count));

interface NotificationBellProps {
	/** From useNotificationFeed in Top (one listener per page) **/
	unread: number;
}

/**
 * Navbar bell for signed-in members: live unread badge; dropdown of the latest entries on wide screens,
 * a link to the Notification Center on phones.
 */
const NotificationBell = ({ unread }: NotificationBellProps) => {
	const router = useRouter();
	const narrow = useMediaQuery('(max-width: 899px)');
	const live = useReactiveVar(liveNotificationVar);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);
	const [pulse, setPulse] = useState(false);

	const { data, loading, error, refetch } = useQuery(GET_MY_NOTIFICATIONS, {
		skip: !open,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
		variables: { input: { page: 1, limit: MENU_LIMIT } },
	});
	const [markRead] = useMutation(MARK_NOTIFICATION_READ, { refetchQueries: ['GetUnreadNotificationCount'] });
	const [markAll, { loading: markingAll }] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
		refetchQueries: ['GetUnreadNotificationCount'],
	});
	const list: Notification[] = data?.getMyNotifications?.list ?? [];

	/** LIFECYCLES **/
	useEffect(() => setOpen(false), [router.asPath]);

	// A live arrival: a short nudge on the bell, and a fresh list if the menu is open
	useEffect(() => {
		if (!live) return;
		setPulse(true);
		const timer = window.setTimeout(() => setPulse(false), 700);
		if (open) refetch().catch(() => undefined);
		return () => window.clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [live]);

	/** HANDLERS **/
	const openEntry = (notification: Notification) => {
		setOpen(false);
		if (notification.notificationStatus === NotificationStatus.WAIT) {
			markRead({ variables: { notificationId: notification._id } }).catch(() => undefined);
		}
	};

	const markAllRead = async () => {
		try {
			await markAll();
			await refetch();
		} catch {
			/* the error link already reports it */
		}
	};

	const label = unread ? `Notifications, ${unread} unread` : 'Notifications';
	const face = (
		<>
			<NotificationsNoneRoundedIcon aria-hidden />
			{unread > 0 && (
				<span className="gv-bell__badge" aria-hidden>
					{badgeText(unread)}
				</span>
			)}
		</>
	);

	if (narrow) {
		return (
			<Link href="/notifications" className={`gv-bell ${pulse ? 'is-pulsing' : ''}`} aria-label={label}>
				{face}
			</Link>
		);
	}

	return (
		<>
			<button
				type="button"
				ref={buttonRef}
				className={`gv-bell ${open ? 'is-open' : ''} ${pulse ? 'is-pulsing' : ''}`}
				aria-label={label}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls="gv-note-menu"
				onClick={() => setOpen((value) => !value)}
			>
				{face}
			</button>

			<Popover
				open={open}
				anchorEl={buttonRef.current}
				onClose={() => setOpen(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				disableScrollLock
				PaperProps={{
					id: 'gv-note-menu',
					className: 'gv-note-menu',
					role: 'dialog',
					'aria-label': 'Notifications',
				}}
			>
				<div className="gv-note-menu__head">
					<span className="gv-note-menu__tag">Notifications</span>
					<span className="gv-note-menu__count">{unread ? `${unread} unread` : 'All read'}</span>
					<button
						type="button"
						className="gv-note-menu__all"
						onClick={markAllRead}
						disabled={!unread || markingAll}
					>
						Mark all read
					</button>
				</div>

				<div className="gv-note-menu__body" aria-busy={loading}>
					{loading && !list.length ? (
						<ul className="gv-note-list" aria-hidden>
							{[0, 1, 2].map((index) => (
								<li key={index} className="gv-note gv-note--menu gv-note--skeleton">
									<span className="gv-note__glyph" />
									<div className="gv-note__body">
										<span className="gv-note__bar" />
										<span className="gv-note__bar gv-note__bar--short" />
									</div>
								</li>
							))}
						</ul>
					) : error && !list.length ? (
						<div className="gv-note-state">
							<p>Couldn’t load notifications.</p>
							<button type="button" className="gv-note-state__retry" onClick={() => refetch().catch(() => undefined)}>
								Try again
							</button>
						</div>
					) : list.length ? (
						<ul className="gv-note-list">
							{list.map((notification) => (
								<NotificationItem key={notification._id} notification={notification} variant="menu" onOpen={openEntry} />
							))}
						</ul>
					) : (
						<div className="gv-note-state">
							<p className="gv-note-state__title">Nothing yet</p>
							<p>Likes, comments, new followers, support replies and announcements land here.</p>
						</div>
					)}
				</div>

				<Link href="/notifications" className="gv-note-menu__foot" onClick={() => setOpen(false)}>
					Open notification center
				</Link>
			</Popover>
		</>
	);
};

export default NotificationBell;
