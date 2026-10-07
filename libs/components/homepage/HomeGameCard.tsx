import React from 'react';
import Link from 'next/link';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Game } from '../../types/game/game';
import { REACT_APP_API_URL, topGameRank } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../utils';

interface HomeGameCardProps {
	game: Game;
	variant: 'trend' | 'popular' | 'top';
	likeGameHandler?: any;
	feature?: boolean;
	rank?: number;
}

/** Homepage game presentation: cover card (trend/popular, optional feature size) or ranked row (top) **/
const HomeGameCard = (props: HomeGameCardProps) => {
	const { game, variant, likeGameHandler, feature = false, rank } = props;
	const user = useReactiveVar(userVar);
	const imagePath = game?.gameImages?.[0]
		? `${REACT_APP_API_URL}/${game.gameImages[0]}`
		: '/img/gameverse/game-placeholder.svg';
	const detailHref = { pathname: '/game/detail', query: { id: game?._id } };
	const isLiked = Boolean(game?.meLiked?.[0]?.myFavorite);
	const showTopBadge = variant === 'popular' && !game?.isUpcoming && game?.gameRank >= topGameRank;

	const price = (
		<span className="gv-price">
			{hasGameDiscount(game) && <s className="gv-price__was">{formatGameOriginalPrice(game)}</s>}
			<span className="gv-price__now">{formatGamePrice(game)}</span>
		</span>
	);

	const stats = (
		<span className="gv-stats">
			<span className="gv-stat" aria-label={`${game?.gameViews ?? 0} views`}>
				<VisibilityOutlinedIcon aria-hidden />
				{game?.gameViews ?? 0}
			</span>
			{likeGameHandler && (
				<button
					type="button"
					className={`gv-like ${isLiked ? 'is-liked' : ''}`}
					aria-pressed={isLiked}
					aria-label={`${isLiked ? 'Unlike' : 'Like'} ${game?.gameTitle}, ${game?.gameLikes ?? 0} likes`}
					onClick={() => likeGameHandler(user, game?._id)}
				>
					{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
					{game?.gameLikes ?? 0}
				</button>
			)}
		</span>
	);

	if (variant === 'top') {
		return (
			<article className="gv-rank-row">
				<span className="gv-rank-row__rank" aria-label={`Rank ${rank}`}>
					{rank}
				</span>
				<div className="gv-rank-row__cover">
					<img src={imagePath} alt="" width={160} height={100} loading="lazy" decoding="async" />
				</div>
				<div className="gv-rank-row__body">
					<h3 className="gv-rank-row__title">
						<Link href={detailHref} className="gv-stretched">
							{game?.gameTitle}
						</Link>
					</h3>
					<p className="gv-rank-row__desc">{game?.gameDescription}</p>
					<p className="gv-rank-row__meta">
						{game?.gameGenres?.slice(0, 2).map(formatEnumLabel).join(', ')}
						<span className="gv-sep" aria-hidden />
						{game?.gamePlatforms?.map(formatEnumLabel).join(', ')}
					</p>
				</div>
				<div className="gv-rank-row__side">
					{price}
					{stats}
				</div>
			</article>
		);
	}

	return (
		<article className={`gv-card ${feature ? 'gv-card--feature' : ''}`}>
			<div className="gv-card__cover">
				<img src={imagePath} alt="" width={640} height={400} loading="lazy" decoding="async" />
				<span className="gv-card__flags">
					{game?.isUpcoming && <span className="gv-flag gv-flag--upcoming">Upcoming</span>}
					{showTopBadge && <span className="gv-flag gv-flag--top">Top</span>}
				</span>
			</div>
			<div className="gv-card__body">
				<h3 className="gv-card__title">
					<Link href={detailHref} className="gv-stretched">
						{game?.gameTitle}
					</Link>
				</h3>
				<p className="gv-card__genres">{game?.gameGenres?.slice(0, 2).map(formatEnumLabel).join(', ')}</p>
				<p className="gv-card__desc">{game?.gameDescription}</p>
				<ul className="gv-chips" aria-label="Platforms">
					{game?.gamePlatforms?.slice(0, 3).map((platform: string) => (
						<li className="gv-chip" key={platform}>
							{formatEnumLabel(platform)}
						</li>
					))}
				</ul>
				<div className="gv-card__foot">
					{price}
					{stats}
				</div>
			</div>
		</article>
	);
};

export default HomeGameCard;
