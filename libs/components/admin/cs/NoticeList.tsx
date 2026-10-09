import React from 'react';
import { Fade, Menu, MenuItem, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import Moment from 'react-moment';
import { Notice } from '../../../types/notice/notice';
import { NoticeStatus } from '../../../enums/notice.enum';
import { AdminEmpty, Density, StatusChip } from '../ui/AdminUi';
import { NoticeKind, noticeStatusAction, noticeStatusLabels, noticeStatusTone, topicLabel } from './supportMeta';

interface NoticePanelListProps {
	kind: NoticeKind;
	notices: Notice[];
	loading?: boolean;
	error?: boolean;
	density?: Density;
	anchorEl: any;
	menuIconClickHandler: (e: any, index: number) => void;
	menuIconCloseHandler: () => void;
	statusHandler: (notice: Notice, status: NoticeStatus) => void;
	eventHandler: (notice: Notice, noticeEvent: boolean) => void;
	editHandler: (notice: Notice) => void;
	removeHandler: (notice: Notice) => void;
}

/** FAQ / notice table: status chip menu, edit, event switch (notices), permanent remove once deleted **/
export const NoticePanelList = (props: NoticePanelListProps) => {
	const {
		kind,
		notices,
		loading = false,
		error = false,
		density = 'comfortable',
		anchorEl,
		menuIconClickHandler,
		menuIconCloseHandler,
		statusHandler,
		eventHandler,
		editHandler,
		removeHandler,
	} = props;
	const columns = 4 + (kind.hasTopic ? 1 : 0) + (kind.hasEvent ? 1 : 0);

	return (
		<TableContainer className={`gv-admin-table is-${density}`}>
			<Table aria-label={kind.plural}>
				<TableHead>
					<TableRow>
						<TableCell>{kind.titleLabel}</TableCell>
						{kind.hasTopic && <TableCell>Topic</TableCell>}
						{kind.hasEvent && <TableCell>Event</TableCell>}
						<TableCell>Created</TableCell>
						<TableCell>Status</TableCell>
						<TableCell align="right">
							<span className="gv-visually-hidden">Actions</span>
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{notices.length === 0 && (
						<TableRow>
							<TableCell colSpan={columns} className="gv-admin-table__empty">
								{loading ? (
									<AdminEmpty title={`Loading ${kind.plural.toLowerCase()}…`} />
								) : error ? (
									<AdminEmpty title={`${kind.plural} could not be loaded.`} desc="Check the connection and try again." />
								) : (
									<AdminEmpty title="Nothing here yet." desc="Try another status or search, or add a new one." />
								)}
							</TableCell>
						</TableRow>
					)}
					{notices.map((notice: Notice, index: number) => {
						const isDeleted = notice.noticeStatus === NoticeStatus.DELETE;
						const label = noticeStatusLabels[notice.noticeStatus] ?? notice.noticeStatus;
						return (
							<TableRow hover key={notice._id} className={isDeleted ? 'is-dimmed' : undefined}>
								<TableCell className="gv-admin-support__main">
									<span className="gv-admin-support__title">{notice.noticeTitle}</span>
									<span className="gv-admin-support__preview">{notice.noticeContent}</span>
								</TableCell>
								{kind.hasTopic && <TableCell>{topicLabel(notice.noticeTopic)}</TableCell>}
								{kind.hasEvent && (
									<TableCell>
										<Switch
											className="gv-admin-switch"
											size="small"
											checked={Boolean(notice.noticeEvent)}
											disabled={isDeleted}
											inputProps={{ 'aria-label': `Highlight ${notice.noticeTitle} as an event` }}
											onChange={(e: any) => eventHandler(notice, e.target.checked)}
										/>
									</TableCell>
								)}
								<TableCell className="gv-admin-mono">
									<Moment format={'DD.MM.YY'}>{notice.createdAt}</Moment>
								</TableCell>
								<TableCell>
									<StatusChip
										label={label}
										tone={noticeStatusTone[notice.noticeStatus] ?? 'neutral'}
										ariaLabel={`Change status of ${notice.noticeTitle}, now ${label}`}
										onClick={(e: any) => menuIconClickHandler(e, index)}
									/>
									<Menu
										className={'gv-admin-menu'}
										anchorEl={anchorEl[index]}
										open={Boolean(anchorEl[index])}
										onClose={menuIconCloseHandler}
										TransitionComponent={Fade}
									>
										<li className="gv-admin-menu__label">{isDeleted ? 'Restore' : 'Change status'}</li>
										{Object.values(NoticeStatus)
											.filter((status) => status !== notice.noticeStatus)
											.map((status) => (
												<MenuItem onClick={() => statusHandler(notice, status)} key={status}>
													{noticeStatusAction(notice.noticeStatus, status)}
												</MenuItem>
											))}
									</Menu>
								</TableCell>
								<TableCell align="right">
									<span className="gv-admin-row-actions">
										{isDeleted ? (
											<Tooltip title="Remove permanently">
												<button
													type="button"
													className="gv-admin-iconbtn is-danger"
													aria-label={`Remove ${notice.noticeTitle} permanently`}
													onClick={() => removeHandler(notice)}
												>
													<DeleteForeverOutlinedIcon aria-hidden />
												</button>
											</Tooltip>
										) : (
											<Tooltip title="Edit">
												<button
													type="button"
													className="gv-admin-iconbtn"
													aria-label={`Edit ${notice.noticeTitle}`}
													onClick={() => editHandler(notice)}
												>
													<EditOutlinedIcon aria-hidden />
												</button>
											</Tooltip>
										)}
									</span>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
