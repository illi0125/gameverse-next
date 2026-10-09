import { NextPage } from 'next';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';
import PopularGames from '../libs/components/homepage/PopularGames';
import TopAgents from '../libs/components/homepage/TopAgents';
import Events from '../libs/components/homepage/Events';
import TrendGames from '../libs/components/homepage/TrendGames';
import TopGames from '../libs/components/homepage/TopGames';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	return (
		<>
			<TrendGames />
			<PopularGames />
			<TopGames />
			<TopAgents />
			<CommunityBoards />
			<Events />
		</>
	);
};

export default withLayoutMain(Home);
