import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
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
			memberArticles
			memberPoints
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
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
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
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
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberWarnings
			memberBlocks
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LIKE_TARGET_MEMBER = gql`
	mutation LikeTargetMember($input: String!) {
		likeTargetMember(memberId: $input) {
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
`;

/**************************
 *          GAME          *
 *************************/

export const CREATE_GAME = gql`
	mutation CreateGame($input: GameInput!) {
		createGame(input: $input) {
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
	}
`;

export const UPDATE_GAME = gql`
	mutation UpdateGame($input: GameUpdate!) {
		updateGame(input: $input) {
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
	}
`;

export const LIKE_TARGET_GAME = gql`
	mutation LikeTargetGame($input: String!) {
		likeTargetGame(gameId: $input) {
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
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const CREATE_BOARD_ARTICLE = gql`
	mutation CreateBoardArticle($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_BOARD_ARTICLE = gql`
	mutation UpdateBoardArticle($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const LIKE_TARGET_BOARD_ARTICLE = gql`
	mutation LikeTargetBoardArticle($input: String!) {
		likeTargetBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: String!) {
		subscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: String!) {
		unsubscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *    SUPPORT (CS)        *
 *************************/

export const CREATE_INQUIRY = gql`
	mutation CreateInquiry($input: InquiryInput!) {
		createInquiry(input: $input) {
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
	}
`;

/**************************
 *       ASSISTANT        *
 *************************/

export const ASK_ASSISTANT = gql`
	mutation AskAssistant($input: AssistantInput!) {
		askAssistant(input: $input) {
			status
			answer
			sourceIds
			suggestInquiry
		}
	}
`;

/**************************
 *     NOTIFICATIONS      *
 *************************/

export const MARK_NOTIFICATION_READ = gql`
	mutation MarkNotificationRead($notificationId: String!) {
		markNotificationRead(notificationId: $notificationId) {
			_id
			notificationStatus
			readAt
		}
	}
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
	mutation MarkAllNotificationsRead {
		markAllNotificationsRead
	}
`;
