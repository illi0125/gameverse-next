import React, { useEffect } from 'react';
import useHomeScrollMemory from '../../hooks/useHomeScrollMemory';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack } from '@mui/material';
import HomeHero from '../homepage/HomeHero';
import HomeShelf from '../homepage/HomeShelf';
import HeaderFilter from '../homepage/HeaderFilter';
import { userVar } from '../../../apollo/store';
import { useReactiveVar } from '@apollo/client';
import { getJwtToken, updateUserInfo } from '../../auth';
import Chat from '../Chat';
import HomeChapters from '../homepage/HomeChapters';
import HomeCredits from '../homepage/HomeCredits';
import HomeIntro from '../homepage/HomeIntro';

const withLayoutMain = (Component: any) => {
	return (props: any) => {
		const user = useReactiveVar(userVar);
		useHomeScrollMemory();

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		/** HANDLERS **/

		return (
			<>
				<Head>
					<title>Gameverse</title>
					<meta name={'title'} content={`Gameverse`} />
				</Head>
				<Stack id="pc-wrap" className={'gv-home-shell'}>
					<HomeIntro />
					<Stack id={'top'}>
						<Top />
					</Stack>

					<Stack id={'main'} className={'gv-home'}>
						<HomeHero search={<HeaderFilter />} visual={<HomeShelf />} />
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
	};
};

export default withLayoutMain;
