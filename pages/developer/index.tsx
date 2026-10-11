import React, { ChangeEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import { Button, Pagination } from '@mui/material';
import { Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import DeveloperRow, { developerHref, developerImage } from '../../libs/components/developer/DeveloperRow';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Member } from '../../libs/types/member/member';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_AGENTS } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { MemberType } from '../../libs/enums/member.enum';
import { memberTypeLabel } from '../../libs/utils';
import { MOTION_QUERY, SCENE_QUERY, pad } from '../../libs/components/homepage/homeMotion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** Labels for the sorts the page already offers (ids match sortingHandler) **/
const sortOptions = [
	{ id: 'recent', label: 'Recent', sort: 'createdAt', direction: 'DESC' },
	{ id: 'old', label: 'Oldest', sort: 'createdAt', direction: 'ASC' },
	{ id: 'likes', label: 'Likes', sort: 'memberLikes', direction: 'DESC' },
	{ id: 'views', label: 'Views', sort: 'memberViews', direction: 'DESC' },
];

/** A malformed or hand-edited ?input= falls back to the defaults instead of crashing the page **/
const parseInput = (raw: string | string[] | undefined, fallback: any) => {
	if (typeof raw !== 'string') return fallback;
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
	} catch (err: any) {
		return fallback;
	}
};

