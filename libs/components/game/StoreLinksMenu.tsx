import React, { MouseEvent, useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Game } from '../../types/game/game';
import { gameStoreLabels, getGameStoreLinks } from '../../gameStores';

/** Compact "Get it" button for game cards: a menu of the game's official stores, each opening in a new tab **/
const StoreLinksMenu = ({ game }: { game: Game }) => {
	const links = getGameStoreLinks(game);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuId = `stores-${game?._id}`;

	if (links.length === 0) return null;

	const open = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
	const close = () => setAnchorEl(null);

	return (
		<>
			<button
				type="button"
				className="gv-store-trigger"
				aria-haspopup="menu"
				aria-expanded={Boolean(anchorEl)}
				aria-controls={anchorEl ? menuId : undefined}
				aria-label={`Get ${game?.gameTitle}: official stores`}
				onClick={open}
			>
				Get it
				<KeyboardArrowDownRoundedIcon aria-hidden />
			</button>
			<Menu
				id={menuId}
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={close}
				className="gv-store-menu"
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
			>
				{links.map((link) => (
					<MenuItem
						key={link.store}
						component="a"
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={close}
					>
						<span className="gv-store-menu__label">{gameStoreLabels[link.store].label}</span>
						<span className="gv-store-menu__platform">{gameStoreLabels[link.store].platform}</span>
						<OpenInNewRoundedIcon className="gv-store-menu__icon" aria-hidden />
					</MenuItem>
				))}
			</Menu>
		</>
	);
};

export default StoreLinksMenu;
