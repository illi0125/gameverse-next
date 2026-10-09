import { Direction } from '../../enums/common.enum';
import { InquiryStatus, SupportTopic } from '../../enums/notice.enum';

export interface InquiryInput {
	inquiryTopic: SupportTopic;
	inquiryTitle: string;
	inquiryContent: string;
}

export interface MyInquiriesInquiry {
	page: number;
	limit: number;
}

export interface AllInquiriesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: { inquiryStatus?: InquiryStatus; inquiryTopic?: SupportTopic; text?: string };
}
