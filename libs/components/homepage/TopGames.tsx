import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import HomeGameCard from './HomeGameCard';
import { GamesInquiry } from '../../types/game/game.input';
import { Game } from '../../types/game/game';
import { useMutation, useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_GAME } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface TopGamesProps {
	initialInput: GamesInquiry;
}

const TopGames = (props: TopGamesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topGames, setTopGames] = useState<Game[]>([]);

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
			setTopGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/
	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: initialInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') {
		return (
			<Stack className={'top-games'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Top Games</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-game-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={15}
							modules={[Autoplay]}
						>
							{topGames.map((game: Game) => {
								return (
									<SwiperSlide className={'top-game-slide'} key={game?._id}>
										<HomeGameCard game={game} variant={'top'} likeGameHandler={likeGameHandler} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'top-games'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Top Games</span>
							<p>Highest ranked by views, likes and reviews</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-top-prev'} />
								<div className={'swiper-top-pagination'}></div>
								<EastIcon className={'swiper-top-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-game-swiper'}
							slidesPerView={'auto'}
							spaceBetween={15}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-top-next',
								prevEl: '.swiper-top-prev',
							}}
							pagination={{
								el: '.swiper-top-pagination',
							}}
						>
							{topGames.map((game: Game) => {
								return (
									<SwiperSlide className={'top-game-slide'} key={game?._id}>
										<HomeGameCard game={game} variant={'top'} likeGameHandler={likeGameHandler} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TopGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'gameRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopGames;
