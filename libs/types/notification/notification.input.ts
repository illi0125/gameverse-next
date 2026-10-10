import { NotificationType } from '../../enums/notification.enum';

export interface NotificationsInquiry {
	page: number;
	limit: number;
	search?: {
		typeList?: NotificationType[];
		unreadOnly?: boolean;
	};
}
