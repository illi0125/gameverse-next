import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Game } from '../../types/game/game';
import { REACT_APP_API_URL, topGameRank } from '../../config';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../utils';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface GameBigCardProps {
	game: Game;
	likeGameHandler?: any;
}

const GameBigCard = (props: GameBigCardProps) => {
	const { game, likeGameHandler } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const imagePath = game?.gameImages?.[0] ? `${REACT_APP_API_URL}/${game.gameImages[0]}` : '/img/gameverse/game-placeholder.svg';

	/** HANDLERS **/
	const goGameDetailPage = (gameId: string) => {
		router.push(`/game/detail?id=${gameId}`);
	};

	if (device === 'mobile') {
		return <div>GAME BIG CARD</div>;
	} else {
		return (
			<Stack className="game-big-card-box" onClick={() => goGameDetailPage(game?._id)}>
				<Box component={'div'} className={'card-img'} style={{ backgroundImage: `url(${imagePath})` }}>
					{game?.isUpcoming ? (
						<div className={'status upcoming'}>
							<span>upcoming</span>
						</div>
					) : (
						game?.gameRank >= topGameRank && (
							<div className={'status'}>
								<img src="/img/icons/electricity.svg" alt="" />
								<span>top</span>
							</div>
						)
					)}
					<div className={'price'}>
						{hasGameDiscount(game) && <s>{formatGameOriginalPrice(game)}</s>}
						{formatGamePrice(game)}
					</div>
				</Box>
				<Box component={'div'} className={'info'}>
					<strong className={'title'}>{game?.gameTitle}</strong>
					<p className={'desc'}>
						{game?.gameDeveloper} · {game?.gamePublisher}
					</p>
					<div className={'options'}>
						{game?.gamePlatforms?.map((platform: string) => (
							<span className={'chip'} key={platform}>
								{formatEnumLabel(platform)}
							</span>
						))}
					</div>
					<Divider sx={{ mt: '15px', mb: '17px' }} />
					<div className={'bott'}>
						<p className={'genres'}>{game?.gameGenres?.slice(0, 2).map(formatEnumLabel).join(', ')}</p>
						<div className="buttons-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{game?.gameViews}</Typography>
							<IconButton
								color={'default'}
								onClick={(e: any) => {
									e.stopPropagation();
									likeGameHandler?.(user, game?._id);
								}}
							>
								{game?.meLiked && game?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon style={{ color: 'red' }} />
								) : (
									<FavoriteIcon />
								)}
							</IconButton>
							<Typography className="view-cnt">{game?.gameLikes}</Typography>
						</div>
					</div>
				</Box>
			</Stack>
		);
	}
};

export default GameBigCard;
