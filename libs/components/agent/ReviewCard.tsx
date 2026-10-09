import React from 'react';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import { Comment } from '../../types/comment/comment';
import Moment from 'react-moment';
import { REACT_APP_API_URL } from '../../config';

interface ReviewCardProps {
	fromMyPage?: string;
	comment: Comment;
}

/** One review as a log entry (same anatomy as the game page's comments): mono date, cut avatar, author, text **/
const ReviewCard = (props: ReviewCardProps) => {
	const { fromMyPage, comment } = props;
	const imagePath: string = comment?.memberData?.memberImage
		? `${REACT_APP_API_URL}/${comment?.memberData?.memberImage}`
		: '/img/profile/defaultUser.svg';

	return (
		<li className="gv-gd-entry">
			<time className="gv-gd-entry__date" dateTime={String(comment.createdAt)}>
				<Moment format={'DD MMM YYYY'}>{comment.createdAt}</Moment>
			</time>
			<span className="gv-gd-entry__avatar" aria-hidden>
				<img src={imagePath} alt="" loading="lazy" />
			</span>
			<div className="gv-gd-entry__body">
				<span className="gv-gd-entry__name gv-gd-entry__name--static">{comment.memberData?.memberNick}</span>
				<p className="gv-gd-entry__text">{comment.commentContent}</p>
				{fromMyPage && (
					<span className="gv-gd-entry__reply">
						<ReplyRoundedIcon aria-hidden />
						Reply
					</span>
				)}
			</div>
		</li>
	);
};

export default ReviewCard;
