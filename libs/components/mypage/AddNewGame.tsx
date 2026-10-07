import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { GameGenre, GameMode, GamePlatform, GameStatus, GameType } from '../../enums/game.enum';
import { MemberType } from '../../enums/member.enum';
import { REACT_APP_API_URL } from '../../config';
import { GameInput, GameSystemRequirementInput } from '../../types/game/game.input';
import { Game, GameSystemRequirement } from '../../types/game/game';
import axios from 'axios';
import { getJwtToken } from '../../auth';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert, sweetTopSuccessAlert } from '../../sweetAlert';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { CREATE_GAME, UPDATE_GAME } from '../../../apollo/user/mutation';
import { GET_GAME } from '../../../apollo/user/query';
import { formatEnumLabel, validateGamePricing } from '../../utils';
import { T } from '../../types/common';

const MAX_IMAGES = 10;
const MAX_UPLOAD_BATCH = 5;

type ListKey = 'gameGenres' | 'gamePlatforms' | 'gameModes';
type RequirementMap = Partial<Record<GamePlatform, { minimum: string; recommended: string }>>;

interface GameForm extends Omit<GameInput, 'gameReleaseDate' | 'gameVideos' | 'gameSystemRequirements'> {
	gameReleaseDate: string; // yyyy-mm-dd
	gameStatus: GameStatus;
	gameVideosText: string; // one URL per line
	requirements: RequirementMap;
}

const toDateInput = (value?: Date | string): string => (value ? new Date(value).toISOString().slice(0, 10) : '');

const fromGame = (game: Game): GameForm => ({
	gameType: game.gameType,
	gameStatus: game.gameStatus === GameStatus.UPCOMING ? GameStatus.UPCOMING : GameStatus.ACTIVE,
	gameTitle: game.gameTitle,
	gameDescription: game.gameDescription,
	gameOverview: game.gameOverview,
	gameReleaseDate: toDateInput(game.gameReleaseDate),
	gameDeveloper: game.gameDeveloper,
	gamePublisher: game.gamePublisher,
	gameGenres: game.gameGenres,
	gamePlatforms: game.gamePlatforms,
	gameModes: game.gameModes,
	gamePrice: game.gamePrice,
	gameDiscountPrice: game.gameDiscountPrice ?? 0,
	gameImages: game.gameImages,
	gameVideosText: (game.gameVideos ?? []).join('\n'),
	requirements: (game.gameSystemRequirements ?? []).reduce((acc: RequirementMap, req: GameSystemRequirement) => {
		acc[req.platform] = { minimum: req.minimum, recommended: req.recommended ?? '' };
		return acc;
	}, {}),
});

/** Mirrors backend DTO validation so the agent sees problems before submitting **/
const validateForm = (form: GameForm): string | null => {
	if (!form.gameTitle.trim() || form.gameTitle.length > 150) return 'Title is required (max 150 characters)';
	if (!form.gameDeveloper.trim() || form.gameDeveloper.length > 150) return 'Developer is required (max 150 characters)';
	if (!form.gamePublisher.trim() || form.gamePublisher.length > 150) return 'Publisher is required (max 150 characters)';
	if (!form.gameReleaseDate) return 'Release date is required';
	if (!form.gameGenres.length) return 'Select at least one genre';
	if (!form.gamePlatforms.length) return 'Select at least one platform';
	if (!form.gameModes.length) return 'Select at least one game mode';
	if (form.gameDescription.trim().length < 5 || form.gameDescription.length > 500)
		return 'Short description must be 5–500 characters';
	if (form.gameOverview.trim().length < 5 || form.gameOverview.length > 5000) return 'Overview must be 5–5000 characters';
	if (!form.gameImages.length) return 'Upload at least one image';
	const pricingError = validateGamePricing(form.gameType, Number(form.gamePrice), Number(form.gameDiscountPrice ?? 0));
	if (pricingError) return pricingError;
	return null;
};

const toPayload = (form: GameForm) => {
	const gameSystemRequirements: GameSystemRequirementInput[] = form.gamePlatforms
		.filter((platform: GamePlatform) => form.requirements[platform]?.minimum?.trim())
		.map((platform: GamePlatform) => {
			const req = form.requirements[platform]!;
			return {
				platform,
				minimum: req.minimum.trim(),
				...(req.recommended.trim() ? { recommended: req.recommended.trim() } : {}),
			};
		});

	return {
		gameType: form.gameType,
		gameStatus: form.gameStatus,
		gameTitle: form.gameTitle.trim(),
		gameDescription: form.gameDescription.trim(),
		gameOverview: form.gameOverview.trim(),
		gameReleaseDate: new Date(`${form.gameReleaseDate}T00:00:00.000Z`).toISOString(),
		gameDeveloper: form.gameDeveloper.trim(),
		gamePublisher: form.gamePublisher.trim(),
		gameGenres: form.gameGenres,
		gamePlatforms: form.gamePlatforms,
		gameModes: form.gameModes,
		gamePrice: Number(form.gamePrice),
		gameDiscountPrice: Number(form.gameDiscountPrice ?? 0),
		gameImages: form.gameImages,
		gameVideos: form.gameVideosText
			.split('\n')
			.map((url: string) => url.trim())
			.filter(Boolean),
		gameSystemRequirements,
	};
};

