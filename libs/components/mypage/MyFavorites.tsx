import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination, Stack, Typography } from '@mui/material';
import GameCard from '../game/GameCard';
import { Game } from '../../types/game/game';
import { T } from '../../types/common';
import { useMutation, useQuery } from '@apollo/client';
import { LIKE_TARGET_GAME } from '../../../apollo/user/mutation';
import { GET_FAVORITE_GAMES } from '../../../apollo/user/query';
import { Messages } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

const MyFavorites: NextPage = () => {
	const device = useDeviceDetect();
	const [myFavorites, setMyFavorites] = useState<Game[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFavorites, setSearchFavorites] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);

	const {
		loading: getFavoritesLoading,
		data: getFavoritesData,
		error: getFavoritesError,
		refetch: getFavoritesRefetch,
	} = useQuery(GET_FAVORITE_GAMES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFavorites },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMyFavorites(data?.getFavorites?.list ?? []);
			setTotal(data?.getFavorites?.metaCounter?.[0]?.total || 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFavorites({ ...searchFavorites, page: value });
	};

	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetGame({ variables: { input: id } });
			await getFavoritesRefetch({ input: searchFavorites });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') {
		return <div>GAMEVERSE MY FAVORITES MOBILE</div>;
	} else {
		return (
			<div id="my-favorites-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">My Favorites</Typography>
						<Typography className="sub-title">We are glad to see you again!</Typography>
					</Stack>
				</Stack>
				<Stack className="favorites-list-box">
					{myFavorites?.length ? (
						myFavorites?.map((game: Game) => {
							return <GameCard game={game} likeGameHandler={likeGameHandler} myFavorites={true} key={game._id} />;
						})
					) : (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No Favorites found!</p>
						</div>
					)}
				</Stack>
				{myFavorites?.length ? (
					<Stack className="pagination-config">
						<Stack className="pagination-box">
							<Pagination
								count={Math.ceil(total / searchFavorites.limit)}
								page={searchFavorites.page}
								shape="circular"
								color="primary"
								onChange={paginationHandler}
							/>
						</Stack>
						<Stack className="total-result">
							<Typography>
								Total {total} favorite game{total > 1 ? 's' : ''}
							</Typography>
						</Stack>
					</Stack>
				) : null}
			</div>
		);
	}
};

export default MyFavorites;
