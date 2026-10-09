import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
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
				memberArticles
				memberPoints
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
				accessToken
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *          GAME          *
 *************************/

export const GET_ALL_GAMES_BY_ADMIN = gql`
	query GetAllGamesByAdmin($input: AllGamesInquiry!) {
		getAllGamesByAdmin(input: $input) {
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

export const GET_ALL_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetAllBoardArticlesByAdmin($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
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
 *    SUPPORT (CS)        *
 *************************/

export const GET_ALL_NOTICES_BY_ADMIN = gql`
	query GetAllNoticesByAdmin($input: AllNoticesInquiry!) {
		getAllNoticesByAdmin(input: $input) {
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
				memberData {
					_id
					memberNick
					memberImage
					memberType
					memberStatus
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_ALL_INQUIRIES_BY_ADMIN = gql`
	query GetAllInquiriesByAdmin($input: AllInquiriesInquiry!) {
		getAllInquiriesByAdmin(input: $input) {
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
				memberData {
					_id
					memberNick
					memberImage
					memberType
					memberStatus
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
