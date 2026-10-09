import React from 'react';
import Link from 'next/link';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Menu,
	Fade,
	MenuItem,
	Switch,
	Tooltip,
} from '@mui/material';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import { Game } from '../../../types/game/game';
import { REACT_APP_API_URL } from '../../../config';
import { GameStatus } from '../../../enums/game.enum';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../../utils';
import { AdminGameUpdate } from '../../../types/game/game.update';
import { AdminEmpty, ChipTone, Density, StatusChip } from '../ui/AdminUi';

const statusTone: Record<string, ChipTone> = {
	[GameStatus.ACTIVE]: 'live',
	[GameStatus.UPCOMING]: 'hold',
	[GameStatus.DELETE]: 'off',
};

const statusLabels: Record<string, string> = {
	[GameStatus.ACTIVE]: 'Active',
	[GameStatus.UPCOMING]: 'Upcoming',
	[GameStatus.DELETE]: 'Deleted',
};
const statusLabel = (status: string) => statusLabels[status] ?? formatEnumLabel(status);

interface GamePanelListType {
	games: Game[];
	loading?: boolean;
	error?: boolean;
	density?: Density;
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateGameHandler: (updateData: AdminGameUpdate) => Promise<void>;
	removeGameHandler: (id: string) => Promise<void>;
}

/** Admin game table; the status chip opens the same menu as before, the switch toggles featured **/
export const GamePanelList = (props: GamePanelListType) => {
	const {
		games,
		loading = false,
		error = false,
		density = 'comfortable',
		anchorEl,
		menuIconClickHandler,
		menuIconCloseHandler,
		updateGameHandler,
		removeGameHandler,
	} = props;

	return (
		<TableContainer className={`gv-admin-table is-${density}`}>
			<Table aria-label="Games">
				<TableHead>
					<TableRow>
						<TableCell>Game</TableCell>
						<TableCell>Developer</TableCell>
						<TableCell align="right">Price</TableCell>
						<TableCell>Platforms</TableCell>
						<TableCell>Type</TableCell>
						<TableCell align="right">Views</TableCell>
						<TableCell>Featured</TableCell>
						<TableCell>Status</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{games.length === 0 && (
						<TableRow>
							<TableCell colSpan={8} className="gv-admin-table__empty">
								{loading ? (
									<AdminEmpty title="Loading games…" />
								) : error ? (
									<AdminEmpty title="Games could not be loaded." desc="Check the connection and try again." />
								) : (
									<AdminEmpty title="No games match." desc="Try another status, filter or title." />
								)}
							</TableCell>
						</TableRow>
					)}
					{games.map((game: Game, index: number) => {
						const gameImage = game?.gameImages?.[0] ? `${REACT_APP_API_URL}/${game.gameImages[0]}` : undefined;
						const isDeleted = game.gameStatus === GameStatus.DELETE;
						const title = (
							<>
								<span className="gv-admin-person__avatar gv-admin-game__thumb">
									{gameImage && <img src={gameImage} alt="" />}
								</span>
								<span>
									<span className="gv-admin-person__name">{game.gameTitle}</span>
									<span className="gv-admin-person__id">{game._id}</span>
								</span>
							</>
						);

						return (
							<TableRow hover key={game?._id} className={isDeleted ? 'is-dimmed' : undefined}>
								<TableCell>
									{isDeleted ? (
										<span className="gv-admin-person">{title}</span>
									) : (
										<Link href={`/game/detail?id=${game._id}`} className="gv-admin-person">
											{title}
										</Link>
									)}
								</TableCell>
								<TableCell>
									{game.memberData ? (
										<Link href={`/member?memberId=${game.memberData._id}`} className="gv-admin-link">
											{game.memberData.memberNick}
										</Link>
									) : (
										<span className="gv-admin-muted">—</span>
									)}
								</TableCell>
								<TableCell align="right" className="gv-admin-mono">
									{hasGameDiscount(game) && <s className="gv-admin-muted">{formatGameOriginalPrice(game)}</s>}{' '}
									{formatGamePrice(game)}
								</TableCell>
								<TableCell className="gv-admin-game__platforms">
									{game.gamePlatforms.map(formatEnumLabel).join(', ')}
								</TableCell>
								<TableCell>{formatEnumLabel(game.gameType)}</TableCell>
								<TableCell align="right" className="gv-admin-mono">
									{game.gameViews ?? 0}
								</TableCell>
								<TableCell>
									<Tooltip title={isDeleted ? 'Restore the game before featuring it' : ''}>
										<span>
											<Switch
												className="gv-admin-switch"
												size="small"
												checked={game.isFeatured}
												disabled={isDeleted}
												inputProps={{ 'aria-label': `Feature ${game.gameTitle}` }}
												onChange={(e: any) => updateGameHandler({ _id: game._id, isFeatured: e.target.checked })}
											/>
										</span>
									</Tooltip>
								</TableCell>
								<TableCell>
									<span className="gv-admin-row-actions">
										<StatusChip
											label={statusLabel(game.gameStatus)}
											tone={statusTone[game.gameStatus] ?? 'neutral'}
											ariaLabel={`Change status of ${game.gameTitle}, now ${statusLabel(game.gameStatus)}`}
											onClick={(e: any) => menuIconClickHandler(e, index)}
										/>
										{isDeleted && (
											<Tooltip title="Remove permanently">
												<button
													type="button"
													className="gv-admin-iconbtn is-danger"
													aria-label={`Remove ${game.gameTitle} permanently`}
													onClick={() => removeGameHandler(game._id)}
												>
													<DeleteForeverOutlinedIcon aria-hidden />
												</button>
											</Tooltip>
										)}
									</span>
									<Menu
										className={'gv-admin-menu'}
										anchorEl={anchorEl[index]}
										open={Boolean(anchorEl[index])}
										onClose={menuIconCloseHandler}
										TransitionComponent={Fade}
									>
										<li className="gv-admin-menu__label">{isDeleted ? 'Restore' : 'Change status to'}</li>
										{Object.values(GameStatus)
											.filter((status: GameStatus) => status !== game.gameStatus)
											.map((status: GameStatus) => (
												<MenuItem onClick={() => updateGameHandler({ _id: game._id, gameStatus: status })} key={status}>
													{status === GameStatus.DELETE
														? 'Delete'
														: isDeleted
														? `Restore as ${statusLabel(status)}`
														: statusLabel(status)}
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
	);
};
