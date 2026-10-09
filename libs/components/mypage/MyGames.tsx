import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Pagination } from '@mui/material';
import Link from 'next/link';
import MyPageHead from './MyPageHead';
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

	const pageCount = Math.ceil(total / searchFilter.limit);

	return (
		<div className="gv-mp-section gv-mp-games" id="my-games-panel">
			<MyPageHead kicker="Studio" title="My games" desc="Everything you list in the catalog. Click a status to switch it, or edit and delete.">
				<Link href={{ pathname: '/mypage', query: { category: 'addGame' } }} scroll={false} className="gv-mp-btn gv-mp-btn--solid">
					Add a game
				</Link>
			</MyPageHead>

			<div className="gv-mp-tabs" role="tablist" aria-label="Game status">
				{statusTabs.map((tab) => {
					const selected = searchFilter.search.gameStatus === tab.status;
					return (
						<button
							type="button"
							role="tab"
							aria-selected={selected}
							key={tab.status}
							onClick={() => changeStatusHandler(tab.status)}
							className={`gv-mp-tabs__tab ${selected ? 'is-current' : ''}`}
						>
							{tab.label}
							{selected && !getAgentGamesLoading && <span className="gv-mp-tabs__count">{total}</span>}
						</button>
					);
				})}
			</div>

			<div className="gv-mp-table" role="table" aria-label="My games">
				<div className="gv-mp-table__head listing-title-box" role="row">
					<span role="columnheader">Game</span>
					<span role="columnheader">Published</span>
					<span role="columnheader">Status</span>
					<span role="columnheader">Views</span>
					<span role="columnheader">Actions</span>
				</div>

				{agentGames?.length === 0 ? (
					<div className="gv-cat-empty">
						<p className="gv-cat-empty__title">
							{getAgentGamesLoading ? 'Loading games…' : `No ${searchFilter.search.gameStatus === GameStatus.ACTIVE ? 'active' : 'upcoming'} games.`}
						</p>
						{!getAgentGamesLoading && (
							<Link href={{ pathname: '/mypage', query: { category: 'addGame' } }} scroll={false} className="gv-cat-empty__reset">
								List a game
							</Link>
						)}
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
			</div>

			{agentGames.length !== 0 && (
				<nav className="gv-cat-pagination" aria-label="Game pages">
					{pageCount > 1 ? (
						<Pagination count={pageCount} page={searchFilter.page} shape="rounded" onChange={paginationHandler} />
					) : (
						<span />
					)}
					<p className="gv-cat-pagination__total">
						{total} game{total > 1 ? 's' : ''} available
					</p>
				</nav>
			)}
		</div>
	);
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
