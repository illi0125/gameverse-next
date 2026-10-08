import React from 'react';
import Link from 'next/link';
import { Game } from '../../types/game/game';
import { topGameRank } from '../../config';
import { formatGamePrice } from '../../utils';
import { gameCover, gameDetailHref, pad } from './homeMotion';

interface CollectionCardProps {
	game: Game;
	index: number;
}

/** Popular chapter card: one cover in the fanned collection **/
const CollectionCard = ({ game, index }: CollectionCardProps) => {
	const showTopBadge = !game?.isUpcoming && game?.gameRank >= topGameRank;

	return (
		<Link href={gameDetailHref(game)} className="gv-fan-card">
			<span className="gv-fan-card__art">
				<img src={gameCover(game)} alt="" loading="lazy" decoding="async" />
				<span className="gv-fan-card__flags">
					{game?.isUpcoming && <span className="gv-fan-card__flag">Upcoming</span>}
					{showTopBadge && <span className="gv-fan-card__flag gv-fan-card__flag--top">Top</span>}
				</span>
			</span>
			<span className="gv-fan-card__caption">
				<span className="gv-fan-card__rank" aria-hidden>
					{pad(index + 1)}
				</span>
				<span className="gv-fan-card__title">{game?.gameTitle}</span>
				<span className="gv-fan-card__meta">
					{game?.gameViews ?? 0} views / {formatGamePrice(game)}
				</span>
			</span>
		</Link>
	);
};

export default CollectionCard;
