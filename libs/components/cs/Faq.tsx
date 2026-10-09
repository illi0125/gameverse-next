import React, { SyntheticEvent, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, Box, Stack, Typography } from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { useRouter } from 'next/router';
import { styled } from '@mui/material/styles';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useQuery } from '@apollo/client';
import { GET_NOTICES } from '../../../apollo/user/query';
import { NoticeCategory, SupportTopic } from '../../enums/notice.enum';
import { Direction } from '../../enums/common.enum';
import { Notice } from '../../types/notice/notice';

/** Public FAQ tabs → backend SupportTopic (entries are managed in Admin › Support › FAQ) **/
const faqTopics: Record<string, SupportTopic> = {
	games: SupportTopic.GAMES,
	payment: SupportTopic.PAYMENT,
	players: SupportTopic.PLAYERS,
	agents: SupportTopic.DEVELOPERS,
	membership: SupportTopic.MEMBERSHIP,
	community: SupportTopic.COMMUNITY,
	other: SupportTopic.OTHER,
};

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
	const [expanded, setExpanded] = useState<string | false>(false);

	/** APOLLO REQUESTS **/
	const {
		loading,
		data: faqData,
		error,
	} = useQuery(GET_NOTICES, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				page: 1,
				limit: 100,
				sort: 'createdAt',
				direction: Direction.ASC,
				search: { noticeCategory: NoticeCategory.FAQ, noticeTopic: faqTopics[category] },
			},
		},
	});
	const faqs: Notice[] = faqData?.getNotices?.list ?? [];

	/** HANDLERS **/
	const changeCategoryHandler = (category: string) => {
		setCategory(category);
		setExpanded(false);
	};

	const handleChange = (panel: string) => (event: SyntheticEvent, newExpanded: boolean) => {
		setExpanded(newExpanded ? panel : false);
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
					{faqs.length === 0 && (
						<Typography className={'faq-empty'}>
							{loading
								? 'Loading questions…'
								: error
								? 'Questions are unavailable right now.'
								: 'No questions in this topic yet.'}
						</Typography>
					)}
					{faqs.map((faq: Notice) => (
						<Accordion expanded={expanded === faq._id} onChange={handleChange(faq._id)} key={faq._id}>
							<AccordionSummary id="panel1d-header" className="question" aria-controls="panel1d-content">
								<Typography className="badge" variant={'h4'}>
									Q
								</Typography>
								<Typography> {faq.noticeTitle}</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Stack className={'answer flex-box'}>
									<Typography className="badge" variant={'h4'} color={'primary'}>
										A
									</Typography>
									<Typography> {faq.noticeContent}</Typography>
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
