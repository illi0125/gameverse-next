import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Notification } from '../../types/notification/notification';
import { describeNotification, notificationSentence } from './notificationMeta';

interface NotificationItemProps {
	notification: Notification;
	/** `menu` = navbar dropdown (dark), `page` = Notification Center (paper, with a Mark read button) **/
	variant: 'menu' | 'page';
	/** Called when the entry is opened (marks it read; navigation is the link's job) **/
	onOpen: (notification: Notification) => void;
	onMarkRead?: (notification: Notification) => void;
	busy?: boolean;
}

/** One notification: category glyph, "actor action", target title, optional excerpt, kicker and relative time **/
const NotificationItem = ({ notification, variant, onOpen, onMarkRead, busy = false }: NotificationItemProps) => {
	const view = describeNotification(notification);
	const Icon = view.icon;
	const created = moment(notification.createdAt);
	const line = (
		<>
			{view.actor && <strong>{view.actor}</strong>} {view.action}
		</>
	);

	return (
		<li className={`gv-note gv-note--${variant} ${view.unread ? 'is-unread' : ''} ${view.href ? 'is-linked' : ''}`}>
			<span className={`gv-note__glyph gv-note__glyph--${view.tone}`} aria-hidden>
				<Icon aria-hidden />
			</span>

			<div className="gv-note__body">
				<p className="gv-note__line">
					{view.href ? (
						<Link
							href={view.href}
							className="gv-note__link"
							aria-label={`${view.unread ? 'Unread. ' : ''}${notificationSentence(view)}`}
							onClick={() => onOpen(notification)}
						>
							{line}
						</Link>
					) : (
						<button
							type="button"
							className="gv-note__link"
							aria-label={`${view.unread ? 'Unread. ' : ''}${notificationSentence(view)}`}
							onClick={() => onOpen(notification)}
						>
							{line}
						</button>
					)}
				</p>
				{view.title && <p className="gv-note__title">{view.title}</p>}
				{view.desc && <p className="gv-note__desc">{view.desc}</p>}
				<p className="gv-note__meta">
					<span>{view.kicker}</span>
					<time dateTime={created.toISOString()} title={created.format('DD MMM YYYY, HH:mm')}>
						{created.fromNow()}
					</time>
				</p>
			</div>

			{variant === 'page' && view.unread && onMarkRead && (
				<button
					type="button"
					className="gv-note__mark"
					disabled={busy}
					onClick={() => onMarkRead(notification)}
					aria-label={`Mark as read: ${notificationSentence(view)}`}
				>
					Mark read
				</button>
			)}
		</li>
	);
};

export default NotificationItem;
