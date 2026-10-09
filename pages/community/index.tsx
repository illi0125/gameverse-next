import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Tab, Button, Pagination, Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PostEntry from '../../libs/components/community/PostEntry';
import {
	activeAuthor,
	articleHref,
	articleImage,
	boardMeta,
	communityBoards,
} from '../../libs/components/community/communityMeta';
import { MOTION_QUERY, SCENE_QUERY, pad } from '../../libs/components/homepage/homeMotion';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Direction } from '../../libs/enums/common.enum';
import { useMutation, useQuery } from '@apollo/client';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** Sorts the API accepts for board articles; `flag` labels the feature post **/
const communitySorts = [
	{ id: 'old', label: 'Oldest first', flag: 'First post', sort: 'createdAt', direction: Direction.ASC },
	{ id: 'new', label: 'Newest first', flag: 'Latest post', sort: 'createdAt', direction: Direction.DESC },
	{ id: 'likes', label: 'Most liked', flag: 'Most liked', sort: 'articleLikes', direction: Direction.DESC },
	{ id: 'views', label: 'Most read', flag: 'Most read', sort: 'articleViews', direction: Direction.DESC },
];

const isBoard = (value: unknown): value is BoardArticleCategory =>
	Object.values(BoardArticleCategory).includes(value as BoardArticleCategory);

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { query } = router;
	// The board lives in the URL (?articleCategory=…); on client navigation it is readable on the first render
	const [searchCommunity, setSearchCommunity] = useState<BoardArticlesInquiry>(() =>
		router.isReady && isBoard(query?.articleCategory)
			? { ...initialInput, search: { articleCategory: query.articleCategory } }
			: initialInput,
	);
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const {
		loading: bordArticlesLoading,
		data: boardArticlesData,
		error: getBoardArticlesError,
		refetch: boardArticlesRefetch,
	} = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchCommunity },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list);
			setTotalCount(data?.getBoardArticles?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	// Waits for the router so deep links (/community?articleCategory=NEWS), refresh and Back select the right board;
	// a missing or unknown board falls back to FREE in place
	useEffect(() => {
		if (!router.isReady) return;
		if (!isBoard(query?.articleCategory)) {
			router.replace({ pathname: '/community', query: { articleCategory: BoardArticleCategory.FREE } }, undefined, {
				shallow: true,
			});
			return;
		}
		if (query.articleCategory !== searchCommunity.search.articleCategory) {
			setSearchCommunity({ ...searchCommunity, page: 1, search: { articleCategory: query.articleCategory } });
		}
	}, [router.isReady, query?.articleCategory]);

	/** HANDLERS **/
	const tabChangeHandler = async (e: T, value: string) => {
		setSearchCommunity({ ...searchCommunity, page: 1, search: { articleCategory: value as BoardArticleCategory } });
		await router.push(
			{
				pathname: '/community',
				query: { articleCategory: value },
			},
			undefined,
			{ shallow: true },
		);
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};
	const likeArticleHandler = async (e: any, user: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetBoardArticle({ variables: { input: id } });
			await boardArticlesRefetch({ input: searchCommunity });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	/** DISCOVERY (UI only; the backend already accepts these inquiry fields) **/
	const rootRef = useRef<HTMLDivElement>(null);
	const [searchText, setSearchText] = useState<string>('');
	const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

	// Per-board totals and newest post: one light query per board (limit 1, newest first)
	const boardQuery = (articleCategory: BoardArticleCategory) => ({
		fetchPolicy: 'cache-and-network' as const,
		variables: { input: { page: 1, limit: 1, sort: 'createdAt', direction: Direction.DESC, search: { articleCategory } } },
	});
	const freeBoard = useQuery(GET_BOARD_ARTICLES, boardQuery(BoardArticleCategory.FREE));
	const recommendBoard = useQuery(GET_BOARD_ARTICLES, boardQuery(BoardArticleCategory.RECOMMEND));
	const newsBoard = useQuery(GET_BOARD_ARTICLES, boardQuery(BoardArticleCategory.NEWS));
	const humorBoard = useQuery(GET_BOARD_ARTICLES, boardQuery(BoardArticleCategory.HUMOR));
	const boardStats: Record<string, { total?: number; latest?: BoardArticle }> = {};
	[freeBoard, recommendBoard, newsBoard, humorBoard].forEach((result, index) => {
		boardStats[communityBoards[index].value] = {
			total: result.data?.getBoardArticles?.metaCounter?.[0]?.total ?? (result.data ? 0 : undefined),
			latest: result.data?.getBoardArticles?.list?.[0],
		};
	});
	const statsReady = communityBoards.every((board) => boardStats[board.value].total !== undefined);
	const allPosts = communityBoards.reduce((sum, board) => sum + (boardStats[board.value].total ?? 0), 0);
	const newest = communityBoards
		.map((board) => boardStats[board.value].latest)
		.filter((article): article is BoardArticle => Boolean(article))
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

	// Most liked across every board (the search's articleCategory is optional on the API)
	const { data: hotData, refetch: hotRefetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 5, sort: 'articleLikes', direction: Direction.DESC, search: {} } },
	});
	const hot: BoardArticle[] = hotData?.getBoardArticles?.list ?? [];

	/** Likes from anywhere on the page also refresh the cross-board list **/
	const likeAndRefresh = async (e: any, user: any, id: string) => {
		await likeArticleHandler(e, user, id);
		hotRefetch().then();
	};

	const applySearch = (text: string) => {
		setSearchCommunity({ ...searchCommunity, page: 1, search: { ...searchCommunity.search, text } });
	};

	const applySort = (option: (typeof communitySorts)[number]) => {
		setSortAnchor(null);
		setSearchCommunity({ ...searchCommunity, page: 1, sort: option.sort, direction: option.direction });
	};

	/** PRESENTATION **/
	const current = boardMeta(searchCommunity.search.articleCategory);
	const activeSort =
		communitySorts.find(
			(option) => option.sort === (searchCommunity.sort ?? 'createdAt') && option.direction === (searchCommunity.direction ?? 'DESC'),
		) ?? communitySorts[0];
	const activeText = searchCommunity.search.text ?? '';
	const articles: BoardArticle[] = boardArticles ?? [];
	const pageCount = Math.ceil(totalCount / searchCommunity.limit);
	const firstShown = totalCount ? (searchCommunity.page - 1) * searchCommunity.limit + 1 : 0;
	const lastShown = Math.min(searchCommunity.page * searchCommunity.limit, totalCount);
	const showFeature = searchCommunity.page === 1 && articles.length > 1;

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: headline lines rise out of their masks
			gsap.from(root.querySelectorAll('.gv-cm-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
			const hero = root.querySelector('.gv-cm-hero');
			gsap.to(root.querySelector('.gv-cm-hero .gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
		});
		return () => mm.revert();
	}, []);

	// The newest-post plate arrives with its query, so its drift is set up once it exists
	useEffect(() => {
		const root = rootRef.current;
		const signal = root?.querySelector('.gv-cm-hero__signal');
		if (!root || !signal) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			gsap.to(signal, {
				yPercent: -12,
				ease: 'none',
				scrollTrigger: { trigger: root.querySelector('.gv-cm-hero'), start: 'top top', end: 'bottom top', scrub: 0.6 },
			});
		});
		return () => mm.revert();
	}, [newest?._id]);

	// The feature plate tilts in and levels out (world-plate recipe from the homepage)
	useEffect(() => {
		const root = rootRef.current;
		const plate = root?.querySelector('.gv-cm-post--feature');
		if (!root || !plate) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			gsap.fromTo(
				plate.querySelector('.gv-cm-post__art'),
				{ rotation: -4, scale: 0.94 },
				{ rotation: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: plate, start: 'top bottom', end: 'top 55%', scrub: 0.6 } },
			);
		});
		ScrollTrigger.refresh();
		return () => mm.revert();
	}, [articles[0]?._id, showFeature]);

	return (
		<div className="gv-catalog gv-cm" ref={rootRef}>
			<Head>
				<title>Community | Gameverse</title>
			</Head>

			{/** 00 COMMS — night, duotone of the newest post, live readout, incoming transmission **/}
			<section className="gv-cm-hero" aria-labelledby="community-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					{newest ? (
						<img key={newest._id} src={articleImage(newest)} alt="" decoding="async" />
					) : (
						<img src="/img/gameverse/hero.svg" alt="" />
					)}
					<span className="gv-cat-hero__tint" />
					<span className="gv-cat-hero__grain" />
				</div>
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>

				<div className="gv-cm-hero__inner">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>00</span>Comms
					</p>
					<h1 className="gv-cm-hero__title" id="community-title">
						<span className="gv-cm-hero__line">
							<span className="gv-cm-hero__mask">
								<span className="gv-cm-hero__word">Player</span>
							</span>
						</span>
						<span className="gv-cm-hero__line gv-cm-hero__line--2">
							<span className="gv-cm-hero__mask">
								<span className="gv-cm-hero__word">Comms.</span>
							</span>
						</span>
					</h1>
					<p className="gv-cm-hero__lead">
						News, picks, stories and squad calls from the GameVerse community. Pick a board, read, like and join the
						thread.
					</p>
					<p className="gv-cm-hero__readout">
						<span>{statsReady ? `${allPosts} post${allPosts === 1 ? '' : 's'} on ${communityBoards.length} boards` : 'Tuning in'}</span>
						<span>Now on {current.label}</span>
					</p>
				</div>

				{newest && (
					<aside className="gv-cm-hero__signal" aria-label="Newest post">
						<p className="gv-cm-hero__signal-kicker">Incoming / {boardMeta(newest.articleCategory).label}</p>
						<div className="gv-cm-hero__signal-art" aria-hidden>
							<img src={articleImage(newest)} alt="" decoding="async" />
						</div>
						<h2 className="gv-cm-hero__signal-title">
							<Link href={articleHref(newest)}>{newest.articleTitle}</Link>
						</h2>
						<p className="gv-cm-hero__signal-meta">
							<span>{activeAuthor(newest)?.memberNick ?? 'Deleted account'}</span>
							<Moment format="DD MMM YYYY">{newest.createdAt}</Moment>
						</p>
					</aside>
				)}

				<form
					className="gv-cm-hero__console gv-cat-search"
					role="search"
					onSubmit={(event) => {
						event.preventDefault();
						applySearch(searchText.trim());
					}}
				>
					<label className="gv-cat-search__prompt" htmlFor="community-search">
						Search {current.short}
					</label>
					<input
						id="community-search"
						className="gv-cm-search__input"
						type="text"
						placeholder="Search post titles"
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
					/>
					<button type="submit" className="gv-cat-search__go" aria-label={`Search ${current.label}`}>
						<SearchRoundedIcon aria-hidden />
					</button>
				</form>
			</section>

			{/** 01 BOARDS — paper: board selector, feed, pagination **/}
			<section className="gv-cm-boards" aria-labelledby="board-title">
				<div className="gv-cm-boards__inner">
					<TabContext value={searchCommunity.search.articleCategory}>
						<p className="gv-chapter" aria-hidden>
							<span>01</span>Boards
						</p>

						<TabList
							aria-label="Community boards"
							TabIndicatorProps={{
								style: { display: 'none' },
							}}
							onChange={tabChangeHandler}
							className="gv-cm-tabs"
						>
							{communityBoards.map((board, index) => {
								const stats = boardStats[board.value];
								return (
									<Tab
										key={board.value}
										value={board.value}
										disableRipple
										className={`gv-cm-tab ${searchCommunity.search.articleCategory == board.value ? 'active' : ''}`}
										label={
											<>
												<span className="gv-cm-tab__index">{pad(index + 1)}</span>
												<span className="gv-cm-tab__name gv-cm-tab__name--full">{board.label}</span>
												<span className="gv-cm-tab__name gv-cm-tab__name--short" aria-hidden>
													{board.short}
												</span>
												<span className="gv-cm-tab__count">
													{stats.total === undefined ? '—' : `${stats.total} post${stats.total === 1 ? '' : 's'}`}
												</span>
												<span className="gv-cm-tab__latest">
													{stats.latest ? `Latest: ${stats.latest.articleTitle}` : board.desc}
												</span>
											</>
										}
									/>
								);
							})}
						</TabList>

						<header className="gv-cm-boards__head">
							<div>
								<h2 className="gv-cm-boards__title" id="board-title">
									{current.label}
								</h2>
								<p className="gv-cm-boards__desc">{current.desc}</p>
								<p className="gv-cm-boards__range">
									{totalCount
										? `Showing ${firstShown}–${lastShown} of ${totalCount}${activeText ? ` matching “${activeText}”` : ''}`
										: activeText
										? `No titles match “${activeText}”`
										: 'Nothing posted yet'}
								</p>
							</div>
							<div className="gv-cm-boards__tools">
								<div className="gv-cat-sort">
									<span className="gv-cat-sort__label" id="community-sort-label">
										Sort by
									</span>
									<Button
										className="gv-cat-sort__button"
										aria-describedby="community-sort-label"
										onClick={(e) => setSortAnchor(e.currentTarget)}
										endIcon={<KeyboardArrowDownRoundedIcon />}
									>
										{activeSort.label}
									</Button>
									<Menu
										anchorEl={sortAnchor}
										open={Boolean(sortAnchor)}
										onClose={() => setSortAnchor(null)}
										className="gv-cat-sort__menu"
										sx={{ paddingTop: '5px' }}
									>
										{communitySorts.map((option) => (
											<MenuItem onClick={() => applySort(option)} key={option.id} disableRipple>
												{option.label}
											</MenuItem>
										))}
									</Menu>
								</div>
								<button
									type="button"
									onClick={() =>
										router.push({
											pathname: '/mypage',
											query: {
												category: 'writeArticle',
											},
										})
									}
									className="gv-cm-write"
								>
									<EditRoundedIcon aria-hidden />
									Write a post
								</button>
							</div>
						</header>

						<TabPanel value={searchCommunity.search.articleCategory} className="gv-cm-panel">
							{totalCount ? (
								<ol className="gv-cm-feed" aria-label={`${current.label} posts`}>
									{articles.map((boardArticle: BoardArticle, index: number) => (
										<li key={boardArticle?._id} className={index === 0 && showFeature ? 'is-feature' : ''}>
											<PostEntry
												article={boardArticle}
												feature={index === 0 && showFeature}
												flag={`${activeSort.flag} on ${current.short}`}
												likeArticleHandler={likeAndRefresh}
											/>
										</li>
									))}
								</ol>
							) : (
								<div className="gv-cat-empty">
									<p className="gv-cat-empty__title">
										{bordArticlesLoading ? 'Loading posts…' : activeText ? 'No posts match that title.' : 'No posts here yet.'}
									</p>
									{!bordArticlesLoading &&
										(activeText ? (
											<button
												type="button"
												className="gv-cat-empty__reset"
												onClick={() => {
													setSearchText('');
													applySearch('');
												}}
											>
												Clear search
											</button>
										) : (
											<button
												type="button"
												className="gv-cat-empty__reset"
												onClick={() => router.push({ pathname: '/mypage', query: { category: 'writeArticle' } })}
											>
												Write the first post
											</button>
										))}
								</div>
							)}
						</TabPanel>
					</TabContext>

					{totalCount > 0 && (
						<nav className="gv-cat-pagination" aria-label="Pages">
							{pageCount > 1 ? (
								<Pagination
									count={pageCount}
									page={searchCommunity.page}
									shape="rounded"
									onChange={paginationHandler}
								/>
							) : (
								<span />
							)}
							<p className="gv-cat-pagination__total">
								Total {totalCount} article{totalCount > 1 ? 's' : ''} available
							</p>
						</nav>
					)}
				</div>
			</section>

			{/** 02 HOT — signal: most liked posts across every board **/}
			{hot.length > 0 && (
				<section className="gv-cm-hot" aria-labelledby="hot-title">
					<div className="gv-cm-hot__inner">
						<header className="gv-cm-hot__head">
							<p className="gv-chapter" aria-hidden>
								<span>02</span>Hot on the boards
							</p>
							<h2 className="gv-cm-hot__title" id="hot-title">
								<span className="gv-cm-hot__line">Most</span>
								<span className="gv-cm-hot__line gv-cm-hot__line--2">liked.</span>
							</h2>
							<p className="gv-cm-hot__desc">The posts players liked most, across every board.</p>
						</header>
						<ol className="gv-cm-hot__list">
							{hot.map((article: BoardArticle, index: number) => (
								<li className="gv-cm-hot__row" key={article._id}>
									<Link href={articleHref(article)} className="gv-cm-hot__hit" aria-hidden tabIndex={-1} />
									<span className="gv-cm-hot__rank" aria-hidden>
										{pad(index + 1)}
									</span>
									<span className="gv-cm-hot__board">{boardMeta(article.articleCategory).short}</span>
									<h3 className="gv-cm-hot__post">
										<Link href={articleHref(article)}>{article.articleTitle}</Link>
									</h3>
									<span className="gv-cm-hot__meta">
										<span>{activeAuthor(article)?.memberNick ?? 'Deleted account'}</span>
										<span>{article.articleViews ?? 0} views</span>
									</span>
									<span className="gv-cm-hot__likes" aria-label={`${article.articleLikes ?? 0} likes`}>
										<FavoriteRoundedIcon aria-hidden />
										{article.articleLikes ?? 0}
									</span>
								</li>
							))}
						</ol>
					</div>
				</section>
			)}
		</div>
	);
};

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'ASC',
		search: {
			articleCategory: 'FREE',
		},
	},
};

export default withLayoutCatalog(Community);
