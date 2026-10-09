import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination } from '@mui/material';
import Link from 'next/link';
import MyPageHead from './MyPageHead';
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

	const pageCount = Math.ceil(total / searchFavorites.limit);

	return (
		<div className="gv-mp-section gv-mp-library">
			<MyPageHead kicker="Library" title="Favorites" desc="Games you liked. Tap the heart to remove one." />
			{myFavorites?.length ? (
				<ul className="gv-cat-grid gv-mp-grid" aria-label="Favorite games">
					{myFavorites?.map((game: Game) => (
						<li key={game._id}>
							<GameCard game={game} likeGameHandler={likeGameHandler} myFavorites={true} />
						</li>
					))}
				</ul>
			) : (
				<div className="gv-cat-empty">
					<p className="gv-cat-empty__title">{getFavoritesLoading ? 'Loading favorites…' : 'No favorites yet.'}</p>
					{!getFavoritesLoading && (
						<Link href="/game" className="gv-cat-empty__reset">
							Browse games
						</Link>
					)}
				</div>
			)}
			{myFavorites?.length ? (
				<nav className="gv-cat-pagination" aria-label="Favorite pages">
					{pageCount > 1 ? (
						<Pagination count={pageCount} page={searchFavorites.page} shape="rounded" onChange={paginationHandler} />
					) : (
						<span />
					)}
					<p className="gv-cat-pagination__total">
						Total {total} favorite game{total > 1 ? 's' : ''}
					</p>
				</nav>
			) : null}
		</div>
	);
};

export default MyFavorites;
