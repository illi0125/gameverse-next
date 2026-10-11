import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import MenuList, { adminPageTitle } from '../admin/AdminMenuList';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from '@mui/material';
import { ArrowSquareOut, List, SignOut } from 'phosphor-react';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { MemberType } from '../../enums/member.enum';

const withAdminLayout = (Component: ComponentType) => {
	return (props: object) => {
		const router = useRouter();
		const user = useReactiveVar(userVar);
		const [settingsState, setSettingsStateState] = useState(false);
		const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
		const [openMenu, setOpenMenu] = useState(false);
		const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
		const [title, setTitle] = useState('admin');
		const [loading, setLoading] = useState(true);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
			setLoading(false);
		}, []);

		useEffect(() => {
			if (!loading && user.memberType !== MemberType.ADMIN) {
				router.push('/').then();
			}
		}, [loading, user, router]);

		/** HANDLERS **/
		const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
			setAnchorElUser(event.currentTarget);
		};

		const handleCloseUserMenu = () => {
			setAnchorElUser(null);
		};

		const logoutHandler = () => {
			logOut();
			router.push('/').then();
		};

		// Nothing visible for visitors (the redirect above runs), but crawlers still get noindex
		if (!user || user?.memberType !== MemberType.ADMIN)
			return (
				<Head>
					<meta name="robots" content="noindex, nofollow" key="robots" />
				</Head>
			);

		const { section, title: pageTitle } = adminPageTitle(router.pathname);
		const avatar = user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg';

		return (
			<main id="pc-wrap" className="gv-admin">
				<Head>
					<meta name="robots" content="noindex, nofollow" key="robots" />
					<title>{`${pageTitle} · Admin | Gameverse`}</title>
				</Head>
				<a href="#bunker" className="gv-admin-skip">
					Skip to content
				</a>

				<aside className={`gv-admin-aside ${openMenu ? 'is-open' : ''}`} aria-label="Admin navigation">
					<div className="gv-admin-aside__brand">
						<Link href="/_admin" className="gv-admin-aside__logo" aria-label="GameVerse admin home">
							<img src={'/img/logo/logoWhite.svg'} alt="GameVerse" />
						</Link>
						<span className="gv-admin-aside__tag">Control room</span>
					</div>

					<div className="gv-admin-aside__me">
						<span className="gv-admin-aside__avatar">
							<img src={avatar} alt="" />
						</span>
						<div>
							<p className="gv-admin-aside__nick">{user?.memberNick}</p>
							<p className="gv-admin-aside__role">Administrator</p>
						</div>
					</div>

					<MenuList onNavigate={() => setOpenMenu(false)} />

					<div className="gv-admin-aside__foot">
						<Link href="/" className="gv-admin-aside__link">
							<ArrowSquareOut size={16} aria-hidden />
							View site
						</Link>
						<button type="button" className="gv-admin-aside__link" onClick={logoutHandler}>
							<SignOut size={16} aria-hidden />
							Logout
						</button>
					</div>
				</aside>
				{openMenu && <button type="button" className="gv-admin-scrim" aria-label="Close navigation" onClick={() => setOpenMenu(false)} />}

				<div className="gv-admin-main">
					<header className="gv-admin-topbar">
						<button
							type="button"
							className="gv-admin-topbar__menu"
							aria-label="Open navigation"
							aria-expanded={openMenu}
							onClick={() => setOpenMenu(true)}
						>
							<List size={22} aria-hidden />
						</button>
						<p className="gv-admin-topbar__crumbs">
							<span>{section}</span>
							<span aria-hidden>/</span>
							<strong>{pageTitle}</strong>
						</p>
						<button
							type="button"
							className="gv-admin-topbar__me"
							onClick={handleOpenUserMenu}
							aria-haspopup="menu"
							aria-label="Account menu"
						>
							<img src={avatar} alt="" />
							<span>{user?.memberNick}</span>
						</button>
						<Menu
							anchorEl={anchorElUser}
							anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
							transformOrigin={{ vertical: 'top', horizontal: 'right' }}
							open={Boolean(anchorElUser)}
							onClose={handleCloseUserMenu}
							className="gv-admin-menu"
						>
							<li className="gv-admin-menu__who">
								<strong>{user?.memberNick}</strong>
								<span>{user?.memberPhone}</span>
							</li>
							<MenuItem
								onClick={() => {
									handleCloseUserMenu();
									logoutHandler();
								}}
							>
								Logout
							</MenuItem>
						</Menu>
					</header>

					<Box component={'div'} id="bunker" className="gv-admin-content">
						{/*@ts-ignore*/}
						<Component {...props} setSnackbar={setSnackbar} setTitle={setTitle} />
					</Box>
				</div>
			</main>
		);
	};
};

export default withAdminLayout;
