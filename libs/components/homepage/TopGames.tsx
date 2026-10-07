import React, { useState } from 'react';
import HomeGameCard from './HomeGameCard';
import HomeSection from './HomeSection';
import { GamesInquiry } from '../../types/game/game.input';
import { Game } from '../../types/game/game';
import { useMutation, useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_GAME } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface TopGamesProps {
	initialInput: GamesInquiry;
}

const TopGames = (props: TopGamesProps) => {
	const { initialInput } = props;
	const [topGames, setTopGames] = useState<Game[]>([]);

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
			setTopGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/
	const likeGameHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetGame({ variables: { input: id } });
			await getGamesRefetch({ input: initialInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeGameHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<HomeSection
			id="top-games"
			title="Top ranked"
			description="Ranked by views, likes and reviews."
		>
			{topGames.length === 0 ? (
				<p className="gv-empty">No ranked games yet.</p>
			) : (
				<ol className="gv-ranks" aria-label="Top ranked games">
					{topGames.map((game: Game, index: number) => (
						<li key={game._id}>
							<HomeGameCard game={game} variant={'top'} rank={index + 1} likeGameHandler={likeGameHandler} />
						</li>
					))}
				</ol>
			)}
		</HomeSection>
	);
};

TopGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'gameRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopGames;
