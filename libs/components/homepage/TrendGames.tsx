import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Game } from '../../types/game/game';
import { GamesInquiry } from '../../types/game/game.input';
import TrendPlate from './TrendPlate';
import { RailControls, RailTrack, useHomeRail } from './HomeRail';
import { useMutation, useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_GAME } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TrendGamesProps {
	initialInput: GamesInquiry;
}

const TrendGames = (props: TrendGamesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendGames, setTrendGames] = useState<Game[]>([]);
	const rail = useHomeRail(trendGames.length);
	const rootRef = useRef<HTMLElement>(null);

	/** APOLLO REQUESTS **/
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);

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
			setTrendGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/
	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			// execute likeTargetGame Mutation
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: initialInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root || trendGames.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add('(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)', () => {
			const stage = root.querySelector<HTMLElement>('.gv-trend__stage');
			const track = root.querySelector<HTMLElement>('.gv-trend__track');
			if (!stage || !track) return;

			// Vertical scroll drives the horizontal track: the section is as tall as the track is wide
			const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);
			const setHeight = () => {
				root.style.height = `${distance() + window.innerHeight}px`;
			};
			setHeight();
			ScrollTrigger.addEventListener('refreshInit', setHeight);

			const travel = gsap.to(track, {
				x: () => -distance(),
				ease: 'none',
				scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
			});

			gsap.fromTo(
				root.querySelector('.gv-trend__progress-bar'),
				{ scaleX: 0 },
				{ scaleX: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6 } },
			);

			// Each cover pans inside its frame as it crosses the screen
			root.querySelectorAll<HTMLElement>('.gv-plate__art img').forEach((img) => {
				gsap.fromTo(
					img,
					{ xPercent: 6 },
					{
						xPercent: -6,
						ease: 'none',
						scrollTrigger: {
							trigger: img.parentElement,
							containerAnimation: travel,
							start: 'left right',
							end: 'right left',
							scrub: true,
						},
					},
				);
			});

			ScrollTrigger.refresh();

			return () => {
				ScrollTrigger.removeEventListener('refreshInit', setHeight);
				root.style.height = '';
			};
		});

		return () => mm.revert();
	}, [trendGames.length]);

	if (!trendGames) return null;

	return (
		<section className="gv-trend" id="trending-games" aria-labelledby="trending-games-heading" ref={rootRef}>
			<div className="gv-trend__stage">
				<div className="gv-trend__track">
					<header className="gv-trend__intro">
						<p className="gv-trend__chapter" aria-hidden>
							<span>01</span>Level select
						</p>
						<h2 className="gv-trend__title" id="trending-games-heading">
							<span className="gv-trend__title-line">Most liked</span>
							<span className="gv-trend__title-line gv-trend__title-line--2">right now.</span>
						</h2>
						<p className="gv-trend__desc">
							The most liked games in the catalog. Like a game to move it up the list.
						</p>
						<div className="gv-trend__controls">
							<RailControls rail={rail} label="trending games" />
						</div>
					</header>

					{trendGames.length === 0 ? (
						<p className="gv-trend__empty">
							No trending games yet.{' '}
							<Link href={'/game'} className="gv-trend__empty-link">
								Browse the catalog and like the first one
							</Link>
						</p>
					) : (
						<RailTrack rail={rail} label="Trending games" itemClassName={device === 'mobile' ? 'is-compact' : ''}>
							{trendGames.map((game: Game, index: number) => (
								<TrendPlate key={game._id} game={game} index={index} likeGameHandler={likeGameHandler} />
							))}
						</RailTrack>
					)}
				</div>

				<div className="gv-trend__progress" aria-hidden>
					<span className="gv-trend__progress-label">Keep scrolling</span>
					<span className="gv-trend__progress-rail">
						<span className="gv-trend__progress-bar" />
					</span>
					<span className="gv-trend__progress-label">
						{String(trendGames.length).padStart(2, '0')} games
					</span>
				</div>
			</div>
		</section>
	);
};

TrendGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'gameLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendGames;
