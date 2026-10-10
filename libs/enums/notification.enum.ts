/** Mirrors the backend notification enums **/
export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	FOLLOW = 'FOLLOW',
	NEW_GAME = 'NEW_GAME',
	GAME_RELEASE = 'GAME_RELEASE',
	INQUIRY_ANSWER = 'INQUIRY_ANSWER',
	MODERATION = 'MODERATION',
	ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	GAME = 'GAME',
	INQUIRY = 'INQUIRY',
	NOTICE = 'NOTICE',
}
