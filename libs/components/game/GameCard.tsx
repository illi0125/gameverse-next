import React from 'react';
import Link from 'next/link';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Game } from '../../types/game/game';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../utils';
import { topGameRank } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { gameCover, gameDetailHref } from '../homepage/homeMotion';

interface GameCardType {
	game: Game;
	likeGameHandler?: any;
	/** Favorites list: every game is liked, so the heart is filled and clicking it removes the favorite **/
	myFavorites?: boolean;
	/** Recently visited list: read-only, no like button **/
	recentlyVisited?: boolean;
}

/** My Page game card, in the catalog card's anatomy (cut cover, paper-label title, platforms, foot row) **/
const GameCard = (props: GameCardType) => {
	const { game, likeGameHandler, myFavorites, recentlyVisited } = props;
	const user = useReactiveVar(userVar);
	const isLiked = Boolean(myFavorites || game?.meLiked?.[0]?.myFavorite);
	const likes = game?.gameLikes ?? 0;
	const showTop = !game?.isUpcoming && game?.gameRank > topGameRank;
	const credits = [game?.gameDeveloper, game?.gamePublisher].filter(Boolean).join(' / ');

	return (
		<article className="gv-cat-card">
			<Link href={gameDetailHref(game)} className="gv-cat-card__hit" aria-hidden tabIndex={-1} />

			<div className="gv-cat-card__art">
				<img src={gameCover(game)} alt="" loading="lazy" decoding="async" />
				<span className="gv-cat-card__flags">
					{game?.isUpcoming && <span className="gv-cat-card__flag">Upcoming</span>}
					{showTop && <span className="gv-cat-card__flag gv-cat-card__flag--top">Top</span>}
				</span>
				<span className="gv-cat-card__price">
					{hasGameDiscount(game) && <s>{formatGameOriginalPrice(game)}</s>}
					<span>{formatGamePrice(game)}</span>
				</span>
			</div>

			<div className="gv-cat-card__body">
				<h3 className="gv-cat-card__title">
					<Link href={gameDetailHref(game)}>{game?.gameTitle}</Link>
				</h3>
				{credits && <p className="gv-cat-card__credits">{credits}</p>}
				<ul className="gv-cat-card__platforms" aria-label="Platforms">
					{game?.gamePlatforms?.map((platform: string) => (
						<li key={platform}>{formatEnumLabel(platform)}</li>
					))}
				</ul>
				<div className="gv-cat-card__foot">
					<span className="gv-cat-card__genres">{game?.gameGenres?.slice(0, 2).map(formatEnumLabel).join(' / ')}</span>
					<span className="gv-cat-card__views" aria-label={`${game?.gameViews ?? 0} views`}>
						<VisibilityOutlinedIcon aria-hidden />
						{game?.gameViews ?? 0}
					</span>
					{!recentlyVisited && (
						<button
							type="button"
							className={`gv-cat-card__like ${isLiked ? 'is-liked' : ''}`}
							aria-pressed={isLiked}
							aria-label={`${isLiked ? 'Remove from favorites' : 'Like'} ${game?.gameTitle}, ${likes} likes`}
							onClick={() => likeGameHandler?.(user, game?._id)}
						>
							{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
							{likes}
						</button>
					)}
				</div>
			</div>
		</article>
	);
};

export default GameCard;
