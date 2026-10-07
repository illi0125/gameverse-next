import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Pagination, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { MyGameCard } from '../mypage/MyGameCard';
import { Game } from '../../types/game/game';
import { GamesInquiry } from '../../types/game/game.input';
import { T } from '../../types/common';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';

const MemberGames: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { memberId } = router.query;
	const [searchFilter, setSearchFilter] = useState<GamesInquiry>({ ...initialInput });
	const [memberGames, setMemberGames] = useState<Game[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !searchFilter?.search?.memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMemberGames(data?.getGames?.list ?? []);
			setTotal(data?.getGames?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (memberId)
			setSearchFilter({ ...initialInput, search: { ...initialInput.search, memberId: memberId as string } });
	}, [memberId]);

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	if (device === 'mobile') {
		return <div>GAMEVERSE GAMES MOBILE</div>;
	} else {
		return (
			<div id="member-games-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Games</Typography>
					</Stack>
				</Stack>
				<Stack className="games-list-box">
					<Stack className="list-box">
						{memberGames?.length > 0 && (
							<Stack className="listing-title-box">
								<Typography className="title-text">Listing title</Typography>
								<Typography className="title-text">Date Published</Typography>
								<Typography className="title-text">Status</Typography>
								<Typography className="title-text">View</Typography>
							</Stack>
						)}
						{memberGames?.length === 0 && (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No games found!</p>
							</div>
						)}
						{memberGames?.map((game: Game) => {
							return <MyGameCard game={game} memberPage={true} key={game?._id} />;
						})}

						{memberGames.length !== 0 && (
							<Stack className="pagination-config">
								<Stack className="pagination-box">
									<Pagination
										count={Math.ceil(total / searchFilter.limit)}
										page={searchFilter.page}
										shape="circular"
										color="primary"
										onChange={paginationHandler}
									/>
								</Stack>
								<Stack className="total-result">
									<Typography>
										{total} game{total > 1 ? 's' : ''} available
									</Typography>
								</Stack>
							</Stack>
						)}
					</Stack>
				</Stack>
			</div>
		);
	}
};

MemberGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			memberId: '',
		},
	},
};

export default MemberGames;
