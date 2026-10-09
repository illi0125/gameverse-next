import React from 'react';
import { Comment } from '../../types/comment/comment';
import { REACT_APP_API_URL } from '../../config';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface ReviewProps {
	comment: Comment;
}

/** One comment as a log entry: mono date, cut avatar, author and the comment text **/
const Review = (props: ReviewProps) => {
	const { comment } = props;
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const imagePath: string = comment?.memberData?.memberImage
		? `${REACT_APP_API_URL}/${comment?.memberData?.memberImage}`
		: '/img/profile/defaultUser.svg';

	/** HANDLERS **/
	const goMemberPage = (id: string) => {
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};

	return (
		<li className="gv-gd-entry">
			<time className="gv-gd-entry__date" dateTime={String(comment.createdAt)}>
				<Moment format={'DD MMM YYYY'}>{comment.createdAt}</Moment>
			</time>
			<span className="gv-gd-entry__avatar" aria-hidden>
				<img src={imagePath} alt="" loading="lazy" />
			</span>
			<div className="gv-gd-entry__body">
				<button
					type="button"
					className="gv-gd-entry__name"
					onClick={() => goMemberPage(comment?.memberData?._id as string)}
				>
					{comment.memberData?.memberNick}
				</button>
				<p className="gv-gd-entry__text">{comment.commentContent}</p>
			</div>
		</li>
	);
};

export default Review;
