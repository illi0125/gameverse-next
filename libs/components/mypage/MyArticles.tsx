import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination } from '@mui/material';
import Link from 'next/link';
import MyPageHead from './MyPageHead';
import PostEntry from '../community/PostEntry';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { Messages } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

const MyArticles: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const [searchCommunity, setSearchCommunity] = useState({
		...initialInput,
		search: { memberId: user._id },
	});
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const {
		loading: boardArticlesLoading,
		data: boardArticlesData,
		error: getBoardArticlesError,
		refetch: boardArticlesRefetch,
	} = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: searchCommunity },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list);
			setTotalCount(data?.getBoardArticles?.metaCounter?.[0]?.total);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const likeBoardArticleHandler = async (e: any, user: T, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetBoardArticle({ variables: { input: id } });
			await boardArticlesRefetch({ input: searchCommunity });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeBoardArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const pageCount = Math.ceil((totalCount ?? 0) / searchCommunity.limit);

	return (
		<div className="gv-mp-section gv-mp-articles gv-cm">
			<MyPageHead kicker="Community" title="My articles" desc="Everything you posted on the boards, newest first.">
				<Link href={{ pathname: '/mypage', query: { category: 'writeArticle' } }} scroll={false} className="gv-mp-btn gv-mp-btn--solid">
					Write article
				</Link>
			</MyPageHead>
			{boardArticles?.length > 0 ? (
				<ol className="gv-cm-feed" aria-label="My articles">
					{boardArticles?.map((boardArticle: BoardArticle) => (
						<li key={boardArticle?._id}>
							<PostEntry article={boardArticle} likeArticleHandler={likeBoardArticleHandler} />
						</li>
					))}
				</ol>
			) : (
				<div className="gv-cat-empty">
					<p className="gv-cat-empty__title">{boardArticlesLoading ? 'Loading articles…' : 'No articles yet.'}</p>
					{!boardArticlesLoading && (
						<Link href={{ pathname: '/mypage', query: { category: 'writeArticle' } }} scroll={false} className="gv-cat-empty__reset">
							Write your first post
						</Link>
					)}
				</div>
			)}

			{boardArticles?.length > 0 && (
				<nav className="gv-cat-pagination" aria-label="Article pages">
					{pageCount > 1 ? (
						<Pagination count={pageCount} page={searchCommunity.page} shape="rounded" onChange={paginationHandler} />
					) : (
						<span />
					)}
					<p className="gv-cat-pagination__total">Total {totalCount ?? 0} article(s) available</p>
				</nav>
			)}
		</div>
	);
};

MyArticles.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default MyArticles;
