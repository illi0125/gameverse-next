import { Menu, MenuItem, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import IconButton from '@mui/material/IconButton';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { Game } from '../../types/game/game';
import { formatEnumLabel, formatGamePrice } from '../../utils';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { GameStatus } from '../../enums/game.enum';
import { REACT_APP_API_URL } from '../../config';

interface MyGameCardProps {
	game: Game;
	deleteGameHandler?: any;
	memberPage?: boolean;
	updateGameHandler?: any;
}

const statusColors: Record<string, { background: string; color: string }> = {
	ACTIVE: { background: '#E5F0FD', color: '#3554d1' },
	UPCOMING: { background: '#FFF4DC', color: '#b07a00' },
	DELETE: { background: '#F5F5F5', color: '#8f8f8f' },
};

export const MyGameCard = (props: MyGameCardProps) => {
	const { game, deleteGameHandler, memberPage, updateGameHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const canManage = !memberPage && game.gameStatus !== GameStatus.DELETE;
	const nextStatus = game.gameStatus === GameStatus.ACTIVE ? GameStatus.UPCOMING : GameStatus.ACTIVE;
	const imagePath = game?.gameImages?.[0] ? `${REACT_APP_API_URL}/${game.gameImages[0]}` : '/img/gameverse/game-placeholder.svg';

	/** HANDLERS **/
	const pushEditGame = async (id: string) => {
		await router.push({
			pathname: '/mypage',
			query: { category: 'addGame', gameId: id },
		});
	};

	const pushGameDetail = async (id: string) => {
		await router.push({
			pathname: '/game/detail',
			query: { id: id },
		});
	};

	const handleClick = (event: any) => {
		if (canManage) setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
			<Stack className="game-card-box">
				<Stack className="image-box" onClick={() => pushGameDetail(game?._id)}>
					<img src={imagePath} alt={game.gameTitle} />
				</Stack>
				<Stack className="information-box" onClick={() => pushGameDetail(game?._id)}>
					<Typography className="name">{game.gameTitle}</Typography>
					<Typography className="address">{game.gamePlatforms.map(formatEnumLabel).join(', ')}</Typography>
					<Typography className="price">
						<strong>{formatGamePrice(game)}</strong>
					</Typography>
				</Stack>
				<Stack className="date-box">
					<Typography className="date">
						<Moment format="DD MMMM, YYYY">{game.createdAt}</Moment>
					</Typography>
				</Stack>
				<Stack className="status-box">
					<Stack
						className="coloured-box"
						data-status={game.gameStatus}
						sx={{ background: statusColors[game.gameStatus]?.background, cursor: canManage ? 'pointer' : 'default' }}
						onClick={handleClick}
					>
						<Typography className="status" sx={{ color: statusColors[game.gameStatus]?.color }}>
							{formatEnumLabel(game.gameStatus)}
						</Typography>
					</Stack>
				</Stack>
				{canManage && (
					<Menu
						anchorEl={anchorEl}
						open={open}
						onClose={handleClose}
						PaperProps={{
							elevation: 0,
							sx: {
								mt: 1,
								ml: '10px',
								overflow: 'visible',
								filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
							},
							style: {
								padding: 0,
								display: 'flex',
								justifyContent: 'center',
							},
						}}
					>
						<MenuItem
							disableRipple
							onClick={() => {
								handleClose();
								updateGameHandler(nextStatus, game?._id);
							}}
						>
							Mark as {formatEnumLabel(nextStatus)}
						</MenuItem>
					</Menu>
				)}

				<Stack className="views-box">
					<Typography className="views">{game.gameViews.toLocaleString()}</Typography>
				</Stack>
				{canManage && (
					<Stack className="action-box">
						<IconButton className="icon-button" onClick={() => pushEditGame(game._id)}>
							<ModeIcon className="buttons" />
						</IconButton>
						<IconButton className="icon-button" onClick={() => deleteGameHandler(game._id)}>
							<DeleteIcon className="buttons" />
						</IconButton>
					</Stack>
				)}
			</Stack>
		);
};
