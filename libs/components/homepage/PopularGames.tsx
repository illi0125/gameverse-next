import React, { useState } from 'react';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import HomeGameCard from './HomeGameCard';
import HomeSection from './HomeSection';
import { Game } from '../../types/game/game';
import Link from 'next/link';
import { GamesInquiry } from '../../types/game/game.input';
import { useQuery } from '@apollo/client';
import { GET_GAMES } from '../../../apollo/user/query';
import { T } from '../../types/common';

interface PopularGamesProps {
	initialInput: GamesInquiry;
}

const PopularGames = (props: PopularGamesProps) => {
	const { initialInput } = props;
	const [popularGames, setPopularGames] = useState<Game[]>([]);

	/** APOLLO REQUESTS **/

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
			setPopularGames(data?.getGames?.list ?? []);
		},
	});

	/** HANDLERS **/

	if (!popularGames) return null;

	return (
		<HomeSection
			id="popular-games"
			title="Popular games"
			description="The most viewed games in the catalog."
			tone="raised"
			actions={
				<Link href={'/game'} className="gv-link">
					See all games
					<ArrowForwardRoundedIcon aria-hidden />
				</Link>
			}
		>
			{popularGames.length === 0 ? (
				<p className="gv-empty">No popular games yet.</p>
			) : (
				<ul className="gv-bento" aria-label="Popular games">
					{popularGames.map((game: Game, index: number) => (
						<li className={index === 0 ? 'gv-bento__feature' : 'gv-bento__item'} key={game._id}>
							<HomeGameCard game={game} variant={'popular'} feature={index === 0} />
						</li>
					))}
				</ul>
			)}
		</HomeSection>
	);
};

PopularGames.defaultProps = {
	initialInput: {
		page: 1,
		limit: 7,
		sort: 'gameViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularGames;
