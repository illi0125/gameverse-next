import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import Notice from '../../libs/components/cs/Notice';
import Faq from '../../libs/components/cs/Faq';
import Inquiry from '../../libs/components/cs/Inquiry';
import Assistant from '../../libs/components/cs/Assistant';
import {
	CsTabKey,
	csTabs,
	faqInquiry,
	faqTopics,
	isCsTab,
	noticesInquiry,
	topicMeta,
} from '../../libs/components/cs/csMeta';
import { MOTION_QUERY, pad } from '../../libs/components/homepage/homeMotion';
import { GET_ASSISTANT_STATUS, GET_NOTICES } from '../../apollo/user/query';
import { Notice as NoticeItem } from '../../libs/types/notice/notice';
import { NoticeCategory } from '../../libs/enums/notice.enum';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const reducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CS: NextPage = () => {
	const router = useRouter();

	/** HANDLERS **/
	const changeTabHandler = (tab: string) => {
		router.push(
			{
				pathname: '/cs',
				query: { tab: tab },
			},
			undefined,
			{ scroll: false },
		);
	};
	/** AI assistant: its tab exists only while the API reports it enabled (off switch on the server) **/
	const { data: assistantData, error: assistantError } = useQuery(GET_ASSISTANT_STATUS, {
		fetchPolicy: 'cache-and-network',
	});
	const assistantEnabled = assistantData?.getAssistantStatus?.enabled === true;
	const assistantKnown = Boolean(assistantData || assistantError);
	const visibleTabs = csTabs.filter((entry) => entry.key !== 'ai' || assistantEnabled);

	const requestedTab: CsTabKey = isCsTab(router.query.tab) ? router.query.tab : 'notice';
	const tab: CsTabKey = requestedTab === 'ai' && assistantKnown && !assistantEnabled ? 'notice' : requestedTab;

	/** APOLLO REQUESTS (public, ACTIVE only; managed in Admin › Support) **/
	const { loading: faqLoading, data: faqData, error: faqError } = useQuery(GET_NOTICES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: faqInquiry },
	});
	const { loading: noticesLoading, data: noticesData, error: noticesError } = useQuery(GET_NOTICES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: noticesInquiry },
	});
	const faqs: NoticeItem[] = faqData?.getNotices?.list ?? [];
	const notices: NoticeItem[] = noticesData?.getNotices?.list ?? [];

	/** FAQ discovery (client side: topic + text over question and answer) **/
	const rootRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLElement>(null);
	const [searchText, setSearchText] = useState<string>('');
	const [topicKey, setTopicKey] = useState<string>(faqTopics[0].key);

	const topicCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		faqTopics.forEach((entry) => {
			counts[entry.key] = faqs.filter((faq) => faq.noticeTopic === entry.topic).length;
		});
		return counts;
	}, [faqs]);
	const topicsWithAnswers = faqTopics.filter((entry) => topicCounts[entry.key] > 0).length;

	const scrollToContent = () => {
		contentRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
	};

	const openTab = (next: CsTabKey, scroll = false) => {
		if (next !== tab) changeTabHandler(next);
		if (scroll) window.requestAnimationFrame(scrollToContent);
	};

	const openTopic = (key: string) => {
		setTopicKey(key);
		setSearchText('');
		openTab('faq', true);
	};

	/** An answer's source: the FAQ entry (its topic, searched by title) or the notices list **/
	const openSource = (source: NoticeItem) => {
		if (source.noticeCategory === NoticeCategory.FAQ) {
			setTopicKey(topicMeta(source.noticeTopic).key);
			setSearchText(source.noticeTitle);
			openTab('faq', true);
		} else openTab('notice', true);
	};

	/** PRESENTATION **/
	const latest = notices.find((notice) => notice.noticeEvent) ?? notices[0];
	const readoutReady = Boolean(faqData && noticesData);
	const tabCount: Record<CsTabKey, string> = {
		faq: faqData ? `${faqs.length} answer${faqs.length === 1 ? '' : 's'}` : '—',
		notice: noticesData ? `${notices.length} posted` : '—',
		inquiry: 'Reply in your history',
		ai: 'Answers in seconds',
	};

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: headline lines rise out of their masks
			gsap.from(root.querySelectorAll('.gv-cs-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
			const hero = root.querySelector('.gv-cs-hero');
			gsap.to(root.querySelector('.gv-cs-hero .gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
		});
		return () => mm.revert();
	}, []);

	return (
		<div className="gv-catalog gv-cs" ref={rootRef}>
			<Head>
				<title>Help | Gameverse</title>
			</Head>

			{/** 00 HELP — night: headline, live readout, latest notice, help search **/}
			<section className="gv-cs-hero" aria-labelledby="cs-title">
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

				<div className="gv-cs-hero__inner">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>00</span>Help desk
					</p>
					<h1 className="gv-cs-hero__title" id="cs-title">
						<span className="gv-cs-hero__line">
							<span className="gv-cs-hero__mask">
								<span className="gv-cs-hero__word">Need a</span>
							</span>
						</span>
						<span className="gv-cs-hero__line gv-cs-hero__line--2">
							<span className="gv-cs-hero__mask">
								<span className="gv-cs-hero__word">hand?</span>
							</span>
						</span>
					</h1>
					<p className="gv-cs-hero__lead">
						Search the answers, read the latest notices, or send the team a question and follow it here.
					</p>
					<p className="gv-cs-hero__readout">
						<span>
							{readoutReady
								? `${faqs.length} answer${faqs.length === 1 ? '' : 's'} in ${topicsWithAnswers} topic${
										topicsWithAnswers === 1 ? '' : 's'
								  }`
								: 'Connecting'}
						</span>
						{readoutReady && (
							<span>
								{notices.length} notice{notices.length === 1 ? '' : 's'}
							</span>
						)}
					</p>
					<nav className="gv-cs-hero__jump" aria-label="FAQ topics">
						<span aria-hidden>Jump to</span>
						{faqTopics.map((entry) => (
							<button type="button" key={entry.key} onClick={() => openTopic(entry.key)}>
								{entry.label}
							</button>
						))}
					</nav>
				</div>

				{latest && (
					<aside className="gv-cs-hero__signal" aria-label={latest.noticeEvent ? 'Current event' : 'Latest notice'}>
						<p className="gv-cs-hero__signal-kicker">{latest.noticeEvent ? 'Event' : 'Latest notice'}</p>
						<div className="gv-cs-hero__signal-plate">
							<Moment className="gv-cs-hero__signal-date" format="DD MMM YYYY">
								{latest.createdAt}
							</Moment>
							<h2 className="gv-cs-hero__signal-title">{latest.noticeTitle}</h2>
							<button type="button" className="gv-cs-hero__signal-go" onClick={() => openTab('notice', true)}>
								Read notices
							</button>
						</div>
					</aside>
				)}

				<form
					className="gv-cs-hero__console gv-cat-search"
					role="search"
					onSubmit={(event) => {
						event.preventDefault();
						openTab('faq', true);
					}}
				>
					<label className="gv-cat-search__prompt" htmlFor="cs-search">
						Search answers
					</label>
					<input
						id="cs-search"
						className="gv-cs-search__input"
						type="search"
						placeholder="Password, discount, add a game…"
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						autoComplete="off"
					/>
					{searchText && (
						<button
							type="button"
							className="gv-cs-search__clear"
							aria-label="Clear search"
							onClick={() => setSearchText('')}
						>
							<CloseRoundedIcon aria-hidden />
						</button>
					)}
					<button type="submit" className="gv-cat-search__go" aria-label="Search answers">
						<SearchRoundedIcon aria-hidden />
					</button>
				</form>
			</section>

			{/** 01–03 DESK — paper: section tabs and the active section **/}
			<section className="gv-cs-desk" ref={contentRef} aria-label="Help sections">
				<div className="gv-cs-desk__inner">
					<div className="gv-cs-tabs" role="tablist" aria-label="Help sections">
						{visibleTabs.map((entry, index) => {
							const selected = tab === entry.key;
							return (
								<button
									type="button"
									role="tab"
									id={`cs-tab-${entry.key}`}
									aria-selected={selected}
									aria-controls="cs-panel"
									key={entry.key}
									className={`gv-cs-tab ${selected ? 'active' : ''}`}
									onClick={() => openTab(entry.key)}
								>
									<span className="gv-cs-tab__index">{pad(index + 1)}</span>
									<span className="gv-cs-tab__name">{entry.label}</span>
									<span className="gv-cs-tab__count">{tabCount[entry.key]}</span>
									<span className="gv-cs-tab__desc">{entry.desc}</span>
								</button>
							);
						})}
					</div>

					<div className="gv-cs-panel" id="cs-panel" role="tabpanel" aria-labelledby={`cs-tab-${tab}`}>
						{tab === 'faq' && (
							<Faq
								faqs={faqs}
								loading={faqLoading && !faqData}
								error={Boolean(faqError)}
								topicKey={topicKey}
								topicCounts={topicCounts}
								onTopicChange={setTopicKey}
								searchText={searchText}
								onSearchChange={setSearchText}
							/>
						)}

						{tab === 'notice' && (
							<Notice notices={notices} loading={noticesLoading && !noticesData} error={Boolean(noticesError)} />
						)}

						{tab === 'inquiry' && <Inquiry />}

						{tab === 'ai' &&
							(assistantEnabled ? (
								<Assistant
									sources={[...faqs, ...notices]}
									onOpenSource={openSource}
									onAskTeam={() => openTab('inquiry', true)}
								/>
							) : (
								<div className="gv-cs-empty" role="status">
									<p className="gv-cs-empty__title">Loading the assistant…</p>
								</div>
							))}
					</div>
				</div>
			</section>

			{/** 04 STILL STUCK — signal: the two real ways to get more help **/}
			{tab !== 'inquiry' && (
				<section className="gv-cs-stuck" aria-labelledby="cs-stuck-title">
					<div className="gv-cs-stuck__inner">
						<p className="gv-chapter" aria-hidden>
							<span>{pad(visibleTabs.length + 1)}</span>Still stuck
						</p>
						<h2 className="gv-cs-stuck__title" id="cs-stuck-title">
							<span className="gv-cs-stuck__line">No answer</span>
							<span className="gv-cs-stuck__line gv-cs-stuck__line--2">yet?</span>
						</h2>
						<div className="gv-cs-stuck__side">
							<p>Ask the team directly and the reply shows up in your inquiry history, or ask other players on the Free board.</p>
							<div className="gv-cs-stuck__actions">
								<button type="button" className="gv-cs-cta gv-cs-cta--solid" onClick={() => openTab('inquiry', true)}>
									Ask the team
								</button>
								{assistantEnabled && tab !== 'ai' && (
									<button type="button" className="gv-cs-cta" onClick={() => openTab('ai', true)}>
										Ask AI
									</button>
								)}
								<Link href={{ pathname: '/community', query: { articleCategory: 'FREE' } }} className="gv-cs-cta">
									Ask the community
								</Link>
							</div>
						</div>
					</div>
				</section>
			)}
		</div>
	);
};

export default withLayoutCatalog(CS);