const AddNewGame = ({ initialValues, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const inputRef = useRef<any>(null);
	const [form, setForm] = useState<GameForm>(initialValues);
	const [uploading, setUploading] = useState<boolean>(false);
	const [submitted, setSubmitted] = useState<boolean>(false);
	const token = getJwtToken();
	const user = useReactiveVar(userVar);
	const gameId = (router.query.gameId as string) || null;
	const formError = validateForm(form);

	/** APOLLO REQUESTS **/
	const [createGame] = useMutation(CREATE_GAME);
	const [updateGame] = useMutation(UPDATE_GAME);

	const { loading: getGameLoading } = useQuery(GET_GAME, {
		fetchPolicy: 'network-only',
		variables: { input: gameId },
		skip: !gameId,
		onCompleted: (data: T) => {
			if (data?.getGame) setForm(fromGame(data.getGame));
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (user?._id && user?.memberType !== MemberType.AGENT) router.back();
	}, [user]);

	useEffect(() => {
		if (!gameId) setForm(initialValues);
	}, [gameId]);

	/** HANDLERS **/
	const setField = (key: keyof GameForm, value: any) => setForm((prev: GameForm) => ({ ...prev, [key]: value }));

	const typeChangeHandler = (value: GameType) => {
		// FREE games must be zero-priced (backend rule)
		setForm((prev: GameForm) =>
			value === GameType.FREE ? { ...prev, gameType: value, gamePrice: 0, gameDiscountPrice: 0 } : { ...prev, gameType: value },
		);
	};

	const toggleListHandler = (key: ListKey, value: string) => {
		setForm((prev: GameForm) => {
			const current = prev[key] as string[];
			const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
			return { ...prev, [key]: next };
		});
	};

	const requirementChangeHandler = (platform: GamePlatform, field: 'minimum' | 'recommended', value: string) => {
		setForm((prev: GameForm) => {
			const current = prev.requirements[platform] ?? { minimum: '', recommended: '' };
			return { ...prev, requirements: { ...prev.requirements, [platform]: { ...current, [field]: value } } };
		});
	};

	const removeImageHandler = (image: string) => {
		setField(
			'gameImages',
			form.gameImages.filter((item: string) => item !== image),
		);
	};

	async function uploadImages() {
		try {
			const selectedFiles: File[] = Array.from(inputRef.current?.files ?? []);
			if (selectedFiles.length === 0) return;
			if (selectedFiles.length > MAX_UPLOAD_BATCH) throw new Error(`Cannot upload more than ${MAX_UPLOAD_BATCH} images at once!`);
			if (form.gameImages.length + selectedFiles.length > MAX_IMAGES)
				throw new Error(`A game can have at most ${MAX_IMAGES} images!`);

			setUploading(true);
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
						imagesUploader(files: $files, target: $target)
					}`,
					variables: { files: selectedFiles.map(() => null), target: 'game' },
				}),
			);
			const map: Record<string, string[]> = {};
			selectedFiles.forEach((_, index: number) => (map[`${index}`] = [`variables.files.${index}`]));
			formData.append('map', JSON.stringify(map));
			selectedFiles.forEach((file: File, index: number) => formData.append(`${index}`, file));

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
			const responseImages: string[] = response.data.data.imagesUploader;
			setForm((prev: GameForm) => ({ ...prev, gameImages: [...prev.gameImages, ...responseImages] }));
		} catch (err: any) {
			console.log('ERROR, uploadImages:', err.message);
			await sweetMixinErrorAlert(err.message);
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = '';
		}
	}

	const saveHandler = async () => {
		setSubmitted(true);
		if (formError) return;
		try {
			const payload = toPayload(form);
			if (gameId) {
				await updateGame({ variables: { input: { _id: gameId, ...payload } } });
				await sweetMixinSuccessAlert('This game has been updated successfully');
			} else {
				await createGame({ variables: { input: payload } });
				await sweetTopSuccessAlert('This game has been created successfully.');
			}
			await router.push({ pathname: '/mypage', query: { category: 'myGames' } });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const renderChips = (key: ListKey, values: string[]) => (
		<Stack className="chip-select">
			{values.map((value: string) => (
				<button
					type="button"
					key={value}
					className={`chip ${(form[key] as string[]).includes(value) ? 'active' : ''}`}
					onClick={() => toggleListHandler(key, value)}
				>
					{formatEnumLabel(value)}
				</button>
			))}
		</Stack>
	);

	if (device === 'mobile') {
		return <div>ADD NEW GAME MOBILE PAGE</div>;
	}

	if (gameId && getGameLoading) {
		return (
			<Stack sx={{ alignItems: 'center', padding: '120px 0' }}>
				<CircularProgress />
			</Stack>
		);
	}

	return (
		<div id="add-game-page">
			<Stack className="main-title-box">
				<Typography className="main-title">{gameId ? 'Edit Game' : 'Add New Game'}</Typography>
				<Typography className="sub-title">We are glad to see you again!</Typography>
			</Stack>

			<div>
				<Stack className="config">
					<Stack className="description-box">
						<Stack className="config-column">
							<Typography className="title">Title</Typography>
							<input
								type="text"
								className="description-input"
								placeholder={'Title'}
								maxLength={150}
								value={form.gameTitle}
								onChange={({ target: { value } }) => setField('gameTitle', value)}
							/>
						</Stack>

						<Stack className="config-row">
							<Stack className="price-year-after-price">
								<Typography className="title">Developer</Typography>
								<input
									type="text"
									className="description-input"
									placeholder={'Developer'}
									maxLength={150}
									value={form.gameDeveloper}
									onChange={({ target: { value } }) => setField('gameDeveloper', value)}
								/>
							</Stack>
							<Stack className="price-year-after-price">
								<Typography className="title">Publisher</Typography>
								<input
									type="text"
									className="description-input"
									placeholder={'Publisher'}
									maxLength={150}
									value={form.gamePublisher}
									onChange={({ target: { value } }) => setField('gamePublisher', value)}
								/>
							</Stack>
						</Stack>

						<Stack className="config-row">
							<Stack className="price-year-after-price">
								<Typography className="title">Release Date</Typography>
								<input
									type="date"
									className="description-input"
									value={form.gameReleaseDate}
									onChange={({ target: { value } }) => setField('gameReleaseDate', value)}
								/>
							</Stack>
							<Stack className="price-year-after-price">
								<Typography className="title">Status</Typography>
								<select
									className={'select-description'}
									value={form.gameStatus}
									onChange={({ target: { value } }) => setField('gameStatus', value as GameStatus)}
								>
									<option value={GameStatus.ACTIVE}>Active</option>
									<option value={GameStatus.UPCOMING}>Upcoming</option>
								</select>
								<div className={'divider'}></div>
								<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
							</Stack>
						</Stack>

						<Stack className="config-row">
							<Stack className="price-year-after-price">
								<Typography className="title">Pricing Type</Typography>
								<select
									className={'select-description'}
									value={form.gameType}
									onChange={({ target: { value } }) => typeChangeHandler(value as GameType)}
								>
									{Object.values(GameType).map((type: GameType) => (
										<option value={type} key={type}>
											{formatEnumLabel(type)}
										</option>
									))}
								</select>
								<div className={'divider'}></div>
								<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
							</Stack>
							<Stack className="price-year-after-price">
								<Typography className="title">Price ($)</Typography>
								<input
									type="number"
									min={0}
									step={'0.01'}
									className="description-input"
									disabled={form.gameType === GameType.FREE}
									value={form.gamePrice}
									onChange={({ target: { value } }) => setField('gamePrice', value === '' ? 0 : Number(value))}
								/>
							</Stack>
							<Stack className="price-year-after-price">
								<Typography className="title">Discount Price ($)</Typography>
								<input
									type="number"
									min={0}
									step={'0.01'}
									className="description-input"
									placeholder={'0 = no discount'}
									disabled={form.gameType === GameType.FREE}
									value={form.gameDiscountPrice}
									onChange={({ target: { value } }) => setField('gameDiscountPrice', value === '' ? 0 : Number(value))}
								/>
							</Stack>
						</Stack>

						<Stack className="config-column">
							<Typography className="title">Platforms</Typography>
							{renderChips('gamePlatforms', Object.values(GamePlatform))}
						</Stack>
						<Stack className="config-column">
							<Typography className="title">Genres</Typography>
							{renderChips('gameGenres', Object.values(GameGenre))}
						</Stack>
						<Stack className="config-column">
							<Typography className="title">Game Modes</Typography>
							{renderChips('gameModes', Object.values(GameMode))}
						</Stack>

						<Typography className="section-title">Game Description</Typography>
						<Stack className="config-column">
							<Typography className="title">Short Description ({form.gameDescription.length}/500)</Typography>
							<textarea
								className="description-text short"
								maxLength={500}
								value={form.gameDescription}
								onChange={({ target: { value } }) => setField('gameDescription', value)}
							></textarea>
						</Stack>
						<Stack className="config-column">
							<Typography className="title">Overview ({form.gameOverview.length}/5000)</Typography>
							<textarea
								className="description-text"
								maxLength={5000}
								value={form.gameOverview}
								onChange={({ target: { value } }) => setField('gameOverview', value)}
							></textarea>
						</Stack>
						<Stack className="config-column">
							<Typography className="title">Video URLs (optional, one per line)</Typography>
							<textarea
								className="description-text short"
								placeholder={'https://www.youtube.com/watch?v=...'}
								value={form.gameVideosText}
								onChange={({ target: { value } }) => setField('gameVideosText', value)}
							></textarea>
						</Stack>

						{form.gamePlatforms.length > 0 && (
							<>
								<Typography className="section-title">System Requirements (optional)</Typography>
								{form.gamePlatforms.map((platform: GamePlatform) => (
									<Stack className="requirement-row" key={platform}>
										<Typography className="requirement-platform">{formatEnumLabel(platform)}</Typography>
										<Stack className="config-row">
											<Stack className="price-year-after-price">
												<Typography className="title">Minimum</Typography>
												<textarea
													className="description-text short"
													maxLength={2000}
													value={form.requirements[platform]?.minimum ?? ''}
													onChange={({ target: { value } }) => requirementChangeHandler(platform, 'minimum', value)}
												></textarea>
											</Stack>
											<Stack className="price-year-after-price">
												<Typography className="title">Recommended</Typography>
												<textarea
													className="description-text short"
													maxLength={2000}
													value={form.requirements[platform]?.recommended ?? ''}
													onChange={({ target: { value } }) => requirementChangeHandler(platform, 'recommended', value)}
												></textarea>
											</Stack>
										</Stack>
									</Stack>
								))}
							</>
						)}
					</Stack>

					<Typography className="upload-title">Upload images of your game</Typography>
					<Stack className="images-box">
						<Stack className="upload-box">
							<CloudUploadOutlinedIcon sx={{ fontSize: 100, color: '#DDDDDD' }} />
							<Stack className="text-box">
								<Typography className="drag-title">Upload cover and screenshots</Typography>
								<Typography className="format-title">
									JPEG or PNG, up to {MAX_UPLOAD_BATCH} at a time and {MAX_IMAGES} in total. The first image is the cover.
								</Typography>
							</Stack>
							<Button
								className="browse-button"
								disabled={uploading || form.gameImages.length >= MAX_IMAGES}
								onClick={() => {
									inputRef.current.click();
								}}
							>
								<Typography className="browse-button-text">{uploading ? 'Uploading…' : 'Browse Files'}</Typography>
								<input
									ref={inputRef}
									type="file"
									hidden={true}
									onChange={uploadImages}
									multiple={true}
									accept="image/jpg, image/jpeg, image/png"
								/>
							</Button>
						</Stack>
						<Stack className="gallery-box">
							{form.gameImages.map((image: string, index: number) => (
								<Stack className="image-box" key={image}>
									<img src={`${REACT_APP_API_URL}/${image}`} alt="" />
									{index === 0 && <span className="cover-badge">Cover</span>}
									<IconButton className="remove-image" size="small" onClick={() => removeImageHandler(image)}>
										<CloseIcon fontSize="small" />
									</IconButton>
								</Stack>
							))}
						</Stack>
					</Stack>

					{submitted && formError && <Typography className="form-error">{formError}</Typography>}
					<Stack className="buttons-row">
						<Button className="next-button" disabled={uploading || (submitted && Boolean(formError))} onClick={saveHandler}>
							<Typography className="next-button-text">{gameId ? 'Save Changes' : 'Save'}</Typography>
						</Button>
					</Stack>
				</Stack>
			</div>
		</div>
	);
};

AddNewGame.defaultProps = {
	initialValues: {
		gameType: GameType.PAID,
		gameStatus: GameStatus.ACTIVE,
		gameTitle: '',
		gameDescription: '',
		gameOverview: '',
		gameReleaseDate: '',
		gameDeveloper: '',
		gamePublisher: '',
		gameGenres: [],
		gamePlatforms: [],
		gameModes: [],
		gamePrice: 0,
		gameDiscountPrice: 0,
		gameImages: [],
		gameVideosText: '',
		requirements: {},
	},
};

export default AddNewGame;
