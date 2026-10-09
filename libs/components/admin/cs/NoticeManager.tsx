import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TablePagination from '@mui/material/TablePagination';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { AdminPageHeader, AdminSearch, AdminTab, AdminTabs, DensityToggle, useAdminDensity } from '../ui/AdminUi';
import { NoticePanelList } from './NoticeList';
import { NoticeEditor, NoticeEditorValues } from './NoticeEditor';
import { NoticeKind, supportTopics, topicLabel } from './supportMeta';
import { CREATE_NOTICE, REMOVE_NOTICE, UPDATE_NOTICE } from '../../../../apollo/admin/mutation';
import { GET_ALL_NOTICES_BY_ADMIN } from '../../../../apollo/admin/query';
import { AllNoticesInquiry, NoticeUpdate } from '../../../types/notice/notice.input';
import { Notice } from '../../../types/notice/notice';
import { NoticeStatus, SupportTopic } from '../../../enums/notice.enum';
import { Direction } from '../../../enums/common.enum';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../sweetAlert';
import { T } from '../../../types/common';

type StatusTab = NoticeStatus | 'ALL';

const statusTabs: { value: StatusTab; label: string }[] = [
	{ value: 'ALL', label: 'All' },
	{ value: NoticeStatus.ACTIVE, label: 'Published' },
	{ value: NoticeStatus.HOLD, label: 'Drafts' },
	{ value: NoticeStatus.DELETE, label: 'Deleted' },
];

