import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CollectionCard from './CollectionCard';
import { Game } from '../../types/game/game';
import { GamesInquiry } from '../../types/game/game.input';
import { useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { MOBILE_MOTION_QUERY, SCENE_QUERY, pad } from './homeMotion';

/** Fan order: the most viewed game in the centre, then alternating left and right **/
const fanPosition = (index: number) => (index === 0 ? 0 : index % 2 ? -(index + 1) / 2 : index / 2);

interface PopularGamesProps {
	initialInput: GamesInquiry;
}

const PopularGames = (props: PopularGamesProps) => {
	const { initialInput } = props;
	const [popularGames, setPopularGames] = useState<Game[]>([]);
	const rootRef = useRef<HTMLElement>(null);

	/** APOLLO REQUESTS **/

	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setPopularGames(data?.getGames?.list ?? []);
		},
	});

	const total: number = getGamesData?.getGames?.metaCounter?.[0]?.total ?? popularGames.length;

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root || popularGames.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			const cards = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('.gv-fan__item'));
			const counter = root.querySelector<HTMLElement>('.gv-collection__count-num');
			const position = (index: number) => Number(cards[index].dataset.pos);
			const odometer = { value: 0 };

			// The stack fans open into an arc while the catalog count ticks up
			const tl = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
			});

			tl.fromTo(
				cards,
				{
					x: (index: number) => position(index) * 18,
					y: (index: number) => Math.abs(position(index)) * 6,
					rotationZ: (index: number) => position(index) * 2.5,
					rotationY: 0,
					z: 0,
				},
				{
					x: (index: number) => position(index) * window.innerWidth * 0.13,
					y: (index: number) => Math.abs(position(index)) * window.innerHeight * 0.035,
					rotationZ: (index: number) => position(index) * 1.5,
					rotationY: (index: number) => position(index) * -16,
					z: (index: number) => Math.abs(position(index)) * -140,
					duration: 0.75,
					ease: 'power2.out',
				},
				0,
			)
				.fromTo(
					odometer,
					{ value: 0 },
					{
						value: Number(counter?.dataset.total) || 0,
						duration: 0.6,
						onUpdate: () => {
							if (counter) counter.textContent = pad(Math.round(odometer.value));
						},
					},
					0,
				)
				.fromTo(root.querySelector('.gv-collection__title-line--2'), { xPercent: 0 }, { xPercent: 10, duration: 1 }, 0);

			return () => {
				if (counter) counter.textContent = pad(Number(counter.dataset.total) || 0);
			};
		});

		mm.add(MOBILE_MOTION_QUERY, () => {
			// Narrow screens: once, the stack deals out into the row while the count ticks up
			const list = root.querySelector<HTMLElement>('.gv-fan');
			const cards = root.querySelectorAll<HTMLElement>('.gv-fan__item');
			const counter = root.querySelector<HTMLElement>('.gv-collection__count-num');
			if (!list) return;
			const odometer = { value: 0 };
			const total = Number(counter?.dataset.total) || 0;

			gsap.from(cards, {
				xPercent: (index: number) => -100 * index,
				x: (index: number) => index * 6,
				rotation: (index: number) => (index % 2 ? 3 : -3),
				duration: 0.8,
				ease: 'power3.out',
				stagger: 0.03,
				scrollTrigger: { trigger: list, start: 'top 85%', once: true },
			});

			// The count has its own trigger: it ticks up the moment it appears, never sits at 00
			if (counter) {
				gsap.to(odometer, {
					value: total,
					duration: 0.7,
					ease: 'power2.out',
					onStart: () => {
						counter.textContent = pad(0);
					},
					onUpdate: () => {
						counter.textContent = pad(Math.round(odometer.value));
					},
					scrollTrigger: { trigger: counter, start: 'top 92%', once: true },
				});
			}

			return () => {
				if (counter) counter.textContent = pad(total);
			};
		});

		return () => mm.revert();
	}, [popularGames.length]);

	if (!popularGames) return null;

	return (
		<section className="gv-collection" id="popular-games" aria-labelledby="popular-games-heading" ref={rootRef}>
			<div className="gv-collection__stage">
				<header className="gv-collection__head">
					<div className="gv-collection__titles">
						<p className="gv-chapter" aria-hidden>
							<span>02</span>Collection
						</p>
						<h2 className="gv-collection__title" id="popular-games-heading">
							<span className="gv-collection__title-line">Most</span>
							<span className="gv-collection__title-line gv-collection__title-line--2">viewed.</span>
						</h2>
					</div>
					<div className="gv-collection__side">
						<p className="gv-collection__count">
							<span className="gv-collection__count-num" data-total={total}>
								{pad(total)}
							</span>
							<span className="gv-collection__count-label">games in the catalog</span>
						</p>
						<p className="gv-collection__desc">
							The games people open most. Every visit to a game page counts as a view.
						</p>
						<Link href={'/game'} className="gv-ink-cta">
							See all games
						</Link>
					</div>
				</header>

				{popularGames.length === 0 ? (
					<p className="gv-collection__empty">
						No popular games yet. <Link href={'/game'}>Open the catalog to start the count</Link>
					</p>
				) : (
					<ul className="gv-fan" aria-label="Popular games">
						{popularGames.map((game: Game, index: number) => (
							<li
								className="gv-fan__item"
								key={game._id}
								data-pos={fanPosition(index)}
								style={{ zIndex: 20 - Math.abs(fanPosition(index)) }}
							>
								<CollectionCard game={game} index={index} />
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
};

PopularGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 7,
		sort: 'gameViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularGames;
