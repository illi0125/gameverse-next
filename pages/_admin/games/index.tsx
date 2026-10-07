import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, List, ListItem, OutlinedInput, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { TabContext } from '@mui/lab';
import TablePagination from '@mui/material/TablePagination';
import { GamePanelList } from '../../../libs/components/admin/games/GameList';
import { AllGamesInquiry } from '../../../libs/types/game/game.input';
import { Game } from '../../../libs/types/game/game';
import { GameGenre, GamePlatform, GameStatus, GameType } from '../../../libs/enums/game.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { AdminGameUpdate } from '../../../libs/types/game/game.update';
import { useMutation, useQuery } from '@apollo/client';
import { REMOVE_GAME_BY_ADMIN, UPDATE_GAME_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_GAMES_BY_ADMIN } from '../../../apollo/admin/query';
import { T } from '../../../libs/types/common';
import { formatEnumLabel } from '../../../libs/utils';

const statusTabs: { value: GameStatus | 'ALL'; label: string }[] = [
	{ value: 'ALL', label: 'All' },
	{ value: GameStatus.ACTIVE, label: 'Active' },
	{ value: GameStatus.UPCOMING, label: 'Upcoming' },
	{ value: GameStatus.DELETE, label: 'Deleted' },
];

type ListFilter = 'platformList' | 'genreList' | 'typeList';

const AdminGames: NextPage = ({ initialInquiry, ...props }: any) => {
	const [anchorEl, setAnchorEl] = useState<[] | HTMLElement[]>([]);
	const [gamesInquiry, setGamesInquiry] = useState<AllGamesInquiry>(initialInquiry);
	const [games, setGames] = useState<Game[]>([]);
	const [gamesTotal, setGamesTotal] = useState<number>(0);
	const [searchText, setSearchText] = useState<string>('');
	const statusValue = gamesInquiry?.search?.gameStatus ?? 'ALL';

	/** APOLLO REQUESTS **/
	const [updateGameByAdmin] = useMutation(UPDATE_GAME_BY_ADMIN);
	const [removeGameByAdmin] = useMutation(REMOVE_GAME_BY_ADMIN);

	const { refetch: getAllGamesByAdminRefetch } = useQuery(GET_ALL_GAMES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: gamesInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setGames(data?.getAllGamesByAdmin?.list ?? []);
			setGamesTotal(data?.getAllGamesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const changePageHandler = async (event: unknown, newPage: number) => {
		setGamesInquiry({ ...gamesInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setGamesInquiry({ ...gamesInquiry, page: 1, limit: parseInt(event.target.value, 10) });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => {
		setAnchorEl([]);
	};

	const tabChangeHandler = (newValue: GameStatus | 'ALL') => {
		const { gameStatus, ...search } = gamesInquiry.search;
		setGamesInquiry({
			...gamesInquiry,
			page: 1,
			search: newValue === 'ALL' ? search : { ...search, gameStatus: newValue },
		});
	};

	const listFilterHandler = (key: ListFilter, value: string) => {
		const { [key]: _removed, ...search } = gamesInquiry.search;
		setGamesInquiry({
			...gamesInquiry,
			page: 1,
			search: value === 'ALL' ? search : { ...search, [key]: [value] },
		});
	};

	const featuredFilterHandler = (value: string) => {
		const { isFeatured, ...search } = gamesInquiry.search;
		setGamesInquiry({
			...gamesInquiry,
			page: 1,
			search: value === 'ALL' ? search : { ...search, isFeatured: value === 'FEATURED' },
		});
	};

	const textSearchHandler = () => {
		const { text, ...search } = gamesInquiry.search;
		setGamesInquiry({ ...gamesInquiry, page: 1, search: searchText.trim() ? { ...search, text: searchText.trim() } : search });
	};

	const removeGameHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Remove this game permanently? This cannot be undone.')) {
				await removeGameByAdmin({ variables: { input: id } });
				await getAllGamesByAdminRefetch({ input: gamesInquiry });
			}
			menuIconCloseHandler();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const updateGameHandler = async (updateData: AdminGameUpdate) => {
		try {
			menuIconCloseHandler();
			if (updateData.gameStatus === GameStatus.DELETE && !(await sweetConfirmAlert('Delete this game?'))) return;
			await updateGameByAdmin({ variables: { input: updateData } });
			await getAllGamesByAdminRefetch({ input: gamesInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const selectedOf = (key: ListFilter): string => (gamesInquiry.search[key] as string[] | undefined)?.[0] ?? 'ALL';

	const renderListSelect = (key: ListFilter, label: string, values: string[]) => (
		<Select
			sx={{ width: '170px' }}
			value={selectedOf(key)}
			onChange={(e: any) => listFilterHandler(key, e.target.value)}
			renderValue={(value: string) => (value === 'ALL' ? `${label}: All` : formatEnumLabel(value))}
		>
			<MenuItem value={'ALL'}>All</MenuItem>
			{values.map((value: string) => (
				<MenuItem value={value} key={value}>
					{formatEnumLabel(value)}
				</MenuItem>
			))}
		</Select>
	);

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Game List
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={statusValue}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								{statusTabs.map((tab) => (
									<ListItem
										key={tab.value}
										onClick={() => tabChangeHandler(tab.value)}
										value={tab.value}
										className={statusValue === tab.value ? 'li on' : 'li'}
									>
										{tab.label}
									</ListItem>
								))}
							</List>
							<Divider />
							<Stack className={'search-area'} direction={'row'} gap={'16px'} flexWrap={'wrap'} sx={{ m: '24px' }}>
								<OutlinedInput
									value={searchText}
									placeholder={'Search title, developer, publisher'}
									sx={{ width: '280px' }}
									onChange={(e: any) => setSearchText(e.target.value)}
									onKeyDown={(e: any) => {
										if (e.key === 'Enter') textSearchHandler();
									}}
									onBlur={textSearchHandler}
								/>
								{renderListSelect('platformList', 'Platform', Object.values(GamePlatform))}
								{renderListSelect('genreList', 'Genre', Object.values(GameGenre))}
								{renderListSelect('typeList', 'Type', Object.values(GameType))}
								<Select
									sx={{ width: '170px' }}
									value={
										gamesInquiry.search.isFeatured === undefined
											? 'ALL'
											: gamesInquiry.search.isFeatured
											? 'FEATURED'
											: 'NOT_FEATURED'
									}
									onChange={(e: any) => featuredFilterHandler(e.target.value)}
								>
									<MenuItem value={'ALL'}>Featured: All</MenuItem>
									<MenuItem value={'FEATURED'}>Featured</MenuItem>
									<MenuItem value={'NOT_FEATURED'}>Not featured</MenuItem>
								</Select>
							</Stack>
							<Divider />
						</Box>
						<GamePanelList
							games={games}
							anchorEl={anchorEl}
							menuIconClickHandler={menuIconClickHandler}
							menuIconCloseHandler={menuIconCloseHandler}
							updateGameHandler={updateGameHandler}
							removeGameHandler={removeGameHandler}
						/>

						<TablePagination
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={gamesTotal}
							rowsPerPage={gamesInquiry?.limit}
							page={gamesInquiry?.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

AdminGames.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminGames);
