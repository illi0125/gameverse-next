import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import moment from 'moment';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import CatalogCard from '../../libs/components/game/CatalogCard';
import ReviewCard from '../../libs/components/agent/ReviewCard';
import { Pagination } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_QUERY, SCENE_QUERY } from '../../libs/components/homepage/homeMotion';
import { Game } from '../../libs/types/game/game';
import { Member } from '../../libs/types/member/member';
import { sweetErrorHandling } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { GamesInquiry } from '../../libs/types/game/game.input';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_COMMENT, LIKE_TARGET_GAME } from '../../apollo/user/mutation';
import { GET_COMMENTS, GET_MEMBER, GET_GAMES } from '../../apollo/user/query';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';
import { memberTypeLabel } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const AgentDetail: NextPage = ({ initialInput, initialComment, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [agentId, setAgentId] = useState<string | null>(null);
	const [agent, setAgent] = useState<Member | null>(null);
	const [searchFilter, setSearchFilter] = useState<GamesInquiry>(initialInput);
	const [agentGames, setAgentGames] = useState<Game[]>([]);
	const [gameTotal, setGameTotal] = useState<number>(0);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [agentComments, setAgentComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.MEMBER,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [createComment] = useMutation(CREATE_COMMENT);
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);


	const {
		loading: getMemberLoading,
		data: getMemberData,
		error: getMemberError,
		refetch: getMemberRefetch,
	} = useQuery(GET_MEMBER, {
		fetchPolicy: "network-only",
		variables: { input: agentId },
		skip: !agentId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgent(data?.getMember);
			setSearchFilter({
				...searchFilter,
				search: {
					memberId: data?.getMember?._id,
				},
			});
			setCommentInquiry({
				...commentInquiry,
				search: {
					commentGroup: CommentGroup.MEMBER,
					commentRefId: data?.getMember?._id,
				},
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: data?.getMember?._id,
			});
		},
	});

	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !searchFilter.search.memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgentGames(data?.getGames?.list ?? []);
			setGameTotal(data?.getGames?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		variables: { input: commentInquiry },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgentComments(data?.getComments?.list);
			setCommentTotal(data?.getComments?.metaCounter[0]?.total ?? 0);
		},
	});



	/** LIFECYCLES **/
	useEffect(() => {
		// developerId is current; agentId keeps legacy /agent/detail links working
		const id = router.query.developerId ?? router.query.agentId;
		if (id) setAgentId(id as string);
	}, [router]);

	useEffect(() => {
		if (searchFilter.search.memberId) {
			getGamesRefetch({ input: searchFilter }).then();
		}
	}, [searchFilter]);

	useEffect(() => {
		if (commentInquiry.search.commentRefId) {
			getCommentsRefetch({ variables: { input: commentInquiry } }).then();
		}
	}, [commentInquiry]);

	/** HANDLERS **/
	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};


	const gamePaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		setSearchFilter({ ...searchFilter });
	};


	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		commentInquiry.page = value;
		setCommentInquiry({ ...commentInquiry });
	};

	const createCommentHandler = async () => {
		try {
			if (!user._id) throw new Error(Messages.error2);
			if (user._id === agentId) throw new Error('You can not write review for yourself!');
			await createComment({
				variables: {
					input: insertCommentData,
				},
			});
			setInsertCommentData({ ...insertCommentData, commentContent: "" });

			await getCommentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};


	const likeGameHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetGame({
				variables: {
					input: id,
				},
			});

			await getGamesRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};


	/** PRESENTATION **/
	const rootRef = useRef<HTMLDivElement>(null);
	const name = agent?.memberFullName ?? agent?.memberNick ?? '';
	const nameChars = Math.max(name.length, 4);
	const portrait = agent?.memberImage ? `${REACT_APP_API_URL}/${agent.memberImage}` : '/img/profile/defaultUser.svg';
	const gamePages = Math.ceil(gameTotal / searchFilter.limit) || 1;
	const firstGame = gameTotal ? (searchFilter.page - 1) * searchFilter.limit + 1 : 0;
	const lastGame = Math.min(searchFilter.page * searchFilter.limit, gameTotal);
	const readout = [
		{ label: 'Games', value: agent?.memberGames },
		{ label: 'Followers', value: agent?.memberFollowers },
		{ label: 'Following', value: agent?.memberFollowings },
		{ label: 'Likes', value: agent?.memberLikes },
		{ label: 'Views', value: agent?.memberViews },
		{ label: 'Articles', value: agent?.memberArticles },
	];

	const jumpTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		const target = document.getElementById(id);
		if (!target) return;
		event.preventDefault();
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: reduceMotion ? 'auto' : 'smooth' });
	};

	// Scroll motion for the loaded developer; re-runs when another profile opens on the same page
	useEffect(() => {
		const root = rootRef.current;
		if (!root || !agent?._id) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: the name rises out of its mask
			gsap.from(root.querySelectorAll('.gv-dd-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				stagger: 0.08,
				delay: 0.1,
			});
			const hero = root.querySelector('.gv-dd-hero');
			gsap.to(root.querySelector('.gv-dd-hero .gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
			gsap.to(root.querySelector('.gv-dd-hero__portrait'), {
				yPercent: -10,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
			});
		});

		ScrollTrigger.refresh();
		return () => mm.revert();
	}, [agent?._id]);

	// Library cards tilt in and level out as they cross the viewport
	useEffect(() => {
		const root = rootRef.current;
		if (!root || agentGames.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			root.querySelectorAll<HTMLElement>('.gv-dd-library .gv-cat-grid > li').forEach((item, index) => {
				gsap.fromTo(
					item,
					{ rotation: index % 2 === 0 ? -5 : 5, yPercent: 12, scale: 0.94 },
					{
						rotation: 0,
						yPercent: 0,
						scale: 1,
						ease: 'none',
						scrollTrigger: { trigger: item, start: 'top bottom', end: 'top 64%', scrub: 0.6 },
					},
				);
			});
		});

		ScrollTrigger.refresh();
		return () => mm.revert();
	}, [agentGames.length, searchFilter.page]);

	if (!agent) {
		const loading = !getMemberError && (getMemberLoading || !agentId);
		return (
			<div className="gv-catalog gv-gd gv-dd" ref={rootRef}>
				<Head>
					<title>{loading ? 'Developer | Gameverse' : 'Developer not found | Gameverse'}</title>
				</Head>
				<section className="gv-gd-state" aria-live="polite">
					<div className="gv-cat-hero__grid" aria-hidden>
						<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
						<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
						<span className="gv-cat-hero__mark" />
					</div>
					<div className="gv-gd-state__inner">
						<p className="gv-chapter gv-chapter--dark" aria-hidden>
							<span>00</span>Developer
						</p>
						{loading ? (
							<p className="gv-gd-state__readout">Loading developer…</p>
						) : (
							<>
								<h1 className="gv-gd-state__title">Developer not found.</h1>
								<p className="gv-gd-state__lead">The profile may have been removed or the link is incomplete.</p>
								<Link href="/developer" className="gv-gd-cta gv-gd-cta--solid">
									All developers
								</Link>
							</>
						)}
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className="gv-catalog gv-gd gv-dd" ref={rootRef}>
			<Head>
				<title>{`${name} | Gameverse`}</title>
			</Head>

			{/** 00 PROFILE — night, duotone of the portrait, giant name, live readout **/}
			<section className="gv-dd-hero" aria-labelledby="developer-name">
				<div className="gv-cat-hero__atmos" aria-hidden>
					<img key={agent._id} src={portrait} alt="" decoding="async" />
					<span className="gv-cat-hero__tint" />
					<span className="gv-cat-hero__grain" />
				</div>
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>

				<div className="gv-dd-hero__inner">
					<div className="gv-dd-hero__copy">
						<nav className="gv-gd-hero__crumbs" aria-label="Breadcrumb">
							<Link href="/developer">All developers</Link>
							<span aria-hidden>/</span>
							<span>{agent.memberNick}</span>
						</nav>

						<div className="gv-gd-hero__flags">
							<span className="gv-gd-flag">{memberTypeLabel(agent.memberType)}</span>
							<span className="gv-gd-flag gv-gd-flag--line">Joined {moment(agent.createdAt).format('MMM YYYY')}</span>
						</div>

						<h1
							className="gv-dd-hero__name"
							id="developer-name"
							style={{ '--dd-chars': nameChars } as React.CSSProperties}
						>
							<span className="gv-dd-hero__mask">
								<span className="gv-dd-hero__word">{name}</span>
							</span>
						</h1>

						{(agent.memberAddress || agent.memberPhone) && (
							<p className="gv-gd-hero__credits">
								{agent.memberAddress && <span>{agent.memberAddress}</span>}
								{agent.memberPhone && <span>{agent.memberPhone}</span>}
							</p>
						)}

						{agent.memberDesc && <p className="gv-gd-hero__lead">{agent.memberDesc}</p>}

						<div className="gv-gd-hero__actions">
							<button
								type="button"
								className="gv-gd-cta gv-gd-cta--solid"
								onClick={() => redirectToMemberPageHandler(agent?._id as string)}
							>
								Full profile
							</button>
							<a href="#library" className="gv-gd-like" onClick={(event) => jumpTo(event, 'library')}>
								{gameTotal} game{gameTotal === 1 ? '' : 's'}
								<EastIcon aria-hidden />
							</a>
						</div>

						<dl className="gv-gd-hero__readout">
							{readout.map((item) => (
								<div key={item.label}>
									<dt>{item.label}</dt>
									<dd>{item.value ?? 0}</dd>
								</div>
							))}
						</dl>
					</div>

					<div className="gv-dd-hero__portrait" aria-hidden>
						<img src={portrait} alt="" decoding="async" />
						<span className="gv-dd-hero__tag">{agent.memberNick}</span>
					</div>
				</div>
			</section>

			{/** 01 LIBRARY — paper: the developer's games as catalog cards **/}
			<section className="gv-dd-library" id="library" aria-labelledby="library-title">
				<div className="gv-dd-library__inner">
					<header className="gv-dd-library__head">
						<div>
							<p className="gv-chapter" aria-hidden>
								<span>01</span>Library
							</p>
							<h2 className="gv-dd-library__title" id="library-title">
								<span className="gv-dd-library__line">Games by</span>
								<span className="gv-dd-library__line gv-dd-library__line--2">{agent.memberNick}</span>
							</h2>
						</div>
						<p className="gv-dd-library__range">
							{gameTotal ? `Showing ${firstGame}–${lastGame} of ${gameTotal}` : 'Nothing listed yet'}
						</p>
					</header>

					{gameTotal ? (
						<>
							<ul className="gv-cat-grid" aria-label={`Games by ${agent.memberNick}`}>
								{agentGames?.map((game: Game, index: number) => {
									const feature = index === 0 && searchFilter.page === 1 && agentGames.length >= 3;
									return (
										<li className={feature ? 'is-feature' : ''} key={game?._id}>
											<CatalogCard game={game} likeGameHandler={likeGameHandler} feature={feature} />
										</li>
									);
								})}
							</ul>
							<nav className="gv-cat-pagination" aria-label="Game pages">
								{gamePages > 1 ? (
									<Pagination
										page={searchFilter.page}
										count={gamePages}
										onChange={gamePaginationChangeHandler}
										shape="rounded"
									/>
								) : (
									<span />
								)}
								<p className="gv-cat-pagination__total">
									Total {gameTotal} game{gameTotal > 1 ? 's' : ''} available
								</p>
							</nav>
						</>
					) : (
						<div className="gv-cat-empty">
							<p className="gv-cat-empty__title">{getGamesLoading ? 'Loading games…' : 'No games found.'}</p>
							<Link href="/game" className="gv-cat-empty__reset">
								Browse all games
							</Link>
						</div>
					)}
				</div>
			</section>

			{/** 02 REVIEWS — ultraviolet: review log and the review form **/}
			<section className="gv-gd-comms gv-dd-reviews" id="reviews" aria-labelledby="reviews-title">
				<div className="gv-gd-comms__inner">
					<header className="gv-gd-comms__head">
						<p className="gv-chapter" aria-hidden>
							<span>02</span>Reviews
						</p>
						<h2 className="gv-gd-comms__title" id="reviews-title">
							Reviews
						</h2>
						<p className="gv-gd-comms__count">
							{commentTotal} review{commentTotal === 1 ? '' : 's'}
						</p>
					</header>

					<div className="gv-gd-comms__body">
						<div className="gv-gd-comms__log">
							{commentTotal !== 0 ? (
								<>
									<ol className="gv-gd-log">
										{agentComments?.map((comment: Comment) => {
											return <ReviewCard comment={comment} key={comment?._id} />;
										})}
									</ol>
									{Math.ceil(commentTotal / commentInquiry.limit) > 1 && (
										<nav className="gv-cat-pagination" aria-label="Review pages">
											<Pagination
												page={commentInquiry.page}
												count={Math.ceil(commentTotal / commentInquiry.limit) || 1}
												onChange={commentPaginationChangeHandler}
												shape="rounded"
											/>
										</nav>
									)}
								</>
							) : (
								<p className="gv-gd-comms__empty">No reviews yet. Be the first to leave one.</p>
							)}
						</div>

						<form
							className="gv-gd-form"
							onSubmit={(event) => {
								event.preventDefault();
								if (!(insertCommentData.commentContent === '' || user?._id === '')) createCommentHandler();
							}}
						>
							<label className="gv-gd-form__label" htmlFor="developer-review">
								Leave a review
							</label>
							<textarea
								id="developer-review"
								className="gv-gd-form__input"
								placeholder={user?._id ? `What is it like to play ${agent.memberNick}'s games?` : 'Login to leave a review'}
								onChange={({ target: { value } }: any) => {
									setInsertCommentData({ ...insertCommentData, commentContent: value });
								}}
								value={insertCommentData.commentContent}
							></textarea>
							<div className="gv-gd-form__foot">
								{!user?._id && (
									<Link href="/account/join" className="gv-gd-form__login">
										Log in to review
									</Link>
								)}
								<button
									type="submit"
									className="gv-gd-ink-cta gv-gd-ink-cta--solid"
									disabled={insertCommentData.commentContent === '' || user?._id === ''}
								>
									Submit review
								</button>
							</div>
						</form>
					</div>
				</div>
			</section>
		</div>
	);
};

AgentDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		search: {
			memberId: '',
		},
	},
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'ASC',
		search: {
			commentGroup: 'MEMBER',
			commentRefId: '',
		},
	},
};

export default withLayoutCatalog(AgentDetail);
