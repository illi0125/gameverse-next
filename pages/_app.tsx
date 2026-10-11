import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState } from 'react';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import GvCursor from '../libs/components/common/GvCursor';
import PortalTransition from '../libs/components/transition/PortalTransition';
import AppErrorBoundary from '../libs/components/common/AppErrorBoundary';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';

const App = ({ Component, pageProps, router }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<AppErrorBoundary resetKey={router.pathname}>
					<Component {...pageProps} />
				</AppErrorBoundary>
				<PortalTransition />
				<GvCursor />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