const AgentList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const [filterSortName, setFilterSortName] = useState('Recent');
	const [sortingOpen, setSortingOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [searchFilter, setSearchFilter] = useState<any>(parseInput(router?.query?.input, initialInput));
	const [agents, setAgents] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchText, setSearchText] = useState<string>('');
	const [selected, setSelected] = useState<number>(0);
	const rootRef = useRef<HTMLDivElement>(null);

	/** APOLLO REQUESTS **/
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	const {
		loading: getAgentsLoading,
		data: getAgentsData,
		error: getAgentsError,
		refetch: getAgentsRefetch,
	} = useQuery(GET_AGENTS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgents(data?.getAgents?.list);
			setTotal(data?.getAgents?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) {
			const input_obj = parseInput(router?.query?.input, initialInput);
			setSearchFilter(input_obj);
		} else
			router.replace(`/developer?input=${JSON.stringify(searchFilter)}`, `/developer?input=${JSON.stringify(searchFilter)}`);

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
	}, [router]);

	/** HANDLERS **/
	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = (e: React.MouseEvent<HTMLLIElement>) => {
		switch (e.currentTarget.id) {
			case 'recent':
				setSearchFilter({ ...searchFilter, sort: 'createdAt', direction: 'DESC' });
				setFilterSortName('Recent');
				break;
			case 'old':
				setSearchFilter({ ...searchFilter, sort: 'createdAt', direction: 'ASC' });
				setFilterSortName('Oldest order');
				break;
			case 'likes':
				setSearchFilter({ ...searchFilter, sort: 'memberLikes', direction: 'DESC' });
				setFilterSortName('Likes');
				break;
			case 'views':
				setSearchFilter({ ...searchFilter, sort: 'memberViews', direction: 'DESC' });
				setFilterSortName('Views');
				break;
		}
		setSortingOpen(false);
		setAnchorEl2(null);
	};

	const paginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		await router.push(`/developer?input=${JSON.stringify(searchFilter)}`, `/developer?input=${JSON.stringify(searchFilter)}`, {
			scroll: false,
		});
		setCurrentPage(value);
	};

	const likeMemberHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetMember({ variables: { input: id } });
			await getAgentsRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeMemberHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	/** Same update the Enter key makes; the console's button and Clear reuse it **/
	const applySearchText = (text: string) => {
		setSearchFilter({
			...searchFilter,
			search: { ...searchFilter.search, text },
		});
	};

	/** PRESENTATION **/
	const list: Member[] = agents ?? [];
	const chosen = list[Math.min(selected, list.length - 1)];
	const sortLabel =
		sortOptions.find((option) => option.sort === searchFilter?.sort && option.direction === (searchFilter?.direction ?? 'DESC'))
			?.label ?? filterSortName;
	const pageCount = Math.ceil(total / searchFilter.limit);
	const firstShown = total ? (currentPage - 1) * searchFilter.limit + 1 : 0;
	const lastShown = Math.min(currentPage * searchFilter.limit, total);
	const activeText = searchFilter?.search?.text ?? '';
	const lineup = list.slice(0, 5);
	const isDeveloper = user?.memberType === MemberType.AGENT;

	// Keep the selection inside the current page
	useEffect(() => {
		setSelected(0);
	}, [list.length, currentPage, searchFilter?.sort, searchFilter?.direction, activeText]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: headline lines rise out of their masks
			gsap.from(root.querySelectorAll('.gv-dv-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
			const hero = root.querySelector('.gv-dv-hero');
			gsap.to(root.querySelector('.gv-dv-hero .gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
		});
		return () => mm.revert();
	}, []);

	// Lineup slivers fan apart as the hero scrolls away (scene sizes only)
	useEffect(() => {
		const root = rootRef.current;
		if (!root || lineup.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			root.querySelectorAll<HTMLElement>('.gv-dv-hero__sliver').forEach((sliver, index) => {
				gsap.to(sliver, {
					yPercent: index % 2 === 0 ? -10 : 8,
					ease: 'none',
					scrollTrigger: { trigger: root.querySelector('.gv-dv-hero'), start: 'top top', end: 'bottom top', scrub: 0.6 },
				});
			});
		});
		ScrollTrigger.refresh();
		return () => mm.revert();
	}, [lineup.length]);

	return (
		<div className="gv-catalog gv-dv" ref={rootRef}>
			<Head>
				<title>Developers | Gameverse</title>
			</Head>

			{/** 00 TITLE — night, duotone atmosphere and a lineup of the developers on this page **/}
			<section className="gv-dv-hero" aria-labelledby="developers-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					{list[0] ? (
						<img key={list[0]._id} src={developerImage(list[0])} alt="" decoding="async" />
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

				<div className="gv-dv-hero__inner">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>00</span>Studio roster
					</p>
					<h1 className="gv-dv-hero__title" id="developers-title">
						<span className="gv-dv-hero__line">
							<span className="gv-dv-hero__mask">
								<span className="gv-dv-hero__word">The</span>
							</span>
						</span>
						<span className="gv-dv-hero__line gv-dv-hero__line--2">
							<span className="gv-dv-hero__mask">
								<span className="gv-dv-hero__word">Developers.</span>
							</span>
						</span>
					</h1>
					<p className="gv-dv-hero__lead">
						The people behind the catalog. Every developer lists and maintains their own games — open a profile to see what
						they ship.
					</p>
					<p className="gv-dv-hero__readout">
						<span>
							{getAgentsLoading && !list.length ? 'Loading developers' : `${total} developer${total === 1 ? '' : 's'}`}
						</span>
						{activeText && <span>Matching “{activeText}”</span>}
						<span>Sorted by {sortLabel}</span>
					</p>
				</div>

				{lineup.length > 0 && (
					<ul className={`gv-dv-hero__lineup has-${lineup.length}`} aria-hidden>
						{lineup.map((developer: Member) => (
							<li className="gv-dv-hero__sliver" key={developer._id}>
								<img src={developerImage(developer)} alt="" decoding="async" />
								<span>{developer.memberNick}</span>
							</li>
						))}
					</ul>
				)}

				<form
					className="gv-dv-hero__console gv-cat-search"
					role="search"
					onSubmit={(event) => {
						event.preventDefault();
						applySearchText(searchText);
					}}
				>
					<label className="gv-cat-search__prompt" htmlFor="developer-search">
						Find a developer
					</label>
					<input
						id="developer-search"
						className="gv-dv-search__input"
						type="text"
						placeholder={'Search for a developer'}
						value={searchText}
						onChange={(e: any) => setSearchText(e.target.value)}
						onKeyDown={(event: any) => {
							if (event.key == 'Enter') {
								event.preventDefault();
								setSearchFilter({
									...searchFilter,
									search: { ...searchFilter.search, text: searchText },
								});
							}
						}}
					/>
					<button type="submit" className="gv-cat-search__go" aria-label="Search developers">
						<SearchRoundedIcon aria-hidden />
					</button>
				</form>
			</section>

			{/** 01 ROSTER — paper: giant name rows with a sticky selection panel **/}
			<section className="gv-dv-roster" aria-labelledby="roster-title">
				<div className="gv-dv-roster__inner">
					<header className="gv-dv-roster__head">
						<div>
							<p className="gv-chapter" aria-hidden>
								<span>01</span>Character select
							</p>
							<h2 className="gv-dv-roster__title" id="roster-title">
								{total} developer{total === 1 ? '' : 's'}
							</h2>
							<p className="gv-dv-roster__range">
								{total ? `Showing ${firstShown}–${lastShown} of ${total}` : 'Nothing to show yet'}
							</p>
						</div>
						<div className="gv-cat-sort">
							<span className="gv-cat-sort__label" id="developer-sort-label">
								Sort by
							</span>
							<Button
								className="gv-cat-sort__button"
								aria-describedby="developer-sort-label"
								onClick={sortingClickHandler}
								endIcon={<KeyboardArrowDownRoundedIcon />}
							>
								{sortLabel}
							</Button>
							<Menu
								anchorEl={anchorEl}
								open={sortingOpen}
								onClose={sortingCloseHandler}
								className="gv-cat-sort__menu"
								sx={{ paddingTop: '5px' }}
							>
								{sortOptions.map((option) => (
									<MenuItem onClick={sortingHandler} id={option.id} key={option.id} disableRipple>
										{option.label}
									</MenuItem>
								))}
							</Menu>
						</div>
					</header>

					{list.length === 0 ? (
						<div className="gv-cat-empty">
							<p className="gv-cat-empty__title">
								{getAgentsLoading ? 'Loading developers…' : 'No developers found.'}
							</p>
							{!getAgentsLoading && activeText && (
								<button
									type="button"
									className="gv-cat-empty__reset"
									onClick={() => {
										setSearchText('');
										applySearchText('');
									}}
								>
									Clear search
								</button>
							)}
						</div>
					) : (
						<div className="gv-dv-roster__stage">
							<ol className="gv-dv-roster__list" aria-label="Developers">
								{list.map((developer: Member, index: number) => (
									<li key={developer._id}>
										<DeveloperRow
											developer={developer}
											position={firstShown + index}
											active={index === selected}
											onSelect={() => setSelected(index)}
											likeMemberHandler={likeMemberHandler}
										/>
									</li>
								))}
							</ol>

							{chosen && (
								<aside className="gv-dv-panel" aria-label="Selected developer">
									<div className="gv-dv-panel__portrait" aria-hidden>
										{list.map((developer: Member, index: number) => (
											<img
												key={developer._id}
												src={developerImage(developer)}
												alt=""
												loading="lazy"
												decoding="async"
												className={index === selected ? 'is-active' : ''}
											/>
										))}
										<span className="gv-dv-panel__tag">Selected / {pad(firstShown + selected)}</span>
									</div>
									<div className="gv-dv-panel__body" aria-live="polite">
										<p className="gv-dv-panel__name">{chosen.memberFullName ?? chosen.memberNick}</p>
										<p className="gv-dv-panel__role">{memberTypeLabel(chosen.memberType)}</p>
										{chosen.memberDesc && <p className="gv-dv-panel__desc">{chosen.memberDesc}</p>}
										<dl className="gv-dv-panel__stats">
											<div>
												<dt>Games</dt>
												<dd>{chosen.memberGames ?? 0}</dd>
											</div>
											<div>
												<dt>Likes</dt>
												<dd>{chosen.memberLikes ?? 0}</dd>
											</div>
											<div>
												<dt>Views</dt>
												<dd>{chosen.memberViews ?? 0}</dd>
											</div>
										</dl>
										<div className="gv-dv-panel__actions">
											<Link href={developerHref(chosen)} className="gv-dv-cta">
												View profile
											</Link>
											<button
												type="button"
												className={`gv-dv-like gv-dv-like--line ${chosen.meLiked?.[0]?.myFavorite ? 'is-liked' : ''}`}
												aria-pressed={Boolean(chosen.meLiked?.[0]?.myFavorite)}
												aria-label={`${chosen.meLiked?.[0]?.myFavorite ? 'Unlike' : 'Like'} ${
													chosen.memberNick
												}, ${chosen.memberLikes ?? 0} likes`}
												onClick={() => likeMemberHandler(user, chosen._id)}
											>
												{chosen.meLiked?.[0]?.myFavorite ? (
													<FavoriteRoundedIcon aria-hidden />
												) : (
													<FavoriteBorderRoundedIcon aria-hidden />
												)}
												{chosen.memberLikes ?? 0}
											</button>
										</div>
									</div>
								</aside>
							)}
						</div>
					)}

					{list.length !== 0 && (
						<nav className="gv-cat-pagination" aria-label="Pages">
							{pageCount > 1 ? (
								<Pagination page={currentPage} count={pageCount} onChange={paginationChangeHandler} shape="rounded" />
							) : (
								<span />
							)}
							<p className="gv-cat-pagination__total">
								Total {total} developer{total > 1 ? 's' : ''} available
							</p>
						</nav>
					)}
				</div>
			</section>

			{/** 02 JOIN — signal: how to become a developer (real flows only) **/}
			{(!user?._id || isDeveloper) && (
				<section className="gv-dv-join" aria-labelledby="join-title">
					<div className="gv-dv-join__inner">
						<p className="gv-chapter" aria-hidden>
							<span>02</span>Insert coin
						</p>
						<h2 className="gv-dv-join__title" id="join-title">
							<span className="gv-dv-join__line">{isDeveloper ? 'Ship your' : 'List your'}</span>
							<span className="gv-dv-join__line gv-dv-join__line--2">next game.</span>
						</h2>
						<div className="gv-dv-join__side">
							<p className="gv-dv-join__desc">
								{isDeveloper
									? 'Add a game from My Page: details, platforms, genres, pricing and images. It appears in the catalog right away.'
									: 'Create an account as a Developer to list games for free, collect likes and views, and build followers.'}
							</p>
							{isDeveloper ? (
								<Link href={{ pathname: '/mypage', query: { category: 'addGame' } }} className="gv-dv-ink-cta">
									Add a game
								</Link>
							) : (
								<Link href="/account/join" className="gv-dv-ink-cta">
									Create an account
								</Link>
							)}
						</div>
					</div>
				</section>
			)}
		</div>
	);
};

AgentList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutCatalog(AgentList);
