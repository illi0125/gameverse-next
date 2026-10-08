#!/usr/bin/env node
/**
 * Replace game images in place with higher-quality files you provide.
 *
 * The backend stores each game's images as uploads/game/<uuid>.png and the database keeps those paths,
 * so overwriting the files keeps every game, link and like intact — no database edits.
 *
 *   yarn images:replace --init          create game-images/<Game Title>/ folders (+ README.txt)
 *   yarn images:replace                 dry run: show what would be replaced, with sizes and warnings
 *   yarn images:replace --apply         back up the originals, then replace
 *   yarn images:replace --restore <dir> put a backup back
 *
 * Options: --uploads <path> (default ../gameverse/uploads/game), --api <graphql url> (default http://localhost:3007/graphql)
 * Inside each game folder the files are used in name order (1.jpg, 2.jpg, …); the first one is the cover.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, 'game-images');
const BACKUP_DIR = path.join(INPUT_DIR, '_backups');
const COVER_MIN_WIDTH = 1920;
const OTHER_MIN_WIDTH = 1280;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
	const index = args.indexOf(name);
	return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const UPLOADS = path.resolve(ROOT, option('--uploads', '../gameverse/uploads/game'));
const API = option('--api', 'http://localhost:3007/graphql');

const README = `GameVerse game images
=====================

Put each game's images in its folder. Files are used in name order: 1.jpg, 2.jpg, 3.jpg ...
The FIRST file is the cover. It is used everywhere: hero, Trending plates, Collection fan,
leaderboard background and game cards.

Sizes
- Cover (1): landscape key art, at least 2560 x 1440 (minimum 1920 x 1080).
  Keep the subject roughly centred: it is cropped to portrait on cards and shown full screen on the leaderboard.
- Other images: at least 1920 px wide.
- Format: JPEG (quality ~85) or PNG. WebP is not accepted by the backend upload rules.
- Good sources: the publisher's press kit or the game's official store page.

Then run:
  yarn images:replace            (dry run, nothing is changed)
  yarn images:replace --apply    (backs up the originals to game-images/_backups, then replaces)
`;

/** Folder name for a game title: readable, but without characters macOS/Windows reject */
const folderName = (title) => title.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Format and pixel size from the file header (PNG, JPEG, WebP) without any dependency */
const inspect = (file) => {
	const buffer = fs.readFileSync(file);
	if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
		return { format: 'png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
	}
	if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
		let offset = 2;
		while (offset + 9 < buffer.length) {
			if (buffer[offset] !== 0xff) {
				offset += 1;
				continue;
			}
			const marker = buffer[offset + 1];
			const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
			if (isFrame) {
				return { format: 'jpeg', width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
			}
			offset += 2 + buffer.readUInt16BE(offset + 2);
		}
		return { format: 'jpeg', width: 0, height: 0 };
	}
	if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
		return { format: 'webp', width: 0, height: 0 };
	}
	return { format: 'unknown', width: 0, height: 0 };
};

const fetchGames = async () => {
	const query = `query { getGames(input: { page: 1, limit: 100, sort: "createdAt", direction: DESC, search: {} }) { list { _id gameTitle gameImages } } }`;
	const response = await fetch(API, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query }),
	}).catch(() => null);
	if (!response) throw new Error(`Cannot reach the API at ${API}. Is the backend running?`);
	const body = await response.json();
	if (body.errors) throw new Error(body.errors.map((error) => error.message).join('; '));
	return body.data.getGames.list;
};

const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const listImages = (dir) =>
	fs
		.readdirSync(dir)
		.filter((name) => !name.startsWith('.') && !/\.txt$/i.test(name) && fs.statSync(path.join(dir, name)).isFile())
		.sort(naturalSort);

const init = async () => {
	const games = await fetchGames();
	fs.mkdirSync(INPUT_DIR, { recursive: true });
	fs.writeFileSync(path.join(INPUT_DIR, 'README.txt'), README);
	games.forEach((game) => {
		fs.mkdirSync(path.join(INPUT_DIR, folderName(game.gameTitle)), { recursive: true });
		console.log(`  ${folderName(game.gameTitle)}/   (${game.gameImages.length} image slot${game.gameImages.length === 1 ? '' : 's'})`);
	});
	console.log(`\nCreated ${games.length} folders in ${path.relative(ROOT, INPUT_DIR)}/. See README.txt there for sizes.`);
};

