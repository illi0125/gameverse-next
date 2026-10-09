import { NoticeCategory, NoticeStatus, SupportTopic } from '../../enums/notice.enum';
import { Member } from '../member/member';
import { TotalCounter } from '../common';

export interface Notice {
	_id: string;
	noticeCategory: NoticeCategory;
	noticeStatus: NoticeStatus;
	noticeTopic?: SupportTopic | null;
	noticeTitle: string;
	noticeContent: string;
	noticeEvent?: boolean | null;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
	/** admin lists only **/
	memberData?: Member | null;
}

export interface Notices {
	list: Notice[];
	metaCounter: TotalCounter[];
}
