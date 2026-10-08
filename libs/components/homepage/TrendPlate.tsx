import React from 'react';
import Link from 'next/link';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Game } from '../../types/game/game';
import { REACT_APP_API_URL } from '../../config';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../utils';

interface TrendPlateProps {
	game: Game;
	index: number;
	likeGameHandler: any;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Trending chapter plate: cut-corner cover, rotated like counter, title across the art edge **/
const TrendPlate = (props: TrendPlateProps) => {
	const { game, index, likeGameHandler } = props;
	const user = useReactiveVar(userVar);
	const imagePath = game?.gameImages?.[0]
		? `${REACT_APP_API_URL}/${game.gameImages[0]}`
		: '/img/gameverse/game-placeholder.svg';
	const detailHref = { pathname: '/game/detail', query: { id: game?._id } };
	const isLiked = Boolean(game?.meLiked?.[0]?.myFavorite);
	const likes = game?.gameLikes ?? 0;

	return (
		<article className={`gv-plate gv-plate--${index % 4}`}>
			{/* Whole-plate click target for pointer users; keyboard users get the title link */}
			<Link href={detailHref} className="gv-plate__hit" aria-hidden tabIndex={-1} />
			<p className="gv-plate__count" aria-hidden>
				<span className="gv-plate__count-num">{pad(likes)}</span>
				<span className="gv-plate__count-label">Likes</span>
			</p>

			<div className="gv-plate__main">
				<div className="gv-plate__art">
					<img src={imagePath} alt="" loading="lazy" decoding="async" />
					<span className="gv-plate__index" aria-hidden>
						No. {pad(index + 1)}
					</span>
					{game?.isUpcoming && <span className="gv-plate__flag">Upcoming</span>}
				</div>

				<div className="gv-plate__body">
					<h3 className="gv-plate__title">
						<Link href={detailHref}>
							{game?.gameTitle}
						</Link>
					</h3>
					<p className="gv-plate__meta">
						{[...(game?.gameGenres?.slice(0, 2) ?? []), ...(game?.gamePlatforms?.slice(0, 2) ?? [])]
							.map(formatEnumLabel)
							.join(' / ')}
					</p>
					<div className="gv-plate__foot">
						<span className="gv-plate__price">
							{hasGameDiscount(game) && <s>{formatGameOriginalPrice(game)}</s>}
							<span>{formatGamePrice(game)}</span>
						</span>
						<span className="gv-plate__views" aria-label={`${game?.gameViews ?? 0} views`}>
							<VisibilityOutlinedIcon aria-hidden />
							{game?.gameViews ?? 0}
						</span>
						<button
							type="button"
							className={`gv-plate__like ${isLiked ? 'is-liked' : ''}`}
							aria-pressed={isLiked}
							aria-label={`${isLiked ? 'Unlike' : 'Like'} ${game?.gameTitle}, ${likes} likes`}
							onClick={() => likeGameHandler(user, game?._id)}
						>
							{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
							{likes}
						</button>
					</div>
				</div>
			</div>
		</article>
	);
};

export default TrendPlate;
