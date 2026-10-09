import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TablePagination from '@mui/material/TablePagination';
import {
	AdminPageHeader,
	AdminTab,
	AdminTabs,
	DensityToggle,
	useAdminDensity,
} from '../../../libs/components/admin/ui/AdminUi';
import CommunityArticleList from '../../../libs/components/admin/community/CommunityArticleList';
import { communityBoards } from '../../../libs/components/community/communityMeta';
import { AllBoardArticlesInquiry } from '../../../libs/types/board-article/board-article.input';
import { BoardArticle } from '../../../libs/types/board-article/board-article';
import { BoardArticleCategory, BoardArticleStatus } from '../../../libs/enums/board-article.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { BoardArticleUpdate } from '../../../libs/types/board-article/board-article.update';
import { useMutation, useQuery } from '@apollo/client';
import { REMOVE_BOARD_ARTICLE_BY_ADMIN, UPDATE_BOARD_ARTICLE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_BOARD_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { T } from '../../../libs/types/common';

const AdminCommunity: NextPage = ({ initialInquiry, ...props }: any) => {
	const [anchorEl, setAnchorEl] = useState<any>([]);
	const [communityInquiry, setCommunityInquiry] = useState<AllBoardArticlesInquiry>(initialInquiry);
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [articleTotal, setArticleTotal] = useState<number>(0);
	const [value, setValue] = useState(
		communityInquiry?.search?.articleStatus ? communityInquiry?.search?.articleStatus : 'ALL',
	);
	const [searchType, setSearchType] = useState('ALL');

	/** APOLLO REQUESTS **/
	const [updateBoardArticleByAdmin] = useMutation(UPDATE_BOARD_ARTICLE_BY_ADMIN);
	const [removeBoardArticleByAdmin] = useMutation(REMOVE_BOARD_ARTICLE_BY_ADMIN);

	const {
		loading: getAllBoardArticlesByAdminLoading,
		data: getAllBoardArticlesByAdminData,
		error: getAllBoardArticlesByAdminError,
		refetch: getAllBoardArticlesByAdminRefetch,
	} = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: communityInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setArticles(data?.getAllBoardArticlesByAdmin?.list);
			setArticleTotal(data?.getAllBoardArticlesByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		getAllBoardArticlesByAdminRefetch({ input: communityInquiry }).then();
	}, [communityInquiry]);

	/** HANDLERS **/
	const changePageHandler = async (event: unknown, newPage: number) => {
		communityInquiry.page = newPage + 1;
		await getAllBoardArticlesByAdminRefetch({ input: communityInquiry });
		setCommunityInquiry({ ...communityInquiry });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		communityInquiry.limit = parseInt(event.target.value, 10);
		communityInquiry.page = 1;
		await getAllBoardArticlesByAdminRefetch({ input: communityInquiry });
		setCommunityInquiry({ ...communityInquiry });
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

		setCommunityInquiry({ ...communityInquiry, page: 1, sort: 'createdAt' });

		switch (newValue) {
			case 'ACTIVE':
				setCommunityInquiry({ ...communityInquiry, search: { articleStatus: BoardArticleStatus.ACTIVE } });
				break;
			case 'DELETE':
				setCommunityInquiry({ ...communityInquiry, search: { articleStatus: BoardArticleStatus.DELETE } });
				break;
			default:
				delete communityInquiry?.search?.articleStatus;
				setCommunityInquiry({ ...communityInquiry });
				break;
		}
	};

	const searchTypeHandler = async (newValue: string) => {
		try {
			setSearchType(newValue);

			if (newValue !== 'ALL') {
				setCommunityInquiry({
					...communityInquiry,
					page: 1,
					sort: 'createdAt',
					search: {
						...communityInquiry.search,
						articleCategory: newValue as BoardArticleCategory,
					},
				});
			} else {
				delete communityInquiry?.search?.articleCategory;
				setCommunityInquiry({ ...communityInquiry });
			}
		} catch (err: any) {
			console.log('searchTypeHandler: ', err.message);
		}
	};

	const updateArticleHandler = async (updateData: BoardArticleUpdate) => {
		try {
			await updateBoardArticleByAdmin({ variables: { input: updateData } });
			menuIconCloseHandler();
			await getAllBoardArticlesByAdminRefetch({ input: communityInquiry });
		} catch (err: any) {
			menuIconCloseHandler();
			sweetErrorHandling(err).then();
		}
	};

	const removeArticleHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to remove?')) {
				await removeBoardArticleByAdmin({ variables: { input: id } });
				await getAllBoardArticlesByAdminRefetch({ input: communityInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	/** PRESENTATION (status counts are read-only queries, one row each) **/
	const [density, setDensity] = useAdminDensity();
	const countQuery = (articleStatus?: BoardArticleStatus) => ({
		fetchPolicy: 'network-only' as const,
		variables: { input: { page: 1, limit: 1, search: articleStatus ? { articleStatus } : {} } },
	});
	const allCount = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, countQuery());
	const activeCount = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, countQuery(BoardArticleStatus.ACTIVE));
	const deleteCount = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, countQuery(BoardArticleStatus.DELETE));
	const totalOf = (result: T) =>
		result.data?.getAllBoardArticlesByAdmin?.metaCounter?.[0]?.total ?? (result.data ? 0 : undefined);

	// A status change or removal moves articles between tabs, so the counts follow the list
	useEffect(() => {
		[allCount, activeCount, deleteCount].forEach((query) => query.refetch().catch(() => undefined));
	}, [articles]);

	const statusTabs: AdminTab[] = [
		{ value: 'ALL', label: 'All', count: totalOf(allCount) },
		{ value: 'ACTIVE', label: 'Active', count: totalOf(activeCount) },
		{ value: 'DELETE', label: 'Deleted', count: totalOf(deleteCount) },
	];

	return (
		<div className="gv-admin-page">
			<AdminPageHeader
				kicker="Manage"
				title="Community"
				desc="Articles across all four boards. Delete or restore from the status chip; deleted articles can also be removed for good."
			/>

			<section className="gv-admin-panel" aria-label="Article list">
				<AdminTabs tabs={statusTabs} value={value} onChange={(next) => tabChangeHandler(null, next)} label="Article status" />

				<div className="gv-admin-toolbar">
					<label className="gv-admin-select">
						<span>Board</span>
						<Select value={searchType} MenuProps={{ className: 'gv-admin-menu' }}>
							<MenuItem value={'ALL'} onClick={() => searchTypeHandler('ALL')}>
								All boards
							</MenuItem>
							{communityBoards.map((board) => (
								<MenuItem value={board.value} onClick={() => searchTypeHandler(board.value)} key={board.value}>
									{board.label}
								</MenuItem>
							))}
						</Select>
					</label>
					<DensityToggle density={density} onChange={setDensity} />
				</div>

				<CommunityArticleList
					articles={articles ?? []}
					loading={getAllBoardArticlesByAdminLoading}
					error={Boolean(getAllBoardArticlesByAdminError)}
					density={density}
					anchorEl={anchorEl}
					menuIconClickHandler={menuIconClickHandler}
					menuIconCloseHandler={menuIconCloseHandler}
					updateArticleHandler={updateArticleHandler}
					removeArticleHandler={removeArticleHandler}
				/>

				<TablePagination
					className="gv-admin-pagination"
					rowsPerPageOptions={[10, 20, 40, 60]}
					component="div"
					count={articleTotal}
					rowsPerPage={communityInquiry?.limit}
					page={communityInquiry?.page - 1}
					onPageChange={changePageHandler}
					onRowsPerPageChange={changeRowsPerPageHandler}
				/>
			</section>
		</div>
	);
};

AdminCommunity.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminCommunity);
