import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { Member } from '../member/member';
import { TotalCounter } from '../common';

export interface Notification {
	_id: string;
	notificationType: NotificationType;
	notificationStatus: NotificationStatus;
	notificationGroup: NotificationGroup;
	notificationTitle: string;
	notificationDesc?: string | null;
	authorId: string;
	receiverId: string;
	gameId?: string | null;
	articleId?: string | null;
	inquiryId?: string | null;
	noticeId?: string | null;
	commentId?: string | null;
	readAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
	/** the actor; null for a deleted account **/
	authorData?: Pick<Member, '_id' | 'memberNick' | 'memberImage' | 'memberType'> | null;
}

export interface Notifications {
	list: Notification[];
	metaCounter: TotalCounter[];
}
