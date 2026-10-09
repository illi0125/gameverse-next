import React from 'react';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Game } from '../../types/game/game';
import { gameStoreLabels, getGameStoreLinks } from '../../gameStores';

/** "Where to get it" block for the game detail page: one button per official store **/
const StoreLinks = ({ game }: { game: Game }) => {
	const links = getGameStoreLinks(game);
	if (links.length === 0) return null;

	return (
		<section className="gv-store-links" aria-labelledby="store-links-title">
			<h2 className="gv-store-links__title" id="store-links-title">
				Where to get it
			</h2>
			<p className="gv-store-links__note">Official stores and publisher sites. Opens in a new tab.</p>
			<ul className="gv-store-links__list">
				{links.map((link) => (
					<li key={link.store}>
						<a className="gv-store-links__item" href={link.url} target="_blank" rel="noopener noreferrer">
							<span className="gv-store-links__label">{gameStoreLabels[link.store].label}</span>
							<span className="gv-store-links__platform">{gameStoreLabels[link.store].platform}</span>
							<OpenInNewRoundedIcon aria-hidden />
						</a>
					</li>
				))}
			</ul>
		</section>
	);
};

export default StoreLinks;
