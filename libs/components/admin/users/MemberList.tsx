import React from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Menu, Fade, MenuItem } from '@mui/material';
import { Member } from '../../../types/member/member';
import { REACT_APP_API_URL } from '../../../config';
import { MemberStatus, MemberType } from '../../../enums/member.enum';
import { memberTypeLabel, formatEnumLabel } from '../../../utils';
import { AdminEmpty, ChipTone, Density, StatusChip } from '../ui/AdminUi';

const statusTone: Record<string, ChipTone> = {
	[MemberStatus.ACTIVE]: 'live',
	[MemberStatus.BLOCK]: 'alert',
	[MemberStatus.DELETE]: 'off',
};

const statusLabels: Record<string, string> = {
	[MemberStatus.ACTIVE]: 'Active',
	[MemberStatus.BLOCK]: 'Blocked',
	[MemberStatus.DELETE]: 'Deleted',
};
const statusLabel = (status: string) => statusLabels[status] ?? formatEnumLabel(status);

interface MemberPanelListType {
	members: Member[];
	loading?: boolean;
	error?: boolean;
	density?: Density;
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateMemberHandler: any;
}

/** Admin member table; the role and status chips open the same menus as before **/
export const MemberPanelList = (props: MemberPanelListType) => {
	const {
		members,
		loading = false,
		error = false,
		density = 'comfortable',
		anchorEl,
		menuIconClickHandler,
		menuIconCloseHandler,
		updateMemberHandler,
	} = props;

	return (
		<TableContainer className={`gv-admin-table is-${density}`}>
			<Table aria-label="Members">
				<TableHead>
					<TableRow>
						<TableCell>Member</TableCell>
						<TableCell>Full name</TableCell>
						<TableCell>Phone</TableCell>
						<TableCell>Role</TableCell>
						<TableCell align="right">Warnings</TableCell>
						<TableCell align="right">Blocks</TableCell>
						<TableCell>Status</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{members.length === 0 && (
						<TableRow>
							<TableCell colSpan={7} className="gv-admin-table__empty">
								{loading ? (
									<AdminEmpty title="Loading members…" />
								) : error ? (
									<AdminEmpty title="Members could not be loaded." desc="Check the connection and try again." />
								) : (
									<AdminEmpty title="No members match." desc="Try another status, role or name." />
								)}
							</TableCell>
						</TableRow>
					)}
					{members.map((member: Member, index: number) => {
						const memberImage = member.memberImage
							? `${REACT_APP_API_URL}/${member.memberImage}`
							: '/img/profile/defaultUser.svg';
						return (
							<TableRow hover key={member?._id}>
								<TableCell>
									<Link href={`/member?memberId=${member._id}`} className="gv-admin-person">
										<span className="gv-admin-person__avatar">
											<img src={memberImage} alt="" />
										</span>
										<span>
											<span className="gv-admin-person__name">{member.memberNick}</span>
											<span className="gv-admin-person__id">{member._id}</span>
										</span>
									</Link>
								</TableCell>
								<TableCell>{member.memberFullName ?? <span className="gv-admin-muted">—</span>}</TableCell>
								<TableCell className="gv-admin-mono">{member.memberPhone}</TableCell>
								<TableCell>
									<StatusChip
										label={memberTypeLabel(member.memberType)}
										tone="neutral"
										ariaLabel={`Change role of ${member.memberNick}, now ${memberTypeLabel(member.memberType)}`}
										onClick={(e: any) => menuIconClickHandler(e, index)}
									/>
									<Menu
										className={'gv-admin-menu'}
										anchorEl={anchorEl[index]}
										open={Boolean(anchorEl[index])}
										onClose={menuIconCloseHandler}
										TransitionComponent={Fade}
									>
										<li className="gv-admin-menu__label">Change role to</li>
										{Object.values(MemberType)
											.filter((ele) => ele !== member?.memberType)
											.map((type: string) => (
												<MenuItem onClick={() => updateMemberHandler({ _id: member._id, memberType: type })} key={type}>
													{memberTypeLabel(type)}
												</MenuItem>
											))}
									</Menu>
								</TableCell>
								<TableCell align="right" className="gv-admin-mono">
									{member.memberWarnings}
								</TableCell>
								<TableCell align="right" className="gv-admin-mono">
									{member.memberBlocks}
								</TableCell>
								<TableCell>
									<StatusChip
										label={statusLabel(member.memberStatus)}
										tone={statusTone[member.memberStatus] ?? 'neutral'}
										ariaLabel={`Change status of ${member.memberNick}, now ${statusLabel(member.memberStatus)}`}
										onClick={(e: any) => menuIconClickHandler(e, member._id)}
									/>
									<Menu
										className={'gv-admin-menu'}
										anchorEl={anchorEl[member._id]}
										open={Boolean(anchorEl[member._id])}
										onClose={menuIconCloseHandler}
										TransitionComponent={Fade}
									>
										<li className="gv-admin-menu__label">Change status to</li>
										{Object.values(MemberStatus)
											.filter((ele: string) => ele !== member?.memberStatus)
											.map((status: string) => (
												<MenuItem
													onClick={() => updateMemberHandler({ _id: member._id, memberStatus: status })}
													key={status}
												>
													{statusLabel(status)}
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
