import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import { Dialog, Pagination } from '@mui/material';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import Moment from 'react-moment';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GET_COMMENTS } from '../../apollo/admin/query';
import { userVar } from '../../apollo/store';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { GET_BOARD_ARTICLE, GET_BOARD_ARTICLES } from '../../apollo/user/query';
import withLayoutCatalog from '../../libs/components/layout/LayoutCatalog';
import {
	articleHref,
	articleImage,
	boardMeta,
	communityBoards,
	readingMinutes,
} from '../../libs/components/community/communityMeta';
import { MOTION_QUERY, SCENE_QUERY } from '../../libs/components/homepage/homeMotion';
import { Messages } from '../../libs/config';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import {
	sweetConfirmAlert,
	sweetMixinErrorAlert,
	sweetMixinSuccessAlert,
	sweetTopSmallSuccessAlert,
} from '../../libs/sweetAlert';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { Comment } from '../../libs/types/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { CommentUpdate } from '../../libs/types/comment/comment.update';
import { T } from '../../libs/types/common';
import { memberTypeLabel } from '../../libs/utils';
//@ts-ignore
const ToastViewerComponent = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CommunityDetail: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { query } = router;

	const articleId = query?.id as string;
	const articleCategory = query?.articleCategory as string;

	const [comment, setComment] = useState<string>('');
	const [wordsCnt, setWordsCnt] = useState<number>(0);
	const [updatedCommentWordsCnt, setUpdatedCommentWordsCnt] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useState<CommentsInquiry>({
		...initialInput,
	});
	const [memberImage, setMemberImage] = useState<string>('/img/community/articleImg.png');
	const [anchorEl, setAnchorEl] = useState<any | null>(null);
	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;
	const [openBackdrop, setOpenBackdrop] = useState<boolean>(false);
	const [updatedComment, setUpdatedComment] = useState<string>('');
	const [updatedCommentId, setUpdatedCommentId] = useState<string>('');
	const [likeLoading, setLikeLoading] = useState<boolean>(false);
	const [boardArticle, setBoardArticle] = useState<BoardArticle>();

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);

	const {
		loading: boardArticleLoading,
		data: boardArticleData,
		error: getBoardArticleError,
		refetch: boardArticleRefetch,
	} = useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: {
			input: articleId,
		},
		notifyOnNetworkStatusChange: true,
		onCompleted(data: any) {
			setBoardArticle(data?.getBoardArticle);
			if (data?.getBoardArticle?.memberData?.memberImage) {
				setMemberImage(`${process.env.REACT_APP_API_URL}/${data?.getBoardArticle?.memberData?.memberImage}`);
			}
		},
	});

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: searchFilter,
		},
		notifyOnNetworkStatusChange: true,
		onCompleted(data: any) {
			setComments(data?.getComments.list);
			setTotal(data?.getComments?.metaCounter?.[0]?.total || 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (articleId) setSearchFilter({ ...searchFilter, search: { commentGroup: CommentGroup.ARTICLE, commentRefId: articleId } });
	}, [articleId]);

	/** HANDLERS **/
	const tabChangeHandler = (event: React.SyntheticEvent, value: string) => {
		router.replace(
			{
				pathname: '/community',
				query: { articleCategory: value },
			},
			undefined,
			{ shallow: true },
		);
	};

	const likeBoardArticleHandler = async (user: any, id: any) => {
		try {
			if (likeLoading) return;
			if (!id) return;

			if (!user._id) throw new Error(Messages.error2);

			setLikeLoading(true);

			await likeTargetBoardArticle({
				variables: {
					input: id,
				},
			});

			await boardArticleRefetch({ input: articleId });
			await sweetTopSmallSuccessAlert('success!', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setLikeLoading(false);
		}
	};

	const creteCommentHandler = async () => {
		if (!comment) return;

		try {
			if (!user?._id) throw new Error(Messages.error2);
			const commentInput: CommentInput = {
				commentGroup: CommentGroup.ARTICLE,
				commentRefId: articleId,
				commentContent: comment,
			};

			await createComment({
				variables: {
					input: commentInput,
				},
			});

			await getCommentsRefetch({ input: searchFilter });
			await boardArticleRefetch({ input: articleId });
			setComment('');
			await sweetMixinSuccessAlert('Successfully commented!');
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	};

	const updateButtonHandler = async (commentId: string, commentStatus?: CommentStatus.DELETE) => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!commentId) throw new Error('Select a comment to update!');
			const comment = comments?.find((comment) => {
				if (comment?._id === commentId) return;
			})?.commentContent;

			if (updatedComment === comment) return;

			const updateData: CommentUpdate = {
				_id: commentId,
				...(commentStatus && { commentStatus: commentStatus }),
				...(updatedComment && { commentContent: updatedComment }),
			};

			if (!updateData?.commentContent && !updateData?.commentStatus) {
				throw new Error('Provide data to update your comment!');
			}

			if (commentStatus) {
				if (await sweetConfirmAlert('Do you want to delete the comment?')) {
					await updateComment({
						variables: {
							input: updateData,
						},
					});

					await sweetMixinSuccessAlert('Successfully deleted!');
				} else return;
			} else {
				await updateComment({
					variables: {
						input: updateData,
					},
				});

				await sweetMixinSuccessAlert('Successfully updated!');
			}

			await getCommentsRefetch({ input: searchFilter });
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setOpenBackdrop(false);
			setUpdatedComment('');
			setUpdatedCommentWordsCnt(0);
			setUpdatedCommentId('');
		}
	};

	const getCommentMemberImage = (imageUrl: string | undefined) => {
		if (imageUrl) return `${process.env.REACT_APP_API_URL}/${imageUrl}`;
		else return '/img/community/articleImg.png';
	};

	const goMemberPage = (id: any) => {
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};

	const cancelButtonHandler = () => {
		setOpenBackdrop(false);
		setUpdatedComment('');
		setUpdatedCommentWordsCnt(0);
	};

	const updateCommentInputHandler = (value: string) => {
		if (value.length > 100) return;
		setUpdatedCommentWordsCnt(value.length);
		setUpdatedComment(value);
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	/** PRESENTATION + UI-only extras (related posts, reading progress, copy link) **/
	/** Fallback when the Clipboard API is unavailable or blocked (older browsers, non-secure origins) **/
	const legacyCopy = (text: string) => {
		const field = document.createElement('textarea');
		field.value = text;
		field.setAttribute('readonly', '');
		field.style.position = 'fixed';
		field.style.opacity = '0';
		document.body.appendChild(field);
		field.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(field);
		if (!ok) throw new Error('copy failed');
	};
	const rootRef = useRef<HTMLDivElement>(null);
	const progressRef = useRef<HTMLSpanElement>(null);
	const [copied, setCopied] = useState<boolean>(false);

	const { data: relatedData } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		skip: !boardArticle?.articleCategory,
		variables: {
			input: { page: 1, limit: 4, sort: 'createdAt', direction: Direction.DESC, search: { articleCategory: boardArticle?.articleCategory } },
		},
	});
	const related: BoardArticle[] = (relatedData?.getBoardArticles?.list ?? [])
		.filter((item: BoardArticle) => item._id !== boardArticle?._id)
		.slice(0, 3);

	const board = boardMeta(boardArticle?.articleCategory ?? articleCategory);
	const author = boardArticle?.memberData;
	const isLiked = Boolean(boardArticle?.meLiked?.[0]?.myFavorite);
	const title = boardArticle?.articleTitle ?? '';
	const titleSize = title.length <= 16 ? 'is-short' : title.length <= 34 ? 'is-mid' : 'is-long';
	const minutes = readingMinutes(boardArticle?.articleContent);
	const commentPages = Math.ceil(total / searchFilter.limit) || 1;

	const copyLink = async () => {
		try {
			const url = window.location.href;
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url).catch(() => legacyCopy(url));
			} else legacyCopy(url);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch (err: any) {
			sweetMixinErrorAlert('Could not copy the link').then();
		}
	};

	const jumpTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		const target = document.getElementById(id);
		if (!target) return;
		event.preventDefault();
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 96, behavior: reduceMotion ? 'auto' : 'smooth' });
	};

	// Reading progress: how much of the article body has scrolled past (written to a CSS variable, no re-render)
	useEffect(() => {
		const body = rootRef.current?.querySelector<HTMLElement>('.gv-cd-article');
		const bar = progressRef.current;
		if (!body || !bar) return;
		let frame = 0;
		const update = () => {
			frame = 0;
			// Share of the article that has entered the viewport: 0 before it appears, 1 once its end is visible
			const rect = body.getBoundingClientRect();
			const value = rect.height > 0 ? Math.min(1, Math.max(0, (window.innerHeight - rect.top) / rect.height)) : 0;
			bar.style.setProperty('--gv-progress', String(value));
		};
		const onScroll = () => {
			if (!frame) frame = window.requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, [boardArticle?._id]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || !boardArticle?._id) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			// The page's single load moment: the title rises out of its mask
			gsap.from(root.querySelectorAll('.gv-cd-hero__word'), {
				yPercent: 110,
				duration: 0.9,
				ease: 'power4.out',
				delay: 0.1,
			});
			const hero = root.querySelector('.gv-cd-hero');
			gsap.to(root.querySelector('.gv-cd-hero .gv-cat-hero__atmos'), {
				scale: 1.12,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
			});
		});
		mm.add(SCENE_QUERY, () => {
			const plate = root.querySelector('.gv-cd-hero__plate');
			if (plate) {
				gsap.to(plate, {
					yPercent: -12,
					ease: 'none',
					scrollTrigger: { trigger: root.querySelector('.gv-cd-hero'), start: 'top top', end: 'bottom top', scrub: 0.6 },
				});
			}
		});
		ScrollTrigger.refresh();
		return () => mm.revert();
	}, [boardArticle?._id]);

	if (!boardArticle) {
		const unavailable = Boolean(articleId) && !boardArticleLoading && Boolean(getBoardArticleError);
		return (
			<div className="gv-catalog gv-gd gv-cd" ref={rootRef}>
				<Head>
					<title>{unavailable ? 'Post not available | Gameverse' : 'Community | Gameverse'}</title>
				</Head>
				<section className="gv-gd-state" aria-live="polite">
					<div className="gv-cat-hero__grid" aria-hidden>
						<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
						<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
						<span className="gv-cat-hero__mark" />
					</div>
					<div className="gv-gd-state__inner">
						<p className="gv-chapter gv-chapter--dark" aria-hidden>
							<span>00</span>Post
						</p>
						{unavailable ? (
							<>
								<h1 className="gv-gd-state__title">Post not available.</h1>
								<p className="gv-gd-state__lead">It may have been removed, or the link is incomplete.</p>
								<Link
									href={{ pathname: '/community', query: { articleCategory: board.value } }}
									className="gv-gd-cta gv-gd-cta--solid"
								>
									Back to {board.label}
								</Link>
							</>
						) : (
							<p className="gv-gd-state__readout">Loading post…</p>
						)}
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className="gv-catalog gv-gd gv-cd" ref={rootRef}>
			<Head>
				<title>{`${title} | Gameverse Community`}</title>
			</Head>

			<span className="gv-cd-progress" ref={progressRef} aria-hidden />

			{/** 00 POST — night, duotone of the post image, title, byline, actions **/}
			<section className="gv-cd-hero" aria-labelledby="post-title">
				<div className="gv-cat-hero__atmos" aria-hidden>
					<img key={boardArticle._id} src={articleImage(boardArticle)} alt="" decoding="async" />
					<span className="gv-cat-hero__tint" />
					<span className="gv-cat-hero__grain" />
				</div>
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>

				<div className="gv-cd-hero__inner">
					<div className="gv-cd-hero__copy">
						<nav className="gv-gd-hero__crumbs" aria-label="Breadcrumb">
							<Link href={{ pathname: '/community', query: { articleCategory: board.value } }}>Community</Link>
							<span aria-hidden>/</span>
							<Link href={{ pathname: '/community', query: { articleCategory: board.value } }}>{board.label}</Link>
						</nav>

						<div className="gv-gd-hero__flags">
							<span className="gv-gd-flag">{board.label}</span>
							<span className="gv-gd-flag gv-gd-flag--line">{minutes} min read</span>
						</div>

						<h1 className={`gv-cd-hero__title ${titleSize}`} id="post-title">
							<span className="gv-cd-hero__mask">
								<span className="gv-cd-hero__word">{title}</span>
							</span>
						</h1>

						<div className="gv-cd-byline">
							<span className="gv-cd-byline__avatar" aria-hidden>
								<img src={author ? memberImage : '/img/profile/defaultUser.svg'} alt="" />
							</span>
							<div className="gv-cd-byline__text">
								{author?._id ? (
									<button type="button" className="gv-cd-byline__name" onClick={() => goMemberPage(author._id)}>
										{author.memberNick}
									</button>
								) : (
									<span className="gv-cd-byline__name gv-cd-byline__name--gone">Deleted account</span>
								)}
								<span className="gv-cd-byline__meta">
									{author && <span>{memberTypeLabel(author.memberType)}</span>}
									<Moment format={'DD MMM YYYY, HH:mm'}>{boardArticle.createdAt}</Moment>
								</span>
							</div>
						</div>

						<div className="gv-gd-hero__actions">
							<button
								type="button"
								className={`gv-gd-like ${isLiked ? 'is-liked' : ''}`}
								aria-pressed={isLiked}
								aria-label={`${isLiked ? 'Unlike' : 'Like'} this post, ${boardArticle.articleLikes} likes`}
								disabled={likeLoading}
								onClick={() => likeBoardArticleHandler(user, boardArticle?._id)}
							>
								{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
								{boardArticle.articleLikes}
							</button>
							<a href="#comments" className="gv-gd-like" onClick={(event) => jumpTo(event, 'comments')}>
								<ChatBubbleOutlineRoundedIcon aria-hidden />
								{total} comment{total === 1 ? '' : 's'}
							</a>
							<button type="button" className="gv-gd-like" onClick={copyLink}>
								<LinkRoundedIcon aria-hidden />
								<span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
							</button>
						</div>

						<dl className="gv-gd-hero__readout">
							<div>
								<dt>Views</dt>
								<dd>{boardArticle.articleViews}</dd>
							</div>
							<div>
								<dt>Likes</dt>
								<dd>{boardArticle.articleLikes}</dd>
							</div>
							<div>
								<dt>Comments</dt>
								<dd>{total}</dd>
							</div>
							<div>
								<dt>Board</dt>
								<dd>{board.label}</dd>
							</div>
						</dl>
					</div>

					<div className="gv-cd-hero__plate" aria-hidden>
						<img src={articleImage(boardArticle)} alt="" decoding="async" />
					</div>
				</div>
			</section>

			{/** 01 READ — paper: long-form body, sticky action rail, board switcher **/}
			<section className="gv-cd-read" aria-label="Post">
				<div className="gv-cd-read__inner">
					<aside className="gv-cd-rail" aria-label="Post actions">
						<button
							type="button"
							className={`gv-cd-rail__btn ${isLiked ? 'is-liked' : ''}`}
							aria-pressed={isLiked}
							aria-label={`${isLiked ? 'Unlike' : 'Like'} this post, ${boardArticle.articleLikes} likes`}
							disabled={likeLoading}
							onClick={() => likeBoardArticleHandler(user, boardArticle?._id)}
						>
							{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
							<span>{boardArticle.articleLikes}</span>
						</button>
						<a
							href="#comments"
							className="gv-cd-rail__btn"
							aria-label={`Go to comments, ${total}`}
							onClick={(event) => jumpTo(event, 'comments')}
						>
							<ChatBubbleOutlineRoundedIcon aria-hidden />
							<span>{total}</span>
						</a>
						<button type="button" className="gv-cd-rail__btn" aria-label="Copy link to this post" onClick={copyLink}>
							<LinkRoundedIcon aria-hidden />
							<span>{copied ? 'Copied' : 'Link'}</span>
						</button>
					</aside>

					<article className="gv-cd-article">
						<p className="gv-chapter" aria-hidden>
							<span>01</span>Read
						</p>
						<div className="gv-cd-content">
							<ToastViewerComponent markdown={boardArticle?.articleContent} className={'ytb_play'} />
						</div>

						<div className="gv-cd-end">
							<p className="gv-cd-end__title">Enjoyed this post?</p>
							<button
								type="button"
								className={`gv-cd-end__like ${isLiked ? 'is-liked' : ''}`}
								aria-pressed={isLiked}
								aria-label={`${isLiked ? 'Unlike' : 'Like'} this post, ${boardArticle.articleLikes} likes`}
								disabled={likeLoading}
								onClick={() => likeBoardArticleHandler(user, boardArticle?._id)}
							>
								{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
								{isLiked ? 'Liked' : 'Like'} · {boardArticle.articleLikes}
							</button>
						</div>
					</article>

					<nav className="gv-cd-boards" aria-label="Boards">
						<p className="gv-cd-boards__title">Boards</p>
						<ul>
							{communityBoards.map((item) => (
								<li key={item.value}>
									<button
										type="button"
										className={`gv-cd-boards__item ${item.value === board.value ? 'is-current' : ''}`}
										aria-current={item.value === board.value ? 'true' : undefined}
										onClick={(event) => tabChangeHandler(event, item.value)}
									>
										{item.label}
									</button>
								</li>
							))}
						</ul>
						<button
							type="button"
							className="gv-cd-boards__write"
							onClick={() =>
								router.push({
									pathname: '/mypage',
									query: {
										category: 'writeArticle',
									},
								})
							}
						>
							<EditRoundedIcon aria-hidden />
							Write a post
						</button>
					</nav>
				</div>
			</section>

			{/** 02 COMMENTS — ultraviolet: form first, then the log **/}
			<section className="gv-gd-comms gv-cd-comments" id="comments" aria-labelledby="comments-title">
				<div className="gv-gd-comms__inner">
					<header className="gv-gd-comms__head">
						<p className="gv-chapter" aria-hidden>
							<span>02</span>Thread
						</p>
						<h2 className="gv-gd-comms__title" id="comments-title">
							Comments
						</h2>
						<p className="gv-gd-comms__count">
							{total} comment{total === 1 ? '' : 's'}
						</p>
					</header>

					<div className="gv-gd-comms__body">
						<div className="gv-gd-comms__log">
							{total > 0 ? (
								<>
									<ol className="gv-gd-log">
										{comments?.map((commentData) => {
											const commenter =
												commentData?.memberData?.memberStatus === MemberStatus.DELETE ? null : commentData?.memberData;
											const isMine = commentData?.memberId === user?._id;
											return (
												<li className={`gv-gd-entry ${isMine ? 'is-mine' : ''}`} key={commentData?._id}>
													<time className="gv-gd-entry__date" dateTime={String(commentData?.createdAt)}>
														<Moment format={'DD MMM, HH:mm'}>{commentData?.createdAt}</Moment>
													</time>
													<span className="gv-gd-entry__avatar" aria-hidden>
														<img src={getCommentMemberImage(commenter?.memberImage)} alt="" loading="lazy" />
													</span>
													<div className="gv-gd-entry__body">
														{commenter?._id ? (
															<button
																type="button"
																className="gv-gd-entry__name"
																onClick={() => goMemberPage(commentData?.memberData?._id as string)}
															>
																{commenter.memberNick}
																{commentData?.memberId === boardArticle.memberId && (
																	<span className="gv-cd-op">Author</span>
																)}
															</button>
														) : (
															<span className="gv-gd-entry__name gv-cd-gone">Deleted account</span>
														)}
														<p className="gv-gd-entry__text">{commentData?.commentContent}</p>
														{isMine && (
															<div className="gv-cd-own">
																<button
																	type="button"
																	onClick={() => {
																		setUpdatedComment(commentData?.commentContent);
																		setUpdatedCommentWordsCnt(commentData?.commentContent?.length);
																		setUpdatedCommentId(commentData?._id);
																		setOpenBackdrop(true);
																	}}
																>
																	<EditRoundedIcon aria-hidden />
																	Edit
																</button>
																<button
																	type="button"
																	onClick={() => {
																		setUpdatedCommentId(commentData?._id);
																		updateButtonHandler(commentData?._id, CommentStatus.DELETE);
																	}}
																>
																	<DeleteOutlineRoundedIcon aria-hidden />
																	Delete
																</button>
															</div>
														)}
													</div>
												</li>
											);
										})}
									</ol>
									{commentPages > 1 && (
										<nav className="gv-cat-pagination" aria-label="Comment pages">
											<Pagination
												count={commentPages}
												page={searchFilter.page}
												shape="rounded"
												onChange={paginationHandler}
											/>
										</nav>
									)}
								</>
							) : (
								<p className="gv-gd-comms__empty">No comments yet. Start the thread.</p>
							)}
						</div>

						<form
							className="gv-gd-form"
							onSubmit={(event) => {
								event.preventDefault();
								creteCommentHandler();
							}}
						>
							<label className="gv-gd-form__label" htmlFor="post-comment">
								Leave a comment
							</label>
							<textarea
								id="post-comment"
								className="gv-gd-form__input gv-cd-form__input"
								placeholder={user?._id ? 'Add to the thread' : 'Login to leave a comment'}
								value={comment}
								maxLength={100}
								onChange={(e) => {
									if (e.target.value.length > 100) return;
									setWordsCnt(e.target.value.length);
									setComment(e.target.value);
								}}
							/>
							<div className="gv-gd-form__foot">
								<span className={`gv-cd-count ${wordsCnt >= 90 ? 'is-near' : ''}`} aria-live="polite">
									{wordsCnt}/100
								</span>
								{!user?._id && (
									<Link href="/account/join" className="gv-gd-form__login">
										Log in to comment
									</Link>
								)}
								<button type="submit" className="gv-gd-ink-cta gv-gd-ink-cta--solid" disabled={!comment}>
									Comment
								</button>
							</div>
						</form>
					</div>
				</div>
			</section>

			{/** 03 MORE — signal: newer posts on the same board **/}
			{related.length > 0 && (
				<section className="gv-cd-more" aria-labelledby="more-title">
					<div className="gv-cd-more__inner">
						<header className="gv-cd-more__head">
							<div>
								<p className="gv-chapter" aria-hidden>
									<span>03</span>Keep reading
								</p>
								<h2 className="gv-cd-more__title" id="more-title">
									More on {board.short}
								</h2>
							</div>
							<Link href={{ pathname: '/community', query: { articleCategory: board.value } }} className="gv-gd-ink-cta">
								All {board.label}
							</Link>
						</header>
						<ul className="gv-cd-more__list">
							{related.map((item: BoardArticle) => (
								<li key={item._id} className="gv-cd-more__item">
									<Link href={articleHref(item)} className="gv-cd-more__hit" aria-hidden tabIndex={-1} />
									<span className="gv-cd-more__art" aria-hidden>
										<img src={articleImage(item)} alt="" loading="lazy" decoding="async" />
									</span>
									<h3 className="gv-cd-more__post">
										<Link href={articleHref(item)}>{item.articleTitle}</Link>
									</h3>
									<p className="gv-cd-more__meta">
										<Moment format="DD MMM YYYY">{item.createdAt}</Moment>
										<span>{item.articleLikes ?? 0} likes</span>
										<span>{item.articleComments ?? 0} comments</span>
									</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			)}

			<Dialog
				open={openBackdrop}
				onClose={cancelButtonHandler}
				className="gv-cd-dialog"
				aria-labelledby="edit-comment-title"
				fullWidth
				maxWidth="sm"
			>
				<form
					className="gv-cd-dialog__panel"
					onSubmit={(event) => {
						event.preventDefault();
						updateButtonHandler(updatedCommentId, undefined);
					}}
				>
					<h2 className="gv-cd-dialog__title" id="edit-comment-title">
						Edit comment
					</h2>
					<textarea
						autoFocus
						className="gv-cd-dialog__input"
						value={updatedComment}
						maxLength={100}
						aria-label="Comment text"
						onChange={(e) => updateCommentInputHandler(e.target.value)}
					/>
					<div className="gv-cd-dialog__foot">
						<span className="gv-cd-dialog__count">{updatedCommentWordsCnt}/100</span>
						<button type="button" className="gv-cd-dialog__cancel" onClick={() => cancelButtonHandler()}>
							Cancel
						</button>
						<button type="submit" className="gv-cd-dialog__save">
							Update
						</button>
					</div>
				</form>
			</Dialog>
		</div>
	);
};

CommunityDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentGroup: 'ARTICLE', commentRefId: '' },
	},
};

export default withLayoutCatalog(CommunityDetail);
