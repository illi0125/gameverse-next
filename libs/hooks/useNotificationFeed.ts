import { useEffect } from 'react';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import { GET_UNREAD_NOTIFICATION_COUNT } from '../../apollo/user/query';
import { liveNotificationVar, socketVar, userVar } from '../../apollo/store';
import { Notification } from '../types/notification/notification';

interface LivePayload {
	event?: string;
	unread?: number;
	notification?: Notification;
}

/**
 * The signed-in member's unread count, kept live:
 * - GraphQL count on load and whenever the tab becomes visible again (the socket does not reconnect on its own);
 * - socket events `notification` / `notificationCount` write the count into the Apollo cache, so every reader updates.
 * Listens with addEventListener, so the Chat widget's own `onmessage` handler is untouched.
 */
export const useNotificationFeed = () => {
	const user = useReactiveVar(userVar);
	const socket = useReactiveVar(socketVar);
	const client = useApolloClient();
	const signedIn = Boolean(user?._id);

	const { data, refetch } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
		skip: !signedIn,
		fetchPolicy: 'cache-and-network',
	});

	useEffect(() => {
		if (!signedIn || !socket) return;
		const writeCount = (unread: number) =>
			client.writeQuery({ query: GET_UNREAD_NOTIFICATION_COUNT, data: { getUnreadNotificationCount: unread } });

		const onMessage = (message: MessageEvent) => {
			let payload: LivePayload;
			try {
				payload = JSON.parse(message.data);
			} catch {
				return;
			}
			if (payload?.event === 'notification' && payload.notification) {
				if (typeof payload.unread === 'number') writeCount(payload.unread);
				liveNotificationVar({ __typename: 'Notification', ...payload.notification } as Notification);
			} else if (payload?.event === 'notificationCount' && typeof payload.unread === 'number') {
				writeCount(payload.unread);
			}
		};
		socket.addEventListener('message', onMessage);
		return () => socket.removeEventListener('message', onMessage);
	}, [socket, signedIn, client]);

	useEffect(() => {
		if (!signedIn) return;
		const onVisible = () => {
			if (document.visibilityState === 'visible') refetch().catch(() => undefined);
		};
		window.addEventListener('focus', onVisible);
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			window.removeEventListener('focus', onVisible);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, [signedIn, refetch]);

	return { signedIn, unread: signedIn ? (data?.getUnreadNotificationCount as number | undefined) ?? 0 : 0 };
};