/** Admin › Support › FAQ and Notices: list, filter, create, edit, publish / draft / delete / restore, remove **/
export const NoticeManager = ({ kind }: { kind: NoticeKind }) => {
	const [anchorEl, setAnchorEl] = useState<any[]>([]);
	const [noticesInquiry, setNoticesInquiry] = useState<AllNoticesInquiry>({
		page: 1,
		limit: 20,
		sort: 'createdAt',
		direction: kind.direction as Direction,
		search: { noticeCategory: kind.category },
	});
	const [notices, setNotices] = useState<Notice[]>([]);
	const [noticesTotal, setNoticesTotal] = useState<number>(0);
	const [searchText, setSearchText] = useState<string>('');
	const [editor, setEditor] = useState<{ open: boolean; notice: Notice | null }>({ open: false, notice: null });
	const [saving, setSaving] = useState(false);
	const statusValue: StatusTab = noticesInquiry.search.noticeStatus ?? 'ALL';

	/** APOLLO REQUESTS **/
	const [createNotice] = useMutation(CREATE_NOTICE);
	const [updateNotice] = useMutation(UPDATE_NOTICE);
	const [removeNotice] = useMutation(REMOVE_NOTICE);

	const {
		loading: getAllNoticesLoading,
		error: getAllNoticesError,
		refetch: getAllNoticesRefetch,
	} = useQuery(GET_ALL_NOTICES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: noticesInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setNotices(data?.getAllNoticesByAdmin?.list ?? []);
			setNoticesTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const refresh = () => getAllNoticesRefetch({ input: noticesInquiry });

	const changePageHandler = (event: unknown, newPage: number) => {
		setNoticesInquiry({ ...noticesInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
		setNoticesInquiry({ ...noticesInquiry, page: 1, limit: parseInt(event.target.value, 10) });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => setAnchorEl([]);

	const tabChangeHandler = (newValue: StatusTab) => {
		const { noticeStatus, ...search } = noticesInquiry.search;
		setNoticesInquiry({
			...noticesInquiry,
			page: 1,
			search: newValue === 'ALL' ? search : { ...search, noticeStatus: newValue },
		});
	};

	const topicFilterHandler = (value: string) => {
		const { noticeTopic, ...search } = noticesInquiry.search;
		setNoticesInquiry({
			...noticesInquiry,
			page: 1,
			search: value === 'ALL' ? search : { ...search, noticeTopic: value as SupportTopic },
		});
	};

	const textSearchHandler = (value: string = searchText) => {
		const { text, ...search } = noticesInquiry.search;
		setNoticesInquiry({ ...noticesInquiry, page: 1, search: value.trim() ? { ...search, text: value.trim() } : search });
	};

	const updateHandler = async (input: NoticeUpdate) => {
		try {
			await updateNotice({ variables: { input } });
			await refresh();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const statusHandler = async (notice: Notice, noticeStatus: NoticeStatus) => {
		menuIconCloseHandler();
		if (noticeStatus === NoticeStatus.DELETE && !(await sweetConfirmAlert(`Delete this ${kind.singular}? It leaves the site but can be restored.`)))
			return;
		await updateHandler({ _id: notice._id, noticeStatus });
	};

	const eventHandler = (notice: Notice, noticeEvent: boolean) => updateHandler({ _id: notice._id, noticeEvent });

	const removeHandler = async (notice: Notice) => {
		try {
			if (await sweetConfirmAlert(`Remove this ${kind.singular} permanently? This cannot be undone.`)) {
				await removeNotice({ variables: { input: notice._id } });
				await refresh();
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const saveHandler = async (values: NoticeEditorValues) => {
		try {
			setSaving(true);
			if (editor.notice) {
				await updateNotice({ variables: { input: { _id: editor.notice._id, ...values } } });
			} else {
				await createNotice({ variables: { input: { noticeCategory: kind.category, ...values } } });
			}
			setEditor({ open: false, notice: null });
			await refresh();
			const message = editor.notice
				? 'Changes saved'
				: values.noticeStatus === NoticeStatus.ACTIVE
				? 'Published'
				: 'Saved as draft';
			await sweetTopSmallSuccessAlert(message, 1200);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setSaving(false);
		}
	};

	/** PRESENTATION (status counts are read-only queries, one row each) **/
	const [density, setDensity] = useAdminDensity();
	const countQuery = (noticeStatus?: NoticeStatus) => ({
		fetchPolicy: 'network-only' as const,
		variables: {
			input: { page: 1, limit: 1, search: { noticeCategory: kind.category, ...(noticeStatus ? { noticeStatus } : {}) } },
		},
	});
	const allCount = useQuery(GET_ALL_NOTICES_BY_ADMIN, countQuery());
	const activeCount = useQuery(GET_ALL_NOTICES_BY_ADMIN, countQuery(NoticeStatus.ACTIVE));
	const holdCount = useQuery(GET_ALL_NOTICES_BY_ADMIN, countQuery(NoticeStatus.HOLD));
	const deleteCount = useQuery(GET_ALL_NOTICES_BY_ADMIN, countQuery(NoticeStatus.DELETE));
	const totalOf = (result: T) => result.data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? (result.data ? 0 : undefined);

	// Creating, publishing or deleting moves entries between tabs, so the counts follow the list
	useEffect(() => {
		[allCount, activeCount, holdCount, deleteCount].forEach((query) => query.refetch().catch(() => undefined));
	}, [notices]);

	const counts: Record<string, number | undefined> = {
		ALL: totalOf(allCount),
		[NoticeStatus.ACTIVE]: totalOf(activeCount),
		[NoticeStatus.HOLD]: totalOf(holdCount),
		[NoticeStatus.DELETE]: totalOf(deleteCount),
	};
	const tabs: AdminTab<StatusTab>[] = statusTabs.map((tab) => ({ ...tab, count: counts[tab.value] }));

	return (
		<div className="gv-admin-page">
			<AdminPageHeader kicker="Support" title={kind.plural} desc={kind.desc}>
				<button type="button" className="gv-admin-btn" onClick={() => setEditor({ open: true, notice: null })}>
					<AddRoundedIcon aria-hidden />
					New {kind.singular}
				</button>
			</AdminPageHeader>

			<section className="gv-admin-panel" aria-label={`${kind.plural} list`}>
				<AdminTabs tabs={tabs} value={statusValue} onChange={tabChangeHandler} label={`${kind.plural} status`} />

				<div className="gv-admin-toolbar">
					<AdminSearch
						value={searchText}
						placeholder={`Search ${kind.titleLabel.toLowerCase()}`}
						onChange={setSearchText}
						onSubmit={() => textSearchHandler()}
						onClear={() => {
							setSearchText('');
							textSearchHandler('');
						}}
					/>
					{kind.hasTopic && (
						<label className="gv-admin-select">
							<span>Topic</span>
							<Select
								value={noticesInquiry.search.noticeTopic ?? 'ALL'}
								onChange={(e: any) => topicFilterHandler(e.target.value)}
								MenuProps={{ className: 'gv-admin-menu' }}
							>
								<MenuItem value={'ALL'}>All topics</MenuItem>
								{supportTopics.map((topic) => (
									<MenuItem value={topic} key={topic}>
										{topicLabel(topic)}
									</MenuItem>
								))}
							</Select>
						</label>
					)}
					<DensityToggle density={density} onChange={setDensity} />
				</div>

				<NoticePanelList
					kind={kind}
					notices={notices}
					loading={getAllNoticesLoading}
					error={Boolean(getAllNoticesError)}
					density={density}
					anchorEl={anchorEl}
					menuIconClickHandler={menuIconClickHandler}
					menuIconCloseHandler={menuIconCloseHandler}
					statusHandler={statusHandler}
					eventHandler={eventHandler}
					editHandler={(notice) => setEditor({ open: true, notice })}
					removeHandler={removeHandler}
				/>

				<TablePagination
					className="gv-admin-pagination"
					rowsPerPageOptions={[10, 20, 40, 60]}
					component="div"
					count={noticesTotal}
					rowsPerPage={noticesInquiry.limit}
					page={noticesInquiry.page - 1}
					onPageChange={changePageHandler}
					onRowsPerPageChange={changeRowsPerPageHandler}
				/>
			</section>

			<NoticeEditor
				kind={kind}
				open={editor.open}
				notice={editor.notice}
				saving={saving}
				onClose={() => setEditor({ open: false, notice: null })}
				onSave={saveHandler}
			/>
		</div>
	);
};
