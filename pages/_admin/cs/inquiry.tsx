import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TablePagination from '@mui/material/TablePagination';
import { useMutation, useQuery } from '@apollo/client';
import {
	AdminPageHeader,
	AdminSearch,
	AdminTab,
	AdminTabs,
	DensityToggle,
	useAdminDensity,
} from '../../../libs/components/admin/ui/AdminUi';
import { InquiryList } from '../../../libs/components/admin/cs/InquiryList';
import { InquiryAnswerDialog } from '../../../libs/components/admin/cs/InquiryAnswerDialog';
import { supportTopics, topicLabel } from '../../../libs/components/admin/cs/supportMeta';
import { ANSWER_INQUIRY, REMOVE_INQUIRY, UPDATE_INQUIRY_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_INQUIRIES_BY_ADMIN } from '../../../apollo/admin/query';
import { AllInquiriesInquiry } from '../../../libs/types/inquiry/inquiry.input';
import { Inquiry } from '../../../libs/types/inquiry/inquiry';
import { InquiryStatus, SupportTopic } from '../../../libs/enums/notice.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { T } from '../../../libs/types/common';

type StatusTab = InquiryStatus | 'ALL';

const statusTabs: { value: StatusTab; label: string }[] = [
	{ value: InquiryStatus.PENDING, label: 'Pending' },
	{ value: InquiryStatus.ANSWERED, label: 'Answered' },
	{ value: InquiryStatus.CLOSED, label: 'Closed' },
	{ value: 'ALL', label: 'All' },
];

/** The pending queue is worked oldest first; every other view shows the newest first **/
const directionFor = (status: StatusTab) => (status === InquiryStatus.PENDING ? Direction.ASC : Direction.DESC);

