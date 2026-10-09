import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import MyGames from '../../libs/components/mypage/MyGames';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import AddNewGame from '../../libs/components/mypage/AddNewGame';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import MyMenu from '../../libs/components/mypage/MyMenu';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MemberFollowers from '../../libs/components/member/MemberFollowers';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import MemberFollowings from '../../libs/components/member/MemberFollowings';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Messages, REACT_APP_API_URL } from '../../libs/config';
import { getJwtToken } from '../../libs/auth';
import { MemberType } from '../../libs/enums/member.enum';
import { memberTypeLabel } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MyPage: NextPage = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const category: any = router.query?.category ?? 'myProfile';

	/** APOLLO REQUESTS **/
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	/** LIFECYCLES **/
	// Only leave when there is no saved login: on a reload the layout restores the user from the token
	// after this effect runs, so checking user._id alone sent signed-in members home
	useEffect(() => {
		if (!user._id && !getJwtToken()) router.push('/').then();
	}, [user]);

	// Legacy Nestar tab names
	useEffect(() => {
		const legacy: Record<string, string> = { addProperty: 'addGame', myProperties: 'myGames' };
		if (router.isReady && legacy[category]) {
			const { propertyId, ...rest } = router.query;
			const query = { ...rest, category: legacy[category], ...(propertyId ? { gameId: propertyId } : {}) };
			router.replace({ pathname: '/mypage', query }, undefined, { shallow: true });
		}
	}, [category, router.isReady]);

	/** HANDLERS **/
	const subscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) throw new Error(Messages.error1);
			if (!user._id) throw new Error(Messages.error2);

			await subscribe({ variables: { input: id } });
			await sweetTopSmallSuccessAlert('Subscribed!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const unsubscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) throw new Error(Messages.error1);
			if (!user._id) throw new Error(Messages.error2);

			await unsubscribe({ variables: { input: id } });
			await sweetTopSmallSuccessAlert('Unsubscribed!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const likeMemberHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetMember({ variables: { input: id } });
			await sweetTopSmallSuccessAlert('Success!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			console.log('ERROR, likeMemberHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	/** PRESENTATION **/
	const sectionLabels: Record<string, string> = {
		myProfile: 'My profile',
		addGame: router.query?.gameId ? 'Edit game' : 'Add game',
		myGames: 'My games',
		myFavorites: 'Favorites',
		recentlyVisited: 'Recently visited',
		followers: 'Followers',
		followings: 'Following',
		myArticles: 'My articles',
		writeArticle: 'Write article',
	};
	const nick = user?.memberNick ?? '';
	const avatar = user?.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg';

	return (
		<div className="gv-catalog gv-gd gv-mp">
			<Head>
				<title>{`${sectionLabels[category] ?? 'My page'} | Gameverse`}</title>
			</Head>

			{/** 00 PLAYER ONE — night: who is signed in, and quick actions **/}
			<section className="gv-mp-hero" aria-labelledby="mypage-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					<img src={avatar} alt="" decoding="async" />
					<span className="gv-cat-hero__tint" />
					<span className="gv-cat-hero__grain" />
				</div>
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>

				<div className="gv-mp-hero__inner">
					<span className="gv-mp-hero__avatar" aria-hidden>
						<img src={avatar} alt="" />
					</span>
					<div className="gv-mp-hero__copy">
						<p className="gv-chapter gv-chapter--dark" aria-hidden>
							<span>00</span>Player one
						</p>
						<h1 className="gv-mp-hero__name" id="mypage-title" style={{ '--mp-chars': Math.max(nick.length, 4) } as React.CSSProperties}>
							<span className="gv-visually-hidden">My page, </span>
							{nick}
						</h1>
						<p className="gv-mp-hero__meta">
							<span className="gv-gd-flag">{memberTypeLabel(user?.memberType)}</span>
							{user?.memberAddress && <span>{user.memberAddress}</span>}
							<span>Now: {sectionLabels[category] ?? 'My page'}</span>
						</p>
					</div>
					<div className="gv-mp-hero__actions">
						<Link href={{ pathname: '/mypage', query: { category: 'myProfile' } }} scroll={false} className="gv-gd-like">
							Edit profile
						</Link>
						{user?.memberType === MemberType.AGENT ? (
							<Link href={{ pathname: '/mypage', query: { category: 'addGame' } }} scroll={false} className="gv-gd-cta gv-gd-cta--solid">
								Add a game
							</Link>
						) : (
							<Link href={{ pathname: '/mypage', query: { category: 'writeArticle' } }} scroll={false} className="gv-gd-cta gv-gd-cta--solid">
								Write a post
							</Link>
						)}
					</div>
				</div>
			</section>

			{/** 01 CONSOLE — paper: section navigation + the active panel **/}
			<section className="gv-mp-console" aria-label="My page">
				<div className="gv-mp-console__inner">
					<aside className="gv-mp-console__nav">
						<MyMenu />
					</aside>
					<div className="gv-mp-console__panel">
						{category === 'addGame' && <AddNewGame />}
						{category === 'myGames' && <MyGames />}
						{category === 'myFavorites' && <MyFavorites />}
						{category === 'recentlyVisited' && <RecentlyVisited />}
						{category === 'myArticles' && <MyArticles />}
						{category === 'writeArticle' && <WriteArticle />}
						{category === 'myProfile' && <MyProfile />}
						{category === 'followers' && (
							<MemberFollowers
								subscribeHandler={subscribeHandler}
								unsubscribeHandler={unsubscribeHandler}
								likeMemberHandler={likeMemberHandler}
								redirectToMemberPageHandler={redirectToMemberPageHandler}
							/>
						)}
						{category === 'followings' && (
							<MemberFollowings
								subscribeHandler={subscribeHandler}
								unsubscribeHandler={unsubscribeHandler}
								likeMemberHandler={likeMemberHandler}
								redirectToMemberPageHandler={redirectToMemberPageHandler}
							/>
						)}
					</div>
				</div>
			</section>
		</div>
	);
};

export default withLayoutCatalog(MyPage);
