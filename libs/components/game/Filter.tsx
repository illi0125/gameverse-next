import React, { useCallback, useEffect, useState } from 'react';
import {
	Stack,
	Typography,
	Checkbox,
	OutlinedInput,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Tooltip,
	IconButton,
} from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { GameGenre, GameMode, GamePlatform, GameType } from '../../enums/game.enum';
import { GameSearch, GamesInquiry } from '../../types/game/game.input';
import { useRouter } from 'next/router';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import { gamePriceMax, gameReleaseYears } from '../../config';
import { formatEnumLabel } from '../../utils';

const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: '200px',
		},
	},
};

type ListKey = 'typeList' | 'platformList' | 'genreList' | 'modeList';

interface FilterType {
	searchFilter: GamesInquiry;
	setSearchFilter: any;
	initialInput: GamesInquiry;
}

const yearOf = (value?: Date | string): number | '' => (value ? new Date(value).getUTCFullYear() : '');

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchText, setSearchText] = useState<string>(searchFilter?.search?.text ?? '');
	const [showMore, setShowMore] = useState<boolean>(false);

	/** LIFECYCLES **/
	useEffect(() => {
		setSearchText(searchFilter?.search?.text ?? '');
		if (searchFilter?.search?.genreList?.length) setShowMore(true);
	}, [searchFilter]);

	/** HANDLERS **/
	const pushSearch = useCallback(
		async (search: GameSearch) => {
			const cleaned: GameSearch = { ...search };
			(['typeList', 'platformList', 'genreList', 'modeList'] as ListKey[]).forEach((key: ListKey) => {
				if (!cleaned[key]?.length) delete cleaned[key];
			});
			if (!cleaned.text) delete cleaned.text;
			if (cleaned.isFeatured !== true) delete cleaned.isFeatured;

			const url = `/game?input=${JSON.stringify({ ...searchFilter, page: 1, search: cleaned })}`;
			await router.push(url, url, { scroll: false });
		},
		[searchFilter],
	);

	const listSelectHandler = useCallback(
		async (key: ListKey, e: any) => {
			try {
				const isChecked = e.target.checked;
				const value = e.target.value;
				const current: string[] = searchFilter?.search?.[key] || [];
				const next = isChecked ? [...current, value] : current.filter((item: string) => item !== value);
				await pushSearch({ ...searchFilter.search, [key]: next });
			} catch (err: any) {
				console.log('ERROR, listSelectHandler:', err);
			}
		},
		[searchFilter],
	);

	const featuredHandler = useCallback(
		async (e: any) => {
			await pushSearch({ ...searchFilter.search, isFeatured: e.target.checked });
		},
		[searchFilter],
	);

	const releaseYearHandler = useCallback(
		async (e: any, type: 'start' | 'end') => {
			const value = e.target.value;
			const range = searchFilter?.search?.releaseDateRange;
			const startYear = type === 'start' ? value : yearOf(range?.start);
			const endYear = type === 'end' ? value : yearOf(range?.end);

			if (startYear === '' && endYear === '') {
				const { releaseDateRange, ...rest } = searchFilter.search;
				await pushSearch(rest);
				return;
			}

			const start = startYear === '' ? gameReleaseYears[gameReleaseYears.length - 1] : startYear;
			const end = endYear === '' ? gameReleaseYears[0] : endYear;
			await pushSearch({
				...searchFilter.search,
				releaseDateRange: {
					start: new Date(Date.UTC(start, 0, 1)).toISOString(),
					end: new Date(Date.UTC(end, 11, 31, 23, 59, 59)).toISOString(),
				},
			});
		},
		[searchFilter],
	);

	const priceHandler = useCallback(
		async (value: string, type: 'start' | 'end') => {
			const range = searchFilter?.search?.pricesRange;
			if (value === '' && (type === 'start' ? range?.end === undefined : range?.start === undefined)) {
				const { pricesRange, ...rest } = searchFilter.search;
				await pushSearch(rest);
				return;
			}
			await pushSearch({
				...searchFilter.search,
				pricesRange: {
					start: range?.start ?? 0,
					end: range?.end ?? gamePriceMax,
					[type]: value === '' ? (type === 'start' ? 0 : gamePriceMax) : Number(value),
				},
			});
		},
		[searchFilter],
	);

	const textHandler = async (text: string) => {
		await pushSearch({ ...searchFilter.search, text });
	};

	const refreshHandler = async () => {
		try {
			setSearchText('');
			await router.push(`/game?input=${JSON.stringify(initialInput)}`, `/game?input=${JSON.stringify(initialInput)}`, {
				scroll: false,
			});
		} catch (err: any) {
			console.log('ERROR, refreshHandler:', err);
		}
	};

	const renderCheckboxes = (key: ListKey, values: string[]) =>
		values.map((value: string) => (
			<Stack className={'input-box'} key={value}>
				<Checkbox
					id={`${key}-${value}`}
					className="game-checkbox"
					color="default"
					size="small"
					value={value}
					checked={((searchFilter?.search?.[key] as string[]) || []).includes(value)}
					onChange={(e: any) => listSelectHandler(key, e)}
				/>
				<label htmlFor={`${key}-${value}`} style={{ cursor: 'pointer' }}>
					<Typography className="game-option">{formatEnumLabel(value)}</Typography>
				</label>
			</Stack>
		));

	if (device === 'mobile') {
		return <div>GAMES FILTER</div>;
	} else {
		return (
			<Stack className={'filter-main'}>
				<Stack className={'find-your-game'} mb={'40px'}>
					<Typography className={'title-main'}>Find Your Game</Typography>
					<Stack className={'input-box'}>
						<OutlinedInput
							value={searchText}
							type={'text'}
							className={'search-input'}
							placeholder={'Title, developer or publisher'}
							onChange={(e: any) => setSearchText(e.target.value)}
							onKeyDown={(event: any) => {
								if (event.key == 'Enter') textHandler(searchText);
							}}
							endAdornment={
								<CancelRoundedIcon
									onClick={() => {
										setSearchText('');
										textHandler('');
									}}
								/>
							}
						/>
						<img src={'/img/icons/search_icon.png'} alt={''} />
						<Tooltip title="Reset">
							<IconButton onClick={refreshHandler}>
								<RefreshIcon />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Stack className={'find-your-game'} mb={'30px'}>
					<Typography className={'title'}>Platform</Typography>
					{renderCheckboxes('platformList', Object.values(GamePlatform))}
				</Stack>
				<Stack className={'find-your-game'} mb={'30px'}>
					<Typography className={'title'}>Genre</Typography>
					<Stack
						className={'game-genre'}
						style={{ height: showMore ? '310px' : '115px' }}
						onMouseEnter={() => setShowMore(true)}
						onMouseLeave={() => {
							if (!searchFilter?.search?.genreList?.length) setShowMore(false);
						}}
					>
						{renderCheckboxes('genreList', Object.values(GameGenre))}
					</Stack>
				</Stack>
				<Stack className={'find-your-game'} mb={'30px'}>
					<Typography className={'title'}>Game Mode</Typography>
					{renderCheckboxes('modeList', Object.values(GameMode))}
				</Stack>
				<Stack className={'find-your-game'} mb={'30px'}>
					<Typography className={'title'}>Pricing</Typography>
					{renderCheckboxes('typeList', Object.values(GameType))}
					<Stack className={'input-box'}>
						<Checkbox
							id={'featured'}
							className="game-checkbox"
							color="default"
							size="small"
							checked={searchFilter?.search?.isFeatured === true}
							onChange={featuredHandler}
						/>
						<label htmlFor={'featured'} style={{ cursor: 'pointer' }}>
							<Typography className="game-option">Featured only</Typography>
						</label>
					</Stack>
				</Stack>
				<Stack className={'find-your-game'} mb={'30px'}>
					<Typography className={'title'}>Release Year</Typography>
					<Stack className="range-input">
						<FormControl fullWidth>
							<InputLabel id="release-start-label">From</InputLabel>
							<Select
								labelId="release-start-label"
								value={yearOf(searchFilter?.search?.releaseDateRange?.start)}
								label="From"
								onChange={(e: any) => releaseYearHandler(e, 'start')}
								MenuProps={MenuProps}
							>
								<MenuItem value={''}>Any</MenuItem>
								{gameReleaseYears.map((year: number) => (
									<MenuItem
										value={year}
										key={year}
										disabled={year > (yearOf(searchFilter?.search?.releaseDateRange?.end) || Infinity)}
									>
										{year}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<div className="central-divider"></div>
						<FormControl fullWidth>
							<InputLabel id="release-end-label">To</InputLabel>
							<Select
								labelId="release-end-label"
								value={yearOf(searchFilter?.search?.releaseDateRange?.end)}
								label="To"
								onChange={(e: any) => releaseYearHandler(e, 'end')}
								MenuProps={MenuProps}
							>
								<MenuItem value={''}>Any</MenuItem>
								{gameReleaseYears.map((year: number) => (
									<MenuItem
										value={year}
										key={year}
										disabled={year < (yearOf(searchFilter?.search?.releaseDateRange?.start) || 0)}
									>
										{year}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Stack>
				</Stack>
				<Stack className={'find-your-game'}>
					<Typography className={'title'}>Price Range</Typography>
					<Stack className="range-input">
						<input
							type="number"
							placeholder="$ min"
							min={0}
							value={searchFilter?.search?.pricesRange?.start ?? ''}
							onChange={(e: any) => {
								if (e.target.value === '' || e.target.value >= 0) priceHandler(e.target.value, 'start');
							}}
						/>
						<div className="central-divider"></div>
						<input
							type="number"
							placeholder="$ max"
							min={0}
							value={searchFilter?.search?.pricesRange?.end ?? ''}
							onChange={(e: any) => {
								if (e.target.value === '' || e.target.value >= 0) priceHandler(e.target.value, 'end');
							}}
						/>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Filter;
