import React, { useCallback, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { MemberPanelList } from '../../../libs/components/admin/users/MemberList';
import {
	AdminPageHeader,
	AdminSearch,
	AdminTab,
	AdminTabs,
	DensityToggle,
	useAdminDensity,
} from '../../../libs/components/admin/ui/AdminUi';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TablePagination from '@mui/material/TablePagination';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { Member } from '../../../libs/types/member/member';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { sweetErrorHandling } from '../../../libs/sweetAlert';
import { MemberUpdate } from '../../../libs/types/member/member.update';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { T } from '../../../libs/types/common';

const AdminUsers: NextPage = ({ initialInquiry, ...props }: any) => {
	const [anchorEl, setAnchorEl] = useState<[] | HTMLElement[]>([]);
	const [membersInquiry, setMembersInquiry] = useState<MembersInquiry>(initialInquiry);
	const [members, setMembers] = useState<Member[]>([]);
	const [membersTotal, setMembersTotal] = useState<number>(0);
	const [value, setValue] = useState(
		membersInquiry?.search?.memberStatus ? membersInquiry?.search?.memberStatus : 'ALL',
	);
	const [searchText, setSearchText] = useState('');
	const [searchType, setSearchType] = useState('ALL');

	/** APOLLO REQUESTS **/
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);

	const {
		loading: getAllMembersByAdminLoading,
		data: getAllMembersByAdminData,
		error: getAllMembersByAdminError,
		refetch: getAllMembersRefetch,
	} = useQuery(GET_ALL_MEMBERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: membersInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMembers(data?.getAllMembersByAdmin?.list);
			setMembersTotal(data?.getAllMembersByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		getAllMembersRefetch({ input: membersInquiry }).then();
	}, [membersInquiry]);

	/** HANDLERS **/
	const changePageHandler = async (event: unknown, newPage: number) => {
		membersInquiry.page = newPage + 1;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		membersInquiry.limit = parseInt(event.target.value, 10);
		membersInquiry.page = 1;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => {
		setAnchorEl([]);
	};

	const tabChangeHandler = async (event: any, newValue: string) => {
		setValue(newValue);
		setSearchText('');

		setMembersInquiry({ ...membersInquiry, page: 1, sort: 'createdAt' });

		switch (newValue) {
			case 'ACTIVE':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.ACTIVE } });
				break;
			case 'BLOCK':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.BLOCK } });
				break;
			case 'DELETE':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.DELETE } });
				break;
			default:
				delete membersInquiry?.search?.memberStatus;
				setMembersInquiry({ ...membersInquiry });
				break;
		}
	};

	const updateMemberHandler = async (updateData: MemberUpdate) => {
		try {
			await updateMemberByAdmin({ variables: { input: updateData } });
			menuIconCloseHandler();
			await getAllMembersRefetch({ input: membersInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const textHandler = useCallback((value: string) => {
		try {
			setSearchText(value);
		} catch (err: any) {
			console.log('textHandler: ', err.message);
		}
	}, []);

	const searchTextHandler = () => {
		try {
			setMembersInquiry({
				...membersInquiry,
				search: {
					...membersInquiry.search,
					text: searchText,
				},
			});
		} catch (err: any) {
			console.log('searchTextHandler: ', err.message);
		}
	};

	const searchTypeHandler = async (newValue: string) => {
		try {
			setSearchType(newValue);

			if (newValue !== 'ALL') {
				setMembersInquiry({
					...membersInquiry,
					page: 1,
					sort: 'createdAt',
					search: {
						...membersInquiry.search,
						memberType: newValue as MemberType,
					},
				});
			} else {
				delete membersInquiry?.search?.memberType;
				setMembersInquiry({ ...membersInquiry });
			}
		} catch (err: any) {
			console.log('searchTypeHandler: ', err.message);
		}
	};

	/** PRESENTATION (status counts are read-only queries, one row each) **/
	const [density, setDensity] = useAdminDensity();
	const countQuery = (memberStatus?: MemberStatus) => ({
		fetchPolicy: 'network-only' as const,
		variables: { input: { page: 1, limit: 1, search: memberStatus ? { memberStatus } : {} } },
	});
	const allCount = useQuery(GET_ALL_MEMBERS_BY_ADMIN, countQuery());
	const activeCount = useQuery(GET_ALL_MEMBERS_BY_ADMIN, countQuery(MemberStatus.ACTIVE));
	const blockCount = useQuery(GET_ALL_MEMBERS_BY_ADMIN, countQuery(MemberStatus.BLOCK));
	const deleteCount = useQuery(GET_ALL_MEMBERS_BY_ADMIN, countQuery(MemberStatus.DELETE));
	const totalOf = (result: T) => result.data?.getAllMembersByAdmin?.metaCounter?.[0]?.total ?? (result.data ? 0 : undefined);

	// A role or status change moves members between tabs, so the counts follow the list
	useEffect(() => {
		[allCount, activeCount, blockCount, deleteCount].forEach((query) => query.refetch().catch(() => undefined));
	}, [members]);

	const statusTabs: AdminTab[] = [
		{ value: 'ALL', label: 'All', count: totalOf(allCount) },
		{ value: 'ACTIVE', label: 'Active', count: totalOf(activeCount) },
		{ value: 'BLOCK', label: 'Blocked', count: totalOf(blockCount) },
		{ value: 'DELETE', label: 'Deleted', count: totalOf(deleteCount) },
	];

	return (
		<div className="gv-admin-page">
			<AdminPageHeader
				kicker="Manage"
				title="Users"
				desc="Every account on GameVerse. Change a role or status from the chips in each row."
			/>

			<section className="gv-admin-panel" aria-label="Member list">
				<AdminTabs tabs={statusTabs} value={value} onChange={(next) => tabChangeHandler(null, next)} label="Member status" />

				<div className="gv-admin-toolbar">
					<AdminSearch
						value={searchText}
						placeholder="Search user name"
						onChange={textHandler}
						onSubmit={searchTextHandler}
						onClear={async () => {
							setSearchText('');
							setMembersInquiry({
								...membersInquiry,
								search: {
									...membersInquiry.search,
									text: '',
								},
							});
							await getAllMembersRefetch({ input: membersInquiry });
						}}
					/>
					<label className="gv-admin-select">
						<span>Type</span>
						<Select value={searchType} MenuProps={{ className: 'gv-admin-menu' }}>
							<MenuItem value={'ALL'} onClick={() => searchTypeHandler('ALL')}>
								All
							</MenuItem>
							<MenuItem value={'USER'} onClick={() => searchTypeHandler('USER')}>
								User
							</MenuItem>
							<MenuItem value={'AGENT'} onClick={() => searchTypeHandler('AGENT')}>
								Developer
							</MenuItem>
							<MenuItem value={'ADMIN'} onClick={() => searchTypeHandler('ADMIN')}>
								Admin
							</MenuItem>
						</Select>
					</label>
					<DensityToggle density={density} onChange={setDensity} />
				</div>

				<MemberPanelList
					members={members}
					loading={getAllMembersByAdminLoading}
					error={Boolean(getAllMembersByAdminError)}
					density={density}
					anchorEl={anchorEl}
					menuIconClickHandler={menuIconClickHandler}
					menuIconCloseHandler={menuIconCloseHandler}
					updateMemberHandler={updateMemberHandler}
				/>

				<TablePagination
					className="gv-admin-pagination"
					rowsPerPageOptions={[10, 20, 40, 60]}
					component="div"
					count={membersTotal}
					rowsPerPage={membersInquiry?.limit}
					page={membersInquiry?.page - 1}
					onPageChange={changePageHandler}
					onRowsPerPageChange={changeRowsPerPageHandler}
				/>
			</section>
		</div>
	);
};

AdminUsers.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		search: {},
	},
};

export default withAdminLayout(AdminUsers);
