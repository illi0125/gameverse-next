import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutCatalog from '../libs/components/layout/LayoutCatalog';
import GvErrorState from '../libs/components/common/GvErrorState';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** Static server-error page. Client-side render errors are caught by AppErrorBoundary in _app **/
const ServerError: NextPage = () => {
	return (
		<GvErrorState
			code="500"
			title="Something broke."
			lead="The server could not finish this request. Try again in a moment."
			actions={
				<>
					{/* Full reloads: the app may be in a broken state */}
					<a href="/" className="gv-gd-cta gv-gd-cta--solid">
						Back to home
					</a>
				</>
			}
		/>
	);
};

export default withLayoutCatalog(ServerError);
