import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import CommunityCard from './CommunityCard';
import { BoardArticle } from '../../types/board-article/board-article';
import { useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { T } from '../../types/common';
import { SCENE_QUERY } from './homeMotion';

const CommunityBoards = () => {
	const device = useDeviceDetect();
	const [searchCommunity, setSearchCommunity] = useState({
		page: 1,
		sort: 'articleViews',
		direction: 'DESC',
	});
	const [newsArticles, setNewsArticles] = useState<BoardArticle[]>([]);
	const [freeArticles, setFreeArticles] = useState<BoardArticle[]>([]);
	const rootRef = useRef<HTMLElement>(null);

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

	const news: BoardArticle[] = newsArticles ?? [];
	const free: BoardArticle[] = freeArticles ?? [];

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root || news.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			// News plates arrive tilted and settle as they reach the middle of the screen
			root.querySelectorAll<HTMLElement>('.gv-comms__news-item').forEach((item, index) => {
				gsap.fromTo(
					item,
					{ rotation: index % 2 ? 7 : -7, yPercent: 18 },
					{
						rotation: index % 2 ? 1.5 : -1.5,
						yPercent: 0,
						ease: 'none',
						scrollTrigger: { trigger: item, start: 'top bottom', end: 'center center', scrub: 0.5 },
					},
				);
			});
		});

		return () => mm.revert();
	}, [news.length]);

	if (device === 'mobile') {
		return <div>COMMUNITY BOARDS (MOBILE)</div>;
	} else {
		return (
			<section className="gv-comms" id="community" aria-labelledby="community-heading" ref={rootRef}>
				<div className="gv-comms__inner">
					<header className="gv-comms__head">
						<p className="gv-chapter" aria-hidden>
							<span>05</span>Comms
						</p>
						<h2 className="gv-comms__title" id="community-heading">
							<span>From the</span>
							<span className="gv-comms__title-line--2">community.</span>
						</h2>
						<p className="gv-comms__desc">The most read posts on the news and free boards.</p>
					</header>

					<div className="gv-comms__grid">
						<div className="gv-comms__news">
							<h3 className="gv-comms__board">
								<Link href={'/community?articleCategory=NEWS'}>News board</Link>
								<span aria-hidden>{String(news.length).padStart(2, '0')} posts</span>
							</h3>
							{news.length === 0 ? (
								<p className="gv-comms__empty">
									No news posts yet. <Link href={'/community?articleCategory=NEWS'}>Open the news board</Link>
								</p>
							) : (
								<ol className="gv-comms__news-list" aria-label="Most read news">
									{news.map((article, index) => (
										<li className="gv-comms__news-item" key={article?._id}>
											<CommunityCard vertical={true} article={article} index={index} />
										</li>
									))}
								</ol>
							)}
						</div>

						<div className="gv-comms__log">
							<h3 className="gv-comms__board">
								<Link href={'/community?articleCategory=FREE'}>Free board</Link>
								<span aria-hidden>Incoming</span>
							</h3>
							{free.length === 0 ? (
								<p className="gv-comms__empty">
									No posts on the free board yet.{' '}
									<Link href={'/community?articleCategory=FREE'}>Start the first thread</Link>
								</p>
							) : (
								<ul className="gv-comms__log-list" aria-label="Most read free board posts">
									{free.map((article, index) => (
										<li key={article?._id}>
											<CommunityCard vertical={false} article={article} index={index} />
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>
			</section>
		);
	}
};

export default CommunityBoards;
