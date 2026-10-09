import React from 'react';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Stack, Box } from '@mui/material';

const About: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>ABOUT PAGE MOBILE</div>;
	} else {
		return (
			<Stack className={'about-page'}>
				<Stack className={'intro'}>
					<Stack className={'container'}>
						<Stack className={'left'}>
							<strong>We're on a Mission to Make Finding Your Next Game Simple.</strong>
						</Stack>
						<Stack className={'right'}>
							<p>
								Gameverse brings PC, console and mobile games together in one catalog, so you can compare platforms,
								genres, game modes and prices without jumping between stores.
								<br />
								<br />
								Developers keep listings up to date with release dates, system requirements and media, while players
								follow trends, save favorites and share their opinions with the community.
							</p>
							<Stack className={'boxes'}>
								<div className={'box'}>
									<div>
										<SportsEsportsOutlinedIcon sx={{ color: '#181a20' }} />
									</div>
									<span>Every Platform</span>
									<p>PC, PlayStation, Xbox, Nintendo and mobile in one place.</p>
								</div>
								<div className={'box'}>
									<div>
										<img src="/img/icons/securePayment.svg" alt="" />
									</div>
									<span>Honest Pricing</span>
									<p>Clear prices and discounts on every listing.</p>
								</div>
							</Stack>
						</Stack>
					</Stack>
				</Stack>
				<Stack className={'statistics'}>
					<Stack className={'container'}>
						<Stack className={'banner'}>
							<img src="/img/gameverse/hero.svg" alt="" />
						</Stack>
						<Stack className={'info'}>
							<Box component={'div'}>
								<strong>5</strong>
								<p>Platforms</p>
							</Box>
							<Box component={'div'}>
								<strong>10</strong>
								<p>Genres</p>
							</Box>
							<Box component={'div'}>
								<strong>3</strong>
								<p>Game Modes</p>
							</Box>
						</Stack>
					</Stack>
				</Stack>
				<Stack className={'agents'}>
					<Stack className={'container'}>
						<span className={'title'}>Our Developers</span>
						<p className={'desc'}>Meet the developers who curate our catalog</p>
						<Stack className={'wrap'}>
							{/*{[1, 2, 3, 4, 5].map(() => {*/}
							{/*	return <AgentCard />;*/}
							{/*})}*/}
						</Stack>
					</Stack>
				</Stack>
				<Stack className={'options'}>
					<img src="/img/gameverse/about.svg" alt="" className={'about-banner'} />
					<Stack className={'container'}>
						<strong>Let’s get your games in front of players</strong>
						<Stack>
							<div className={'icon-box'}>
								<img src="/img/icons/security.svg" alt="" />
							</div>
							<div className={'text-box'}>
								<span>List Your Games</span>
								<p>Publish games with media, platforms, pricing and system requirements.</p>
							</div>
						</Stack>
						<Stack>
							<div className={'icon-box'}>
								<img src="/img/icons/keywording.svg" alt="" />
							</div>
							<div className={'text_-box'}>
								<span>Reach Players</span>
								<p>Get discovered through trending, popular and top-ranked sections.</p>
							</div>
						</Stack>
						<Stack>
							<div className={'icon-box'}>
								<img src="/img/icons/investment.svg" alt="" />
							</div>
							<div className={'text-box'}>
								<span>Grow Your Audience</span>
								<p>Collect likes, views and comments, and build followers as a developer.</p>
							</div>
						</Stack>
						<Stack className={'btn'}>
							Learn More
							<img src="/img/icons/rightup.svg" alt="" />
						</Stack>
					</Stack>
				</Stack>
				<Stack className={'partners'}>
					<Stack className={'container'}>
						<span>Trusted by the world's best</span>
						<Stack className={'wrap'}>
							<img src="/img/icons/brands/amazon.svg" alt="" />
							<img src="/img/icons/brands/amd.svg" alt="" />
							<img src="/img/icons/brands/cisco.svg" alt="" />
							<img src="/img/icons/brands/dropcam.svg" alt="" />
							<img src="/img/icons/brands/spotify.svg" alt="" />
						</Stack>
					</Stack>
				</Stack>
				<Stack className={'help'}>
					<Stack className={'container'}>
						<Box component={'div'} className={'left'}>
							<strong>Need help? Talk to our expert.</strong>
							<p>Talk to our team or browse through more games.</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'white'}>
								Contact Us
								<img src="/img/icons/rightup.svg" alt="" />
							</div>
							<div className={'black'}>
								<img src="/img/icons/call.svg" alt="" />
								920 851 9087
							</div>
						</Box>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default withLayoutBasic(About);
