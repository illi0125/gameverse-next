import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Game } from '../../types/game/game';
import Link from 'next/link';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../utils';
import { REACT_APP_API_URL, topGameRank } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface GameCardType {
	game: Game;
	likeGameHandler?: any;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

const GameCard = (props: GameCardType) => {
	const { game, likeGameHandler, myFavorites, recentlyVisited } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const imagePath: string = game?.gameImages?.[0]
		? `${REACT_APP_API_URL}/${game?.gameImages[0]}`
		: '/img/gameverse/game-placeholder.svg';
	const detailHref = { pathname: '/game/detail', query: { id: game?._id } };

	if (device === 'mobile') {
		return <div>GAME CARD</div>;
	} else {
		return (
			<Stack className="card-config">
				<Stack className="top">
					<Link href={detailHref}>
						<img src={imagePath} alt={game?.gameTitle} />
					</Link>
					{game?.isUpcoming ? (
						<Box component={'div'} className={'top-badge upcoming-badge'}>
							<Typography>UPCOMING</Typography>
						</Box>
					) : (
						game?.gameRank > topGameRank && (
							<Box component={'div'} className={'top-badge'}>
								<img src="/img/icons/electricity.svg" alt="" />
								<Typography>TOP</Typography>
							</Box>
						)
					)}
					<Box component={'div'} className={'price-box'}>
						{hasGameDiscount(game) && (
							<Typography className={'original-price'}>{formatGameOriginalPrice(game)}</Typography>
						)}
						<Typography>{formatGamePrice(game)}</Typography>
					</Box>
				</Stack>
				<Stack className="bottom">
					<Stack className="name-address">
						<Stack className="name">
							<Link href={detailHref}>
								<Typography>{game?.gameTitle}</Typography>
							</Link>
						</Stack>
						<Stack className="address">
							<Typography>
								{game?.gameDeveloper} · {game?.gamePublisher}
							</Typography>
						</Stack>
					</Stack>
					<Stack className="options">
						{game?.gamePlatforms?.map((platform: string) => (
							<Typography className="option-chip" key={platform}>
								{formatEnumLabel(platform)}
							</Typography>
						))}
					</Stack>
					<Stack className="divider"></Stack>
					<Stack className="type-buttons">
						<Stack className="type">
							<Typography sx={{ fontWeight: 500, fontSize: '13px' }}>
								{game?.gameGenres?.slice(0, 2).map(formatEnumLabel).join(', ')}
							</Typography>
						</Stack>
						{!recentlyVisited && (
							<Stack className="buttons">
								<IconButton color={'default'}>
									<RemoveRedEyeIcon />
								</IconButton>
								<Typography className="view-cnt">{game?.gameViews}</Typography>
								<IconButton color={'default'} onClick={() => likeGameHandler?.(user, game?._id)}>
									{myFavorites ? (
										<FavoriteIcon color="primary" />
									) : game?.meLiked && game?.meLiked[0]?.myFavorite ? (
										<FavoriteIcon color="primary" />
									) : (
										<FavoriteBorderIcon />
									)}
								</IconButton>
								<Typography className="view-cnt">{game?.gameLikes}</Typography>
							</Stack>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default GameCard;
