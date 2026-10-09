/**
 * Official places to get each catalog game, keyed by game title.
 *
 * Frontend-only by design: the backend Game model has no store-link field. Add a title here when a new game
 * joins the catalog. Every URL is an official store page or the publisher's own site, checked to resolve.
 */
import { Game } from './types/game/game';

export type GameStore =
	| 'STEAM'
	| 'GOG'
	| 'EA_APP'
	| 'OFFICIAL'
	| 'PLAYSTATION'
	| 'APP_STORE'
	| 'GOOGLE_PLAY';

export interface GameStoreLink {
	store: GameStore;
	url: string;
}

export const gameStoreLabels: Record<GameStore, { label: string; platform: string }> = {
	STEAM: { label: 'Steam', platform: 'PC' },
	GOG: { label: 'GOG', platform: 'PC' },
	EA_APP: { label: 'EA app', platform: 'PC' },
	OFFICIAL: { label: 'Official site', platform: 'Download' },
	PLAYSTATION: { label: 'PlayStation Store', platform: 'PlayStation' },
	APP_STORE: { label: 'App Store', platform: 'iPhone & iPad' },
	GOOGLE_PLAY: { label: 'Google Play', platform: 'Android' },
};

const steam = (appId: number): GameStoreLink => ({ store: 'STEAM', url: `https://store.steampowered.com/app/${appId}/` });

const storeLinksByTitle: Record<string, GameStoreLink[]> = {
	apexlegends: [steam(1172470), { store: 'EA_APP', url: 'https://www.ea.com/games/apex-legends' }],
	eldenring: [steam(1245620), { store: 'OFFICIAL', url: 'https://en.bandainamcoent.eu/elden-ring/elden-ring' }],
	thewitcher3wildhunt: [
		steam(292030),
		{ store: 'GOG', url: 'https://www.gog.com/en/game/the_witcher_3_wild_hunt_game_of_the_year_edition' },
		{ store: 'OFFICIAL', url: 'https://www.thewitcher.com/us/en/witcher3' },
	],
	grandtheftautov: [steam(271590), { store: 'OFFICIAL', url: 'https://www.rockstargames.com/gta-v' }],
	pubgbattlegrounds: [steam(578080), { store: 'OFFICIAL', url: 'https://pubg.com/' }],
	counterstrike2: [steam(730), { store: 'OFFICIAL', url: 'https://www.counter-strike.net/cs2' }],
	valorant: [{ store: 'OFFICIAL', url: 'https://playvalorant.com/' }],
	genshinimpact: [
		{ store: 'OFFICIAL', url: 'https://genshin.hoyoverse.com/' },
		{ store: 'PLAYSTATION', url: 'https://store.playstation.com/en-us/concept/10000896' },
		{ store: 'APP_STORE', url: 'https://apps.apple.com/us/app/genshin-impact/id1517783697' },
		{ store: 'GOOGLE_PLAY', url: 'https://play.google.com/store/apps/details?id=com.miHoYo.GenshinImpact' },
	],
	minecraft: [
		{ store: 'OFFICIAL', url: 'https://www.minecraft.net/en-us/get-minecraft' },
		{ store: 'PLAYSTATION', url: 'https://store.playstation.com/en-us/concept/212779' },
		{ store: 'APP_STORE', url: 'https://apps.apple.com/us/app/minecraft-play-with-friends/id479516143' },
		{ store: 'GOOGLE_PLAY', url: 'https://play.google.com/store/apps/details?id=com.mojang.minecraftpe' },
	],
	clashofclans: [
		{ store: 'APP_STORE', url: 'https://apps.apple.com/us/app/clash-of-clans/id529479190' },
		{ store: 'GOOGLE_PLAY', url: 'https://play.google.com/store/apps/details?id=com.supercell.clashofclans' },
		{ store: 'OFFICIAL', url: 'https://supercell.com/en/games/clashofclans/' },
	],
};

/** Title match ignores case, spaces and punctuation ("PUBG: BATTLEGROUNDS" → "pubgbattlegrounds") **/
const titleKey = (title?: string) => (title ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const getGameStoreLinks = (game?: Pick<Game, 'gameTitle'>): GameStoreLink[] =>
	storeLinksByTitle[titleKey(game?.gameTitle)] ?? [];
