import React, { ChangeEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import { Button, Menu, MenuItem, Pagination } from '@mui/material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CatalogCard from '../../libs/components/game/CatalogCard';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import { MOTION_QUERY, gameCover } from '../../libs/components/homepage/homeMotion';
import Filter from '../../libs/components/game/Filter';
import { useRouter } from 'next/router';
import { GameSearch, GamesInquiry } from '../../libs/types/game/game.input';
import { Game } from '../../libs/types/game/game';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Direction, Message } from '../../libs/enums/common.enum';
import { useMutation, useQuery } from '@apollo/client';
import { GET_GAMES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_GAME } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { gameSortOptions } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const searchKeys: (keyof GameSearch)[] = [
	'memberId',
	'typeList',
	'platformList',
	'genreList',
	'modeList',
	'pricesRange',
	'releaseDateRange',
	'isFeatured',
	'text',
];

/** Drops unknown keys so stale URLs (e.g. legacy /property links) never reach the API **/
const parseInput = (raw: string | string[] | undefined, fallback: GamesInquiry): GamesInquiry => {
	if (typeof raw !== 'string') return fallback;
	try {
		const parsed = JSON.parse(raw);
		const search: GameSearch = {};
		searchKeys.forEach((key: keyof GameSearch) => {
			if (parsed?.search?.[key] !== undefined) (search as T)[key] = parsed.search[key];
		});
		const sortOption = gameSortOptions.find((option) => option.sort === parsed?.sort);
		return {
			page: Number(parsed?.page) > 0 ? Number(parsed.page) : fallback.page,
			limit: Number(parsed?.limit) > 0 ? Number(parsed.limit) : fallback.limit,
			sort: sortOption ? parsed.sort : fallback.sort,
			direction: parsed?.direction === Direction.ASC ? Direction.ASC : Direction.DESC,
			search,
		};
	} catch (err: any) {
		return fallback;
	}
};