/** Pair every provided file with the upload it replaces */
const plan = async () => {
	if (!fs.existsSync(INPUT_DIR)) throw new Error('No game-images/ folder yet. Run: yarn images:replace --init');
	if (!fs.existsSync(UPLOADS)) throw new Error(`Uploads folder not found: ${UPLOADS} (use --uploads <path>)`);

	const games = await fetchGames();
	const byTitle = new Map(games.map((game) => [normalize(game.gameTitle), game]));
	const folders = fs
		.readdirSync(INPUT_DIR)
		.filter((name) => !name.startsWith('_') && !name.startsWith('.') && fs.statSync(path.join(INPUT_DIR, name)).isDirectory());

	const swaps = [];
	const notes = [];

	folders.forEach((folder) => {
		const game = byTitle.get(normalize(folder));
		const files = listImages(path.join(INPUT_DIR, folder));
		if (!game) {
			if (files.length) notes.push(`"${folder}": no game with this title, skipped`);
			return;
		}
		if (files.length > game.gameImages.length) {
			notes.push(`"${folder}": ${files.length} files but the game has ${game.gameImages.length} image slots; extra files ignored`);
		}
		files.slice(0, game.gameImages.length).forEach((file, index) => {
			const source = path.join(INPUT_DIR, folder, file);
			const target = path.join(UPLOADS, path.basename(game.gameImages[index]));
			const info = inspect(source);
			const minWidth = index === 0 ? COVER_MIN_WIDTH : OTHER_MIN_WIDTH;
			const problems = [];
			if (!['png', 'jpeg'].includes(info.format)) problems.push(`${info.format} is not accepted (use JPEG or PNG)`);
			const warnings = [];
			if (info.width && info.width < minWidth) warnings.push(`only ${info.width}px wide; ${minWidth}px+ recommended`);
			if (!fs.existsSync(target)) problems.push(`target ${path.basename(target)} does not exist in uploads`);
			swaps.push({ game: game.gameTitle, slot: index + 1, source, target, info, problems, warnings });
		});
	});

	return { swaps, notes };
};

const report = ({ swaps, notes }) => {
	if (!swaps.length) console.log('Nothing to replace yet: put images in the game-images/<Game Title>/ folders.');
	let game = '';
	swaps.forEach((swap) => {
		if (swap.game !== game) {
			game = swap.game;
			console.log(`\n${game}`);
		}
		const current = inspect(swap.target);
		const size = swap.info.width ? `${swap.info.width}x${swap.info.height}` : 'size unknown';
		console.log(
			`  ${swap.slot === 1 ? 'cover' : `img ${swap.slot}`}  ${path.basename(swap.source)} (${swap.info.format} ${size})` +
				`  ->  ${path.basename(swap.target)} (now ${current.width}x${current.height})`,
		);
		swap.warnings.forEach((warning) => console.log(`         warning: ${warning}`));
		swap.problems.forEach((problem) => console.log(`         SKIPPED: ${problem}`));
	});
	notes.forEach((note) => console.log(`\nnote: ${note}`));
};

const apply = ({ swaps }) => {
	const ready = swaps.filter((swap) => swap.problems.length === 0);
	if (!ready.length) return console.log('\nNothing applied.');

	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const backup = path.join(BACKUP_DIR, stamp);
	fs.mkdirSync(backup, { recursive: true });
	const manifest = {};
	ready.forEach((swap) => {
		const name = path.basename(swap.target);
		fs.copyFileSync(swap.target, path.join(backup, name));
		manifest[name] = swap.game;
		fs.copyFileSync(swap.source, swap.target);
	});
	fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ uploads: UPLOADS, files: manifest }, null, 2));
	console.log(`\nReplaced ${ready.length} image(s). Originals backed up to ${path.relative(ROOT, backup)}/`);
	console.log(`Undo with: yarn images:replace --restore ${path.relative(ROOT, backup)}`);
	console.log('Hard-refresh the browser (Cmd+Shift+R) to see the new images.');
};

const restore = (dir) => {
	const backup = path.resolve(ROOT, dir);
	const manifest = JSON.parse(fs.readFileSync(path.join(backup, 'manifest.json'), 'utf8'));
	const uploads = option('--uploads', null) ? UPLOADS : manifest.uploads;
	Object.keys(manifest.files).forEach((name) => fs.copyFileSync(path.join(backup, name), path.join(uploads, name)));
	console.log(`Restored ${Object.keys(manifest.files).length} image(s) into ${uploads}`);
};

const main = async () => {
	if (flag('--init')) return init();
	if (flag('--restore')) return restore(option('--restore'));
	const result = await plan();
	report(result);
	if (flag('--apply')) apply(result);
	else if (result.swaps.length) console.log('\nDry run: nothing changed. Run again with --apply to replace.');
};

main().catch((error) => {
	console.error(`error: ${error.message}`);
	process.exit(1);
});
