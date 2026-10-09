import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { LOGIN, SIGN_UP } from '../../apollo/user/mutation';
import { reconnectChatSocket } from '../../apollo/client';

export function getJwtToken(): any {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('accessToken') ?? '';
	}
}

export function setJwtToken(token: string) {
	localStorage.setItem('accessToken', token);
}

/** Readable text for the API's auth errors (libs/enums/common.enum.ts › Message on the backend) **/
const authErrorMessages: Record<string, string> = {
	'No member with that member nick!': 'No account with that nickname. Check it or sign up.',
	'Wrong password, try again!': 'Wrong password. Please try again.',
	'You have been blocked!': 'This account has been blocked.',
	'Already used member nick or phone': 'That nickname or phone number is already in use.',
};

const authErrorMessage = (err: any): string => {
	const serverMessage: string | undefined = err?.graphQLErrors?.[0]?.message;
	if (serverMessage) {
		// class-validator rejections arrive as "Bad Request" with the details in the original error
		const details = err?.graphQLErrors?.[0]?.extensions?.originalError?.message;
		if (authErrorMessages[serverMessage]) return authErrorMessages[serverMessage];
		if (Array.isArray(details) && details.length) return String(details[0]);
		return serverMessage;
	}
	if (err?.networkError) return 'Cannot reach the server. Check your connection and try again.';
	return 'Something went wrong. Please try again.';
};

export const logIn = async (nick: string, password: string): Promise<void> => {
	try {
		const { jwtToken } = await requestJwtToken({ nick, password });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
			// Live chat: reconnect so messages are sent as this member, not as Guest
			reconnectChatSocket();
		}
	} catch (err) {
		// The page shows the message and stays put (it used to call logOut(), which reloaded the page)
		throw err;
	}
};

const requestJwtToken = async ({
	nick,
	password,
}: {
	nick: string;
	password: string;
}): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: LOGIN,
			variables: { input: { memberNick: nick, memberPassword: password } },
			fetchPolicy: 'network-only',
		});

		const { accessToken } = result?.data?.login;

		return { jwtToken: accessToken };
	} catch (err: any) {
		throw new Error(authErrorMessage(err));
	}
};

export const signUp = async (nick: string, password: string, phone: string, type: string): Promise<void> => {
	try {
		const { jwtToken } = await requestSignUpJwtToken({ nick, password, phone, type });

		if (jwtToken) {
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
			// Live chat: reconnect so messages are sent as this member, not as Guest
			reconnectChatSocket();
		}
	} catch (err) {
		throw err;
	}
};

const requestSignUpJwtToken = async ({
	nick,
	password,
	phone,
	type,
}: {
	nick: string;
	password: string;
	phone: string;
	type: string;
}): Promise<{ jwtToken: string }> => {
	const apolloClient = await initializeApollo();

	try {
		const result = await apolloClient.mutate({
			mutation: SIGN_UP,
			variables: {
				input: { memberNick: nick, memberPassword: password, memberPhone: phone, memberType: type },
			},
			fetchPolicy: 'network-only',
		});

		const { accessToken } = result?.data?.signup;

		return { jwtToken: accessToken };
	} catch (err: any) {
		throw new Error(authErrorMessage(err));
	}
};

export const updateStorage = ({ jwtToken }: { jwtToken: any }) => {
	setJwtToken(jwtToken);
	window.localStorage.setItem('login', Date.now().toString());
};

export const updateUserInfo = (jwtToken: any) => {
	if (!jwtToken) return false;

	const claims = decodeJWT<CustomJwtPayload>(jwtToken);
	userVar({
		_id: claims._id ?? '',
		memberType: claims.memberType ?? '',
		memberStatus: claims.memberStatus ?? '',
		memberAuthType: claims.memberAuthType,
		memberPhone: claims.memberPhone ?? '',
		memberNick: claims.memberNick ?? '',
		memberFullName: claims.memberFullName ?? '',
		memberImage:
			claims.memberImage === null || claims.memberImage === undefined
				? '/img/profile/defaultUser.svg'
				: `${claims.memberImage}`,
		memberAddress: claims.memberAddress ?? '',
		memberDesc: claims.memberDesc ?? '',
		memberGames: claims.memberGames,
		memberRank: claims.memberRank,
		memberArticles: claims.memberArticles,
		memberPoints: claims.memberPoints,
		memberLikes: claims.memberLikes,
		memberViews: claims.memberViews,
		memberWarnings: claims.memberWarnings,
		memberBlocks: claims.memberBlocks,
	});
};

export const logOut = () => {
	deleteStorage();
	deleteUserInfo();
	window.location.reload();
};

const deleteStorage = () => {
	localStorage.removeItem('accessToken');
	window.localStorage.setItem('logout', Date.now().toString());
};

const deleteUserInfo = () => {
	userVar({
		_id: '',
		memberType: '',
		memberStatus: '',
		memberAuthType: '',
		memberPhone: '',
		memberNick: '',
		memberFullName: '',
		memberImage: '',
		memberAddress: '',
		memberDesc: '',
		memberGames: 0,
		memberRank: 0,
		memberArticles: 0,
		memberPoints: 0,
		memberLikes: 0,
		memberViews: 0,
		memberWarnings: 0,
		memberBlocks: 0,
	});
};
