import React from 'react';
import Link from 'next/link';
import {
	TableCell,
	TableHead,
	TableBody,
	TableRow,
	Table,
	TableContainer,
	Button,
	Menu,
	Fade,
	MenuItem,
	Switch,
	Tooltip,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import { Stack } from '@mui/material';
import { Game } from '../../../types/game/game';
import { REACT_APP_API_URL } from '../../../config';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Typography from '@mui/material/Typography';
import { GameStatus } from '../../../enums/game.enum';
import { formatEnumLabel, formatGamePrice } from '../../../utils';
import { AdminGameUpdate } from '../../../types/game/game.update';

const headCells = ['ID', 'TITLE', 'PRICE', 'AGENT', 'PLATFORMS', 'TYPE', 'FEATURED', 'STATUS'];

const statusBadge: Record<GameStatus, string> = {
	[GameStatus.ACTIVE]: 'badge success',
	[GameStatus.UPCOMING]: 'badge warning',
	[GameStatus.DELETE]: 'badge delete',
};

interface GamePanelListType {
	games: Game[];
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateGameHandler: (updateData: AdminGameUpdate) => Promise<void>;
	removeGameHandler: (id: string) => Promise<void>;
}

export const GamePanelList = (props: GamePanelListType) => {
	const { games, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateGameHandler, removeGameHandler } = props;

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
					<TableHead>
						<TableRow>
							{headCells.map((label: string, index: number) => (
								<TableCell key={label} align={index < 2 ? 'left' : 'center'}>
									{label}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{games?.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={headCells.length}>
									<span className={'no-data'}>data not found!</span>
								</TableCell>
							</TableRow>
						)}

						{games?.map((game: Game, index: number) => {
							const gameImage = game?.gameImages?.[0] ? `${REACT_APP_API_URL}/${game.gameImages[0]}` : undefined;
							const isDeleted = game.gameStatus === GameStatus.DELETE;
							const title = (
								<Stack direction={'row'} alignItems={'center'}>
									<Avatar alt={game.gameTitle} src={gameImage} variant={'rounded'} sx={{ ml: '2px', mr: '10px' }} />
									<div>{game.gameTitle}</div>
								</Stack>
							);

							return (
								<TableRow hover key={game?._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
									<TableCell align="left">{game._id}</TableCell>
									<TableCell align="left" className={'name'}>
										{isDeleted ? title : <Link href={`/game/detail?id=${game._id}`}>{title}</Link>}
									</TableCell>
									<TableCell align="center">{formatGamePrice(game)}</TableCell>
									<TableCell align="center">{game.memberData?.memberNick ?? '—'}</TableCell>
									<TableCell align="center">{game.gamePlatforms.map(formatEnumLabel).join(', ')}</TableCell>
									<TableCell align="center">{formatEnumLabel(game.gameType)}</TableCell>
									<TableCell align="center">
										<Tooltip title={isDeleted ? 'Restore the game before featuring it' : ''}>
											<span>
												<Switch
													size="small"
													checked={game.isFeatured}
													disabled={isDeleted}
													onChange={(e: any) => updateGameHandler({ _id: game._id, isFeatured: e.target.checked })}
												/>
											</span>
										</Tooltip>
									</TableCell>
									<TableCell align="center">
										<Stack direction={'row'} justifyContent={'center'} alignItems={'center'} gap={'6px'}>
											<Button onClick={(e: any) => menuIconClickHandler(e, index)} className={statusBadge[game.gameStatus]}>
												{isDeleted ? 'DELETED' : game.gameStatus}
											</Button>
											{isDeleted && (
												<Tooltip title="Remove permanently">
													<Button
														variant="outlined"
														sx={{ p: '3px', minWidth: 0, border: 'none', ':hover': { border: '1px solid #000000' } }}
														onClick={() => removeGameHandler(game._id)}
													>
														<DeleteForeverIcon fontSize="small" />
													</Button>
												</Tooltip>
											)}
										</Stack>
										<Menu
											className={'menu-modal'}
											MenuListProps={{ 'aria-labelledby': 'fade-button' }}
											anchorEl={anchorEl[index]}
											open={Boolean(anchorEl[index])}
											onClose={menuIconCloseHandler}
											TransitionComponent={Fade}
											sx={{ p: 1 }}
										>
											{Object.values(GameStatus)
												.filter((status: GameStatus) => status !== game.gameStatus)
												.map((status: GameStatus) => (
													<MenuItem onClick={() => updateGameHandler({ _id: game._id, gameStatus: status })} key={status}>
														<Typography variant={'subtitle1'} component={'span'}>
															{status === GameStatus.DELETE
																? 'Delete'
																: isDeleted
																? `Restore as ${formatEnumLabel(status)}`
																: formatEnumLabel(status)}
														</Typography>
													</MenuItem>
												))}
										</Menu>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
};
