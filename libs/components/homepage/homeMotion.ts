import { Game } from '../../types/game/game';
import { REACT_APP_API_URL } from '../../config';

/** Where homepage scroll scenes (pinning, scrubbed timelines) run; everything else gets static layouts **/
export const SCENE_QUERY = '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)';

export const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

export const pad = (value: number) => String(value).padStart(2, '0');

export const gameCover = (game?: Game, position = 0): string =>
	game?.gameImages?.[position] ? `${REACT_APP_API_URL}/${game.gameImages[position]}` : '/img/gameverse/game-placeholder.svg';

export const gameDetailHref = (game?: Game) => ({ pathname: '/game/detail', query: { id: game?._id } });