const InquiryArticles: NextPage = ({ initialInquiry, ...props }: any) => {
	const [inquiriesInquiry, setInquiriesInquiry] = useState<AllInquiriesInquiry>(initialInquiry);
	const [inquiries, setInquiries] = useState<Inquiry[]>([]);
	const [inquiriesTotal, setInquiriesTotal] = useState<number>(0);
	const [searchText, setSearchText] = useState<string>('');
	const [selected, setSelected] = useState<Inquiry | null>(null);
	const [busy, setBusy] = useState(false);
	const statusValue: StatusTab = inquiriesInquiry.search.inquiryStatus ?? 'ALL';

	/** APOLLO REQUESTS **/
	const [answerInquiry] = useMutation(ANSWER_INQUIRY);
	const [updateInquiryByAdmin] = useMutation(UPDATE_INQUIRY_BY_ADMIN);
	const [removeInquiry] = useMutation(REMOVE_INQUIRY);

	const {
		loading: getAllInquiriesLoading,
		error: getAllInquiriesError,
		refetch: getAllInquiriesRefetch,
	} = useQuery(GET_ALL_INQUIRIES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiriesInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setInquiries(data?.getAllInquiriesByAdmin?.list ?? []);
			setInquiriesTotal(data?.getAllInquiriesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const refresh = () => getAllInquiriesRefetch({ input: inquiriesInquiry });

	const changePageHandler = (event: unknown, newPage: number) => {
		setInquiriesInquiry({ ...inquiriesInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
		setInquiriesInquiry({ ...inquiriesInquiry, page: 1, limit: parseInt(event.target.value, 10) });
	};

	const tabChangeHandler = (newValue: StatusTab) => {
		const { inquiryStatus, ...search } = inquiriesInquiry.search;
		setInquiriesInquiry({
			...inquiriesInquiry,
			page: 1,
			direction: directionFor(newValue),
			search: newValue === 'ALL' ? search : { ...search, inquiryStatus: newValue },
		});
	};

	const topicFilterHandler = (value: string) => {
		const { inquiryTopic, ...search } = inquiriesInquiry.search;
		setInquiriesInquiry({
			...inquiriesInquiry,
			page: 1,
			search: value === 'ALL' ? search : { ...search, inquiryTopic: value as SupportTopic },
		});
	};

	const textSearchHandler = (value: string = searchText) => {
		const { text, ...search } = inquiriesInquiry.search;
		setInquiriesInquiry({
			...inquiriesInquiry,
			page: 1,
			search: value.trim() ? { ...search, text: value.trim() } : search,
		});
	};

	const answerHandler = async (inquiry: Inquiry, answerContent: string) => {
		try {
			setBusy(true);
			await answerInquiry({ variables: { input: { _id: inquiry._id, answerContent } } });
			setSelected(null);
			await refresh();
			await sweetTopSmallSuccessAlert('Reply sent', 1200);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setBusy(false);
		}
	};

	const statusHandler = async (inquiry: Inquiry, inquiryStatus: InquiryStatus) => {
		try {
			setBusy(true);
			const result = await updateInquiryByAdmin({ variables: { input: { _id: inquiry._id, inquiryStatus } } });
			const updated: Inquiry | undefined = result?.data?.updateInquiryByAdmin;
			// Reopening keeps the dialog open so the reply can be written right away
			setSelected(inquiryStatus === InquiryStatus.CLOSED || !updated ? null : { ...inquiry, ...updated });
			await refresh();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setBusy(false);
		}
	};

	const removeHandler = async (inquiry: Inquiry) => {
		try {
			if (await sweetConfirmAlert('Remove this inquiry permanently? This cannot be undone.')) {
				await removeInquiry({ variables: { input: inquiry._id } });
				await refresh();
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	/** PRESENTATION (status counts are read-only queries, one row each) **/
	const [density, setDensity] = useAdminDensity();
	const countQuery = (inquiryStatus?: InquiryStatus) => ({
		fetchPolicy: 'network-only' as const,
		variables: { input: { page: 1, limit: 1, search: inquiryStatus ? { inquiryStatus } : {} } },
	});
	const allCount = useQuery(GET_ALL_INQUIRIES_BY_ADMIN, countQuery());
	const pendingCount = useQuery(GET_ALL_INQUIRIES_BY_ADMIN, countQuery(InquiryStatus.PENDING));
	const answeredCount = useQuery(GET_ALL_INQUIRIES_BY_ADMIN, countQuery(InquiryStatus.ANSWERED));
	const closedCount = useQuery(GET_ALL_INQUIRIES_BY_ADMIN, countQuery(InquiryStatus.CLOSED));
	const totalOf = (result: T) =>
		result.data?.getAllInquiriesByAdmin?.metaCounter?.[0]?.total ?? (result.data ? 0 : undefined);

	// Answering, closing or removing moves inquiries between tabs, so the counts follow the list
	useEffect(() => {
		[allCount, pendingCount, answeredCount, closedCount].forEach((query) => query.refetch().catch(() => undefined));
	}, [inquiries]);

	const counts: Record<string, number | undefined> = {
		ALL: totalOf(allCount),
		[InquiryStatus.PENDING]: totalOf(pendingCount),
		[InquiryStatus.ANSWERED]: totalOf(answeredCount),
		[InquiryStatus.CLOSED]: totalOf(closedCount),
	};
	const tabs: AdminTab<StatusTab>[] = statusTabs.map((tab) => ({ ...tab, count: counts[tab.value] }));

	return (
		<div className="gv-admin-page">
			<AdminPageHeader
				kicker="Support"
				title="Inquiries"
				desc="Questions members send from the Help page. Pending ones are listed oldest first; members see your reply in their inquiry history."
			/>

			<section className="gv-admin-panel" aria-label="Inquiry list">
				<AdminTabs tabs={tabs} value={statusValue} onChange={tabChangeHandler} label="Inquiry status" />

				<div className="gv-admin-toolbar">
					<AdminSearch
						value={searchText}
						placeholder="Search title"
						onChange={setSearchText}
						onSubmit={() => textSearchHandler()}
						onClear={() => {
							setSearchText('');
							textSearchHandler('');
						}}
					/>
					<label className="gv-admin-select">
						<span>Topic</span>
						<Select
							value={inquiriesInquiry.search.inquiryTopic ?? 'ALL'}
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
					<DensityToggle density={density} onChange={setDensity} />
				</div>

				<InquiryList
					inquiries={inquiries}
					loading={getAllInquiriesLoading}
					error={Boolean(getAllInquiriesError)}
					density={density}
					openHandler={setSelected}
					removeHandler={removeHandler}
				/>

				<TablePagination
					className="gv-admin-pagination"
					rowsPerPageOptions={[10, 20, 40, 60]}
					component="div"
					count={inquiriesTotal}
					rowsPerPage={inquiriesInquiry.limit}
					page={inquiriesInquiry.page - 1}
					onPageChange={changePageHandler}
					onRowsPerPageChange={changeRowsPerPageHandler}
				/>
			</section>

			<InquiryAnswerDialog
				inquiry={selected}
				busy={busy}
				onClose={() => setSelected(null)}
				onAnswer={answerHandler}
				onStatus={statusHandler}
			/>
		</div>
	);
};

InquiryArticles.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 20,
		sort: 'createdAt',
		direction: Direction.ASC,
		search: { inquiryStatus: InquiryStatus.PENDING },
	},
};

export default withAdminLayout(InquiryArticles);
