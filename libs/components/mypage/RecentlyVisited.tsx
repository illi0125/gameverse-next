import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination } from '@mui/material';
import Link from 'next/link';
import MyPageHead from './MyPageHead';
import GameCard from '../game/GameCard';
import { Game } from '../../types/game/game';
import { T } from '../../types/common';
import { useQuery } from '@apollo/client';
import { GET_VISITED_GAMES } from '../../../apollo/user/query';

const RecentlyVisited: NextPage = () => {
	const device = useDeviceDetect();
	const [recentlyVisited, setRecentlyVisited] = useState<Game[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchVisited, setSearchVisited] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const {
		loading: getVisitedLoading,
		data: getVisitedData,
		error: getVisitedError,
		refetch: getVisitedRefetch,
	} = useQuery(GET_VISITED_GAMES, {
		fetchPolicy: 'network-only',
		variables: { input: searchVisited },
		onCompleted: (data: T) => {
			setRecentlyVisited(data?.getVisited?.list ?? []);
			setTotal(data?.getVisited?.metaCounter?.[0]?.total || 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchVisited({ ...searchVisited, page: value });
	};

	const pageCount = Math.ceil(total / searchVisited.limit);

	return (
		<div className="gv-mp-section gv-mp-library">
			<MyPageHead kicker="Library" title="Recently visited" desc="Games you opened lately, newest first." />
			{recentlyVisited?.length ? (
				<ul className="gv-cat-grid gv-mp-grid" aria-label="Recently visited games">
					{recentlyVisited?.map((game: Game) => (
						<li key={game._id}>
							<GameCard game={game} recentlyVisited={true} />
						</li>
					))}
				</ul>
			) : (
				<div className="gv-cat-empty">
					<p className="gv-cat-empty__title">{getVisitedLoading ? 'Loading…' : 'Nothing visited yet.'}</p>
					{!getVisitedLoading && (
						<Link href="/game" className="gv-cat-empty__reset">
							Explore the catalog
						</Link>
					)}
				</div>
			)}
			{recentlyVisited?.length ? (
				<nav className="gv-cat-pagination" aria-label="Visited pages">
					{pageCount > 1 ? (
						<Pagination count={pageCount} page={searchVisited.page} shape="rounded" onChange={paginationHandler} />
					) : (
						<span />
					)}
					<p className="gv-cat-pagination__total">
						Total {total} recently visited game{total > 1 ? 's' : ''}
					</p>
				</nav>
			) : null}
		</div>
	);
};

export default RecentlyVisited;
