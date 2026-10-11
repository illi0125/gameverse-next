import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutCatalog from '../libs/components/layout/LayoutCatalog';
import GvErrorState from '../libs/components/common/GvErrorState';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const NotFound: NextPage = () => {
	return (
		<GvErrorState
			code="404"
			title="Page not found."
			lead="This link leads nowhere. It may be mistyped, or the page has moved."
			actions={
				<>
					<Link href="/" className="gv-gd-cta gv-gd-cta--solid">
						Back to home
					</Link>
					<Link href="/game" className="gv-gd-cta">
						Browse games
					</Link>
				</>
			}
		/>
	);
};

export default withLayoutCatalog(NotFound);
