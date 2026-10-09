import React from 'react';
import Link from 'next/link';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { userVar } from '../../../apollo/store';
import { BoardArticle } from '../../types/board-article/board-article';
import { memberTypeLabel } from '../../utils';
import { activeAuthor, articleExcerpt, articleHref, articleImage } from './communityMeta';

interface PostEntryProps {
	article: BoardArticle;
	feature?: boolean;
	/** Feature-plate label describing why this post leads (follows the active sort) **/
	flag?: string;
	likeArticleHandler: (e: any, user: any, id: string) => void;
}

/** Community post: a cut-art feature plate (first post) or a log row; the title is the keyboard link **/
const PostEntry = ({ article, feature = false, flag, likeArticleHandler }: PostEntryProps) => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const isLiked = Boolean(article?.meLiked?.[0]?.myFavorite);
	const likes = article?.articleLikes ?? 0;
	const author = activeAuthor(article);

	/** Same rule as CommunityCard: your own name opens My Page **/
	const goMemberPage = (id: string) => {
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};

	return (
		<article className={`gv-cm-post ${feature ? 'gv-cm-post--feature' : ''}`}>
			{/* Whole-post click target for pointer users */}
			<Link href={articleHref(article)} className="gv-cm-post__hit" aria-hidden tabIndex={-1} />

			<time className="gv-cm-post__date" dateTime={String(article?.createdAt)}>
				<Moment format={feature ? 'DD MMM YYYY' : 'DD MMM'}>{article?.createdAt}</Moment>
			</time>

			<div className="gv-cm-post__art" aria-hidden>
				<img src={articleImage(article)} alt="" loading="lazy" decoding="async" />
				{feature && flag && <span className="gv-cm-post__flag">{flag}</span>}
			</div>

			<div className="gv-cm-post__body">
				<h3 className="gv-cm-post__title">
					<Link href={articleHref(article)}>{article?.articleTitle}</Link>
				</h3>
				<p className="gv-cm-post__excerpt">{articleExcerpt(article?.articleContent, feature ? 220 : 140)}</p>

				<div className="gv-cm-post__foot">
					{author?._id ? (
						<button type="button" className="gv-cm-post__author" onClick={() => goMemberPage(author._id)}>
							{author.memberNick}
							<span>{memberTypeLabel(author.memberType)}</span>
						</button>
					) : (
						<span className="gv-cm-post__author gv-cm-post__author--gone">Deleted account</span>
					)}
					<span className="gv-cm-post__stat" aria-label={`${article?.articleViews ?? 0} views`}>
						<VisibilityOutlinedIcon aria-hidden />
						{article?.articleViews ?? 0}
					</span>
					<span className="gv-cm-post__stat" aria-label={`${article?.articleComments ?? 0} comments`}>
						<ChatBubbleOutlineRoundedIcon aria-hidden />
						{article?.articleComments ?? 0}
					</span>
					<button
						type="button"
						className={`gv-cm-like ${isLiked ? 'is-liked' : ''}`}
						aria-pressed={isLiked}
						aria-label={`${isLiked ? 'Unlike' : 'Like'} ${article?.articleTitle}, ${likes} likes`}
						onClick={(e) => likeArticleHandler(e, user, article?._id)}
					>
						{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
						{likes}
					</button>
				</div>
			</div>
		</article>
	);
};

export default PostEntry;
