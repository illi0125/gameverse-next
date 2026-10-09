import { InquiryStatus, NoticeCategory, NoticeStatus, SupportTopic } from '../../../enums/notice.enum';
import { formatEnumLabel } from '../../../utils';
import { ChipTone } from '../ui/AdminUi';

/** Admin wording for Support content (HOLD is a draft, ACTIVE is published) **/
export const noticeStatusLabels: Record<NoticeStatus, string> = {
	[NoticeStatus.HOLD]: 'Draft',
	[NoticeStatus.ACTIVE]: 'Published',
	[NoticeStatus.DELETE]: 'Deleted',
};

export const noticeStatusTone: Record<NoticeStatus, ChipTone> = {
	[NoticeStatus.HOLD]: 'hold',
	[NoticeStatus.ACTIVE]: 'live',
	[NoticeStatus.DELETE]: 'off',
};

/** Menu wording for moving a notice from its current status to another **/
export const noticeStatusAction = (from: NoticeStatus, to: NoticeStatus): string => {
	if (to === NoticeStatus.DELETE) return 'Delete';
	if (from === NoticeStatus.DELETE) return to === NoticeStatus.ACTIVE ? 'Restore as published' : 'Restore as draft';
	return to === NoticeStatus.ACTIVE ? 'Publish' : 'Move to drafts';
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
	[InquiryStatus.PENDING]: 'Pending',
	[InquiryStatus.ANSWERED]: 'Answered',
	[InquiryStatus.CLOSED]: 'Closed',
};

export const inquiryStatusTone: Record<InquiryStatus, ChipTone> = {
	[InquiryStatus.PENDING]: 'alert',
	[InquiryStatus.ANSWERED]: 'live',
	[InquiryStatus.CLOSED]: 'off',
};

export const supportTopics: SupportTopic[] = Object.values(SupportTopic);
export const topicLabel = (topic?: SupportTopic | null): string => (topic ? formatEnumLabel(topic) : '—');

/** FAQ and Notices share one manager; this is what differs between them **/
export interface NoticeKind {
	category: NoticeCategory.FAQ | NoticeCategory.NOTICE;
	singular: string;
	plural: string;
	titleLabel: string;
	contentLabel: string;
	/** FAQ entries are grouped by topic; notices can be highlighted as events **/
	hasTopic: boolean;
	hasEvent: boolean;
	/** public order: FAQ oldest first, notices newest first **/
	direction: 'ASC' | 'DESC';
	desc: string;
}

export const noticeKinds: Record<'FAQ' | 'NOTICE', NoticeKind> = {
	FAQ: {
		category: NoticeCategory.FAQ,
		singular: 'question',
		plural: 'FAQ',
		titleLabel: 'Question',
		contentLabel: 'Answer',
		hasTopic: true,
		hasEvent: false,
		direction: 'ASC',
		desc: 'Questions on the public Help page, grouped by topic. Drafts stay hidden until published.',
	},
	NOTICE: {
		category: NoticeCategory.NOTICE,
		singular: 'notice',
		plural: 'Notices',
		titleLabel: 'Title',
		contentLabel: 'Body',
		hasTopic: false,
		hasEvent: true,
		direction: 'DESC',
		desc: 'Announcements on the public Help page, newest first. Mark one as an event to highlight it.',
	},
};

export const NOTICE_TITLE_MAX = 150;
export const NOTICE_CONTENT_MAX = 5000;
export const ANSWER_MAX = 2000;
