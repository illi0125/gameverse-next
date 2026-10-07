import React, { ChangeEvent, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../../libs/components/property/Review';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation, Pagination } from 'swiper';
import GameBigCard from '../../libs/components/common/GameBigCard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
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
import { Pagination as MuiPagination } from '@mui/material';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import 'swiper/css';
import 'swiper/css/pagination';
import { GET_GAME, GET_GAMES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CREATE_COMMENT, LIKE_TARGET_GAME } from '../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { GET_COMMENTS } from '../../apollo/admin/query';
import { MemberType } from '../../libs/enums/member.enum';

SwiperCore.use([Autoplay, Navigation, Pagination]);

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

const GameDetail: NextPage = ({ initialComment, ...props }: any) => {
	const device = useDeviceDetect();
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

	if (getGameLoading && !game) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '1080px' }}>
				<CircularProgress size={'4rem'} />
			</Stack>
		);
	}

	if (!game) {
		return (
			<div id={'game-detail-page'}>
				<div className={'container'}>
					<Stack className={'not-found'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<Typography>{getGameError ? 'This game is not available.' : 'No game selected.'}</Typography>
						<Link href={'/game'}>
							<Button className={'back-btn'}>Back to games</Button>
						</Link>
					</Stack>
				</div>
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

	if (device === 'mobile') {
		return <div>GAME DETAIL PAGE</div>;
	} else {
		return (
			<div id={'game-detail-page'}>
				<div className={'container'}>
					<Stack className={'game-detail-config'}>
						<Stack className={'game-info-config'}>
							<Stack className={'info'}>
								<Stack className={'left-box'}>
									<Stack className={'badges'}>
										<span className={`badge type-${game.gameType.toLowerCase()}`}>{formatEnumLabel(game.gameType)}</span>
										{game.isUpcoming && <span className={'badge upcoming'}>Upcoming</span>}
										{game.isFeatured && <span className={'badge featured'}>Featured</span>}
									</Stack>
									<Typography className={'title-main'}>{game.gameTitle}</Typography>
									<Stack className={'top-box'}>
										<Typography className={'studio'}>
											{game.gameDeveloper} · {game.gamePublisher}
										</Typography>
										<Stack className={'divider'}></Stack>
										<Typography className={'date'}>
											{game.isUpcoming ? 'Releases' : 'Released'} {moment(game.gameReleaseDate).format('MMM D, YYYY')}
										</Typography>
									</Stack>
									<Stack className={'chip-box'}>
										{game.gamePlatforms.map((platform: string) => (
											<span className={'chip'} key={platform}>
												{formatEnumLabel(platform)}
											</span>
										))}
									</Stack>
								</Stack>
								<Stack className={'right-box'}>
									<Stack className="buttons">
										<Stack className="button-box">
											<RemoveRedEyeIcon fontSize="medium" />
											<Typography>{game.gameViews}</Typography>
										</Stack>
										<Stack className="button-box" onClick={() => likeGameHandler(user, game._id)}>
											{isLiked ? (
												<FavoriteIcon color="primary" fontSize={'medium'} />
											) : (
												<FavoriteBorderIcon fontSize={'medium'} />
											)}
											<Typography>{game.gameLikes}</Typography>
										</Stack>
										<Stack className="button-box">
											<ChatBubbleOutlineIcon fontSize="medium" />
											<Typography>{game.gameComments}</Typography>
										</Stack>
									</Stack>
									<Stack className={'price-box'}>
										{hasGameDiscount(game) && (
											<Typography className={'original-price'}>{formatGameOriginalPrice(game)}</Typography>
										)}
										<Typography className={'price'}>{formatGamePrice(game)}</Typography>
									</Stack>
								</Stack>
							</Stack>
							<Stack className={'images'}>
								<Stack className={'main-image'}>
									<img
										src={slideImage ? `${REACT_APP_API_URL}/${slideImage}` : '/img/banner/header1.svg'}
										alt={game.gameTitle}
									/>
								</Stack>
								<Stack className={'sub-images'}>
									{game.gameImages.map((subImg: string) => (
										<Stack
											className={`sub-img-box ${subImg === slideImage ? 'active' : ''}`}
											onClick={() => setSlideImage(subImg)}
											key={subImg}
										>
											<img src={`${REACT_APP_API_URL}/${subImg}`} alt={'sub-image'} />
										</Stack>
									))}
								</Stack>
							</Stack>
						</Stack>
						<Stack className={'game-desc-config'}>
							<Stack className={'left-config'}>
								<Stack className={'facts-config'}>
									<Stack className={'fact'}>
										<Typography className={'title'}>Genres</Typography>
										<Typography className={'data'}>{game.gameGenres.map(formatEnumLabel).join(', ')}</Typography>
									</Stack>
									<Stack className={'fact'}>
										<Typography className={'title'}>Modes</Typography>
										<Typography className={'data'}>{game.gameModes.map(formatEnumLabel).join(', ')}</Typography>
									</Stack>
									<Stack className={'fact'}>
										<Typography className={'title'}>Platforms</Typography>
										<Typography className={'data'}>{game.gamePlatforms.map(formatEnumLabel).join(', ')}</Typography>
									</Stack>
									<Stack className={'fact'}>
										<Typography className={'title'}>Release</Typography>
										<Typography className={'data'}>{moment(game.gameReleaseDate).format('YYYY')}</Typography>
									</Stack>
								</Stack>

								<Stack className={'section-config'}>
									<Typography className={'title'}>About This Game</Typography>
									<Typography className={'lead'}>{game.gameDescription}</Typography>
									<Typography className={'desc'}>{game.gameOverview}</Typography>
								</Stack>

								<Stack className={'section-config'}>
									<Typography className={'title'}>Game Details</Typography>
									<Stack className={'info-box'}>
										<Box component={'div'} className={'info'}>
											<Typography className={'label'}>Developer</Typography>
											<Typography className={'data'}>{game.gameDeveloper}</Typography>
										</Box>
										<Box component={'div'} className={'info'}>
											<Typography className={'label'}>Publisher</Typography>
											<Typography className={'data'}>{game.gamePublisher}</Typography>
										</Box>
										<Box component={'div'} className={'info'}>
											<Typography className={'label'}>Release Date</Typography>
											<Typography className={'data'}>{moment(game.gameReleaseDate).format('MMMM D, YYYY')}</Typography>
										</Box>
										<Box component={'div'} className={'info'}>
											<Typography className={'label'}>Type</Typography>
											<Typography className={'data'}>{formatEnumLabel(game.gameType)}</Typography>
										</Box>
										<Box component={'div'} className={'info'}>
											<Typography className={'label'}>Price</Typography>
											<Typography className={'data'}>{formatGamePrice(game)}</Typography>
										</Box>
										<Box component={'div'} className={'info'}>
											<Typography className={'label'}>Status</Typography>
											<Typography className={'data'}>{formatEnumLabel(game.gameStatus)}</Typography>
										</Box>
									</Stack>
								</Stack>

								{game.gameVideos?.length > 0 && (
									<Stack className={'section-config'}>
										<Typography className={'title'}>Videos</Typography>
										<Stack className={'video-list'}>
											{game.gameVideos.map((video: string) => {
												const embed = toYoutubeEmbed(video);
												return (
													<Box component={'div'} className={'video-box'} key={video}>
														{embed ? (
															<iframe
																src={embed}
																title={game.gameTitle}
																allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
																allowFullScreen
																loading="lazy"
															/>
														) : (
															<video src={toMediaUrl(video)} controls preload="metadata" />
														)}
													</Box>
												);
											})}
										</Stack>
									</Stack>
								)}

								{game.gameSystemRequirements?.length > 0 && (
									<Stack className={'section-config'}>
										<Typography className={'title'}>System Requirements</Typography>
										<Stack className={'requirements'}>
											{game.gameSystemRequirements.map((req: GameSystemRequirement) => (
												<Stack className={'requirement'} key={req.platform}>
													<Typography className={'platform'}>{formatEnumLabel(req.platform)}</Typography>
													<Stack className={'columns'}>
														<Box component={'div'} className={'column'}>
															<Typography className={'label'}>Minimum</Typography>
															<Typography className={'data'}>{req.minimum}</Typography>
														</Box>
														<Box component={'div'} className={'column'}>
															<Typography className={'label'}>Recommended</Typography>
															<Typography className={'data'}>{req.recommended || '—'}</Typography>
														</Box>
													</Stack>
												</Stack>
											))}
										</Stack>
									</Stack>
								)}

								{commentTotal !== 0 && (
									<Stack className={'reviews-config'}>
										<Stack className={'filter-box'}>
											<Stack className={'review-cnt'}>
												<ChatBubbleOutlineIcon fontSize="small" />
												<Typography className={'reviews'}>
													{commentTotal} comment{commentTotal > 1 ? 's' : ''}
												</Typography>
											</Stack>
										</Stack>
										<Stack className={'review-list'}>
											{gameComments?.map((comment: Comment) => {
												return <Review comment={comment} key={comment?._id} />;
											})}
											<Box component={'div'} className={'pagination-box'}>
												<MuiPagination
													page={commentInquiry.page}
													count={Math.ceil(commentTotal / commentInquiry.limit)}
													onChange={commentPaginationChangeHandler}
													shape="circular"
													color="primary"
												/>
											</Box>
										</Stack>
									</Stack>
								)}
								<Stack className={'leave-review-config'}>
									<Typography className={'main-title'}>Leave A Comment</Typography>
									<Typography className={'review-title'}>Comment</Typography>
									<textarea
										placeholder={user?._id ? 'Share your thoughts about this game' : 'Login to leave a comment'}
										onChange={({ target: { value } }: any) => {
											setInsertCommentData({ ...insertCommentData, commentContent: value });
										}}
										value={insertCommentData.commentContent}
									></textarea>
									<Box className={'submit-btn'} component={'div'}>
										<Button
											className={'submit-review'}
											disabled={insertCommentData.commentContent.trim() === '' || !user?._id}
											onClick={createCommentHandler}
										>
											<Typography className={'title'}>Submit Comment</Typography>
										</Button>
									</Box>
								</Stack>
							</Stack>
							<Stack className={'right-config'}>
								<Stack className={'info-box'}>
									<Typography className={'main-title'}>Listed By</Typography>
									{owner ? (
										<Stack className={'image-info'}>
											<img
												className={'member-image'}
												src={
													owner.memberImage
														? `${REACT_APP_API_URL}/${owner.memberImage}`
														: '/img/profile/defaultUser.svg'
												}
												alt={owner.memberNick}
											/>
											<Stack className={'name-listings'}>
												<Link href={ownerHref as string}>
													<Typography className={'name'}>{owner.memberNick}</Typography>
												</Link>
												<Typography className={'role'}>{formatEnumLabel(owner.memberType)}</Typography>
												<Typography className={'listings'}>
													{owner.memberGames ?? 0} game{owner.memberGames === 1 ? '' : 's'} listed
												</Typography>
											</Stack>
										</Stack>
									) : (
										<Typography className={'owner-missing'}>Owner information is unavailable.</Typography>
									)}
								</Stack>
								{owner && ownerHref && (
									<Link href={ownerHref}>
										<Button className={'owner-btn'}>View {owner.memberType === MemberType.AGENT ? 'Agent' : 'Profile'}</Button>
									</Link>
								)}
							</Stack>
						</Stack>
						{similarGames.length !== 0 && (
							<Stack className={'similar-games-config'}>
								<Stack className={'title-pagination-box'}>
									<Stack className={'title-box'}>
										<Typography className={'main-title'}>Similar Games</Typography>
										<Typography className={'sub-title'}>
											More {game.gameGenres.slice(0, 2).map(formatEnumLabel).join(' & ')} games you may like
										</Typography>
									</Stack>
									<Stack className={'pagination-box'}>
										<WestIcon className={'swiper-similar-prev'} />
										<div className={'swiper-similar-pagination'}></div>
										<EastIcon className={'swiper-similar-next'} />
									</Stack>
								</Stack>
								<Stack className={'cards-box'}>
									<Swiper
										className={'similar-games-swiper'}
										slidesPerView={'auto'}
										spaceBetween={35}
										modules={[Autoplay, Navigation, Pagination]}
										navigation={{
											nextEl: '.swiper-similar-next',
											prevEl: '.swiper-similar-prev',
										}}
										pagination={{
											el: '.swiper-similar-pagination',
										}}
									>
										{similarGames.map((similar: Game) => (
											<SwiperSlide className={'similar-games-slide'} key={similar._id}>
												<GameBigCard game={similar} likeGameHandler={likeGameHandler} />
											</SwiperSlide>
										))}
									</Swiper>
								</Stack>
							</Stack>
						)}
					</Stack>
				</div>
			</div>
		);
	}
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

export default withLayoutFull(GameDetail);
