import numeral from 'numeral';
import { sweetMixinErrorAlert } from './sweetAlert';
import { FollowInquiry } from './types/follow/follow.input';
import { GameType } from './enums/game.enum';
import { Game } from './types/game/game';

export const formatterStr = (value: number | undefined): string => {
	return numeral(value).format('0,0') != '0' ? numeral(value).format('0,0') : '';
};

export const likeTargetGameHandler = async (likeTargetGame: any, id: string) => {
	try {
		await likeTargetGame({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetGameHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

const enumLabelOverrides: Record<string, string> = {
	PLAYSTATION: 'PlayStation',
	CO_OP: 'Co-op',
};

/** SINGLE_PLAYER → "Single Player", RPG → "RPG" **/
export const formatEnumLabel = (value: string | undefined): string => {
	if (!value) return '';
	if (enumLabelOverrides[value]) return enumLabelOverrides[value];
	if (value.length <= 3) return value;
	return value
		.split('_')
		.map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(' ');
};

export const hasGameDiscount = (game: Pick<Game, 'gamePrice' | 'gameDiscountPrice'>): boolean => {
	return game?.gameDiscountPrice > 0 && game?.gameDiscountPrice < game?.gamePrice;
};

export const formatGamePrice = (game: Pick<Game, 'gameType' | 'gamePrice' | 'gameDiscountPrice'>): string => {
	if (game?.gameType === GameType.FREE || !game?.gamePrice) return 'Free';
	const price = hasGameDiscount(game) ? game.gameDiscountPrice : game.gamePrice;
	return `$${numeral(price).format('0,0.[00]')}`;
};

export const formatGameOriginalPrice = (game: Pick<Game, 'gamePrice'>): string => {
	return `$${numeral(game?.gamePrice).format('0,0.[00]')}`;
};

/** Mirrors backend pricing rules; returns an error message or null **/
export const validateGamePricing = (gameType: GameType, gamePrice: number, gameDiscountPrice: number = 0): string | null => {
	if (gameType === GameType.FREE) {
		if (gamePrice !== 0 || gameDiscountPrice !== 0) return 'Free games must have zero price and discount';
		return null;
	}
	if (!(gamePrice > 0)) return 'Paid and premium games require a positive price';
	if (gameDiscountPrice < 0) return 'Discount price cannot be negative';
	if (gameDiscountPrice !== 0 && gameDiscountPrice >= gamePrice) return 'Discount price must be lower than the base price';
	return null;
};

export const likeTargetBoardArticleHandler = async (likeTargetBoardArticle: any, id: string) => {
	try {
		await likeTargetBoardArticle({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetBoardArticleHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

export const likeTargetMemberHandler = async (
	likeTargetMember: any,
	getMemberFollowersRefetch: unknown,
	followInquiry: FollowInquiry,
	id: string,
) => {
	try {
		await likeTargetMember({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetMemberHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};
