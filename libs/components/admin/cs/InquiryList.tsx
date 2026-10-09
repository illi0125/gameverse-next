import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import Moment from 'react-moment';
import { Inquiry } from '../../../types/inquiry/inquiry';
import { InquiryStatus } from '../../../enums/notice.enum';
import { REACT_APP_API_URL } from '../../../config';
import { AdminEmpty, Density, StatusChip } from '../ui/AdminUi';
import { inquiryStatusLabels, inquiryStatusTone, topicLabel } from './supportMeta';

interface InquiryListProps {
	inquiries: Inquiry[];
	loading?: boolean;
	error?: boolean;
	density?: Density;
	openHandler: (inquiry: Inquiry) => void;
	removeHandler: (inquiry: Inquiry) => void;
}

/** 1:1 inquiry queue; a row opens the answer dialog, closed inquiries can be removed for good **/
export const InquiryList = (props: InquiryListProps) => {
	const { inquiries, loading = false, error = false, density = 'comfortable', openHandler, removeHandler } = props;

	return (
		<TableContainer className={`gv-admin-table is-${density}`}>
			<Table aria-label="Inquiries">
				<TableHead>
					<TableRow>
						<TableCell>Inquiry</TableCell>
						<TableCell>From</TableCell>
						<TableCell>Topic</TableCell>
						<TableCell>Asked</TableCell>
						<TableCell>Answered</TableCell>
						<TableCell>Status</TableCell>
						<TableCell align="right">
							<span className="gv-visually-hidden">Actions</span>
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{inquiries.length === 0 && (
						<TableRow>
							<TableCell colSpan={7} className="gv-admin-table__empty">
								{loading ? (
									<AdminEmpty title="Loading inquiries…" />
								) : error ? (
									<AdminEmpty title="Inquiries could not be loaded." desc="Check the connection and try again." />
								) : (
									<AdminEmpty title="No inquiries here." desc="Nothing waiting in this view." />
								)}
							</TableCell>
						</TableRow>
					)}
					{inquiries.map((inquiry: Inquiry) => {
						const member = inquiry.memberData;
						const memberImage = member?.memberImage
							? `${REACT_APP_API_URL}/${member.memberImage}`
							: '/img/profile/defaultUser.svg';
						const isClosed = inquiry.inquiryStatus === InquiryStatus.CLOSED;
						const label = inquiryStatusLabels[inquiry.inquiryStatus] ?? inquiry.inquiryStatus;
						return (
							<TableRow hover key={inquiry._id} className={isClosed ? 'is-dimmed' : undefined}>
								<TableCell className="gv-admin-support__main">
									<button type="button" className="gv-admin-support__open" onClick={() => openHandler(inquiry)}>
										<span className="gv-admin-support__title">{inquiry.inquiryTitle}</span>
										<span className="gv-admin-support__preview">{inquiry.inquiryContent}</span>
									</button>
								</TableCell>
								<TableCell>
									{member ? (
										<span className="gv-admin-writer">
											<img src={memberImage} alt="" />
											<span>{member.memberNick}</span>
										</span>
									) : (
										<span className="gv-admin-muted">Deleted member</span>
									)}
								</TableCell>
								<TableCell>{topicLabel(inquiry.inquiryTopic)}</TableCell>
								<TableCell className="gv-admin-mono">
									<Moment format={'DD.MM.YY HH:mm'}>{inquiry.createdAt}</Moment>
								</TableCell>
								<TableCell className="gv-admin-mono">
									{inquiry.answeredAt ? (
										<Moment format={'DD.MM.YY HH:mm'}>{inquiry.answeredAt}</Moment>
									) : (
										<span className="gv-admin-muted">—</span>
									)}
								</TableCell>
								<TableCell>
									<StatusChip label={label} tone={inquiryStatusTone[inquiry.inquiryStatus] ?? 'neutral'} />
								</TableCell>
								<TableCell align="right">
									<span className="gv-admin-row-actions">
										<button type="button" className="gv-admin-btn is-small is-ghost" onClick={() => openHandler(inquiry)}>
											{inquiry.inquiryStatus === InquiryStatus.PENDING ? 'Answer' : 'Open'}
										</button>
										{isClosed && (
											<Tooltip title="Remove permanently">
												<button
													type="button"
													className="gv-admin-iconbtn is-danger"
													aria-label={`Remove ${inquiry.inquiryTitle} permanently`}
													onClick={() => removeHandler(inquiry)}
												>
													<DeleteForeverOutlinedIcon aria-hidden />
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
