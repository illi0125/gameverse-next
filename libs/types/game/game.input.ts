import { GameGenre, GameMode, GamePlatform, GameStatus, GameType } from '../../enums/game.enum';
import { Direction } from '../../enums/common.enum';

export interface GameSystemRequirementInput {
	platform: GamePlatform;
	minimum: string;
	recommended?: string;
}

export interface GameInput {
	gameType: GameType;
	gameStatus?: GameStatus;
	gameTitle: string;
	gameDescription: string;
	gameOverview: string;
	gameReleaseDate: Date | string;
	gameDeveloper: string;
	gamePublisher: string;
	gameGenres: GameGenre[];
	gamePlatforms: GamePlatform[];
	gameModes: GameMode[];
	gamePrice: number;
	gameDiscountPrice?: number;
	gameImages: string[];
	gameVideos?: string[];
	gameSystemRequirements?: GameSystemRequirementInput[];
}

interface PriceRange {
	start: number;
	end: number;
}

interface DateRange {
	start: Date | string;
	end: Date | string;
}

export interface GameSearch {
	memberId?: string;
	typeList?: GameType[];
	platformList?: GamePlatform[];
	genreList?: GameGenre[];
	modeList?: GameMode[];
	pricesRange?: PriceRange;
	releaseDateRange?: DateRange;
	isFeatured?: boolean;
	text?: string;
}

export interface GamesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: GameSearch;
}

interface AgentGameSearch {
	gameStatus?: GameStatus;
}

export interface AgentGamesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AgentGameSearch;
}

interface AdminGameSearch extends GameSearch {
	gameStatus?: GameStatus;
}

export interface AllGamesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AdminGameSearch;
}
