import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_AGENTS = gql`
	query GetAgents($input: AgentsInquiry!) {
		getAgents(input: $input) {
			list {
				_id
				memberType
				memberStatus
				memberAuthType
				memberPhone
				memberNick
				memberFullName
				memberImage
				memberAddress
				memberDesc
				memberWarnings
				memberBlocks
				memberGames
				memberRank
				memberPoints
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
				accessToken
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER = gql(`
  query GetMember($input: String!) {
    getMember(memberId: $input) {
        _id
        memberType
        memberStatus
        memberAuthType
        memberPhone
        memberNick
        memberFullName
        memberImage
        memberAddress
        memberDesc
        memberGames
        memberArticles
        memberPoints
        memberLikes
        memberViews
        memberFollowings
				memberFollowers
        memberRank
        memberWarnings
        memberBlocks
        deletedAt
        createdAt
        updatedAt
        accessToken
        meFollowed {
					followingId
					followerId
					myFollowing
				}
    }
}
`);

/**************************
 *          GAME          *
 *************************/

export const GET_GAME = gql`
	query GetGame($input: String!) {
		getGame(gameId: $input) {
			_id
			gameStatus
			gameType
			gameTitle
			gameSlug
			gameDescription
			gameOverview
			gameReleaseDate
			gameDeveloper
			gamePublisher
			gameGenres
			gamePlatforms
			gameModes
			gamePrice
			gameDiscountPrice
			gameImages
			gameVideos
			gameSystemRequirements {
				platform
				minimum
				recommended
			}
			gameRatings
			gameReviews
			gameComments
			gameViews
			gameLikes
			gameRank
			memberId
			isFeatured
			isUpcoming
			deletedAt
			createdAt
			updatedAt
			memberData {
				_id
				memberType
				memberStatus
				memberAuthType
				memberPhone
				memberNick
				memberFullName
				memberImage
				memberAddress
				memberDesc
				memberWarnings
				memberBlocks
				memberGames
				memberRank
				memberPoints
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_GAMES = gql`
	query GetGames($input: GamesInquiry!) {
		getGames(input: $input) {
			list {
				_id
				gameStatus
				gameType
				gameTitle
				gameSlug
				gameDescription
				gameOverview
				gameReleaseDate
				gameDeveloper
				gamePublisher
				gameGenres
				gamePlatforms
				gameModes
				gamePrice
				gameDiscountPrice
				gameImages
				gameVideos
				gameSystemRequirements {
					platform
					minimum
					recommended
				}
				gameRatings
				gameReviews
				gameComments
				gameViews
				gameLikes
				gameRank
				memberId
				isFeatured
				isUpcoming
				deletedAt
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberWarnings
					memberBlocks
					memberGames
					memberRank
					memberPoints
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_AGENT_GAMES = gql`
	query GetAgentGames($input: AgentGamesInquiry!) {
		getAgentGames(input: $input) {
			list {
				_id
				gameStatus
				gameType
				gameTitle
				gameSlug
				gameDescription
				gameOverview
				gameReleaseDate
				gameDeveloper
				gamePublisher
				gameGenres
				gamePlatforms
				gameModes
				gamePrice
				gameDiscountPrice
				gameImages
				gameVideos
				gameSystemRequirements {
					platform
					minimum
					recommended
				}
				gameRatings
				gameReviews
				gameComments
				gameViews
				gameLikes
				gameRank
				memberId
				isFeatured
				isUpcoming
				deletedAt
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_FAVORITE_GAMES = gql`
	query GetFavoriteGames($input: OrdinaryInquiry!) {
		getFavorites(input: $input) {
			list {
				_id
				gameStatus
				gameType
				gameTitle
				gameSlug
				gameDescription
				gameOverview
				gameReleaseDate
				gameDeveloper
				gamePublisher
				gameGenres
				gamePlatforms
				gameModes
				gamePrice
				gameDiscountPrice
				gameImages
				gameVideos
				gameSystemRequirements {
					platform
					minimum
					recommended
				}
				gameRatings
				gameReviews
				gameComments
				gameViews
				gameLikes
				gameRank
				memberId
				isFeatured
				isUpcoming
				deletedAt
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberWarnings
					memberBlocks
					memberGames
					memberRank
					memberPoints
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_VISITED_GAMES = gql`
	query GetVisitedGames($input: OrdinaryInquiry!) {
		getVisited(input: $input) {
			list {
				_id
				gameStatus
				gameType
				gameTitle
				gameSlug
				gameDescription
				gameOverview
				gameReleaseDate
				gameDeveloper
				gamePublisher
				gameGenres
				gamePlatforms
				gameModes
				gamePrice
				gameDiscountPrice
				gameImages
				gameVideos
				gameSystemRequirements {
					platform
					minimum
					recommended
				}
				gameRatings
				gameReviews
				gameComments
				gameViews
				gameLikes
				gameRank
				memberId
				isFeatured
				isUpcoming
				deletedAt
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberWarnings
					memberBlocks
					memberGames
					memberRank
					memberPoints
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
			memberId
			createdAt
			updatedAt
			memberData {
				_id
				memberType
				memberStatus
				memberAuthType
				memberPhone
				memberNick
				memberFullName
				memberImage
				memberAddress
				memberDesc
				memberWarnings
				memberBlocks
				memberGames
				memberRank
				memberPoints
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				articleComments
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberWarnings
					memberBlocks
					memberGames
					memberRank
					memberPoints
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberWarnings
					memberBlocks
					memberGames
					memberRank
					memberPoints
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/
export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
				followerData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberGames
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				followingData {
					_id
					memberType
					memberStatus
					memberAuthType
					memberPhone
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberGames
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *    SUPPORT (CS)        *
 *************************/

export const GET_NOTICES = gql`
	query GetNotices($input: NoticesInquiry!) {
		getNotices(input: $input) {
			list {
				_id
				noticeCategory
				noticeStatus
				noticeTopic
				noticeTitle
				noticeContent
				noticeEvent
				memberId
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_INQUIRIES = gql`
	query GetMyInquiries($input: MyInquiriesInquiry!) {
		getMyInquiries(input: $input) {
			list {
				_id
				inquiryTopic
				inquiryStatus
				inquiryTitle
				inquiryContent
				answerContent
				answeredAt
				answeredBy
				memberId
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;
