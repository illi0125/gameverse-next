import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import StoreLinks from '../../libs/components/game/StoreLinks';
import { Pagination as MuiPagination } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';
import Review from '../../libs/components/game/Review';
import CatalogCard from '../../libs/components/game/CatalogCard';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import { MOTION_QUERY, SCENE_QUERY, gameCover, pad } from '../../libs/components/homepage/homeMotion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Game, GameSystemRequirement } from '../../libs/types/game/game';
import moment from 'moment';
import { formatEnumLabel, formatGameOriginalPrice, formatGamePrice, hasGameDiscount } from '../../libs/utils';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GET_GAME, GET_GAMES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CREATE_COMMENT, LIKE_TARGET_GAME } from '../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { GET_COMMENTS } from '../../apollo/admin/query';
import { MemberType } from '../../libs/enums/member.enum';
import { getGameStoreLinks } from '../../libs/gameStores';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** YouTube links render as embeds; uploaded or direct files use <video> **/
const toYoutubeEmbed = (url: string): string | null => {
	const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
	return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
};

const toMediaUrl = (path: string): string => (/^https?:\/\//.test(path) ? path : `${REACT_APP_API_URL}/${path}`);

/** Splits a title into at most two display lines of similar length, so the second can be indented **/
const splitTitle = (title: string): string[] => {
	const words = title.trim().split(/\s+/);
	if (words.length < 2 || title.length <= 12) return [title];
	let best = 1;
	let bestLongest = Infinity;
	for (let i = 1; i < words.length; i++) {
		const longest = Math.max(words.slice(0, i).join(' ').length, words.slice(i).join(' ').length);
		if (longest < bestLongest) {
			best = i;
			bestLongest = longest;
		}
	}
	return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
};

/** Catalog link filtered by one search key, in the URL shape /game already reads **/
const catalogHref = (search: T) =>
	`/game?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', direction: Direction.DESC, search })}`;

const GameDetail: NextPage = ({ initialComment, ...props }: any) => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [gameId, setGameId] = useState<string | null>(null);
	const [game, setGame] = useState<Game | null>(null);
	const [slideImage, setSlideImage] = useState<string>('');
	const [similarGames, setSimilarGames] = useState<Game[]>([]);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [gameComments, setGameComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.GAME,
		commentContent: '',
		commentRefId: '',
	});
	const rootRef = useRef<HTMLDivElement>(null);

	const similarInput = {
		page: 1,
		limit: 5,
		sort: 'gameRank',
		direction: Direction.DESC,
		search: { genreList: game?.gameGenres ?? [] },
	};

	/** APOLLO REQUESTS **/
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);
	const [createComment] = useMutation(CREATE_COMMENT);

	const {
		loading: getGameLoading,
		data: getGameData,
		error: getGameError,
		refetch: getGameRefetch,
	} = useQuery(GET_GAME, {
		fetchPolicy: 'network-only',
		variables: { input: gameId },
		skip: !gameId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getGame) {
				setGame(data.getGame);
				setSlideImage(data.getGame.gameImages?.[0] ?? '');
			}
		},
	});

	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: similarInput },
		skip: !game?.gameGenres?.length,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			const list: Game[] = data?.getGames?.list ?? [];
			setSimilarGames(list.filter((item: Game) => item._id !== gameId).slice(0, 4));
		},
	});

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: commentInquiry },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getComments?.list) setGameComments(data?.getComments?.list);
			setCommentTotal(data?.getComments?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.id) {
			setGameId(router.query.id as string);
			setCommentInquiry({
				...commentInquiry,
				page: 1,
				search: {
					commentGroup: CommentGroup.GAME,
					commentRefId: router.query.id as string,
				},
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: router.query.id as string,
			});
		}
	}, [router]);

	/** HANDLERS **/
	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetGame({ variables: { input: id } });
			if (id === gameId) await getGameRefetch({ input: id });
			else await getGamesRefetch({ input: similarInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		setCommentInquiry({ ...commentInquiry, page: value });
	};

	const createCommentHandler = async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await createComment({ variables: { input: insertCommentData } });
			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			await getCommentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	/** PRESENTATION **/
	const images: string[] = game?.gameImages?.length ? game.gameImages : [''];
	const activeIndex = Math.max(0, images.indexOf(slideImage));
	const imageSrc = (path: string) => (path ? `${REACT_APP_API_URL}/${path}` : '/img/gameverse/game-placeholder.svg');
	const stepImage = (step: number) => setSlideImage(images[(activeIndex + step + images.length) % images.length]);

	const jumpTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		const target = document.getElementById(id);
		if (!target) return;
		event.preventDefault();
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 104, behavior: reduceMotion ? 'auto' : 'smooth' });
	};

	// Scroll motion for the loaded game; re-runs when another game opens on the same page
	useEffect(() => {
		const root = rootRef.current;
		if (!root || !game?._id) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: title lines rise out of their masks
			gsap.from(root.querySelectorAll('.gv-gd-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
			const hero = root.querySelector('.gv-gd-hero');
			gsap.to(root.querySelector('.gv-gd-hero .gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
			gsap.to(root.querySelector('.gv-gd-hero__fan'), {
				yPercent: -14,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
			});
			// Gallery art settles as the chapter arrives; the giant index drifts against it
			const gallery = root.querySelector('.gv-gd-gallery');
			gsap.fromTo(
				root.querySelector('.gv-gd-gallery__bg'),
				{ scale: 1.1 },
				{ scale: 1, ease: 'none', scrollTrigger: { trigger: gallery, start: 'top bottom', end: 'top top', scrub: 0.6 } },
			);
			gsap.fromTo(
				root.querySelector('.gv-gd-gallery__numeral-track'),
				{ xPercent: 6 },
				{ xPercent: -8, ease: 'none', scrollTrigger: { trigger: gallery, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
			);
		});

		ScrollTrigger.refresh();
		return () => mm.revert();
	}, [game?._id]);

	// Similar games tilt in and level out as they cross the viewport
	useEffect(() => {
		const root = rootRef.current;
		if (!root || similarGames.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			root.querySelectorAll<HTMLElement>('.gv-gd-similar__grid > li').forEach((item, index) => {
				const side = index % 2 === 0 ? -1 : 1;
				gsap.fromTo(
					item,
					{ rotation: side * 6, yPercent: 14, scale: 0.92 },
					{
						rotation: 0,
						yPercent: 0,
						scale: 1,
						ease: 'none',
						scrollTrigger: { trigger: item, start: 'top bottom', end: 'top 62%', scrub: 0.6 },
					},
				);
			});
		});

		ScrollTrigger.refresh();
		return () => mm.revert();
	}, [similarGames.length]);

	if (!game) {
		const loading = getGameLoading || !gameId;
		return (
			<div className="gv-catalog gv-gd" ref={rootRef}>
				<section className="gv-gd-state" aria-live="polite">
					<div className="gv-cat-hero__grid" aria-hidden>
						<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
						<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
						<span className="gv-cat-hero__mark" />
					</div>
					<div className="gv-gd-state__inner">
						<p className="gv-chapter gv-chapter--dark" aria-hidden>
							<span>00</span>Game
						</p>
						{loading && !getGameError ? (
							<p className="gv-gd-state__readout">Loading game…</p>
						) : (
							<>
								<h1 className="gv-gd-state__title">{getGameError ? 'Game not available.' : 'No game selected.'}</h1>
								<p className="gv-gd-state__lead">
									It may have been removed or the link is incomplete. Every listed game is in the catalog.
								</p>
								<Link href="/game" className="gv-gd-cta gv-gd-cta--solid">
									Back to all games
								</Link>
							</>
						)}
					</div>
				</section>
			</div>
		);
	}

	const owner = game.memberData;
	const ownerHref = owner
		? owner.memberType === MemberType.AGENT
			? `/agent/detail?agentId=${owner._id}`
			: `/member?memberId=${owner._id}`
		: null;
	const isLiked = Boolean(game.meLiked?.[0]?.myFavorite);
	const titleLines = splitTitle(game.gameTitle);
	const titleChars = Math.max(...titleLines.map((line: string) => line.length), 6);
	const discount = hasGameDiscount(game) ? Math.round((1 - game.gameDiscountPrice / game.gamePrice) * 100) : 0;
	const hasStores = getGameStoreLinks(game).length > 0;
	const releaseDate = moment(game.gameReleaseDate);
	const fan = (game.gameImages ?? []).slice(0, 3);
	const hasRequirements = game.gameSystemRequirements?.length > 0;
	const hasVideos = game.gameVideos?.length > 0;
	const commentPages = Math.ceil(commentTotal / commentInquiry.limit);

	// Chapter numbers follow what is actually rendered
	const chapterIds = ['briefing', 'gallery', hasRequirements && 'requirements', 'comments', similarGames.length > 0 && 'similar'].filter(
		Boolean,
	) as string[];
	const chapterNo = (id: string) => pad(chapterIds.indexOf(id) + 1);

	return (
		<div className="gv-catalog gv-gd" ref={rootRef}>
			<Head>
				<title>{`${game.gameTitle} | Gameverse`}</title>
			</Head>

			{/** 00 TITLE — night, duotone atmosphere from the game's own cover **/}
			<section className="gv-gd-hero" aria-labelledby="game-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					<img key={game._id} src={gameCover(game)} alt="" decoding="async" />
					<span className="gv-cat-hero__tint" />
					<span className="gv-cat-hero__grain" />
				</div>
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>

				<div className="gv-gd-hero__inner">
					<div className="gv-gd-hero__copy">
						<nav className="gv-gd-hero__crumbs" aria-label="Breadcrumb">
							<Link href="/game">All games</Link>
							{game.gameGenres?.[0] && (
								<>
									<span aria-hidden>/</span>
									<Link href={catalogHref({ genreList: [game.gameGenres[0]] })}>{formatEnumLabel(game.gameGenres[0])}</Link>
								</>
							)}
						</nav>

						<div className="gv-gd-hero__flags">
							<span className="gv-gd-flag">{formatEnumLabel(game.gameType)}</span>
							{game.isUpcoming && <span className="gv-gd-flag">Upcoming</span>}
							{game.isFeatured && <span className="gv-gd-flag gv-gd-flag--line">Featured</span>}
						</div>

						<h1
							className="gv-gd-hero__title"
							id="game-title"
							style={{ '--gd-chars': titleChars } as React.CSSProperties}
						>
							{titleLines.map((line: string, index: number) => (
								<span className={`gv-gd-hero__line ${index === 1 ? 'gv-gd-hero__line--2' : ''}`} key={index}>
									<span className="gv-gd-hero__mask">
										<span className="gv-gd-hero__word">{line}</span>
									</span>
								</span>
							))}
						</h1>

						<p className="gv-gd-hero__credits">
							<span>{game.gameDeveloper}</span>
							{game.gamePublisher && game.gamePublisher !== game.gameDeveloper && <span>{game.gamePublisher}</span>}
							<span>
								{game.isUpcoming ? 'Releases' : 'Released'} {releaseDate.format('MMM D, YYYY')}
							</span>
						</p>

						<p className="gv-gd-hero__lead">{game.gameDescription}</p>

						<div className="gv-gd-hero__actions">
							<div className="gv-gd-price" aria-label={`Price: ${formatGamePrice(game)}`}>
								{discount > 0 && <span className="gv-gd-price__off">−{discount}%</span>}
								{discount > 0 && <s className="gv-gd-price__was">{formatGameOriginalPrice(game)}</s>}
								<span className="gv-gd-price__now">{formatGamePrice(game)}</span>
							</div>
							{hasStores && (
								<a href="#get-it" className="gv-gd-cta gv-gd-cta--solid" onClick={(event) => jumpTo(event, 'get-it')}>
									Where to get it
								</a>
							)}
							<button
								type="button"
								className={`gv-gd-like ${isLiked ? 'is-liked' : ''}`}
								aria-pressed={isLiked}
								aria-label={`${isLiked ? 'Unlike' : 'Like'} ${game.gameTitle}, ${game.gameLikes} likes`}
								onClick={() => likeGameHandler(user, game._id)}
							>
								{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
								{game.gameLikes}
							</button>
						</div>

						<dl className="gv-gd-hero__readout">
							<div>
								<dt>Views</dt>
								<dd>{game.gameViews}</dd>
							</div>
							<div>
								<dt>Likes</dt>
								<dd>{game.gameLikes}</dd>
							</div>
							<div>
								<dt>Comments</dt>
								<dd>{game.gameComments}</dd>
							</div>
							<div>
								<dt>Platforms</dt>
								<dd>{game.gamePlatforms.map(formatEnumLabel).join(' / ')}</dd>
							</div>
						</dl>
					</div>

					{fan.length > 0 && (
						<div className={`gv-gd-hero__fan has-${fan.length}`} aria-hidden>
							{fan.map((path: string) => (
								<span className="gv-gd-hero__plate" key={path}>
									<img src={imageSrc(path)} alt="" decoding="async" />
								</span>
							))}
						</div>
					)}
				</div>
			</section>

			{/** BRIEFING — paper sheet: overview, spec sheet, and the sticky side column **/}
			<section className="gv-gd-brief" id="briefing" aria-labelledby="brief-title">
				<div className="gv-gd-brief__inner">
					<div className="gv-gd-brief__main">
						<p className="gv-chapter" aria-hidden>
							<span>{chapterNo('briefing')}</span>Briefing
						</p>
						<h2 className="gv-gd-brief__title" id="brief-title">
							<span className="gv-gd-brief__title-line">About</span>
							<span className="gv-gd-brief__title-line gv-gd-brief__title-line--2">the game</span>
						</h2>
						{game.gameOverview && (
							<p className={`gv-gd-brief__overview ${game.gameOverview.length > 360 ? 'is-long' : ''}`}>{game.gameOverview}</p>
						)}

						<dl className="gv-gd-spec" aria-label="Game details">
							<div className="gv-gd-spec__cell">
								<dt>Developer</dt>
								<dd>{game.gameDeveloper}</dd>
							</div>
							<div className="gv-gd-spec__cell">
								<dt>Publisher</dt>
								<dd>{game.gamePublisher}</dd>
							</div>
							<div className="gv-gd-spec__cell">
								<dt>Release date</dt>
								<dd>{releaseDate.format('MMMM D, YYYY')}</dd>
							</div>
							<div className="gv-gd-spec__cell">
								<dt>Pricing</dt>
								<dd>
									{formatEnumLabel(game.gameType)} · {formatGamePrice(game)}
								</dd>
							</div>
							<div className="gv-gd-spec__cell">
								<dt>Status</dt>
								<dd>{formatEnumLabel(game.gameStatus)}</dd>
							</div>
							<div className="gv-gd-spec__cell">
								<dt>Modes</dt>
								<dd>{game.gameModes.map(formatEnumLabel).join(', ')}</dd>
							</div>
							<div className="gv-gd-spec__cell gv-gd-spec__cell--wide">
								<dt>Genres</dt>
								<dd>
									<ul className="gv-gd-tags">
										{game.gameGenres.map((genre: string) => (
											<li key={genre}>
												<Link href={catalogHref({ genreList: [genre] })}>{formatEnumLabel(genre)}</Link>
											</li>
										))}
									</ul>
								</dd>
							</div>
							<div className="gv-gd-spec__cell gv-gd-spec__cell--wide">
								<dt>Platforms</dt>
								<dd>
									<ul className="gv-gd-tags">
										{game.gamePlatforms.map((platform: string) => (
											<li key={platform}>
												<Link href={catalogHref({ platformList: [platform] })}>{formatEnumLabel(platform)}</Link>
											</li>
										))}
									</ul>
								</dd>
							</div>
						</dl>
					</div>

					<aside className="gv-gd-brief__aside" aria-label="Get the game and owner">
						<div id="get-it">
							<StoreLinks game={game} />
						</div>

						<section className="gv-gd-owner" aria-labelledby="owner-title">
							<h2 className="gv-gd-owner__title" id="owner-title">
								Listed by
							</h2>
							{owner ? (
								<div className="gv-gd-owner__card">
									<span className="gv-gd-owner__portrait">
										<img
											src={owner.memberImage ? `${REACT_APP_API_URL}/${owner.memberImage}` : '/img/profile/defaultUser.svg'}
											alt=""
										/>
									</span>
									<div className="gv-gd-owner__body">
										<Link href={ownerHref as string} className="gv-gd-owner__name">
											{owner.memberNick}
										</Link>
										<p className="gv-gd-owner__meta">
											<span>{formatEnumLabel(owner.memberType)}</span>
											<span>
												{owner.memberGames ?? 0} game{owner.memberGames === 1 ? '' : 's'} listed
											</span>
										</p>
									</div>
								</div>
							) : (
								<p className="gv-gd-owner__missing">Owner information is unavailable.</p>
							)}
							{owner && ownerHref && (
								<Link href={ownerHref} className="gv-gd-ink-cta">
									View {owner.memberType === MemberType.AGENT ? 'Agent' : 'Profile'}
								</Link>
							)}
						</section>
					</aside>
				</div>
			</section>

			{/** GALLERY — night, full-bleed active image with a giant index and cut thumbnails **/}
			<section className="gv-gd-gallery" id="gallery" aria-labelledby="gallery-title">
				<div className="gv-gd-gallery__stage">
					<div className="gv-gd-gallery__bg" aria-hidden>
						{images.map((path: string, index: number) => (
							<img
								key={path || 'placeholder'}
								src={imageSrc(path)}
								alt=""
								decoding="async"
								loading={index === 0 ? 'eager' : 'lazy'}
								className={index === activeIndex ? 'is-active' : ''}
							/>
						))}
					</div>
					<span className="gv-gd-gallery__shade" aria-hidden />

					<div className="gv-gd-gallery__numeral" aria-hidden>
						<span className="gv-gd-gallery__numeral-track">
							<span key={activeIndex}>{pad(activeIndex + 1)}</span>
						</span>
					</div>

					<header className="gv-gd-gallery__head">
						<p className="gv-chapter gv-chapter--dark" aria-hidden>
							<span>{chapterNo('gallery')}</span>Gallery
						</p>
						<h2 className="gv-gd-gallery__title" id="gallery-title">
							Screens
						</h2>
					</header>

					<div className="gv-gd-gallery__console">
						<p className="gv-gd-gallery__count" aria-live="polite">
							<span className="gv-visually-hidden">Image </span>
							{pad(activeIndex + 1)}
							<span aria-hidden> / </span>
							<span className="gv-visually-hidden"> of </span>
							{pad(images.length)}
						</p>
						{images.length > 1 && (
							<>
								<ul className="gv-gd-gallery__thumbs" aria-label="Choose an image">
									{images.map((path: string, index: number) => (
										<li key={path}>
											<button
												type="button"
												className={`gv-gd-gallery__thumb ${index === activeIndex ? 'is-active' : ''}`}
												aria-pressed={index === activeIndex}
												aria-label={`Show image ${index + 1} of ${images.length}`}
												onClick={() => setSlideImage(path)}
											>
												<img src={imageSrc(path)} alt="" loading="lazy" decoding="async" />
											</button>
										</li>
									))}
								</ul>
								<div className="gv-gd-gallery__arrows">
									<button type="button" className="gv-gd-gallery__arrow" aria-label="Previous image" onClick={() => stepImage(-1)}>
										<WestIcon aria-hidden />
									</button>
									<button type="button" className="gv-gd-gallery__arrow" aria-label="Next image" onClick={() => stepImage(1)}>
										<EastIcon aria-hidden />
									</button>
								</div>
							</>
						)}
					</div>
				</div>

				{hasVideos && (
					<div className="gv-gd-trailers">
						<h3 className="gv-gd-trailers__title">Trailers</h3>
						<ul className="gv-gd-trailers__list">
							{game.gameVideos.map((video: string) => {
								const embed = toYoutubeEmbed(video);
								return (
									<li className="gv-gd-trailers__frame" key={video}>
										{embed ? (
											<iframe
												src={embed}
												title={`${game.gameTitle} trailer`}
												allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
												allowFullScreen
												loading="lazy"
											/>
										) : (
											<video src={toMediaUrl(video)} controls preload="metadata" />
										)}
									</li>
								);
							})}
						</ul>
					</div>
				)}
			</section>

			{/** SYSTEM REQUIREMENTS — ultraviolet, one column pair per platform **/}
			{hasRequirements && (
				<section className="gv-gd-reqs" id="requirements" aria-labelledby="reqs-title">
					<div className="gv-gd-reqs__inner">
						<p className="gv-chapter" aria-hidden>
							<span>{chapterNo('requirements')}</span>Requirements
						</p>
						<h2 className="gv-gd-reqs__title" id="reqs-title">
							System requirements
						</h2>
						<div className="gv-gd-reqs__list">
							{game.gameSystemRequirements.map((req: GameSystemRequirement) => (
								<article className="gv-gd-reqs__platform" key={req.platform}>
									<h3 className="gv-gd-reqs__name">{formatEnumLabel(req.platform)}</h3>
									<dl className="gv-gd-reqs__columns">
										<div>
											<dt>Minimum</dt>
											<dd>{req.minimum}</dd>
										</div>
										<div>
											<dt>Recommended</dt>
											<dd>{req.recommended || '—'}</dd>
										</div>
									</dl>
								</article>
							))}
						</div>
					</div>
				</section>
			)}

			{/** COMMS — paper: comment log and the comment form **/}
			<section className="gv-gd-comms" id="comments" aria-labelledby="comms-title">
				<div className="gv-gd-comms__inner">
					<header className="gv-gd-comms__head">
						<p className="gv-chapter" aria-hidden>
							<span>{chapterNo('comments')}</span>Comms
						</p>
						<h2 className="gv-gd-comms__title" id="comms-title">
							Comments
						</h2>
						<p className="gv-gd-comms__count">
							{commentTotal} comment{commentTotal === 1 ? '' : 's'}
						</p>
					</header>

					<div className="gv-gd-comms__body">
						<div className="gv-gd-comms__log">
							{commentTotal !== 0 ? (
								<>
									<ol className="gv-gd-log">
										{gameComments?.map((comment: Comment) => {
											return <Review comment={comment} key={comment?._id} />;
										})}
									</ol>
									{commentPages > 1 && (
										<nav className="gv-cat-pagination" aria-label="Comment pages">
											<MuiPagination
												page={commentInquiry.page}
												count={commentPages}
												onChange={commentPaginationChangeHandler}
												shape="rounded"
											/>
										</nav>
									)}
								</>
							) : (
								<p className="gv-gd-comms__empty">No comments yet. Start the conversation.</p>
							)}
						</div>

						<form
							className="gv-gd-form"
							onSubmit={(event) => {
								event.preventDefault();
								if (insertCommentData.commentContent.trim() !== '' && user?._id) createCommentHandler();
							}}
						>
							<label className="gv-gd-form__label" htmlFor="game-comment">
								Leave a comment
							</label>
							<textarea
								id="game-comment"
								className="gv-gd-form__input"
								placeholder={user?._id ? 'Share your thoughts about this game' : 'Login to leave a comment'}
								onChange={({ target: { value } }: any) => {
									setInsertCommentData({ ...insertCommentData, commentContent: value });
								}}
								value={insertCommentData.commentContent}
							></textarea>
							<div className="gv-gd-form__foot">
								{!user?._id && (
									<Link href="/account/join" className="gv-gd-form__login">
										Log in to comment
									</Link>
								)}
								<button
									type="submit"
									className="gv-gd-ink-cta gv-gd-ink-cta--solid"
									disabled={insertCommentData.commentContent.trim() === '' || !user?._id}
								>
									Submit comment
								</button>
							</div>
						</form>
					</div>
				</div>
			</section>

			{/** MORE LIKE THIS — signal field with catalog cards **/}
			{similarGames.length !== 0 && (
				<section className="gv-gd-similar" id="similar" aria-labelledby="similar-title">
					<div className="gv-gd-similar__inner">
						<header className="gv-gd-similar__head">
							<div>
								<p className="gv-chapter" aria-hidden>
									<span>{chapterNo('similar')}</span>Next up
								</p>
								<h2 className="gv-gd-similar__title" id="similar-title">
									More like this
								</h2>
								<p className="gv-gd-similar__sub">
									More {game.gameGenres.slice(0, 2).map(formatEnumLabel).join(' & ')} games you may like
								</p>
							</div>
							<Link href={catalogHref({ genreList: game.gameGenres })} className="gv-gd-ink-cta">
								See all
							</Link>
						</header>
						<ul className="gv-gd-similar__grid" aria-label="Similar games">
							{similarGames.map((similar: Game) => (
								<li key={similar._id}>
									<CatalogCard game={similar} likeGameHandler={likeGameHandler} />
								</li>
							))}
						</ul>
					</div>
				</section>
			)}
		</div>
	);
};

GameDetail.defaultProps = {
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			commentGroup: 'GAME',
			commentRefId: '',
		},
	},
};

export default withLayoutCatalog(GameDetail);
