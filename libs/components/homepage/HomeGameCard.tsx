import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Game } from '../../types/game/game';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { REACT_APP_API_URL, topGameRank } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { formatEnumLabel, formatGamePrice } from '../../utils';

interface HomeGameCardProps {
	game: Game;
	variant: 'trend' | 'popular' | 'top';
	likeGameHandler?: any;
}

/** Shared card for the Trend, Popular and Top homepage sections (desktop and mobile share markup) **/
const HomeGameCard = (props: HomeGameCardProps) => {
	const { game, variant, likeGameHandler } = props;
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const imagePath = game?.gameImages?.[0] ? `${REACT_APP_API_URL}/${game.gameImages[0]}` : '/img/banner/header1.svg';
	const showBadges = variant === 'popular';

	/** HANDLERS **/
	const pushDetailHandler = async (gameId: string) => {
		await router.push({ pathname: '/game/detail', query: { id: gameId } });
	};

	return (
		<Stack className={`${variant}-card-box`}>
			<Box
				component={'div'}
				className={'card-img'}
				style={{ backgroundImage: `url(${imagePath})` }}
				onClick={() => pushDetailHandler(game._id)}
			>
				{showBadges && game?.isUpcoming && (
					<div className={'status upcoming'}>
						<span>upcoming</span>
					</div>
				)}
				{showBadges && !game?.isUpcoming && game?.gameRank >= topGameRank && (
					<div className={'status'}>
						<img src="/img/icons/electricity.svg" alt="" />
						<span>top</span>
					</div>
				)}
				<div className={showBadges ? 'price' : undefined}>{formatGamePrice(game)}</div>
			</Box>
			<Box component={'div'} className={'info'}>
				<strong className={'title'} onClick={() => pushDetailHandler(game._id)}>
					{game?.gameTitle}
				</strong>
				<p className={'desc'}>{game?.gameDescription}</p>
				<div className={'options game-chips'}>
					{game?.gamePlatforms?.slice(0, 3).map((platform: string) => (
						<div key={platform}>
							<span>{formatEnumLabel(platform)}</span>
						</div>
					))}
				</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>{game?.gameGenres?.slice(0, 2).map(formatEnumLabel).join(' / ')}</p>
					<div className="view-like-box">
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
						<Typography className="view-cnt">{game?.gameViews}</Typography>
						{likeGameHandler && (
							<>
								<IconButton color={'default'} onClick={() => likeGameHandler(user, game?._id)}>
									{game?.meLiked && game?.meLiked[0]?.myFavorite ? (
										<FavoriteIcon style={{ color: 'red' }} />
									) : (
										<FavoriteIcon />
									)}
								</IconButton>
								<Typography className="view-cnt">{game?.gameLikes}</Typography>
							</>
						)}
					</div>
				</div>
			</Box>
		</Stack>
	);
};

export default HomeGameCard;
