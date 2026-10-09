import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GET_GAMES } from '../../../apollo/user/query';
import { Game } from '../../types/game/game';
import { GamesInquiry } from '../../types/game/game.input';
import { Direction } from '../../enums/common.enum';
import { GameGenre, GameMode, GamePlatform } from '../../enums/game.enum';
import { REACT_APP_API_URL } from '../../config';
import { formatEnumLabel } from '../../utils';
import { onIntroDone } from './introGate';

interface HomeHeroProps {
	search?: ReactNode;
	visual?: ReactNode;
}

/** Same variables as TopGames.defaultProps, so Apollo serves both from one cache entry **/
const heroInput: GamesInquiry = { page: 1, limit: 8, sort: 'gameRank', direction: Direction.DESC, search: {} };

const HERO_SLIDES = 3;
const FALLBACK_ART = '/img/gameverse/hero.svg';

const headlineLines = [
	{ tag: '01F', word: 'Find.' },
	{ tag: '02C', word: 'Compare.' },
	{ tag: '03P', word: 'Play.' },
];

const platformHref = (platform: GamePlatform) =>
	`/game?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search: { platformList: [platform] } })}`;

const pad = (value: number) => String(value).padStart(2, '0');

/** Homepage title screen: live cover art, kinetic headline, actions, the catalog console and the platform banner **/
const HomeHero = ({ search, visual }: HomeHeroProps) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState(0);
	/** Narrow screens: covers advance on a timer while the title screen is on screen **/
	const [autoplay, setAutoplay] = useState(false);
	const [inView, setInView] = useState(true);

	/** APOLLO REQUESTS **/
	const { data: getGamesData } = useQuery(GET_GAMES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: heroInput },
	});

	const total: number | undefined = getGamesData?.getGames?.metaCounter?.[0]?.total;
	const slides: Game[] = (getGamesData?.getGames?.list ?? [])
		.filter((game: Game) => game?.gameImages?.length)
		.slice(0, HERO_SLIDES);
	const current = slides[Math.min(active, slides.length - 1)];

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);
		// Phones: the address bar showing or hiding must not re-measure every trigger mid-scroll
		ScrollTrigger.config({ ignoreMobileResize: true });

		const mm = gsap.matchMedia();
		mm.add('(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)', () => {
			const q = gsap.utils.selector(root);

			// Scroll is the timeline: covers advance, lines drift apart, then the stage exits as a cartridge
			const tl = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: {
					trigger: q('.gv-hero')[0],
					start: 'top top',
					end: 'bottom bottom',
					scrub: 0.6,
					onUpdate: (self) => {
						const count = Number(root.dataset.slides) || 1;
						const index = Math.min(count - 1, Math.floor((self.progress / 0.72) * count));
						setActive((prev) => (prev === index ? prev : index));
					},
				},
			});

			tl.to(q('.gv-hero__atmos'), { scale: 1.12, duration: 1 }, 0)
				.to(q('.gv-hero__plate'), { yPercent: -6, scale: 1.04, duration: 0.72 }, 0)
				.to(q('.gv-hero__line--1'), { xPercent: -5, duration: 0.72 }, 0)
				.to(q('.gv-hero__line--2'), { xPercent: 7, duration: 0.72 }, 0)
				.to(q('.gv-hero__line--3'), { xPercent: -3, duration: 0.72 }, 0)
				.to(q('.gv-hero__fade'), { autoAlpha: 0, y: -24, duration: 0.14, stagger: 0.02 }, 0.7)
				.to(
					q('.gv-hero__stage'),
					{ scale: 0.58, rotation: -5, yPercent: -10, '--gv-stage-cut': '64px', duration: 0.28, ease: 'power2.in' },
					0.72,
				);

			return () => tl.kill();
		});

		mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
			// No scroll runway on narrow screens: covers advance on a slow timer instead (see the effect below)
			setAutoplay(true);
			return () => setAutoplay(false);
		});

		mm.add('(prefers-reduced-motion: no-preference)', () => {
			// The single load moment: headline lines rise out of their masks, frame rules draw in.
			// Held hidden while the intro plays, then released by its hand-over.
			const words = root.querySelectorAll('.gv-hero__word');
			const rules = root.querySelectorAll('.gv-hero__rule');
			gsap.set(words, { yPercent: 110 });
			gsap.set(rules, { scale: 0 });
			const stopWaiting = onIntroDone(() => {
				gsap.to(words, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.08, delay: 0.1 });
				gsap.to(rules, { scale: 1, duration: 1.1, ease: 'power3.inOut', stagger: 0.06 });
			});

			// Banner: the platform marquee travels with the scroll
			const marquee = root.querySelector('.gv-promo__track');
			if (marquee) {
				gsap.fromTo(
					marquee,
					{ xPercent: 3 },
					{
						xPercent: -18,
						ease: 'none',
						scrollTrigger: { trigger: root.querySelector('.gv-promo'), start: 'top bottom', end: 'bottom top', scrub: 0.4 },
					},
				);
			}

			return () => stopWaiting();
		});

		return () => mm.revert();
	}, []);

	useEffect(() => {
		// Images arriving from the API change layout height; let ScrollTrigger re-measure
		ScrollTrigger.refresh();
	}, [slides.length]);

	useEffect(() => {
		// The timer only runs while the title screen is visible, so it never advances unseen
		const stage = rootRef.current?.querySelector('.gv-hero__stage');
		if (!stage || typeof IntersectionObserver === 'undefined') return;
		const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
		observer.observe(stage);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		// Restarts on every change, so a tapped tick gets its full five seconds
		if (!autoplay || !inView || slides.length < 2) return;
		const timer = window.setTimeout(() => setActive((prev) => (prev + 1) % slides.length), 5000);
		return () => window.clearTimeout(timer);
	}, [autoplay, inView, active, slides.length]);

	return (
		<div
			className={`gv-hero-chapter ${autoplay && inView ? 'is-playing' : ''}`}
			ref={rootRef}
			data-slides={Math.max(slides.length, 1)}
		>
			<section className="gv-hero" aria-labelledby="gv-hero-title">
				<div className="gv-hero__stage">
					<div className="gv-hero__atmos" aria-hidden>
						{slides.length === 0 ? (
							<img className="is-active" src={FALLBACK_ART} alt="" />
						) : (
							slides.map((game: Game, index: number) => (
								<img
									key={game._id}
									className={index === active ? 'is-active' : ''}
									src={`${REACT_APP_API_URL}/${game.gameImages[0]}`}
									alt=""
									decoding="async"
								/>
							))
						)}
						<span className="gv-hero__tint" />
						<span className="gv-hero__grain" />
					</div>

					<div className="gv-hero__grid" aria-hidden>
						<span className="gv-hero__rule gv-hero__rule--v1" />
						<span className="gv-hero__rule gv-hero__rule--v2" />
						<span className="gv-hero__rule gv-hero__rule--h1" />
						<span className="gv-hero__rule gv-hero__rule--h2" />
						<span className="gv-hero__mark" />
					</div>

					{/* Always rendered so the scroll timeline has its target before the query resolves */}
					<figure className="gv-hero__plate">
						<div className="gv-hero__plate-art">
							{slides.length === 0 ? (
								<img className="is-active" src={FALLBACK_ART} alt="" />
							) : (
								slides.map((game: Game, index: number) => (
									<img
										key={game._id}
										className={index === active ? 'is-active' : ''}
										src={`${REACT_APP_API_URL}/${game.gameImages[0]}`}
										alt=""
										decoding="async"
									/>
								))
							)}
						</div>
						{current && (
							<figcaption className="gv-hero__caption gv-hero__fade">
								<span className="gv-hero__caption-index" aria-hidden>
									{pad(active + 1)} / {pad(slides.length)}
								</span>
								<Link href={{ pathname: '/game/detail', query: { id: current._id } }} className="gv-hero__caption-link">
									<span className="gv-hero__caption-kicker">Top ranked now</span>
									<span className="gv-hero__caption-title">{current.gameTitle}</span>
									<span className="gv-hero__caption-meta">
										{current.gameGenres?.slice(0, 2).map(formatEnumLabel).join(' / ')}
									</span>
								</Link>
								{/* Narrow screens only: tap a tick to show that cover; the active one fills over five seconds */}
								{slides.length > 1 && (
									<span className="gv-hero__ticks">
										{slides.map((game: Game, index: number) => (
											<button
												type="button"
												key={game._id}
												className={`gv-hero__tick ${index === active ? 'is-active' : ''}`}
												aria-label={`Show ${game.gameTitle}`}
												aria-pressed={index === active}
												onClick={() => setActive(index)}
											>
												<span />
											</button>
										))}
									</span>
								)}
							</figcaption>
						)}
					</figure>

					<div className="gv-hero__intro gv-hero__fade">
						<p className="gv-hero__lead">
							Compare PC, console and mobile games by platform, genre, mode and price, and keep a list of the ones
							you want to play.
						</p>
						<div className="gv-hero__actions">
							<Link href={'/game'} className="gv-cta gv-cta--solid">
								Browse games
							</Link>
							<Link href={'/community?articleCategory=FREE'} className="gv-cta gv-cta--line">
								Join the community
							</Link>
						</div>
					</div>

					<h1 className="gv-hero__title" id="gv-hero-title">
						{headlineLines.map((line, index) => (
							<span className={`gv-hero__line gv-hero__line--${index + 1}`} key={line.tag}>
								<span className="gv-hero__tag" aria-hidden>
									{line.tag}
								</span>
								<span className="gv-hero__mask">
									<span className="gv-hero__word">{line.word}</span>
								</span>
							</span>
						))}
					</h1>

					{search && (
						<div className="gv-hero__console gv-hero__fade" role="search" aria-label="Search games">
							<span className="gv-hero__prompt" aria-hidden>
								Filter the catalog
							</span>
							{search}
						</div>
					)}

					<div className="gv-hero__scroll gv-hero__fade" aria-hidden>
						Scroll
					</div>
				</div>
			</section>

			<section className="gv-promo" aria-label="Browse by platform">
				<div className="gv-promo__head">
					<p className="gv-promo__readout">
						<span>{total !== undefined ? `${total} games in the catalog` : 'Loading the catalog'}</span>
						<span>{Object.values(GamePlatform).length} platforms</span>
						<span>{Object.values(GameGenre).length} genres</span>
						<span>{Object.values(GameMode).length} game modes</span>
					</p>
					<Link href={'/game'} className="gv-promo__all">
						Open the full catalog
					</Link>
				</div>

				<div className="gv-promo__marquee">
					<ul className="gv-promo__track">
						{Object.values(GamePlatform).map((platform: GamePlatform, index: number) => (
							<li key={platform} className={index % 2 ? 'is-outline' : ''}>
								<Link href={platformHref(platform)}>{formatEnumLabel(platform)}</Link>
							</li>
						))}
					</ul>
				</div>

				{visual && (
					<div className="gv-promo__shelf" aria-hidden>
						{visual}
					</div>
				)}
			</section>
		</div>
	);
};

export default HomeHero;
