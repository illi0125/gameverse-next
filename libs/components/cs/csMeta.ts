import { InquiryStatus, NoticeCategory, SupportTopic } from '../../enums/notice.enum';
import { Direction } from '../../enums/common.enum';
import { NoticesInquiry } from '../../types/notice/notice.input';

/** Public Help sections, in tab order; the key is the existing `?tab=` value **/
export const csTabs = [
	{ key: 'faq', label: 'FAQ', short: 'FAQ', desc: 'Answers to the questions players ask most.' },
	{ key: 'notice', label: 'Notices', short: 'Notices', desc: 'Announcements and events from the GameVerse team.' },
	{ key: 'inquiry', label: 'Ask us', short: 'Ask us', desc: 'Send a question to the team and follow its status.' },
	/** Shown only while the API reports the assistant enabled (getAssistantStatus) **/
	{ key: 'ai', label: 'Ask AI', short: 'Ask AI', desc: 'Instant answers from the FAQ and notices.' },
] as const;

export type CsTabKey = (typeof csTabs)[number]['key'];
export const isCsTab = (value: unknown): value is CsTabKey => csTabs.some((tab) => tab.key === value);

/** FAQ topics in the order of the former tabs (keys kept from the old page) **/
export const faqTopics: { key: string; topic: SupportTopic; label: string; desc: string }[] = [
	{ key: 'games', topic: SupportTopic.GAMES, label: 'Games', desc: 'Finding, launching and rating games.' },
	{ key: 'payment', topic: SupportTopic.PAYMENT, label: 'Payment', desc: 'Prices, purchases and refunds.' },
	{ key: 'players', topic: SupportTopic.PLAYERS, label: 'For players', desc: 'Profiles, favorites and following.' },
	{ key: 'agents', topic: SupportTopic.DEVELOPERS, label: 'For developers', desc: 'Publishing and managing your games.' },
	{ key: 'membership', topic: SupportTopic.MEMBERSHIP, label: 'Membership', desc: 'Accounts, sign-in and security.' },
	{ key: 'community', topic: SupportTopic.COMMUNITY, label: 'Community', desc: 'Boards, posts and conduct.' },
	{ key: 'other', topic: SupportTopic.OTHER, label: 'Other', desc: 'Everything else.' },
];

export const topicMeta = (topic?: SupportTopic | null) =>
	faqTopics.find((entry) => entry.topic === topic) ?? faqTopics[faqTopics.length - 1];

/** Every published FAQ entry in its original order; topics and search are applied on the client **/
export const faqInquiry: NoticesInquiry = {
	page: 1,
	limit: 200,
	sort: 'createdAt',
	direction: Direction.ASC,
	search: { noticeCategory: NoticeCategory.FAQ },
};

/** Published notices, newest first (same as before) **/
export const noticesInquiry: NoticesInquiry = {
	page: 1,
	limit: 50,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: { noticeCategory: NoticeCategory.NOTICE },
};

export const inquiryStatusMeta: Record<InquiryStatus, { label: string; desc: string }> = {
	[InquiryStatus.PENDING]: { label: 'Waiting for reply', desc: 'The team has not answered yet.' },
	[InquiryStatus.ANSWERED]: { label: 'Answered', desc: 'Read the reply below.' },
	[InquiryStatus.CLOSED]: { label: 'Closed', desc: 'This inquiry is finished.' },
};

/** API limits (InquiryInput): title 3–100, message 5–2000 **/
export const INQUIRY_TITLE_MIN = 3;
export const INQUIRY_TITLE_MAX = 100;
export const INQUIRY_CONTENT_MIN = 5;
export const INQUIRY_CONTENT_MAX = 2000;

/** Case-insensitive match on the question and the answer **/
export const matchesText = (text: string, ...fields: (string | undefined | null)[]) => {
	const needle = text.trim().toLowerCase();
	if (!needle) return true;
	return fields.some((field) => field?.toLowerCase().includes(needle));
};
