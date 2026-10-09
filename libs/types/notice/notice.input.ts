import { Direction } from '../../enums/common.enum';
import { NoticeCategory, NoticeStatus, SupportTopic } from '../../enums/notice.enum';

export interface NoticeInput {
	noticeCategory: NoticeCategory;
	noticeTopic?: SupportTopic;
	noticeTitle: string;
	noticeContent: string;
	noticeEvent?: boolean;
	noticeStatus?: NoticeStatus.HOLD | NoticeStatus.ACTIVE;
}

export interface NoticesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { noticeCategory: NoticeCategory; noticeTopic?: SupportTopic; text?: string };
}

export interface AllNoticesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { noticeCategory?: NoticeCategory; noticeStatus?: NoticeStatus; noticeTopic?: SupportTopic; text?: string };
}

export interface NoticeUpdate {
	_id: string;
	noticeCategory?: NoticeCategory;
	noticeTopic?: SupportTopic;
	noticeStatus?: NoticeStatus;
	noticeTitle?: string;
	noticeContent?: string;
	noticeEvent?: boolean;
}
