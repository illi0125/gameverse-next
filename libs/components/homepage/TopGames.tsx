import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { GamesInquiry } from '../../types/game/game.input';
import { Game } from '../../types/game/game';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_GAME } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { userVar } from '../../../apollo/store';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../utils';
import { SCENE_QUERY, gameCover, gameDetailHref, pad } from './homeMotion';

/** Where the cover tiles start before they converge into the first rank (percent of the stage) **/
const tileScatter = [
	[8, 20],
	[80, 14],
	[30, 72],
	[66, 64],
	[88, 50],
	[12, 56],
	[48, 16],
	[56, 84],
];

const LikeButton = ({ game, onLike, compact = false }: { game: Game; onLike: any; compact?: boolean }) => {
	const user = useReactiveVar(userVar);
	const isLiked = Boolean(game?.meLiked?.[0]?.myFavorite);

	return (
		<button
			type="button"
			className={`gv-board__like ${compact ? 'is-compact' : ''} ${isLiked ? 'is-liked' : ''}`}
			aria-pressed={isLiked}
			aria-label={`${isLiked ? 'Unlike' : 'Like'} ${game?.gameTitle}, ${game?.gameLikes ?? 0} likes`}
			onClick={() => onLike(user, game?._id)}
		>
			{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
			{game?.gameLikes ?? 0}
		</button>
	);
};

interface TopGamesProps {
	initialInput: GamesInquiry;
}

const TopGames = (props: TopGamesProps) => {
	const { initialInput } = props;
	const [topGames, setTopGames] = useState<Game[]>([]);
	const [active, setActive] = useState(0);
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
			setTopGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/
	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: initialInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const current = topGames[Math.min(active, topGames.length - 1)];

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root || topGames.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			const q = gsap.utils.selector(root);
			const count = topGames.length;

			// Assemble (scattered covers converge), step through every rank, then the stage exits as a cartridge
			const tl = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: {
					trigger: root,
					start: 'top top',
					end: 'bottom bottom',
					scrub: 0.6,
					onUpdate: (self) => {
						const progress = gsap.utils.clamp(0, 0.999, (self.progress - 0.1) / 0.8);
						const index = Math.floor(progress * count);
						setActive((prev) => (prev === index ? prev : index));
					},
				},
			});

			tl.fromTo(
				q('.gv-board__tile'),
				{ left: (index: number) => `${tileScatter[index % tileScatter.length][0]}%`, top: (index: number) => `${tileScatter[index % tileScatter.length][1]}%`, scale: 1, autoAlpha: 1 },
				{ left: '50%', top: '50%', scale: 2.6, autoAlpha: 0, duration: 0.1, stagger: 0.004 },
				0,
			)
				.fromTo(q('.gv-board__bg'), { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.1 }, 0.02)
				.fromTo(q('.gv-board__scene, .gv-board__list'), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.08)
				.to(q('.gv-board__bg'), { scale: 1.08, duration: 0.8 }, 0.1)
				.to(q('.gv-board__frame'), { scale: 0.62, rotation: 4, yPercent: -8, '--gv-stage-cut': '56px', duration: 0.1, ease: 'power2.in' }, 0.9);

			return () => setActive(0);
		});

		return () => mm.revert();
	}, [topGames.length]);

	return (
		<section className="gv-board" id="top-games" aria-labelledby="top-games-heading" ref={rootRef}>
			<div className="gv-board__stage">
				<div className="gv-board__frame">
					<div className="gv-board__bg" aria-hidden>
						{topGames.map((game: Game, index: number) => (
							<img
								key={game._id}
								className={index === active ? 'is-active' : ''}
								src={gameCover(game)}
								alt=""
								loading="lazy"
								decoding="async"
							/>
						))}
						<span className="gv-board__shade" />
					</div>

					<div className="gv-board__tiles" aria-hidden>
						{topGames.map((game: Game) => (
							<span className="gv-board__tile" key={game._id}>
								<img src={gameCover(game)} alt="" loading="lazy" decoding="async" />
							</span>
						))}
					</div>

					<header className="gv-board__head">
						<p className="gv-chapter gv-chapter--dark" aria-hidden>
							<span>03</span>Leaderboard
						</p>
						<h2 className="gv-board__heading" id="top-games-heading">
							Top ranked
						</h2>
						<p className="gv-board__desc">Ranked by views, likes and reviews.</p>
					</header>

					{topGames.length === 0 ? (
						<p className="gv-board__empty">
							No ranked games yet. <Link href={'/game'}>Browse the catalog to get the ranking started</Link>
						</p>
					) : (
						<>
							{current && (
								<div className="gv-board__scene">
									<span className="gv-board__numeral" key={`n-${active}`} aria-hidden>
										{pad(active + 1)}
									</span>
									<div className="gv-board__detail" key={`d-${active}`}>
										<p className="gv-board__kicker">
											Rank {active + 1} of {topGames.length}
										</p>
										<h3 className="gv-board__title">
											<Link href={gameDetailHref(current)}>{current.gameTitle}</Link>
										</h3>
										<p className="gv-board__meta">
											{[...(current.gameGenres?.slice(0, 2) ?? []), ...(current.gamePlatforms ?? [])]
												.map(formatEnumLabel)
												.join(' / ')}
										</p>
										<div className="gv-board__foot">
											<span className="gv-board__price">
												{hasGameDiscount(current) && <s>{formatGameOriginalPrice(current)}</s>}
												<span>{formatGamePrice(current)}</span>
											</span>
											<span className="gv-board__views" aria-label={`${current.gameViews ?? 0} views`}>
												<VisibilityOutlinedIcon aria-hidden />
												{current.gameViews ?? 0}
											</span>
											<LikeButton game={current} onLike={likeGameHandler} />
										</div>
									</div>
								</div>
							)}

							<ol className="gv-board__list" aria-label="Top ranked games">
								{topGames.map((game: Game, index: number) => (
									<li key={game._id} className={index === active ? 'is-active' : ''}>
										<span className="gv-board__row-rank" aria-hidden>
											{pad(index + 1)}
										</span>
										<span className="gv-board__row-thumb" aria-hidden>
											<img src={gameCover(game)} alt="" loading="lazy" decoding="async" />
										</span>
										<Link href={gameDetailHref(game)} className="gv-board__row-title">
											{game.gameTitle}
										</Link>
										<LikeButton game={game} onLike={likeGameHandler} compact />
									</li>
								))}
							</ol>
						</>
					)}
				</div>
			</div>
		</section>
	);
};

TopGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'gameRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopGames;
