import React from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { formatEnumLabel } from '../../utils';
import Moment from 'react-moment';
import { BoardArticle } from '../../types/board-article/board-article';

interface CommunityCardProps {
	vertical: boolean;
	article: BoardArticle;
	index: number;
}

const CommunityCard = (props: CommunityCardProps) => {
	const { vertical, article, index } = props;
	const device = useDeviceDetect();
	const articleImage = article?.articleImage
		? `${process.env.REACT_APP_API_URL}/${article?.articleImage}`
		: '/img/gameverse/article-placeholder.svg';

	if (device === 'mobile') {
		return <div>COMMUNITY CARD (MOBILE)</div>;
	}

	const href = `/community/detail?articleCategory=${article?.articleCategory}&id=${article?._id}`;

	if (vertical) {
		return (
			<article className="gv-post">
				<div className="gv-post__cover">
					<img src={articleImage} alt="" width={480} height={300} loading="lazy" decoding="async" />
					<span className="gv-post__rank" aria-label={`Most read number ${index + 1}`}>
						{index + 1}
					</span>
				</div>
				<h4 className="gv-post__title">
					<Link href={href} className="gv-stretched">
						{article?.articleTitle}
					</Link>
				</h4>
				<span className="gv-post__meta">{formatEnumLabel(article?.articleCategory)}</span>
			</article>
		);
	}

	return (
		<article className="gv-post gv-post--row">
			<div className="gv-post__thumb">
				<img src={articleImage} alt="" width={160} height={120} loading="lazy" decoding="async" />
			</div>
			<div className="gv-post__text">
				<h4 className="gv-post__title">
					<Link href={href} className="gv-stretched">
						{article?.articleTitle}
					</Link>
				</h4>
				<span className="gv-post__meta">
					<Moment format="DD.MM.YY">{article?.createdAt}</Moment>
				</span>
			</div>
		</article>
	);
};

export default CommunityCard;
