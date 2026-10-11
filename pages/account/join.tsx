import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { gsap } from 'gsap';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { GET_GAMES } from '../../apollo/user/query';
import { MOTION_QUERY, gameCover, gameDetailHref, pad } from '../../libs/components/homepage/homeMotion';
import { Game } from '../../libs/types/game/game';
import { GamesInquiry } from '../../libs/types/game/game.input';
import { Direction } from '../../libs/enums/common.enum';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** Same request as the homepage hero (shared cache): the top-ranked cover is the scene's artwork **/
const sceneInput: GamesInquiry = { page: 1, limit: 8, sort: 'gameRank', direction: Direction.DESC, search: {} };

/** Where to go after log in / sign up: same-site paths only ("//host", "/\host", "https:", "javascript:" → home) **/
const safeReferrer = (value: unknown): string =>
	typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
		? value
		: '/';

/** API limits (MemberInput / LoginInput): nickname 3–12, password 5–12, phone required **/
const NICK_MIN = 3;
const NICK_MAX = 12;
const PASSWORD_MIN = 5;
const PASSWORD_MAX = 12;

type Field = 'nick' | 'password' | 'phone';

const fieldError = (name: Field, value: string): string => {
	const length = value.trim().length;
	if (name === 'nick' && (length < NICK_MIN || length > NICK_MAX))
		return `Use ${NICK_MIN}–${NICK_MAX} characters for your nickname.`;
	if (name === 'password' && (value.length < PASSWORD_MIN || value.length > PASSWORD_MAX))
		return `Use ${PASSWORD_MIN}–${PASSWORD_MAX} characters for your password.`;
	if (name === 'phone' && length === 0) return 'Enter a phone number.';
	return '';
};

const memberTypes = [
	{ value: 'USER', label: 'Player', desc: 'Browse, like, review and post.' },
	{ value: 'AGENT', label: 'Developer', desc: 'Everything players do, plus listing your own games.' },
];

const copy = {
	login: {
		chapter: 'Log in',
		lines: ['Welcome', 'back.'],
		lead: 'Pick up where you left off: your favorites, your games and your threads.',
		submit: 'Log in',
		pending: 'Logging in…',
	},
	signup: {
		chapter: 'Sign up',
		lines: ['Press', 'start.'],
		lead: 'One account for the whole catalog: like games, follow developers, post on the boards and ask the team.',
		submit: 'Create account',
		pending: 'Creating account…',
	},
};

