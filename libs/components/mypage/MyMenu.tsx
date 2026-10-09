import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { sweetConfirmAlert } from '../../sweetAlert';
import {
	GET_AGENT_GAMES,
	GET_BOARD_ARTICLES,
	GET_FAVORITE_GAMES,
	GET_MEMBER_FOLLOWERS,
	GET_MEMBER_FOLLOWINGS,
	GET_VISITED_GAMES,
} from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { GameStatus } from '../../enums/game.enum';
import { Direction } from '../../enums/common.enum';
import { T } from '../../types/common';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

const totalOf = (data: T, key: string): number | undefined => data?.[key]?.metaCounter?.[0]?.total ?? (data ? 0 : undefined);

/** My Page console: sections grouped by purpose, each with a live total from its own (limit 1) query **/
const MyMenu = () => {
	const router = useRouter();
	const category: any = router.query?.category ?? 'myProfile';
	const user = useReactiveVar(userVar);
	const isDeveloper = user?.memberType === MemberType.AGENT;

	/** HANDLERS **/
	const logoutHandler = async () => {
		try {
			if (await sweetConfirmAlert('Do you want to logout?')) logOut();
		} catch (err: any) {
			console.log('ERROR, logoutHandler:', err.message);
		}
	};

	/** LIVE TOTALS (read-only queries, one row each) **/
	const one = { page: 1, limit: 1 };
	const favorites = useQuery(GET_FAVORITE_GAMES, { fetchPolicy: 'cache-and-network', skip: !user?._id, variables: { input: one } });
	const visited = useQuery(GET_VISITED_GAMES, { fetchPolicy: 'cache-and-network', skip: !user?._id, variables: { input: one } });
	const articles = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		skip: !user?._id,
		variables: { input: { ...one, sort: 'createdAt', direction: Direction.DESC, search: { memberId: user?._id } } },
	});
	const followers = useQuery(GET_MEMBER_FOLLOWERS, {
		fetchPolicy: 'cache-and-network',
		skip: !user?._id,
		variables: { input: { ...one, search: { followingId: user?._id } } },
	});
	const followings = useQuery(GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'cache-and-network',
		skip: !user?._id,
		variables: { input: { ...one, search: { followerId: user?._id } } },
	});
	const activeGames = useQuery(GET_AGENT_GAMES, {
		fetchPolicy: 'cache-and-network',
		skip: !isDeveloper,
		variables: { input: { ...one, sort: 'createdAt', direction: Direction.DESC, search: { gameStatus: GameStatus.ACTIVE } } },
	});
	const upcomingGames = useQuery(GET_AGENT_GAMES, {
		fetchPolicy: 'cache-and-network',
		skip: !isDeveloper,
		variables: { input: { ...one, sort: 'createdAt', direction: Direction.DESC, search: { gameStatus: GameStatus.UPCOMING } } },
	});

	// Totals follow changes made inside a section (unlike, delete, follow …) when you switch sections
	useEffect(() => {
		if (!user?._id) return;
		[favorites, visited, articles, followers, followings].forEach((query) => query.refetch().catch(() => undefined));
		if (isDeveloper) [activeGames, upcomingGames].forEach((query) => query.refetch().catch(() => undefined));
	}, [category]);

	const gameTotal =
		totalOf(activeGames.data, 'getAgentGames') === undefined
			? undefined
			: (totalOf(activeGames.data, 'getAgentGames') ?? 0) + (totalOf(upcomingGames.data, 'getAgentGames') ?? 0);

	const groups = [
		...(isDeveloper
			? [
					{
						title: 'Studio',
						items: [
							{ id: 'addGame', label: 'Add game', icon: AddBoxOutlinedIcon },
							{ id: 'myGames', label: 'My games', icon: SportsEsportsOutlinedIcon, count: gameTotal },
						],
					},
			  ]
			: []),
		{
			title: 'Library',
			items: [
				{ id: 'myFavorites', label: 'Favorites', icon: FavoriteBorderRoundedIcon, count: totalOf(favorites.data, 'getFavorites') },
				{ id: 'recentlyVisited', label: 'Recently visited', icon: HistoryRoundedIcon, count: totalOf(visited.data, 'getVisited') },
			],
		},
		{
			title: 'Social',
			items: [
				{
					id: 'followers',
					label: 'Followers',
					icon: GroupOutlinedIcon,
					count: totalOf(followers.data, 'getMemberFollowers'),
				},
				{
					id: 'followings',
					label: 'Following',
					icon: PersonAddAltOutlinedIcon,
					count: totalOf(followings.data, 'getMemberFollowings'),
				},
			],
		},
		{
			title: 'Community',
			items: [
				{ id: 'myArticles', label: 'My articles', icon: ArticleOutlinedIcon, count: totalOf(articles.data, 'getBoardArticles') },
				{ id: 'writeArticle', label: 'Write article', icon: EditNoteRoundedIcon },
			],
		},
	];

	return (
		<nav className="gv-mp-nav" aria-label="My Page sections">
			{groups.map((group) => (
				<div className="gv-mp-nav__group" key={group.title}>
					<p className="gv-mp-nav__title">{group.title}</p>
					<ul>
						{group.items.map((item: T) => {
							const Icon = item.icon;
							const current = category === item.id;
							return (
								<li key={item.id}>
									<Link
										href={{ pathname: '/mypage', query: { category: item.id } }}
										scroll={false}
										className={`gv-mp-nav__item ${current ? 'is-current' : ''}`}
										aria-current={current ? 'page' : undefined}
									>
										<Icon aria-hidden />
										<span className="gv-mp-nav__label">{item.label}</span>
										{item.count !== undefined && <span className="gv-mp-nav__count">{item.count}</span>}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}

			<div className="gv-mp-nav__group">
				<p className="gv-mp-nav__title">Account</p>
				<ul>
					<li>
						<Link
							href={{ pathname: '/mypage', query: { category: 'myProfile' } }}
							scroll={false}
							className={`gv-mp-nav__item ${category === 'myProfile' ? 'is-current' : ''}`}
							aria-current={category === 'myProfile' ? 'page' : undefined}
						>
							<ManageAccountsOutlinedIcon aria-hidden />
							<span className="gv-mp-nav__label">My profile</span>
						</Link>
					</li>
					{user?.memberType === MemberType.ADMIN && (
						<li>
							<a href="/_admin/users" target={'_blank'} rel="noopener noreferrer" className="gv-mp-nav__item">
								<AdminPanelSettingsOutlinedIcon aria-hidden />
								<span className="gv-mp-nav__label">Admin panel</span>
							</a>
						</li>
					)}
					<li>
						<button type="button" className="gv-mp-nav__item gv-mp-nav__item--logout" onClick={logoutHandler}>
							<LogoutRoundedIcon aria-hidden />
							<span className="gv-mp-nav__label">Logout</span>
						</button>
					</li>
				</ul>
			</div>
		</nav>
	);
};

export default MyMenu;
