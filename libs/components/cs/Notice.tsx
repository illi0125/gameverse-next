import React from 'react';
import { Stack, Box } from '@mui/material';
import moment from 'moment';
import { useQuery } from '@apollo/client';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { GET_NOTICES } from '../../../apollo/user/query';
import { NoticeCategory } from '../../enums/notice.enum';
import { Direction } from '../../enums/common.enum';
import { Notice as NoticeItem } from '../../types/notice/notice';
import { NoticesInquiry } from '../../types/notice/notice.input';

const noticesInquiry: NoticesInquiry = {
	page: 1,
	limit: 50,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: { noticeCategory: NoticeCategory.NOTICE },
};

/** Public notices, managed in Admin › Support › Notices **/
const Notice = () => {
	const device = useDeviceDetect();

	/** APOLLO REQUESTS **/
	const { loading, data, error } = useQuery(GET_NOTICES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: noticesInquiry },
	});
	const notices: NoticeItem[] = data?.getNotices?.list ?? [];

	if (device === 'mobile') {
		return <div>NOTICE MOBILE</div>;
	} else {
		return (
			<Stack className={'notice-content'}>
				<span className={'title'}>Notice</span>
				<Stack className={'main'}>
					<Box component={'div'} className={'top'}>
						<span>number</span>
						<span>title</span>
						<span>date</span>
					</Box>
					<Stack className={'bottom'}>
						{notices.length === 0 && (
							<div className={'notice-card'}>
								<span className={'notice-title'}>
									{loading ? 'Loading notices…' : error ? 'Notices are unavailable right now.' : 'No notices yet.'}
								</span>
							</div>
						)}
						{notices.map((notice: NoticeItem, index: number) => (
							<div className={`notice-card ${notice.noticeEvent ? 'event' : ''}`} key={notice._id}>
								{notice.noticeEvent ? <div>event</div> : <span className={'notice-number'}>{index + 1}</span>}
								<span className={'notice-title'}>
									{notice.noticeTitle}
									{notice.noticeContent && notice.noticeContent !== notice.noticeTitle && (
										<small className={'notice-body'}>{notice.noticeContent}</small>
									)}
								</span>
								<span className={'notice-date'}>{moment(notice.createdAt).format('DD.MM.YYYY')}</span>
							</div>
						))}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Notice;
