export enum NoticeCategory {
	NOTICE = 'NOTICE',
	FAQ = 'FAQ',
	TERMS = 'TERMS',
}

export enum NoticeStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}

/** FAQ grouping and inquiry topic (mirrors the backend SupportTopic) **/
export enum SupportTopic {
	GAMES = 'GAMES',
	PAYMENT = 'PAYMENT',
	PLAYERS = 'PLAYERS',
	DEVELOPERS = 'DEVELOPERS',
	MEMBERSHIP = 'MEMBERSHIP',
	COMMUNITY = 'COMMUNITY',
	OTHER = 'OTHER',
}

export enum InquiryStatus {
	PENDING = 'PENDING',
	ANSWERED = 'ANSWERED',
	CLOSED = 'CLOSED',
}
