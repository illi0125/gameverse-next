import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Pagination, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { MyGameCard } from './MyGameCard';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Game } from '../../types/game/game';
import { AgentGamesInquiry } from '../../types/game/game.input';
import { T } from '../../types/common';
import { GameStatus } from '../../enums/game.enum';
import { MemberType } from '../../enums/member.enum';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import { UPDATE_GAME } from '../../../apollo/user/mutation';
import { GET_AGENT_GAMES } from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import { formatEnumLabel } from '../../utils';

/** Backend rejects DELETE in getAgentGames, so owners only browse live lifecycle states **/
const statusTabs = [
	{ status: GameStatus.ACTIVE, label: 'Active' },
	{ status: GameStatus.UPCOMING, label: 'Upcoming' },
];

const MyGames: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const [searchFilter, setSearchFilter] = useState<AgentGamesInquiry>(initialInput);
	const [agentGames, setAgentGames] = useState<Game[]>([]);
	const [total, setTotal] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const router = useRouter();

	/** APOLLO REQUESTS **/
	const [updateGame] = useMutation(UPDATE_GAME);

	const {
		loading: getAgentGamesLoading,
		data: getAgentGamesData,
		error: getAgentGamesError,
		refetch: getAgentGamesRefetch,
	} = useQuery(GET_AGENT_GAMES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: user?.memberType !== MemberType.AGENT,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgentGames(data?.getAgentGames?.list ?? []);
			setTotal(data?.getAgentGames?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (user?._id && user?.memberType !== MemberType.AGENT) router.back();
	}, [user]);

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const changeStatusHandler = (value: GameStatus) => {
		setSearchFilter({ ...searchFilter, page: 1, search: { gameStatus: value } });
	};

	const deleteGameHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to delete this game?')) {
				await updateGame({ variables: { input: { _id: id, gameStatus: GameStatus.DELETE } } });
				await getAgentGamesRefetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const updateGameHandler = async (status: GameStatus, id: string) => {
		try {
			if (await sweetConfirmAlert(`Are you sure to change status to ${formatEnumLabel(status)}?`)) {
				await updateGame({ variables: { input: { _id: id, gameStatus: status } } });
				await getAgentGamesRefetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (device === 'mobile') {
		return <div>GAMEVERSE MY GAMES MOBILE</div>;
	} else {
		return (
			<div id="my-games-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">My Games</Typography>
						<Typography className="sub-title">We are glad to see you again!</Typography>
					</Stack>
				</Stack>
				<Stack className="game-list-box">
					<Stack className="tab-name-box">
						{statusTabs.map((tab) => (
							<Typography
								key={tab.status}
								onClick={() => changeStatusHandler(tab.status)}
								className={searchFilter.search.gameStatus === tab.status ? 'active-tab-name' : 'tab-name'}
							>
								{tab.label}
							</Typography>
						))}
					</Stack>
					<Stack className="list-box">
						<Stack className="listing-title-box">
							<Typography className="title-text">Listing title</Typography>
							<Typography className="title-text">Date Published</Typography>
							<Typography className="title-text">Status</Typography>
							<Typography className="title-text">View</Typography>
							<Typography className="title-text">Action</Typography>
						</Stack>

						{agentGames?.length === 0 ? (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No games found!</p>
							</div>
						) : (
							agentGames.map((game: Game) => {
								return (
									<MyGameCard
										key={game._id}
										game={game}
										deleteGameHandler={deleteGameHandler}
										updateGameHandler={updateGameHandler}
									/>
								);
							})
						)}

						{agentGames.length !== 0 && (
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

MyGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			gameStatus: 'ACTIVE',
		},
	},
};

export default MyGames;
