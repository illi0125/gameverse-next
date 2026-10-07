import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Menu, MenuItem, Pagination, Stack, Typography } from '@mui/material';
import GameCard from '../../libs/components/game/GameCard';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Filter from '../../libs/components/game/Filter';
import { useRouter } from 'next/router';
import { GameSearch, GamesInquiry } from '../../libs/types/game/game.input';
import { Game } from '../../libs/types/game/game';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Direction, Message } from '../../libs/enums/common.enum';
import { useMutation, useQuery } from '@apollo/client';
import { GET_GAMES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_GAME } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { gameSortOptions } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const searchKeys: (keyof GameSearch)[] = [
	'memberId',
	'typeList',
	'platformList',
	'genreList',
	'modeList',
	'pricesRange',
	'releaseDateRange',
	'isFeatured',
	'text',
];

/** Drops unknown keys so stale URLs (e.g. legacy /property links) never reach the API **/
const parseInput = (raw: string | string[] | undefined, fallback: GamesInquiry): GamesInquiry => {
	if (typeof raw !== 'string') return fallback;
	try {
		const parsed = JSON.parse(raw);
		const search: GameSearch = {};
		searchKeys.forEach((key: keyof GameSearch) => {
			if (parsed?.search?.[key] !== undefined) (search as T)[key] = parsed.search[key];
		});
		const sortOption = gameSortOptions.find((option) => option.sort === parsed?.sort);
		return {
			page: Number(parsed?.page) > 0 ? Number(parsed.page) : fallback.page,
			limit: Number(parsed?.limit) > 0 ? Number(parsed.limit) : fallback.limit,
			sort: sortOption ? parsed.sort : fallback.sort,
			direction: parsed?.direction === Direction.ASC ? Direction.ASC : Direction.DESC,
			search,
		};
	} catch (err: any) {
		return fallback;
	}
};

const GameList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchFilter, setSearchFilter] = useState<GamesInquiry>(parseInput(router?.query?.input, initialInput));
	const [games, setGames] = useState<Game[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [sortingOpen, setSortingOpen] = useState(false);

	const filterSortName =
		gameSortOptions.find((option) => option.sort === searchFilter.sort && option.direction === searchFilter.direction)
			?.label ?? 'Newest';

	/** APOLLO REQUESTS **/
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);

	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setGames(data?.getGames?.list ?? []);
			setTotal(data?.getGames?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		const inputObj = parseInput(router?.query?.input, initialInput);
		if (router.query.input) setSearchFilter(inputObj);
		setCurrentPage(inputObj.page);
	}, [router]);

	/** HANDLERS **/
	const pushInput = async (input: GamesInquiry) => {
		await router.push(`/game?input=${JSON.stringify(input)}`, `/game?input=${JSON.stringify(input)}`, {
			scroll: false,
		});
	};

	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
		await pushInput({ ...searchFilter, page: value });
		setCurrentPage(value);
	};

	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = async (e: React.MouseEvent<HTMLLIElement>) => {
		const option = gameSortOptions.find((item) => item.id === e.currentTarget.id);
		setSortingOpen(false);
		setAnchorEl(null);
		if (option) await pushInput({ ...searchFilter, page: 1, sort: option.sort, direction: option.direction as Direction });
	};

	if (device === 'mobile') {
		return <h1>GAMES MOBILE</h1>;
	} else {
		return (
			<div id="game-list-page" style={{ position: 'relative' }}>
				<div className="container">
					<Box component={'div'} className={'right'}>
						<span>Sort by</span>
						<div>
							<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
								{filterSortName}
							</Button>
							<Menu anchorEl={anchorEl} open={sortingOpen} onClose={sortingCloseHandler} sx={{ paddingTop: '5px' }}>
								{gameSortOptions.map((option) => (
									<MenuItem
										onClick={sortingHandler}
										id={option.id}
										key={option.id}
										disableRipple
										sx={{ boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px' }}
									>
										{option.label}
									</MenuItem>
								))}
							</Menu>
						</div>
					</Box>
					<Stack className={'game-page'}>
						<Stack className={'filter-config'}>
							<Filter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} />
						</Stack>
						<Stack className="main-config" mb={'76px'}>
							<Stack className={'list-config'}>
								{games?.length === 0 ? (
									<div className={'no-data'}>
										<img src="/img/icons/icoAlert.svg" alt="" />
										<p>No games found!</p>
									</div>
								) : (
									games.map((game: Game) => {
										return <GameCard game={game} likeGameHandler={likeGameHandler} key={game?._id} />;
									})
								)}
							</Stack>
							<Stack className="pagination-config">
								{games.length !== 0 && (
									<Stack className="pagination-box">
										<Pagination
											page={currentPage}
											count={Math.ceil(total / searchFilter.limit)}
											onChange={handlePaginationChange}
											shape="circular"
											color="primary"
										/>
									</Stack>
								)}

								{games.length !== 0 && (
									<Stack className="total-result">
										<Typography>
											Total {total} game{total > 1 ? 's' : ''} available
										</Typography>
									</Stack>
								)}
							</Stack>
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

GameList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(GameList);
