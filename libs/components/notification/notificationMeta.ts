import { ComponentType } from 'react';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { Notification } from '../../types/notification/notification';

/** Category tabs on the Notification Center; each maps to the types the API filters on **/
export type NotificationCategoryKey = 'all' | 'activity' | 'games' | 'support' | 'account' | 'announcements';

export const notificationCategories: { key: NotificationCategoryKey; label: string; types?: NotificationType[] }[] = [
	{ key: 'all', label: 'All' },
	{
		key: 'activity',
		label: 'Activity',
		types: [NotificationType.LIKE, NotificationType.COMMENT, NotificationType.FOLLOW],
	},
	{ key: 'games', label: 'Games', types: [NotificationType.NEW_GAME, NotificationType.GAME_RELEASE] },
	{ key: 'support', label: 'Support', types: [NotificationType.INQUIRY_ANSWER] },
	{ key: 'account', label: 'Account', types: [NotificationType.MODERATION] },
	{ key: 'announcements', label: 'Announcements', types: [NotificationType.ANNOUNCEMENT] },
];

export const isNotificationCategory = (value: unknown): value is NotificationCategoryKey =>
	notificationCategories.some((entry) => entry.key === value);

export type NotificationTone = 'uv' | 'signal' | 'paper' | 'haze';

export interface NotificationView {
	icon: ComponentType<{ 'aria-hidden'?: boolean }>;
	tone: NotificationTone;
	kicker: string;
	/** "Leo liked your game" — the actor is bold in the UI **/
	actor: string | null;
	action: string;
	title: string;
	desc: string | null;
	href: string | null;
	unread: boolean;
}

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const validId = (value?: string | null): string | null => (value && OBJECT_ID.test(value) ? value : null);

const targetNoun: Partial<Record<NotificationGroup, string>> = {
	[NotificationGroup.GAME]: 'game',
	[NotificationGroup.ARTICLE]: 'post',
	[NotificationGroup.MEMBER]: 'profile',
};

/**
 * Links are never stored: they are built here from the type and validated IDs, and only to internal pages.
 * Anything malformed simply makes the entry non-clickable.
 */
export const notificationHref = (notification: Notification): string | null => {
	const { notificationType: type, notificationGroup: group } = notification;
	const gameId = validId(notification.gameId);
	const articleId = validId(notification.articleId);
	const authorId = validId(notification.authorData?._id ?? notification.authorId);

	if (type === NotificationType.MODERATION) {
		if (group === NotificationGroup.GAME) return '/mypage?category=myGames';
		if (group === NotificationGroup.ARTICLE) return '/mypage?category=myArticles';
		return null;
	}
	if (type === NotificationType.INQUIRY_ANSWER) return '/cs?tab=inquiry';
	if (type === NotificationType.ANNOUNCEMENT) return '/cs?tab=notice';
	if (group === NotificationGroup.GAME) return gameId ? `/game/detail?id=${gameId}` : null;
	if (group === NotificationGroup.ARTICLE) return articleId ? `/community/detail?id=${articleId}` : null;
	if (group === NotificationGroup.MEMBER) return authorId ? `/member?memberId=${authorId}` : null;
	return null;
};

export const describeNotification = (notification: Notification): NotificationView => {
	const { notificationType: type, notificationGroup: group } = notification;
	const actor = notification.authorData?.memberNick ?? 'A deleted account';
	const noun = targetNoun[group] ?? 'page';
	// A profile event's title is the actor's own name, already shown in the line
	const repeatsActor = group === NotificationGroup.MEMBER && notification.notificationTitle === actor;
	const base = {
		title: repeatsActor ? '' : notification.notificationTitle,
		desc: notification.notificationDesc ?? null,
		href: notificationHref(notification),
		unread: notification.notificationStatus === NotificationStatus.WAIT,
	};

	switch (type) {
		case NotificationType.LIKE:
			return { ...base, icon: FavoriteRoundedIcon, tone: 'uv', kicker: 'Like', actor, action: `liked your ${noun}` };
		case NotificationType.COMMENT:
			return {
				...base,
				icon: ChatBubbleRoundedIcon,
				tone: 'uv',
				kicker: 'Comment',
				actor,
				action: `commented on your ${noun}`,
			};
		case NotificationType.FOLLOW:
			return {
				...base,
				icon: PersonAddAlt1RoundedIcon,
				tone: 'uv',
				kicker: 'Follower',
				actor,
				action: 'started following you',
			};
		case NotificationType.NEW_GAME:
			return {
				...base,
				icon: SportsEsportsRoundedIcon,
				tone: 'signal',
				kicker: 'New game',
				actor,
				action: 'published a new game',
			};
		case NotificationType.GAME_RELEASE:
			return {
				...base,
				icon: RocketLaunchRoundedIcon,
				tone: 'signal',
				kicker: 'Out now',
				actor: null,
				action: 'A game you liked is out now',
			};
		case NotificationType.INQUIRY_ANSWER:
			return {
				...base,
				icon: SupportAgentRoundedIcon,
				tone: 'paper',
				kicker: 'Support',
				actor: null,
				action: 'Support answered your inquiry',
			};
		case NotificationType.MODERATION:
			return {
				...base,
				icon: GavelRoundedIcon,
				tone: 'haze',
				kicker: 'Account',
				actor: null,
				action: `Your ${noun} was removed by moderation`,
			};
		case NotificationType.ANNOUNCEMENT:
		default:
			return {
				...base,
				icon: CampaignRoundedIcon,
				tone: 'haze',
				kicker: 'Announcement',
				actor: null,
				action: 'New announcement',
			};
	}
};

/** One line for screen readers and titles **/
export const notificationSentence = (view: NotificationView): string =>
	[view.actor ? `${view.actor} ${view.action}` : view.action, view.title].filter(Boolean).join(': ');
