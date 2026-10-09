import { InquiryStatus, SupportTopic } from '../../enums/notice.enum';
import { Member } from '../member/member';
import { TotalCounter } from '../common';

export interface Inquiry {
	_id: string;
	inquiryTopic: SupportTopic;
	inquiryStatus: InquiryStatus;
	inquiryTitle: string;
	inquiryContent: string;
	answerContent?: string | null;
	answeredAt?: Date | null;
	answeredBy?: string | null;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
	/** admin queue only: the member who asked **/
	memberData?: Member | null;
}

export interface Inquiries {
	list: Inquiry[];
	metaCounter: TotalCounter[];
}
