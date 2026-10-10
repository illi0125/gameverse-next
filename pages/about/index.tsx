import React, { useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import { MOTION_QUERY, pad } from '../../libs/components/homepage/homeMotion';
import { GET_AGENTS, GET_GAMES } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { Member } from '../../libs/types/member/member';
import { GameGenre, GameMode, GamePlatform } from '../../libs/enums/game.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { formatEnumLabel, memberTypeLabel } from '../../libs/utils';
import { REACT_APP_API_URL } from '../../libs/config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const platformHref = (platform: GamePlatform) =>
	`/game?input=${JSON.stringify({
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: 'DESC',
		search: { platformList: [platform] },
	})}`;

const About: NextPage = ({ gamesInput, agentsInput, ...props }: any) => {
	const user = useReactiveVar(userVar);
	const rootRef = useRef<HTMLDivElement>(null);

	/** APOLLO REQUESTS (read-only: totals and the top-ranked developers) **/
	const { data: gamesData } = useQuery(GET_GAMES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: gamesInput },
	});
	const { data: agentsData } = useQuery(GET_AGENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: agentsInput },
	});
	const gameTotal: number | undefined = gamesData?.getGames?.metaCounter?.[0]?.total;
	const developerTotal: number | undefined = agentsData?.getAgents?.metaCounter?.[0]?.total;
	const developers: Member[] = agentsData?.getAgents?.list ?? [];

	/** PRESENTATION **/
	const platforms = Object.values(GamePlatform);
	const counts = [
		{ value: platforms.length, label: 'Platforms' },
		{ value: Object.values(GameGenre).length, label: 'Genres' },
		{ value: Object.values(GameMode).length, label: 'Game modes' },
	];
	const readoutReady = gameTotal !== undefined && developerTotal !== undefined;
	const steps = [
		{
			title: 'Players',
			text: 'Compare platforms, genres, modes and prices in one catalog, then like, save and talk about the games you find.',
			href: '/game',
			cta: 'Browse games',
		},
		{
			title: 'Developers',
			text: 'List games with media, release dates, pricing and system requirements, and build a following.',
			href: user?.memberType === MemberType.AGENT ? '/mypage?category=addGame' : '/account/join',
			cta: user?.memberType === MemberType.AGENT ? 'Add a game' : 'Join as a developer',
		},
		{
			title: 'Community',
			text: 'Reviews, news, humor and free talk boards where players and developers meet.',
			href: '/community?articleCategory=FREE',
			cta: 'Open the boards',
		},
	];

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: headline lines rise out of their masks
			gsap.from(root.querySelectorAll('.gv-about-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
			const hero = root.querySelector('.gv-about-hero');
			gsap.to(root.querySelector('.gv-about-hero .gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
		});
		return () => mm.revert();
	}, []);

	return (
		<div className="gv-catalog gv-about" ref={rootRef}>
			<Head>
				<title>About | Gameverse</title>
			</Head>

			{/** 00 ABOUT — night: headline, live readout, the two ways in **/}
			<section className="gv-about-hero" aria-labelledby="about-title">
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

				<div className="gv-about-hero__inner">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>00</span>About
					</p>
					<h1 className="gv-about-hero__title" id="about-title">
						<span className="gv-about-hero__line">
							<span className="gv-about-hero__mask">
								<span className="gv-about-hero__word">One catalog.</span>
							</span>
						</span>
						<span className="gv-about-hero__line gv-about-hero__line--2">
							<span className="gv-about-hero__mask">
								<span className="gv-about-hero__word">Every platform.</span>
							</span>
						</span>
					</h1>
					<p className="gv-about-hero__lead">
						Gameverse brings PC, console and mobile games together, so you can find your next game without jumping
						between stores.
					</p>
					<p className="gv-about-hero__readout" aria-live="polite">
						{readoutReady ? (
							<>
								<span>
									{gameTotal} game{gameTotal === 1 ? '' : 's'}
								</span>
								<span>
									{developerTotal} developer{developerTotal === 1 ? '' : 's'}
								</span>
							</>
						) : (
							<span>Connecting</span>
						)}
					</p>
					<div className="gv-about-hero__actions">
						<Link href="/game" className="gv-about-cta gv-about-cta--solid">
							Browse games
						</Link>
						<Link href="/developer" className="gv-about-cta gv-about-cta--line">
							Meet developers
						</Link>
					</div>
				</div>
			</section>

			{/** 01 MISSION — paper: why Gameverse exists, the catalog's real dimensions **/}
			<section className="gv-about-mission" aria-labelledby="about-mission-title">
				<div className="gv-about-mission__inner">
					<p className="gv-chapter" aria-hidden>
						<span>01</span>Mission
					</p>
					<h2 className="gv-about-mission__title" id="about-mission-title">
						<span className="gv-about-mission__line">Made for</span>
						<span className="gv-about-mission__line gv-about-mission__line--2">players</span>
					</h2>
					<div className="gv-about-mission__side">
						<p>
							Compare platforms, genres, game modes and prices in one place, follow what is trending, save your
							favorites and share your opinion with the community.
						</p>
						<p>
							Developers keep their listings up to date with release dates, system requirements and media, so what you
							read is what you get.
						</p>
					</div>

					<ul className="gv-about-counts">
						{counts.map((entry) => (
							<li key={entry.label}>
								<strong>{pad(entry.value)}</strong>
								<span>{entry.label}</span>
							</li>
						))}
					</ul>

					<nav className="gv-about-platforms" aria-label="Browse by platform">
						<span aria-hidden>Browse</span>
						{platforms.map((platform) => (
							<Link key={platform} href={platformHref(platform)} className="gv-about-chip">
								{formatEnumLabel(platform)}
							</Link>
						))}
					</nav>
				</div>
			</section>

			{/** 02 HOW IT WORKS — ultraviolet: the three ways people use Gameverse **/}
			<section className="gv-about-how" aria-labelledby="about-how-title">
				<div className="gv-about-how__inner">
					<p className="gv-chapter" aria-hidden>
						<span>02</span>How it works
					</p>
					<h2 className="gv-about-how__title" id="about-how-title">
						<span className="gv-about-how__line">Pick your</span>
						<span className="gv-about-how__line gv-about-how__line--2">side</span>
					</h2>
					<ol className="gv-about-steps">
						{steps.map((step, index) => (
							<li key={step.title} className="gv-about-step">
								<span className="gv-about-step__index" aria-hidden>
									{pad(index + 1)}
								</span>
								<h3 className="gv-about-step__title">{step.title}</h3>
								<p className="gv-about-step__text">{step.text}</p>
								<Link href={step.href} className="gv-about-step__go">
									{step.cta}
								</Link>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/** 03 TOP DEVELOPERS — paper: highest-ranked developers (hidden without data) **/}
			{developers.length > 0 && (
				<section className="gv-about-devs" aria-labelledby="about-devs-title">
					<div className="gv-about-devs__inner">
						<p className="gv-chapter" aria-hidden>
							<span>03</span>Developers
						</p>
						<div className="gv-about-devs__head">
							<h2 className="gv-about-devs__title" id="about-devs-title">
								<span className="gv-about-devs__line">Top</span>
								<span className="gv-about-devs__line gv-about-devs__line--2">developers</span>
							</h2>
							<div className="gv-about-devs__side">
								<p>The developers with the highest rank, earned through their games, likes and views.</p>
								<Link href="/developer" className="gv-about-cta gv-about-cta--ink">
									All {developerTotal ?? ''} developers
								</Link>
							</div>
						</div>
						<ul className="gv-about-devs__list">
							{developers.map((developer) => (
								<li key={developer._id}>
									<Link href={`/developer/detail?developerId=${developer._id}`} className="gv-about-dev">
										<span className="gv-about-dev__portrait">
											<img
												src={
													developer.memberImage
														? `${REACT_APP_API_URL}/${developer.memberImage}`
														: '/img/profile/defaultUser.svg'
												}
												alt=""
												loading="lazy"
												decoding="async"
											/>
										</span>
										<span className="gv-about-dev__name">{developer.memberNick}</span>
										<span className="gv-about-dev__meta">
											{memberTypeLabel(developer.memberType)} · {developer.memberGames} game
											{developer.memberGames === 1 ? '' : 's'}
										</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			)}

			{/** 04 QUESTIONS — signal: the real ways to reach the team **/}
			<section className="gv-about-ask" aria-labelledby="about-ask-title">
				<div className="gv-about-ask__inner">
					<p className="gv-chapter" aria-hidden>
						<span>04</span>Questions
					</p>
					<h2 className="gv-about-ask__title" id="about-ask-title">
						<span className="gv-about-ask__line">Questions?</span>
						<span className="gv-about-ask__line gv-about-ask__line--2">Ask us.</span>
					</h2>
					<div className="gv-about-ask__side">
						<p>Browse the answers and notices in Help, or send the team a question and follow the reply there.</p>
						<div className="gv-about-ask__actions">
							<Link href="/cs?tab=inquiry" className="gv-about-cta gv-about-cta--ink-solid">
								Send an inquiry
							</Link>
							<Link href="/cs" className="gv-about-cta gv-about-cta--ink">
								Visit Help
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

About.defaultProps = {
	gamesInput: {
		page: 1,
		limit: 1,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
	agentsInput: {
		page: 1,
		limit: 5,
		sort: 'memberRank',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutCatalog(About);
