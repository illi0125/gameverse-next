import React, { useState } from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import HomeSection from './HomeSection';
import CommunityCard from './CommunityCard';
import { BoardArticle } from '../../types/board-article/board-article';
import { useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { T } from '../../types/common';

const CommunityBoards = () => {
	const device = useDeviceDetect();
	const [searchCommunity, setSearchCommunity] = useState({
		page: 1,
		sort: 'articleViews',
		direction: 'DESC',
	});
	const [newsArticles, setNewsArticles] = useState<BoardArticle[]>([]);
	const [freeArticles, setFreeArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/

	const {
		loading: getNewsArticlesLoading,
		data: getNewsArticlesData,
		error: getNewsArticlesError,
		refetch: getNewsArticlesRefetch,
	} = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: {...searchCommunity, limit:6, search:{articleCategory: BoardArticleCategory.NEWS}} },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setNewsArticles(data?.getBoardArticles?.list);
		},
  });
  
   const {
			loading: getFreeArticlesLoading,
			data: getFreeArticlesData,
			error: getFreeArticlesError,
			refetch: getFreeArticlesRefetch,
		} = useQuery(GET_BOARD_ARTICLES, {
			fetchPolicy: 'network-only',
			variables: { input: { ...searchCommunity, limit: 3, search: { articleCategory: BoardArticleCategory.FREE } } },
			notifyOnNetworkStatusChange: true,
			onCompleted: (data: T) => {
				setFreeArticles(data?.getBoardArticles?.list);
			},
		});

	if (device === 'mobile') {
		return <div>COMMUNITY BOARDS (MOBILE)</div>;
	} else {
		return (
			<HomeSection
				id="community"
				title="From the community"
				description="The most read posts on the news and free boards."
			>
				<div className="gv-community">
					<div className="gv-board">
						<h3 className="gv-board__title">
							<Link href={'/community?articleCategory=NEWS'} className="gv-link">
								News
								<ArrowForwardRoundedIcon aria-hidden />
							</Link>
						</h3>
						{newsArticles.length === 0 ? (
							<p className="gv-empty">No news posts yet.</p>
						) : (
							<ol className="gv-board__grid" aria-label="Most read news">
								{newsArticles.map((article, index) => (
									<li key={article?._id}>
										<CommunityCard vertical={true} article={article} index={index} />
									</li>
								))}
							</ol>
						)}
					</div>
					<div className="gv-board gv-board--list">
						<h3 className="gv-board__title">
							<Link href={'/community?articleCategory=FREE'} className="gv-link">
								Free board
								<ArrowForwardRoundedIcon aria-hidden />
							</Link>
						</h3>
						{freeArticles.length === 0 ? (
							<p className="gv-empty">No free board posts yet.</p>
						) : (
							<ul className="gv-board__list" aria-label="Most read free board posts">
								{freeArticles.map((article, index) => (
									<li key={article?._id}>
										<CommunityCard vertical={false} article={article} index={index} />
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</HomeSection>
		);
	}
};

export default CommunityBoards;
