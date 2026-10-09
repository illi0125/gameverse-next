import React, { useEffect } from 'react';
import Head from 'next/head';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Top from '../Top';
import Footer from '../Footer';
import Chat from '../Chat';
import { getJwtToken, updateUserInfo } from '../../auth';

/**
 * Layout for the redesigned Games catalog: same Top / Chat / Footer and session refresh as LayoutBasic,
 * without the legacy banner header. `gv-catalog-shell` scopes the header and footer skin to this page.
 */
const withLayoutCatalog = (Component: any) => {
	return (props: any) => {
		const device = useDeviceDetect();

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		const head = (
			<Head>
				<title>Gameverse | Games</title>
				<meta name={'title'} content={`Gameverse`} />
			</Head>
		);

		if (device == 'mobile') {
			return (
				<>
					{head}
					<Stack id="mobile-wrap" className={'gv-catalog-shell'}>
						<Stack id={'top'}>
							<Top />
						</Stack>
						<Stack id={'main'}>
							<Component {...props} />
						</Stack>
						<Stack id={'footer'}>
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		}

		return (
			<>
				{head}
				<Stack id="pc-wrap" className={'gv-catalog-shell'}>
					<Stack id={'top'}>
						<Top />
					</Stack>
					<Stack id={'main'}>
						<Component {...props} />
					</Stack>
					<Chat />
					<Stack id={'footer'}>
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};
};

export default withLayoutCatalog;
