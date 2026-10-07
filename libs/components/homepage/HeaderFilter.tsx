import React, { useEffect, useRef, useState } from 'react';
import { Stack, Box, Modal, Divider, Button } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { gamePriceMax, gameReleaseYears } from '../../config';
import { GameGenre, GameMode, GamePlatform, GameType } from '../../enums/game.enum';
import { GamesInquiry } from '../../types/game/game.input';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { formatEnumLabel } from '../../utils';

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	bgcolor: 'background.paper',
	borderRadius: '12px',
	outline: 'none',
	boxShadow: 24,
};

const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: '200px',
		},
	},
};

const priceSteps = [0, 10, 20, 30, 50, 70, 100, 200];

interface HeaderFilterProps {
	initialInput: GamesInquiry;
}

const HeaderFilter = (props: HeaderFilterProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const { t, i18n } = useTranslation('common');
	const [searchFilter, setSearchFilter] = useState<GamesInquiry>(initialInput);
	const platformRef: any = useRef();
	const genreRef: any = useRef();
	const typeRef: any = useRef();
	const router = useRouter();
	const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
	const [openPlatform, setOpenPlatform] = useState(false);
	const [openGenre, setOpenGenre] = useState(false);
	const [openType, setOpenType] = useState(false);
	const [yearCheck, setYearCheck] = useState<{ start: number | ''; end: number | '' }>({ start: '', end: '' });
	const [priceCheck, setPriceCheck] = useState<{ start: number | ''; end: number | '' }>({ start: '', end: '' });

	/** LIFECYCLES **/
	useEffect(() => {
		const clickHandler = (event: MouseEvent) => {
			if (!platformRef?.current?.contains(event.target)) setOpenPlatform(false);
			if (!genreRef?.current?.contains(event.target)) setOpenGenre(false);
			if (!typeRef?.current?.contains(event.target)) setOpenType(false);
		};

		document.addEventListener('mousedown', clickHandler);

		return () => {
			document.removeEventListener('mousedown', clickHandler);
		};
	}, []);

	/** HANDLERS **/
	const disableAllStateHandler = () => {
		setOpenPlatform(false);
		setOpenGenre(false);
		setOpenType(false);
	};

	const advancedFilterHandler = (status: boolean) => {
		disableAllStateHandler();
		setOpenAdvancedFilter(status);
	};

	const platformStateChangeHandler = () => {
		setOpenPlatform((prev) => !prev);
		setOpenGenre(false);
		setOpenType(false);
	};

	const genreStateChangeHandler = () => {
		setOpenGenre((prev) => !prev);
		setOpenPlatform(false);
		setOpenType(false);
	};

	const typeStateChangeHandler = () => {
		setOpenType((prev) => !prev);
		setOpenPlatform(false);
		setOpenGenre(false);
	};

	const platformSelectHandler = (value: GamePlatform) => {
		setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, platformList: [value] } });
		genreStateChangeHandler();
	};

	const genreSelectHandler = (value: GameGenre) => {
		setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, genreList: [value] } });
		typeStateChangeHandler();
	};

	const typeSelectHandler = (value: GameType) => {
		setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, typeList: [value] } });
		disableAllStateHandler();
	};

	const modeSelectHandler = (mode: GameMode | null) => {
		const current = searchFilter?.search?.modeList || [];
		const modeList = mode === null ? [] : current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode];
		setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, modeList } });
	};

	const featuredChangeHandler = (e: any) => {
		setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, isFeatured: e.target.value === 'featured' } });
	};

	const resetFilterHandler = () => {
		setSearchFilter(initialInput);
		setYearCheck({ start: '', end: '' });
		setPriceCheck({ start: '', end: '' });
	};

	const pushSearchHandler = async () => {
		try {
			const search = { ...searchFilter.search };
			if (!search.platformList?.length) delete search.platformList;
			if (!search.genreList?.length) delete search.genreList;
			if (!search.typeList?.length) delete search.typeList;
			if (!search.modeList?.length) delete search.modeList;
			if (!search.text) delete search.text;
			if (search.isFeatured !== true) delete search.isFeatured;

			if (yearCheck.start !== '' || yearCheck.end !== '') {
				const start = yearCheck.start === '' ? gameReleaseYears[gameReleaseYears.length - 1] : yearCheck.start;
				const end = yearCheck.end === '' ? gameReleaseYears[0] : yearCheck.end;
				search.releaseDateRange = {
					start: new Date(Date.UTC(start, 0, 1)).toISOString(),
					end: new Date(Date.UTC(end, 11, 31, 23, 59, 59)).toISOString(),
				};
			}

			if (priceCheck.start !== '' || priceCheck.end !== '') {
				search.pricesRange = {
					start: priceCheck.start === '' ? 0 : priceCheck.start,
					end: priceCheck.end === '' ? gamePriceMax : priceCheck.end,
				};
			}

			const input = { ...searchFilter, search };
			await router.push(`/game?input=${JSON.stringify(input)}`, `/game?input=${JSON.stringify(input)}`);
		} catch (err: any) {
			console.log('ERROR, pushSearchHandler:', err);
		}
	};

	if (device === 'mobile') {
		return <div>HEADER FILTER MOBILE</div>;
	} else {
		return (
			<>
				<Stack className={'search-box'}>
					<Stack className={'select-box'}>
						<Box component={'div'} className={`box ${openPlatform ? 'on' : ''}`} onClick={platformStateChangeHandler}>
							<span>
								{searchFilter?.search?.platformList
									? formatEnumLabel(searchFilter.search.platformList[0])
									: t('Platform')}
							</span>
							<ExpandMoreIcon />
						</Box>
						<Box className={`box ${openGenre ? 'on' : ''}`} onClick={genreStateChangeHandler}>
							<span>
								{searchFilter?.search?.genreList ? formatEnumLabel(searchFilter.search.genreList[0]) : t('Genre')}
							</span>
							<ExpandMoreIcon />
						</Box>
						<Box className={`box ${openType ? 'on' : ''}`} onClick={typeStateChangeHandler}>
							<span>
								{searchFilter?.search?.typeList ? formatEnumLabel(searchFilter.search.typeList[0]) : t('Pricing')}
							</span>
							<ExpandMoreIcon />
						</Box>
					</Stack>
					<Stack className={'search-box-other'}>
						<Box className={'advanced-filter'} onClick={() => advancedFilterHandler(true)}>
							<img src="/img/icons/tune.svg" alt="" />
							<span>{t('Advanced')}</span>
						</Box>
						<Box className={'search-btn'} onClick={pushSearchHandler}>
							<img src="/img/icons/search_white.svg" alt="" />
						</Box>
					</Stack>

					{/*MENU */}
					<div className={`filter-rooms ${openPlatform ? 'on' : ''}`} ref={platformRef}>
						{Object.values(GamePlatform).map((platform: GamePlatform) => (
							<span onClick={() => platformSelectHandler(platform)} key={platform}>
								{formatEnumLabel(platform)}
							</span>
						))}
					</div>

					<div className={`filter-rooms wrap ${openGenre ? 'on' : ''}`} ref={genreRef}>
						{Object.values(GameGenre).map((genre: GameGenre) => (
							<span onClick={() => genreSelectHandler(genre)} key={genre}>
								{formatEnumLabel(genre)}
							</span>
						))}
					</div>

					<div className={`filter-rooms ${openType ? 'on' : ''}`} ref={typeRef}>
						{Object.values(GameType).map((type: GameType) => (
							<span onClick={() => typeSelectHandler(type)} key={type}>
								{formatEnumLabel(type)}
							</span>
						))}
					</div>
				</Stack>

				{/* ADVANCED FILTER MODAL */}
				<Modal
					open={openAdvancedFilter}
					onClose={() => advancedFilterHandler(false)}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					{/* @ts-ignore */}
					<Box sx={style}>
						<Box className={'advanced-filter-modal'}>
							<div className={'close'} onClick={() => advancedFilterHandler(false)}>
								<CloseIcon />
							</div>
							<div className={'top'}>
								<span>Find your game</span>
								<div className={'search-input-box'}>
									<img src="/img/icons/search.svg" alt="" />
									<input
										value={searchFilter?.search?.text ?? ''}
										type="text"
										placeholder={'Title, developer or publisher'}
										onChange={(e: any) => {
											setSearchFilter({
												...searchFilter,
												search: { ...searchFilter.search, text: e.target.value },
											});
										}}
									/>
								</div>
							</div>
							<Divider sx={{ mt: '30px', mb: '35px' }} />
							<div className={'middle'}>
								<div className={'row-box'}>
									<div className={'box'}>
										<span>game modes</span>
										<div className={'inside'}>
											<div
												className={`room ${!searchFilter?.search?.modeList?.length ? 'active' : ''}`}
												onClick={() => modeSelectHandler(null)}
											>
												Any
											</div>
											{Object.values(GameMode).map((mode: GameMode) => (
												<div
													className={`room mode ${searchFilter?.search?.modeList?.includes(mode) ? 'active' : ''}`}
													onClick={() => modeSelectHandler(mode)}
													key={mode}
												>
													{formatEnumLabel(mode)}
												</div>
											))}
										</div>
									</div>
									<div className={'box'}>
										<span>listing</span>
										<div className={'inside'}>
											<FormControl>
												<Select
													value={searchFilter?.search?.isFeatured ? 'featured' : 'all'}
													onChange={featuredChangeHandler}
													displayEmpty
													inputProps={{ 'aria-label': 'Without label' }}
												>
													<MenuItem value={'all'}>All Games</MenuItem>
													<MenuItem value={'featured'}>Featured Only</MenuItem>
												</Select>
											</FormControl>
										</div>
									</div>
								</div>
								<div className={'row-box'} style={{ marginTop: '44px' }}>
									<div className={'box'}>
										<span>Release Year</span>
										<div className={'inside space-between align-center'}>
											<FormControl sx={{ width: '122px' }}>
												<Select
													value={yearCheck.start}
													onChange={(e: any) => setYearCheck({ ...yearCheck, start: e.target.value })}
													displayEmpty
													inputProps={{ 'aria-label': 'Without label' }}
													MenuProps={MenuProps}
												>
													<MenuItem value={''}>Any</MenuItem>
													{gameReleaseYears.map((year: number) => (
														<MenuItem value={year} disabled={yearCheck.end !== '' && yearCheck.end < year} key={year}>
															{year}
														</MenuItem>
													))}
												</Select>
											</FormControl>
											<div className={'minus-line'}></div>
											<FormControl sx={{ width: '122px' }}>
												<Select
													value={yearCheck.end}
													onChange={(e: any) => setYearCheck({ ...yearCheck, end: e.target.value })}
													displayEmpty
													inputProps={{ 'aria-label': 'Without label' }}
													MenuProps={MenuProps}
												>
													<MenuItem value={''}>Any</MenuItem>
													{gameReleaseYears.map((year: number) => (
														<MenuItem
															value={year}
															disabled={yearCheck.start !== '' && yearCheck.start > year}
															key={year}
														>
															{year}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</div>
									</div>
									<div className={'box'}>
										<span>price ($)</span>
										<div className={'inside space-between align-center'}>
											<FormControl sx={{ width: '122px' }}>
												<Select
													value={priceCheck.start}
													onChange={(e: any) => setPriceCheck({ ...priceCheck, start: e.target.value })}
													displayEmpty
													inputProps={{ 'aria-label': 'Without label' }}
													MenuProps={MenuProps}
												>
													<MenuItem value={''}>Any</MenuItem>
													{priceSteps.map((price: number) => (
														<MenuItem
															value={price}
															disabled={priceCheck.end !== '' && priceCheck.end < price}
															key={price}
														>
															{price}
														</MenuItem>
													))}
												</Select>
											</FormControl>
											<div className={'minus-line'}></div>
											<FormControl sx={{ width: '122px' }}>
												<Select
													value={priceCheck.end}
													onChange={(e: any) => setPriceCheck({ ...priceCheck, end: e.target.value })}
													displayEmpty
													inputProps={{ 'aria-label': 'Without label' }}
													MenuProps={MenuProps}
												>
													<MenuItem value={''}>Any</MenuItem>
													{priceSteps.map((price: number) => (
														<MenuItem
															value={price}
															disabled={priceCheck.start !== '' && priceCheck.start > price}
															key={price}
														>
															{price}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</div>
									</div>
								</div>
							</div>
							<Divider sx={{ mt: '60px', mb: '18px' }} />
							<div className={'bottom'}>
								<div onClick={resetFilterHandler}>
									<img src="/img/icons/reset.svg" alt="" />
									<span>Reset all filters</span>
								</div>
								<Button
									startIcon={<img src={'/img/icons/search.svg'} />}
									className={'search-btn'}
									onClick={pushSearchHandler}
								>
									Search
								</Button>
							</div>
						</Box>
					</Box>
				</Modal>
			</>
		);
	}
};

HeaderFilter.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default HeaderFilter;
