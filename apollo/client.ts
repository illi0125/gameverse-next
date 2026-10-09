import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, split, from, NormalizedCacheObject } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
import { sweetErrorAlert } from '../libs/sweetAlert';
import { socketVar } from './store';
let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: () => {
		return true;
	}, // @ts-ignore
	fetchAccessToken: () => {
		// execute refresh token
		return null;
	},
});

// Custom Websocket client
class LoggingWebSocket {
	private socket: WebSocket;

	constructor(url: string) {
		this.socket = new WebSocket(`${url}?token=${getJwtToken()}`);
		socketVar(this.socket);

		this.socket.onopen = () => {
			console.log('WebSocket connection');
		};

		this.socket.onmessage = (msg) => {
			console.log('WebSocket message:', msg.data);
		};

		this.socket.onerror = (error) => {
			console.log('WebSocket error:', error);
		};
	}

	send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) {
		this.socket.send(data as string | Blob | ArrayBuffer);
	}
	close() {
		this.socket.close();
	}
}

const CHAT_SOCKET_URL = process.env.REACT_APP_API_WS ?? 'ws://127.0.0.1:3007';

/**
 * The chat socket sends the token in its URL once, when it opens (no reconnect). After logging in without a page
 * reload it would stay a Guest connection, so a new identity gets a new connection; the Chat widget follows socketVar.
 */
export const reconnectChatSocket = () => {
	if (typeof window === 'undefined') return;
	const current = socketVar();
	try {
		current?.close();
	} catch (err) {
		/* already closed */
	}
	new LoggingWebSocket(CHAT_SOCKET_URL);
};

function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			console.warn('requesting.. ', operation);
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: process.env.REACT_APP_API_GRAPHQL_URL,
		});

		/* WEBSOCKET SUBSCRIPTION LINK */
		const wsLink = new WebSocketLink({
			uri: CHAT_SOCKET_URL,
			options: {
				reconnect: false,
				timeout: 30000,
				connectionParams: () => {
					return { headers: getHeaders() };
				},
			},
			webSocketImpl: LoggingWebSocket,
		});

		const errorLink = onError(({ graphQLErrors, networkError, response, operation }) => {
			// The log in / sign up form shows its own readable message (libs/auth), so no second alert here
			const handledByForm = ['Login', 'Signup'].includes(operation.operationName);
			if (graphQLErrors) {
				graphQLErrors.map(({ message, locations, path, extensions }) => {
					console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
					if (!message.includes('input') && !handledByForm) sweetErrorAlert(message);
				});
			}
			if (networkError) console.log(`[Network error]: ${networkError}`);
			// @ts-ignore
			if (networkError?.statusCode === 401) {
			}
		});

		const splitLink = split(
			({ query }) => {
				const definition = getMainDefinition(query);
				return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
			},
			wsLink,
			authLink.concat(link),
		);

		return from([errorLink, tokenRefreshLink, splitLink]);
	}
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}

/**
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// No Subscription required for develop process

const httpLink = createHttpLink({
  uri: "http://localhost:3007/graphql",
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
*/
