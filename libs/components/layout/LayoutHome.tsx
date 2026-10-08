import React, { useEffect } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';
import HomeHero from '../homepage/HomeHero';
import FiberContainer from '../common/FiberContainer';
import HeaderFilter from '../homepage/HeaderFilter';
import { userVar } from '../../../apollo/store';
import { useReactiveVar } from '@apollo/client';
import { getJwtToken, updateUserInfo } from '../../auth';
import Chat from '../Chat';
import HomeChapters from '../homepage/HomeChapters';
import HomeCredits from '../homepage/HomeCredits';

const withLayoutMain = (Component: any) => {
	return (props: any) => {
		const device = useDeviceDetect();
		const user = useReactiveVar(userVar);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		/** HANDLERS **/

		if (device == 'mobile') {
			return (
				<>
					<Head>
						<title>Gameverse</title>
						<meta name={'title'} content={`Gameverse`} />
					</Head>
					<Stack id="mobile-wrap" className={'gv-home-shell'}>
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack id={'main'} className={'gv-home'}>
							<HomeHero />
							<Component {...props} />
						</Stack>

						<Stack id={'footer'}>
							<Footer />
							<HomeCredits />
						</Stack>
					</Stack>
				</>
			);
		} else {
			return (
				<>
					<Head>
						<title>Gameverse</title>
						<meta name={'title'} content={`Gameverse`} />
					</Head>
					<Stack id="pc-wrap" className={'gv-home-shell'}>
						<Stack id={'top'}>
							<Top />
						</Stack>

						<Stack id={'main'} className={'gv-home'}>
							<HomeHero search={<HeaderFilter />} visual={<FiberContainer />} />
							<Component {...props} />
						</Stack>

						<HomeChapters />

						<Chat />

						<Stack id={'footer'}>
							<Footer />
							<HomeCredits />
						</Stack>
					</Stack>
				</>
			);
		}
	};
};

export default withLayoutMain;
