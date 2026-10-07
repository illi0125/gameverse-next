import { GameGenre, GameMode, GamePlatform, GameStatus, GameType } from '../../enums/game.enum';
import { Member } from '../member/member';
import { MeLiked, TotalCounter } from '../common';

export interface GameSystemRequirement {
	platform: GamePlatform;
	minimum: string;
	recommended?: string;
}

export interface Game {
	_id: string;
	gameStatus: GameStatus;
	gameType: GameType;
	gameTitle: string;
	gameSlug: string;
	gameDescription: string;
	gameOverview: string;
	gameReleaseDate: Date;
	gameDeveloper: string;
	gamePublisher: string;
	gameGenres: GameGenre[];
	gamePlatforms: GamePlatform[];
	gameModes: GameMode[];
	gamePrice: number;
	gameDiscountPrice: number;
	gameImages: string[];
	gameVideos: string[];
	gameSystemRequirements: GameSystemRequirement[];
	gameRatings: number;
	gameReviews: number;
	gameComments: number;
	gameViews: number;
	gameLikes: number;
	gameRank: number;
	memberId: string;
	isFeatured: boolean;
	isUpcoming: boolean;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	memberData?: Member | null;
}

export interface Games {
	list: Game[];
	metaCounter: TotalCounter[];
}
