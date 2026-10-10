import React, { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { getJwtToken, logOut, updateUserInfo } from '../auth';
import { Stack, Box, Drawer } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { alpha, styled } from '@mui/material/styles';
import Menu, { MenuProps } from '@mui/material/Menu';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { CaretDown } from 'phosphor-react';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { Logout } from '@mui/icons-material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { REACT_APP_API_URL } from '../config';
import NotificationBell from './notification/NotificationBell';
import { useNotificationFeed } from '../hooks/useNotificationFeed';

const Top = () => {
	const user = useReactiveVar(userVar);
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const [lang, setLang] = useState<string | null>('en');
	const drop = Boolean(anchorEl2);
	const [colorChange, setColorChange] = useState(false);
	const [anchorEl, setAnchorEl] = React.useState<any | HTMLElement>(null);
	let open = Boolean(anchorEl);
	const [bgColor, setBgColor] = useState<boolean>(false);
	const [logoutAnchor, setLogoutAnchor] = React.useState<null | HTMLElement>(null);
	const logoutOpen = Boolean(logoutAnchor);
	const [menuOpen, setMenuOpen] = useState<boolean>(false);
	const { unread } = useNotificationFeed();

	const navLinks = [
		{ href: '/', label: t('Home'), match: (path: string) => path === '/' },
		{ href: '/game', label: t('Games'), match: (path: string) => path.startsWith('/game') },
		{ href: '/developer', label: t('Developers'), match: (path: string) => path.startsWith('/developer') },
		{
			href: '/community?articleCategory=FREE',
			label: t('Community'),
			match: (path: string) => path.startsWith('/community'),
		},
		...(user?._id ? [{ href: '/mypage', label: t('My Page'), match: (path: string) => path.startsWith('/mypage') }] : []),
		{ href: '/cs', label: t('CS'), match: (path: string) => path.startsWith('/cs') },
	];
	const languages = [
		{ id: 'en', label: t('English') },
		{ id: 'kr', label: t('Korean') },
		{ id: 'ru', label: t('Russian') },
	];

	/** LIFECYCLES **/
	useEffect(() => {
		if (localStorage.getItem('locale') === null) {
			localStorage.setItem('locale', 'en');
			setLang('en');
		} else {
			setLang(localStorage.getItem('locale'));
		}
	}, [router]);

	useEffect(() => {
		switch (router.pathname) {
			case '/game/detail':
				setBgColor(true);
				break;
			default:
				break;
		}
	}, [router]);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	// The small-screen menu closes whenever a link changes the route
	useEffect(() => {
		setMenuOpen(false);
	}, [router.asPath]);

	/** HANDLERS **/
	const langClick = (e: any) => {
		setAnchorEl2(e.currentTarget);
	};

	const langClose = () => {
		setAnchorEl2(null);
	};

	const langChoice = useCallback(
		async (e: any) => {
			setLang(e.target.id);
			localStorage.setItem('locale', e.target.id);
			setAnchorEl2(null);
			await router.push(router.asPath, router.asPath, { locale: e.target.id });
		},
		[router],
	);

	const changeNavbarColor = () => {
		if (window.scrollY >= 50) {
			setColorChange(true);
		} else {
			setColorChange(false);
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleHover = (event: any) => {
		if (anchorEl !== event.currentTarget) {
			setAnchorEl(event.currentTarget);
		} else {
			setAnchorEl(null);
		}
	};

	const StyledMenu = styled((props: MenuProps) => (
		<Menu
			elevation={0}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'right',
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'right',
			}}
			{...props}
		/>
	))(({ theme }) => ({
		'& .MuiPaper-root': {
			top: '109px',
			borderRadius: 6,
			marginTop: theme.spacing(1),
			minWidth: 160,
			color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
			boxShadow:
				'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
			'& .MuiMenu-list': {
				padding: '4px 0',
			},
			'& .MuiMenuItem-root': {
				'& .MuiSvgIcon-root': {
					fontSize: 18,
					color: theme.palette.text.secondary,
					marginRight: theme.spacing(1.5),
				},
				'&:active': {
					backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
				},
			},
		},
	}));

	if (typeof window !== 'undefined') {
		window.addEventListener('scroll', changeNavbarColor);
	}

	return (
		<Stack className={'navbar'}>
			<Stack className={`navbar-main ${colorChange ? 'transparent' : ''} ${bgColor ? 'transparent' : ''}`}>
				<Stack className={'container'}>
					<Box component={'div'} className={'logo-box'}>
						<Link href={'/'}>
							<img src="/img/logo/logoWhite.svg" alt="" />
						</Link>
					</Box>
					<Box component={'div'} className={'router-box'}>
						<Link href={'/'}>
							<div>{t('Home')}</div>
						</Link>
						<Link href={'/game'}>
							<div>{t('Games')}</div>
						</Link>
						<Link href={'/developer'}>
							<div> {t('Developers')} </div>
						</Link>
						<Link href={'/community?articleCategory=FREE'}>
							<div> {t('Community')} </div>
						</Link>
						{user?._id && (
							<Link href={'/mypage'}>
								<div> {t('My Page')} </div>
							</Link>
						)}
						<Link href={'/cs'}>
							<div> {t('CS')} </div>
						</Link>
					</Box>
					<Box component={'div'} className={'user-box'}>
						{user?._id ? (
							<>
								<NotificationBell unread={unread} />
								<div className={'login-user'} onClick={(event: any) => setLogoutAnchor(event.currentTarget)}>
									<img
										src={
											user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'
										}
										alt=""
									/>
								</div>

								<Menu
									id="basic-menu"
									anchorEl={logoutAnchor}
									open={logoutOpen}
									onClose={() => {
										setLogoutAnchor(null);
									}}
									sx={{ mt: '5px' }}
								>
									<MenuItem onClick={() => logOut()}>
										<Logout fontSize="small" style={{ color: 'blue', marginRight: '10px' }} />
										Logout
									</MenuItem>
								</Menu>
							</>
						) : (
							<Link href={'/account/join'}>
								<div className={'join-box'}>
									<AccountCircleOutlinedIcon />
									<span>
										{t('Login')} / {t('Register')}
									</span>
								</div>
							</Link>
						)}

						<div className={'lan-box'}>
							<Button
								disableRipple
								className="btn-lang"
								onClick={langClick}
								endIcon={<CaretDown size={14} color="#616161" weight="fill" />}
							>
								<Box component={'div'} className={'flag'}>
									{lang !== null ? (
										<img src={`/img/flag/lang${lang}.png`} alt={'usaFlag'} />
									) : (
										<img src={`/img/flag/langen.png`} alt={'usaFlag'} />
									)}
								</Box>
							</Button>

							<StyledMenu anchorEl={anchorEl2} open={drop} onClose={langClose} sx={{ position: 'absolute' }}>
								<MenuItem disableRipple onClick={langChoice} id="en">
									<img
										className="img-flag"
										src={'/img/flag/langen.png'}
										onClick={langChoice}
										id="en"
										alt={'usaFlag'}
									/>
									{t('English')}
								</MenuItem>
								<MenuItem disableRipple onClick={langChoice} id="kr">
									<img
										className="img-flag"
										src={'/img/flag/langkr.png'}
										onClick={langChoice}
										id="uz"
										alt={'koreanFlag'}
									/>
									{t('Korean')}
								</MenuItem>
								<MenuItem disableRipple onClick={langChoice} id="ru">
									<img
										className="img-flag"
										src={'/img/flag/langru.png'}
										onClick={langChoice}
										id="ru"
										alt={'russiaFlag'}
									/>
									{t('Russian')}
								</MenuItem>
							</StyledMenu>
						</div>

						<button
							type="button"
							className={'menu-btn'}
							aria-label={t('Menu')}
							aria-expanded={menuOpen}
							aria-controls={'gv-nav-drawer'}
							onClick={() => setMenuOpen(true)}
						>
							<MenuRoundedIcon />
						</button>
					</Box>
				</Stack>
			</Stack>

			<Drawer
				anchor={'right'}
				open={menuOpen}
				onClose={() => setMenuOpen(false)}
				PaperProps={{ id: 'gv-nav-drawer', className: 'gv-nav-drawer' }}
			>
				<div className={'gv-nav-drawer__head'}>
					<span className={'gv-nav-drawer__tag'}>Menu</span>
					<button
						type="button"
						className={'gv-nav-drawer__close'}
						aria-label={t('Close')}
						onClick={() => setMenuOpen(false)}
					>
						<CloseRoundedIcon />
					</button>
				</div>

				<nav className={'gv-nav-drawer__links'} aria-label={'Main'}>
					{navLinks.map((link, index) => {
						const active = link.match(router.pathname);
						return (
							<Link
								key={link.href}
								href={link.href}
								className={`gv-nav-drawer__link ${active ? 'is-active' : ''}`}
								aria-current={active ? 'page' : undefined}
								onClick={() => setMenuOpen(false)}
							>
								<span className={'gv-nav-drawer__index'}>{String(index).padStart(2, '0')}</span>
								<span>{link.label}</span>
							</Link>
						);
					})}
					{user?._id && (
						<Link
							href={'/notifications'}
							className={`gv-nav-drawer__sublink ${router.pathname === '/notifications' ? 'is-active' : ''}`}
							aria-current={router.pathname === '/notifications' ? 'page' : undefined}
							onClick={() => setMenuOpen(false)}
						>
							{t('Notifications')}
							{unread > 0 && <span className={'gv-nav-drawer__count'}>{unread > 9 ? '9+' : unread}</span>}
						</Link>
					)}
					<Link
						href={'/about'}
						className={`gv-nav-drawer__sublink ${router.pathname === '/about' ? 'is-active' : ''}`}
						aria-current={router.pathname === '/about' ? 'page' : undefined}
						onClick={() => setMenuOpen(false)}
					>
						{t('About Us')}
					</Link>
				</nav>

				<div className={'gv-nav-drawer__foot'}>
					<div className={'gv-nav-drawer__langs'} role={'group'} aria-label={'Language'}>
						{languages.map((language) => (
							<button
								key={language.id}
								type="button"
								id={language.id}
								className={`gv-nav-drawer__lang ${lang === language.id ? 'is-active' : ''}`}
								aria-pressed={lang === language.id}
								onClick={langChoice}
							>
								{language.label}
							</button>
						))}
					</div>

					{user?._id ? (
						<button type="button" className={'gv-nav-drawer__cta is-ghost'} onClick={() => logOut()}>
							<Logout fontSize="small" />
							Logout
						</button>
					) : (
						<Link href={'/account/join'} className={'gv-nav-drawer__cta'} onClick={() => setMenuOpen(false)}>
							<AccountCircleOutlinedIcon fontSize="small" />
							{t('Login')} / {t('Register')}
						</Link>
					)}
				</div>
			</Drawer>
		</Stack>
	);
};

export default withRouter(Top);
