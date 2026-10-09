import React, { SyntheticEvent, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, Box, Stack, Typography } from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { useRouter } from 'next/router';
import { styled } from '@mui/material/styles';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
	({ theme }) => ({
		border: `1px solid ${theme.palette.divider}`,
		'&:not(:last-child)': {
			borderBottom: 0,
		},
		'&:before': {
			display: 'none',
		},
	}),
);
const AccordionSummary = styled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary expandIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: '1.4rem' }} />} {...props} />
))(({ theme }) => ({
	backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : '#fff',
	'& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
		transform: 'rotate(180deg)',
	},
	'& .MuiAccordionSummary-content': {
		marginLeft: theme.spacing(1),
	},
}));

const Faq = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [category, setCategory] = useState<string>('games');
	const [expanded, setExpanded] = useState<string | false>('panel1');

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	
	/** HANDLERS **/
	const changeCategoryHandler = (category: string) => {
		setCategory(category);
	};

	const handleChange = (panel: string) => (event: SyntheticEvent, newExpanded: boolean) => {
		setExpanded(newExpanded ? panel : false);
	};

	const data: any = {
		games: [
			{
				id: '01',
				subject: 'What kinds of games are listed on Gameverse?',
				content: 'Gameverse lists PC, PlayStation, Xbox, Nintendo and mobile games across genres such as action, RPG, strategy, sports, racing, shooter, simulation, puzzle and horror.',
			},
			{
				id: '02',
				subject: 'How do I find a specific game?',
				content: 'Use the search bar on the Games page to search by title, developer or publisher, then narrow results by platform, genre, game mode, pricing type, release year and price.',
			},
			{
				id: '03',
				subject: 'What does "Upcoming" mean?',
				content: 'Upcoming games are announced but not yet released. Their pages show the planned release date, and they move to Active once the publisher releases them.',
			},
			{
				id: '04',
				subject: 'What is the difference between Free, Paid and Premium?',
				content: 'Free games cost nothing. Paid and Premium games have a listed price; a discounted price is shown when the developer has set one.',
			},
			{
				id: '05',
				subject: 'How are Trending, Popular and Top games chosen?',
				content: 'Trending is based on likes, Popular on views, and Top on a ranking that combines views, likes and reviews.',
			},
			{
				id: '06',
				subject: 'Can I see system requirements before choosing a game?',
				content: 'Yes. When the developer provides them, each game page lists minimum and recommended requirements per platform.',
			},
		],
		payment: [
			{
				id: '01',
				subject: 'Can I buy games directly on Gameverse?',
				content: 'Not yet. Gameverse currently works as a catalog. Checkout and payments are planned for a future release.',
			},
			{
				id: '02',
				subject: 'Why is the price different from the original price?',
				content: 'When a discount is active, the discounted price is shown and the original price is crossed out.',
			},
			{
				id: '03',
				subject: 'Are prices shown in a specific currency?',
				content: 'Prices are shown in US dollars.',
			},
			{
				id: '04',
				subject: 'Will I be charged for creating an account?',
				content: 'No. Creating an account and using the catalog is free.',
			},
		],
		players: [
			{
				id: '01',
				subject: 'How do I save games I am interested in?',
				content: 'Click the heart icon on any game. Liked games appear under My Favorites on your My Page.',
			},
			{
				id: '02',
				subject: 'Where can I see games I viewed recently?',
				content: 'Open My Page and choose Recently Visited.',
			},
			{
				id: '03',
				subject: 'Can I leave comments on games?',
				content: 'Yes. Log in and use the comment box at the bottom of any game page.',
			},
			{
				id: '04',
				subject: 'Can I follow developers?',
				content: 'Yes. Open a developer or member profile and press Follow to keep up with their activity.',
			},
		],
		agents: [
			{
				id: '01',
				subject: 'Who are developers on Gameverse?',
				content: 'Developers are members who list and manage games in the catalog.',
			},
			{
				id: '02',
				subject: 'How do I add a new game?',
				content: 'Log in with a developer account, open My Page and choose Add Game. Fill in the details, select platforms, genres and modes, and upload images.',
			},
			{
				id: '03',
				subject: 'What pricing rules apply to my listing?',
				content: 'Free games must have a price and discount of zero. Paid and Premium games need a positive price, and any discount must be lower than the price.',
			},
			{
				id: '04',
				subject: 'Can I change a game from Upcoming to Active?',
				content: 'Yes. In My Games, click the status badge and choose the new status, or edit the game.',
			},
			{
				id: '05',
				subject: 'What happens when I delete a game?',
				content: 'The game is removed from the public catalog and your listing count. Administrators can restore it if needed.',
			},
			{
				id: '06',
				subject: 'Can I change the game URL?',
				content: 'No. Each game gets a permanent URL when it is created, so links keep working even if you rename the game.',
			},
		],
		membership: [
			{
				id: '01',
				subject: 'How do I create an account?',
				content: 'Click Login / Register in the top bar and choose to sign up.',
			},
			{
				id: '02',
				subject: 'How do I update my profile?',
				content: 'Open My Page and choose My Profile to change your nickname, phone, address or profile image.',
			},
			{
				id: '03',
				subject: 'What should I do if I forget my password?',
				content: 'Please contact support through the CS page and we will help you recover access.',
			},
		],
		community: [
			{
				id: '01',
				subject: 'What can I post in the community?',
				content: 'You can write articles in the free board, recommendations, news and humor categories.',
			},
			{
				id: '02',
				subject: 'Are there community rules?',
				content: 'Be respectful, stay on topic and do not share spam or harmful content. Posts that break the rules may be removed.',
			},
			{
				id: '03',
				subject: 'How do I report inappropriate content?',
				content: 'Contact support through the CS page with a link to the content.',
			},
		],
		other: [
			{
				id: '01',
				subject: 'How can I contact support?',
				content: 'Use the Inquiry section on the CS page.',
			},
			{
				id: '02',
				subject: 'Which languages does Gameverse support?',
				content: 'English, Korean and Russian. Use the language selector in the top bar.',
			},
			{
				id: '03',
				subject: 'Can I request a new feature?',
				content: 'We welcome suggestions through the Inquiry section, although we cannot promise every request will be implemented.',
			},
		],
	};

	if (device === 'mobile') {
		return <div>FAQ MOBILE</div>;
	} else {
		return (
			<Stack className={'faq-content'}>
				<Box className={'categories'} component={'div'}>
					<div
						className={category === 'games' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('games');
						}}
					>
						Games
					</div>
					<div
						className={category === 'payment' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('payment');
						}}
					>
						Payment
					</div>
					<div
						className={category === 'players' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('players');
						}}
					>
						For Players
					</div>
					<div
						className={category === 'agents' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('agents');
						}}
					>
						For Developers
					</div>
					<div
						className={category === 'membership' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('membership');
						}}
					>
						Membership
					</div>
					<div
						className={category === 'community' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('community');
						}}
					>
						Community
					</div>
					<div
						className={category === 'other' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('other');
						}}
					>
						Other
					</div>
				</Box>
				<Box className={'wrap'} component={'div'}>
					{data[category] &&
						data[category].map((ele: any) => (
							<Accordion expanded={expanded === ele?.id} onChange={handleChange(ele?.id)} key={ele?.subject}>
								<AccordionSummary id="panel1d-header" className="question" aria-controls="panel1d-content">
									<Typography className="badge" variant={'h4'}>
										Q
									</Typography>
									<Typography> {ele?.subject}</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack className={'answer flex-box'}>
										<Typography className="badge" variant={'h4'} color={'primary'}>
											A
										</Typography>
										<Typography> {ele?.content}</Typography>
									</Stack>
								</AccordionDetails>
							</Accordion>
						))}
				</Box>
			</Stack>
		);
	}
};

export default Faq;
