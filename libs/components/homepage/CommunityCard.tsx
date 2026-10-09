import React from 'react';
import Link from 'next/link';
import Moment from 'react-moment';
import { BoardArticle } from '../../types/board-article/board-article';

interface CommunityCardProps {
	vertical: boolean;
	article: BoardArticle;
	index: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Comms chapter: a news plate (vertical) or a free-board log entry (row) **/
const CommunityCard = (props: CommunityCardProps) => {
	const { vertical, article, index } = props;
	const articleImage = article?.articleImage
		? `${process.env.REACT_APP_API_URL}/${article?.articleImage}`
		: '/img/gameverse/article-placeholder.svg';

	const href = `/community/detail?articleCategory=${article?.articleCategory}&id=${article?._id}`;

	if (vertical) {
		return (
			<article className="gv-news-plate">
				<div className="gv-news-plate__art">
					<img src={articleImage} alt="" loading="lazy" decoding="async" />
					<span className="gv-news-plate__rank" aria-label={`Most read number ${index + 1}`}>
						No. {pad(index + 1)}
					</span>
				</div>
				<h4 className="gv-news-plate__title">
					<Link href={href} className="gv-stretched">
						{article?.articleTitle}
					</Link>
				</h4>
				<p className="gv-news-plate__meta">
					<span>{article?.articleViews ?? 0} views</span>
					<span>{article?.articleComments ?? 0} comments</span>
					<Moment format="DD.MM.YY">{article?.createdAt}</Moment>
				</p>
			</article>
		);
	}

	return (
		<article className="gv-log-entry">
			<span className="gv-log-entry__time">
				<Moment format="DD.MM.YY">{article?.createdAt}</Moment>
			</span>
			<div className="gv-log-entry__thumb" aria-hidden>
				<img src={articleImage} alt="" loading="lazy" decoding="async" />
			</div>
			<div className="gv-log-entry__text">
				<h4 className="gv-log-entry__title">
					<Link href={href} className="gv-stretched">
						{article?.articleTitle}
					</Link>
				</h4>
				<span className="gv-log-entry__meta">
					{article?.memberData?.memberNick ? `${article.memberData.memberNick} / ` : ''}
					{article?.articleViews ?? 0} views / {article?.articleLikes ?? 0} likes
				</span>
			</div>
		</article>
	);
};

export default CommunityCard;
