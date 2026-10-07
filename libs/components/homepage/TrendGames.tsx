import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import { Game } from '../../types/game/game';
import { GamesInquiry } from '../../types/game/game.input';
import HomeGameCard from './HomeGameCard';
import { useMutation, useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_GAME } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TrendGamesProps {
	initialInput: GamesInquiry;
}

const TrendGames = (props: TrendGamesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendGames, setTrendGames] = useState<Game[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);

	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrendGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/
	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			// execute likeTargetGame Mutation
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: initialInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (!trendGames) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'trend-games'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Trending Games</span>
					</Stack>
					<Stack className={'card-box'}>
						{trendGames.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>
								No trending games yet
							</Box>
						) : (
							<Swiper
								className={'trend-game-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={15}
								modules={[Autoplay]}
							>
								{trendGames.map((game: Game) => {
									return (
										<SwiperSlide key={game._id} className={'trend-game-slide'}>
											<HomeGameCard game={game} variant={'trend'} likeGameHandler={likeGameHandler} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'trend-games'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Trending Games</span>
							<p>Trend is based on likes</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-trend-prev'} />
								<div className={'swiper-trend-pagination'}></div>
								<EastIcon className={'swiper-trend-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{trendGames.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>
								No trending games yet
							</Box>
						) : (
							<Swiper
								className={'trend-game-swiper'}
								slidesPerView={'auto'}
								spaceBetween={15}
								modules={[Autoplay, Navigation, Pagination]}
								navigation={{
									nextEl: '.swiper-trend-next',
									prevEl: '.swiper-trend-prev',
								}}
								pagination={{
									el: '.swiper-trend-pagination',
								}}
							>
								{trendGames.map((game: Game) => {
									return (
										<SwiperSlide key={game._id} className={'trend-game-slide'}>
											<HomeGameCard game={game} variant={'trend'} likeGameHandler={likeGameHandler} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TrendGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'gameLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendGames;
