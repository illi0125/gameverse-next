import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import HomeGameCard from './HomeGameCard';
import { Game } from '../../types/game/game';
import Link from 'next/link';
import { GamesInquiry } from '../../types/game/game.input';
import { useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';

interface PopularGamesProps {
	initialInput: GamesInquiry;
}

const PopularGames = (props: PopularGamesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [popularGames, setPopularGames] = useState<Game[]>([]);

	/** APOLLO REQUESTS **/

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
			setPopularGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/

	if (!popularGames) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'popular-games'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Popular Games</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-game-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={25}
							modules={[Autoplay]}
						>
							{popularGames.map((game: Game) => {
								return (
									<SwiperSlide key={game._id} className={'popular-game-slide'}>
										<HomeGameCard game={game} variant={'popular'} />
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
			<Stack className={'popular-games'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Popular Games</span>
							<p>Popularity is based on views</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'more-box'}>
								<Link href={'/game'}>
									<span>See All Games</span>
								</Link>
								<img src="/img/icons/rightup.svg" alt="" />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-game-swiper'}
							slidesPerView={'auto'}
							spaceBetween={25}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-popular-next',
								prevEl: '.swiper-popular-prev',
							}}
							pagination={{
								el: '.swiper-popular-pagination',
							}}
						>
							{popularGames.map((game: Game) => {
								return (
									<SwiperSlide key={game._id} className={'popular-game-slide'}>
										<HomeGameCard game={game} variant={'popular'} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
					<Stack className={'pagination-box'}>
						<WestIcon className={'swiper-popular-prev'} />
						<div className={'swiper-popular-pagination'}></div>
						<EastIcon className={'swiper-popular-next'} />
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

PopularGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 7,
		sort: 'gameViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularGames;
