import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Stack, Box } from '@mui/material';
import moment from 'moment';
import Link from 'next/link';
import { GamePlatform } from '../enums/game.enum';
import { formatEnumLabel } from '../utils';

const Footer = () => {
	return (
		<Stack className={'footer-container'}>
			<Stack className={'main'}>
				<Stack className={'left'}>
					<Box component={'div'} className={'footer-box'}>
						<img src="/img/logo/logoWhite.svg" alt="" className={'logo'} />
					</Box>
					<Box component={'div'} className={'footer-box'}>
						<span>total free customer care</span>
						<p>+82 10 4867 2909</p>
					</Box>
					<Box component={'div'} className={'footer-box'}>
						<span>nee live</span>
						<p>+82 10 4867 2909</p>
						<span>Support?</span>
					</Box>
					<Box component={'div'} className={'footer-box'}>
						<p>follow us on social media</p>
						<div className={'media-box'}>
							<FacebookOutlinedIcon />
							<TelegramIcon />
							<InstagramIcon />
							<TwitterIcon />
						</div>
					</Box>
				</Stack>
				<Stack className={'right'}>
					<Box component={'div'} className={'top'}>
						<strong>keep yourself up to date</strong>
						<div>
							<input type="text" placeholder={'Your Email'} />
							<span>Subscribe</span>
						</div>
					</Box>
					<Box component={'div'} className={'bottom'}>
						<div>
							<strong>Popular Search</strong>
							<Link href={'/game?input={"page":1,"limit":9,"sort":"createdAt","direction":"DESC","search":{"typeList":["FREE"]}}'}>
								<span>Free Games</span>
							</Link>
							<Link href={'/game?input={"page":1,"limit":9,"sort":"gameRank","direction":"DESC","search":{}}'}>
								<span>Top Ranked</span>
							</Link>
						</div>
						<div>
							<strong>Quick Links</strong>
							<span>Terms of Use</span>
							<span>Privacy Policy</span>
							<span>Pricing Plans</span>
							<span>Our Services</span>
							<span>Contact Support</span>
							<span>FAQs</span>
						</div>
						<div>
							<strong>Discover</strong>
							{[GamePlatform.PC, GamePlatform.PLAYSTATION, GamePlatform.XBOX, GamePlatform.NINTENDO].map((platform) => (
								<Link
									key={platform}
									href={`/game?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search: { platformList: [platform] } })}`}
								>
									<span>{formatEnumLabel(platform)}</span>
								</Link>
							))}
						</div>
					</Box>
				</Stack>
			</Stack>
			<Stack className={'second'}>
				<span>© Gameverse - All rights reserved. Gameverse {moment().year()}</span>
				<span>Privacy · Terms · Sitemap</span>
			</Stack>
		</Stack>
	);
};

export default Footer;
