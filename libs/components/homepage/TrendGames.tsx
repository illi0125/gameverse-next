import React, { useState } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Game } from '../../types/game/game';
import { GamesInquiry } from '../../types/game/game.input';
import HomeGameCard from './HomeGameCard';
import HomeSection from './HomeSection';
import { RailControls, RailTrack, useHomeRail } from './HomeRail';
import { useMutation, useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_GAME } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TrendGamesProps {
	initialInput: GamesInquiry;
}

const TrendGames = (props: TrendGamesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendGames, setTrendGames] = useState<Game[]>([]);
	const rail = useHomeRail(trendGames.length);

	/** APOLLO REQUESTS **/
	const [likeTargetGame] = useMutation(LIKE_TARGET_GAME);

	const {
		loading: getGamesLoading,
		data: getGamesData,
		error: getGamesError,
		refetch: getGamesRefetch,
	} = useQuery(GET_GAMES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrendGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/
	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			// execute likeTargetGame Mutation
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: initialInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (!trendGames) return null;

	return (
		<HomeSection
			id="trending-games"
			title="Trending games"
			description="The most liked games in the catalog."
			actions={<RailControls rail={rail} label="trending games" />}
		>
			{trendGames.length === 0 ? (
				<p className="gv-empty">No trending games yet.</p>
			) : (
				<RailTrack rail={rail} label="Trending games" itemClassName={device === 'mobile' ? 'is-compact' : ''}>
					{trendGames.map((game: Game) => (
						<HomeGameCard key={game._id} game={game} variant={'trend'} likeGameHandler={likeGameHandler} />
					))}
				</RailTrack>
			)}
		</HomeSection>
	);
};

TrendGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'gameLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendGames;
