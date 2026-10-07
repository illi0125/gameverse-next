import { GameGenre, GameMode, GamePlatform, GameStatus, GameType } from '../../enums/game.enum';
import { GameSystemRequirementInput } from './game.input';

export interface GameUpdate {
	_id: string;
	gameStatus?: GameStatus;
	gameType?: GameType;
	gameTitle?: string;
	gameDescription?: string;
	gameOverview?: string;
	gameReleaseDate?: Date | string;
	gameDeveloper?: string;
	gamePublisher?: string;
	gameGenres?: GameGenre[];
	gamePlatforms?: GamePlatform[];
	gameModes?: GameMode[];
	gamePrice?: number;
	gameDiscountPrice?: number;
	gameImages?: string[];
	gameVideos?: string[];
	gameSystemRequirements?: GameSystemRequirementInput[];
}

export interface AdminGameUpdate extends GameUpdate {
	isFeatured?: boolean;
}
