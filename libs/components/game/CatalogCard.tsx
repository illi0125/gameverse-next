import React from 'react';
import Link from 'next/link';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Game } from '../../types/game/game';
import { topGameRank } from '../../config';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../utils';
import { gameCover, gameDetailHref } from '../homepage/homeMotion';
import StoreLinksMenu from './StoreLinksMenu';

interface CatalogCardProps {
	game: Game;
	likeGameHandler: any;
	feature?: boolean;
}

/** Games catalog card: cut-corner cover, paper-label title on the art edge, metadata, price and like **/
const CatalogCard = ({ game, likeGameHandler, feature = false }: CatalogCardProps) => {
	const user = useReactiveVar(userVar);
	const isLiked = Boolean(game?.meLiked?.[0]?.myFavorite);
	const likes = game?.gameLikes ?? 0;
	const showTop = !game?.isUpcoming && game?.gameRank > topGameRank;
	const credits = [game?.gameDeveloper, game?.gamePublisher].filter(Boolean).join(' / ');

	return (
		<article className={`gv-cat-card ${feature ? 'gv-cat-card--feature' : ''}`}>
			{/* Whole-card click target for pointer users; the title link is the keyboard target */}
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
					<StoreLinksMenu game={game} />
					<span className="gv-cat-card__genres">{game?.gameGenres?.slice(0, 2).map(formatEnumLabel).join(' / ')}</span>
					<span className="gv-cat-card__views" aria-label={`${game?.gameViews ?? 0} views`}>
						<VisibilityOutlinedIcon aria-hidden />
						{game?.gameViews ?? 0}
					</span>
					<button
						type="button"
						className={`gv-cat-card__like ${isLiked ? 'is-liked' : ''}`}
						aria-pressed={isLiked}
						aria-label={`${isLiked ? 'Unlike' : 'Like'} ${game?.gameTitle}, ${likes} likes`}
						onClick={() => likeGameHandler(user, game?._id)}
					>
						{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
						{likes}
					</button>
				</div>
			</div>
		</article>
	);
};

export default CatalogCard;