const GameList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchFilter, setSearchFilter] = useState<GamesInquiry>(parseInput(router?.query?.input, initialInput));
	const [games, setGames] = useState<Game[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [sortingOpen, setSortingOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	const filterSortName =
		gameSortOptions.find((option) => option.sort === searchFilter.sort && option.direction === searchFilter.direction)
			?.label ?? 'Newest';

	/** APOLLO REQUESTS **/
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);

	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setGames(data?.getGames?.list ?? []);
			setTotal(data?.getGames?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		const inputObj = parseInput(router?.query?.input, initialInput);
		if (router.query.input) setSearchFilter(inputObj);
		setCurrentPage(inputObj.page);
	}, [router]);

	/** HANDLERS **/
	const pushInput = async (input: GamesInquiry) => {
		await router.push(`/game?input=${JSON.stringify(input)}`, `/game?input=${JSON.stringify(input)}`, {
			scroll: false,
		});
	};

	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
		await pushInput({ ...searchFilter, page: value });
		setCurrentPage(value);
	};

	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = async (e: React.MouseEvent<HTMLLIElement>) => {
		const option = gameSortOptions.find((item) => item.id === e.currentTarget.id);
		setSortingOpen(false);
		setAnchorEl(null);
		if (option) await pushInput({ ...searchFilter, page: 1, sort: option.sort, direction: option.direction as Direction });
	};

	/** PRESENTATION **/
	const activeFilters = Object.values(searchFilter?.search ?? {}).filter(
		(value: any) => value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0),
	).length;
	const firstShown = total ? (currentPage - 1) * searchFilter.limit + 1 : 0;
	const lastShown = Math.min(currentPage * searchFilter.limit, total);
	const showcase = games.filter((game: Game) => game?.gameImages?.length).slice(0, 3);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: headline lines rise out of their masks
			gsap.from(root.querySelectorAll('.gv-cat-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
			// The atmosphere drifts slowly as the hero scrolls away
			gsap.to(root.querySelector('.gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: root.querySelector('.gv-cat-hero'), start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
		});

		return () => mm.revert();
	}, []);

	return (
		<div className="gv-catalog" ref={rootRef}>
			<section className="gv-cat-hero" aria-labelledby="catalog-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					{showcase[0] ? (
						<img key={showcase[0]._id} src={gameCover(showcase[0])} alt="" decoding="async" />
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

				<div className="gv-cat-hero__inner">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>00</span>Catalog
					</p>
					<h1 className="gv-cat-hero__title" id="catalog-title">
						<span className="gv-cat-hero__line">
							<span className="gv-cat-hero__mask">
								<span className="gv-cat-hero__word">All</span>
							</span>
						</span>
						<span className="gv-cat-hero__line gv-cat-hero__line--2">
							<span className="gv-cat-hero__mask">
								<span className="gv-cat-hero__word">games.</span>
							</span>
						</span>
					</h1>
					<p className="gv-cat-hero__lead">
						Filter by platform, genre, mode and price, sort the results, and open any game for the full details.
					</p>
					<p className="gv-cat-hero__readout">
						<span>{getGamesLoading && !games.length ? 'Loading games' : `${total} game${total === 1 ? '' : 's'} found`}</span>
						<span>
							{activeFilters} filter{activeFilters === 1 ? '' : 's'} active
						</span>
						<span>Sorted by {filterSortName}</span>
					</p>
				</div>

				{showcase.length > 0 && (
					<div className={`gv-cat-hero__stack has-${showcase.length}`} aria-hidden>
						{showcase.map((game: Game) => (
							<span className="gv-cat-hero__plate" key={game._id}>
								<img src={gameCover(game)} alt="" decoding="async" />
							</span>
						))}
					</div>
				)}

				<div className="gv-cat-hero__console">
					<Filter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} part="search" />
				</div>
			</section>

			<section className="gv-cat-results" aria-labelledby="results-title">
				<div className="gv-cat-results__inner">
					<aside className="gv-cat-results__filters" aria-label="Filters">
						<details className="gv-cat-results__drawer" open={device !== 'mobile'}>
							<summary className="gv-cat-results__summary">
								Filters{activeFilters > 0 && <span className="gv-cat-results__count">{activeFilters}</span>}
							</summary>
							<Filter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} part="panel" />
						</details>
					</aside>

					<div className="gv-cat-results__main">
						<header className="gv-cat-results__head">
							<div>
								<p className="gv-chapter" aria-hidden>
									<span>01</span>Results
								</p>
								<h2 className="gv-cat-results__title" id="results-title">
									{total} game{total === 1 ? '' : 's'}
								</h2>
								<p className="gv-cat-results__range">
									{total ? `Showing ${firstShown}–${lastShown} of ${total}` : 'Nothing to show yet'}
								</p>
							</div>
							<div className="gv-cat-sort">
								<span className="gv-cat-sort__label" id="sort-label">
									Sort by
								</span>
								<Button
									className="gv-cat-sort__button"
									aria-describedby="sort-label"
									onClick={sortingClickHandler}
									endIcon={<KeyboardArrowDownRoundedIcon />}
								>
									{filterSortName}
								</Button>
								<Menu
									anchorEl={anchorEl}
									open={sortingOpen}
									onClose={sortingCloseHandler}
									className="gv-cat-sort__menu"
									sx={{ paddingTop: '5px' }}
								>
									{gameSortOptions.map((option) => (
										<MenuItem onClick={sortingHandler} id={option.id} key={option.id} disableRipple>
											{option.label}
										</MenuItem>
									))}
								</Menu>
							</div>
						</header>

						{games?.length === 0 ? (
							<div className="gv-cat-empty">
								<p className="gv-cat-empty__title">{getGamesLoading ? 'Loading games…' : 'No games match these filters.'}</p>
								{!getGamesLoading && (
									<button type="button" className="gv-cat-empty__reset" onClick={() => pushInput(initialInput)}>
										Reset all filters
									</button>
								)}
							</div>
						) : (
							<ul className="gv-cat-grid" aria-label="Games">
								{games.map((game: Game, index: number) => {
									const feature = index === 0 && currentPage === 1 && games.length >= 3;
									return (
										<li className={feature ? 'is-feature' : ''} key={game?._id}>
											<CatalogCard game={game} likeGameHandler={likeGameHandler} feature={feature} />
										</li>
									);
								})}
							</ul>
						)}

						{games.length !== 0 && (
							<nav className="gv-cat-pagination" aria-label="Pages">
								<Pagination
									page={currentPage}
									count={Math.ceil(total / searchFilter.limit)}
									onChange={handlePaginationChange}
									shape="rounded"
								/>
								<p className="gv-cat-pagination__total">
									Total {total} game{total > 1 ? 's' : ''} available
								</p>
							</nav>
						)}
					</div>
				</div>
			</section>
		</div>
	);
};

GameList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutCatalog(GameList);