const Join: NextPage = () => {
	const router = useRouter();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: 'USER' });
	const [loginView, setLoginView] = useState<boolean>(true);

	/** HANDLERS **/
	const viewChangeHandler = (state: boolean) => {
		setLoginView(state);
	};

	const handleInput = useCallback((name: any, value: any) => {
		setInput((prev) => {
			return { ...prev, [name]: value };
		});
	}, []);

	const doLogin = useCallback(async () => {
		try {
			await logIn(input.nick, input.password);
			await router.push(safeReferrer(router.query.referrer));
		} catch (err: any) {
			// Not awaited: the form is usable again while the alert is showing
			sweetMixinErrorAlert(err.message).then();
		}
	}, [input]);

	const doSignUp = useCallback(async () => {
		try {
			await signUp(input.nick, input.password, input.phone, input.type);
			await router.push(safeReferrer(router.query.referrer));
		} catch (err: any) {
			// Not awaited: the form is usable again while the alert is showing
			sweetMixinErrorAlert(err.message).then();
		}
	}, [input]);

	/** PRESENTATION (inline validation mirrors the API limits; submission still goes through doLogin / doSignUp) **/
	const rootRef = useRef<HTMLDivElement>(null);
	const [touched, setTouched] = useState<Record<Field, boolean>>({ nick: false, password: false, phone: false });
	const [showPassword, setShowPassword] = useState(false);
	const [pending, setPending] = useState(false);
	const mode = loginView ? copy.login : copy.signup;

	const { data: gamesData } = useQuery(GET_GAMES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: sceneInput },
	});
	const total: number | undefined = gamesData?.getGames?.metaCounter?.[0]?.total;
	const featured: Game | undefined = (gamesData?.getGames?.list ?? []).find((game: Game) => game?.gameImages?.length);

	const fields: Field[] = loginView ? ['nick', 'password'] : ['nick', 'password', 'phone'];
	const errors: Record<Field, string> = {
		nick: fieldError('nick', input.nick),
		password: fieldError('password', input.password),
		phone: fieldError('phone', input.phone),
	};
	const shownError = (name: Field) => (touched[name] ? errors[name] : '');
	// Same rule as before: every field filled in (and a member type on sign up)
	const disabled = loginView
		? input.nick == '' || input.password == ''
		: input.nick == '' || input.password == '' || input.phone == '' || input.type == '';

	const switchView = (state: boolean) => {
		viewChangeHandler(state);
		setTouched({ nick: false, password: false, phone: false });
	};

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		setTouched({ nick: true, password: true, phone: true });
		if (disabled || pending || fields.some((name) => errors[name])) return;
		setPending(true);
		try {
			if (loginView) await doLogin();
			else await doSignUp();
		} finally {
			setPending(false);
		}
	};

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: the plate and the form rise in
			gsap.from(root.querySelectorAll('.gv-auth__plate, .gv-auth__card'), {
				y: 28,
				opacity: 0,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.1,
				delay: 0.15,
			});
		});
		return () => mm.revert();
	}, []);

	const fieldProps = (name: Field) => ({
		id: `auth-${name}`,
		value: input[name],
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInput(name, e.target.value),
		onBlur: () => setTouched((prev) => ({ ...prev, [name]: true })),
		'aria-invalid': Boolean(shownError(name)),
		'aria-describedby': `auth-${name}-note`,
		required: true,
	});

	return (
		<div className="gv-catalog gv-auth" ref={rootRef}>
			<Head>
				<meta name="robots" content="noindex, nofollow" key="robots" />
				<title>{`${loginView ? 'Log in' : 'Sign up'} | Gameverse`}</title>
			</Head>

			<section className="gv-auth__stage" aria-labelledby="auth-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					<img key={featured?._id ?? 'fallback'} src={featured ? gameCover(featured) : '/img/gameverse/hero.svg'} alt="" />
					<span className="gv-cat-hero__tint" />
					<span className="gv-cat-hero__grain" />
				</div>
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>

				<div className="gv-auth__intro">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>{loginView ? '01' : '02'}</span>
						{mode.chapter}
					</p>
					<h1 className="gv-auth__title" id="auth-title" key={loginView ? 'login' : 'signup'}>
						<span className="gv-visually-hidden">{loginView ? 'Log in to GameVerse' : 'Create a GameVerse account'}</span>
						<span className="gv-auth__line" aria-hidden>
							<span className="gv-auth__word">{mode.lines[0]}</span>
						</span>
						<span className="gv-auth__line gv-auth__line--2" aria-hidden>
							<span className="gv-auth__word">{mode.lines[1]}</span>
						</span>
					</h1>
					<p className="gv-auth__lead">{mode.lead}</p>
					<p className="gv-auth__readout">
						<span>{total === undefined ? 'Connecting' : `${total} game${total === 1 ? '' : 's'} in the catalog`}</span>
						<span>One account · players and developers</span>
					</p>

					{featured && (
						<Link href={gameDetailHref(featured)} className="gv-auth__plate" aria-label={`Top ranked: ${featured.gameTitle}`}>
							<span className="gv-auth__plate-art" aria-hidden>
								<img src={gameCover(featured)} alt="" />
							</span>
							<span className="gv-auth__plate-tag">No. {pad(1)} ranked</span>
							<span className="gv-auth__plate-title">{featured.gameTitle}</span>
						</Link>
					)}
				</div>

				<div className="gv-auth__card">
					<div className="gv-auth__switch" role="tablist" aria-label="Account">
						{[
							{ state: true, label: 'Log in', index: '01' },
							{ state: false, label: 'Sign up', index: '02' },
						].map((tab) => (
							<button
								key={tab.label}
								type="button"
								role="tab"
								aria-selected={loginView === tab.state}
								aria-controls="auth-form"
								className={loginView === tab.state ? 'is-on' : ''}
								onClick={() => switchView(tab.state)}
							>
								<span>{tab.index}</span>
								{tab.label}
							</button>
						))}
					</div>

					<form id="auth-form" className="gv-auth__form" onSubmit={submitHandler} noValidate key={loginView ? 'login' : 'signup'}>
						<p className="gv-auth__form-title">{loginView ? 'Log in with your nickname' : 'Create your account'}</p>

						<div className="gv-auth__field">
							<label htmlFor="auth-nick">Nickname</label>
							<input
								type="text"
								placeholder="Your nickname"
								autoComplete="username"
								autoCapitalize="none"
								spellCheck={false}
								maxLength={NICK_MAX}
								autoFocus
								{...fieldProps('nick')}
							/>
							<p className={`gv-auth__note ${shownError('nick') ? 'is-error' : ''}`} id="auth-nick-note">
								{shownError('nick') || (loginView ? '' : `${NICK_MIN}–${NICK_MAX} characters, shown to other players.`)}
							</p>
						</div>

						<div className="gv-auth__field">
							<label htmlFor="auth-password">Password</label>
							<div className="gv-auth__secret">
								<input
									type={showPassword ? 'text' : 'password'}
									placeholder="Your password"
									autoComplete={loginView ? 'current-password' : 'new-password'}
									maxLength={PASSWORD_MAX}
									{...fieldProps('password')}
								/>
								<button
									type="button"
									className="gv-auth__reveal"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
									aria-pressed={showPassword}
									onClick={() => setShowPassword((current) => !current)}
								>
									{showPassword ? <VisibilityOffRoundedIcon aria-hidden /> : <VisibilityRoundedIcon aria-hidden />}
								</button>
							</div>
							<p className={`gv-auth__note ${shownError('password') ? 'is-error' : ''}`} id="auth-password-note">
								{shownError('password') || (loginView ? '' : `${PASSWORD_MIN}–${PASSWORD_MAX} characters.`)}
							</p>
						</div>

						{!loginView && (
							<>
								<div className="gv-auth__field gv-auth__field--enter">
									<label htmlFor="auth-phone">Phone</label>
									<input type="tel" placeholder="010 1234 5678" autoComplete="tel" {...fieldProps('phone')} />
									<p className={`gv-auth__note ${shownError('phone') ? 'is-error' : ''}`} id="auth-phone-note">
										{shownError('phone') || 'Used for your account only.'}
									</p>
								</div>

								<fieldset className="gv-auth__types gv-auth__field--enter">
									<legend>I want to be registered as</legend>
									<div>
										{memberTypes.map((type) => (
											<label key={type.value} className={input.type === type.value ? 'is-on' : ''}>
												<input
													type="radio"
													name="memberType"
													value={type.value}
													checked={input.type === type.value}
													onChange={() => handleInput('type', type.value)}
												/>
												<span className="gv-auth__type-name">{type.label}</span>
												<span className="gv-auth__type-desc">{type.desc}</span>
											</label>
										))}
									</div>
								</fieldset>
							</>
						)}

						<button type="submit" className="gv-auth__submit" disabled={disabled || pending} aria-busy={pending}>
							<span>{pending ? mode.pending : mode.submit}</span>
							<span className="gv-auth__submit-arrow" aria-hidden>
								→
							</span>
						</button>

						{loginView && (
							<p className="gv-auth__help">
								Forgot your password? <Link href={{ pathname: '/cs', query: { tab: 'faq' } }}>Find help</Link>
							</p>
						)}
					</form>

					<p className="gv-auth__ask">
						{loginView ? 'New to GameVerse?' : 'Already have an account?'}
						<button type="button" onClick={() => switchView(!loginView)}>
							{loginView ? 'Sign up' : 'Log in'}
						</button>
					</p>
				</div>
			</section>
		</div>
	);
};

export default withLayoutCatalog(Join);
