import React, { useCallback, useEffect, useState } from 'react';
import {
	Checkbox,
	OutlinedInput,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Tooltip,
	IconButton,
} from '@mui/material';
import { GameGenre, GameMode, GamePlatform, GameType } from '../../enums/game.enum';
import { GameSearch, GamesInquiry } from '../../types/game/game.input';
import { useRouter } from 'next/router';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
	/** Presentation only: 'search' renders the title search console, 'panel' the filter groups **/
	part?: 'search' | 'panel';
}

const yearOf = (value?: Date | string): number | '' => (value ? new Date(value).getUTCFullYear() : '');

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput, part = 'panel' } = props;
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
		values.map((value: string) => {
			const checked = ((searchFilter?.search?.[key] as string[]) || []).includes(value);
			return (
				<label className={`gv-chip ${checked ? 'is-on' : ''}`} htmlFor={`${key}-${value}`} key={value}>
					<Checkbox
						id={`${key}-${value}`}
						className="gv-chip__input"
						color="default"
						size="small"
						value={value}
						checked={checked}
						onChange={(e: any) => listSelectHandler(key, e)}
					/>
					<span>{formatEnumLabel(value)}</span>
				</label>
			);
		});

	if (part === 'search') {
		return (
			<div className="gv-cat-search" role="search" aria-label="Search games">
				<span className="gv-cat-search__prompt" aria-hidden>
					Search the catalog
				</span>
				<OutlinedInput
					value={searchText}
					type={'text'}
					className={'gv-cat-search__input'}
					placeholder={'Title, developer or publisher'}
					inputProps={{ 'aria-label': 'Title, developer or publisher' }}
					onChange={(e: any) => setSearchText(e.target.value)}
					onKeyDown={(event: any) => {
						if (event.key == 'Enter') textHandler(searchText);
					}}
					endAdornment={
						searchText ? (
							<CancelRoundedIcon
								className="gv-cat-search__clear"
								aria-label="Clear search"
								onClick={() => {
									setSearchText('');
									textHandler('');
								}}
							/>
						) : undefined
					}
				/>
				<button type="button" className="gv-cat-search__go" aria-label="Search" onClick={() => textHandler(searchText)}>
					<SearchRoundedIcon aria-hidden />
				</button>
				<Tooltip title="Reset all filters">
					<IconButton className="gv-cat-search__reset" aria-label="Reset all filters" onClick={refreshHandler}>
						<RefreshIcon />
					</IconButton>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className={'gv-cat-filter'}>
			<fieldset className={'gv-cat-filter__group'}>
				<legend className={'gv-cat-filter__title'}>Platform</legend>
				<div className="gv-cat-filter__chips">{renderCheckboxes('platformList', Object.values(GamePlatform))}</div>
			</fieldset>
			<fieldset className={'gv-cat-filter__group'}>
				<legend className={'gv-cat-filter__title'}>Genre</legend>
				<div
					className={`gv-cat-filter__chips gv-cat-filter__chips--genre ${showMore ? 'is-open' : ''}`}
					onMouseEnter={() => setShowMore(true)}
					onMouseLeave={() => {
						if (!searchFilter?.search?.genreList?.length) setShowMore(false);
					}}
					onFocus={() => setShowMore(true)}
				>
					{renderCheckboxes('genreList', Object.values(GameGenre))}
				</div>
			</fieldset>
			<fieldset className={'gv-cat-filter__group'}>
				<legend className={'gv-cat-filter__title'}>Game mode</legend>
				<div className="gv-cat-filter__chips">{renderCheckboxes('modeList', Object.values(GameMode))}</div>
			</fieldset>
			<fieldset className={'gv-cat-filter__group'}>
				<legend className={'gv-cat-filter__title'}>Pricing</legend>
				<div className="gv-cat-filter__chips">
					{renderCheckboxes('typeList', Object.values(GameType))}
					<label className={`gv-chip ${searchFilter?.search?.isFeatured === true ? 'is-on' : ''}`} htmlFor={'featured'}>
						<Checkbox
							id={'featured'}
							className="gv-chip__input"
							color="default"
							size="small"
							checked={searchFilter?.search?.isFeatured === true}
							onChange={featuredHandler}
						/>
						<span>Featured only</span>
					</label>
				</div>
			</fieldset>
			<fieldset className={'gv-cat-filter__group'}>
				<legend className={'gv-cat-filter__title'}>Release year</legend>
				<div className="gv-cat-filter__range">
					<FormControl fullWidth size="small">
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
					<span className="gv-cat-filter__dash" aria-hidden />
					<FormControl fullWidth size="small">
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
				</div>
			</fieldset>
			<fieldset className={'gv-cat-filter__group'}>
				<legend className={'gv-cat-filter__title'}>Price range ($)</legend>
				<div className="gv-cat-filter__range">
					<input
						type="number"
						placeholder="Min"
						aria-label="Minimum price"
						min={0}
						value={searchFilter?.search?.pricesRange?.start ?? ''}
						onChange={(e: any) => {
							if (e.target.value === '' || e.target.value >= 0) priceHandler(e.target.value, 'start');
						}}
					/>
					<span className="gv-cat-filter__dash" aria-hidden />
					<input
						type="number"
						placeholder="Max"
						aria-label="Maximum price"
						min={0}
						value={searchFilter?.search?.pricesRange?.end ?? ''}
						onChange={(e: any) => {
							if (e.target.value === '' || e.target.value >= 0) priceHandler(e.target.value, 'end');
						}}
					/>
				</div>
			</fieldset>
		</div>
	);
};

export default Filter;
