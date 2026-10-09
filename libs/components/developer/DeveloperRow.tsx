import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import EastIcon from '@mui/icons-material/East';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { pad } from '../homepage/homeMotion';
import { REACT_APP_API_URL } from '../../config';

interface DeveloperRowProps {
	developer: Member;
	position: number;
	active: boolean;
	onSelect: () => void;
	likeMemberHandler: any;
}

export const developerHref = (developer?: Member) => ({ pathname: '/developer/detail', query: { developerId: developer?._id } });

export const developerImage = (developer?: Member) =>
	developer?.memberImage ? `${REACT_APP_API_URL}/${developer.memberImage}` : '/img/profile/defaultUser.svg';

/** Roster row: index, giant name (keyboard link), counts and like; hovering or focusing it selects the developer **/
const DeveloperRow = ({ developer, position, active, onSelect, likeMemberHandler }: DeveloperRowProps) => {
	const user = useReactiveVar(userVar);
	const isLiked = Boolean(developer?.meLiked?.[0]?.myFavorite);
	const games = developer?.memberGames ?? 0;
	const likes = developer?.memberLikes ?? 0;
	const name = developer?.memberFullName ?? developer?.memberNick;

	return (
		<article className={`gv-dv-row ${active ? 'is-active' : ''}`} onMouseEnter={onSelect} onFocus={onSelect}>
			{/* Whole-row click target for pointer users; the name link is the keyboard target */}
			<Link href={developerHref(developer)} className="gv-dv-row__hit" aria-hidden tabIndex={-1} />

			<span className="gv-dv-row__index" aria-hidden>
				No. {pad(position)}
			</span>

			<span className="gv-dv-row__thumb" aria-hidden>
				<img src={developerImage(developer)} alt="" loading="lazy" decoding="async" />
			</span>

			<div className="gv-dv-row__body">
				<h3 className="gv-dv-row__name">
					<Link href={developerHref(developer)}>{name}</Link>
				</h3>
				<p className="gv-dv-row__meta">
					<span>
						{games} game{games === 1 ? '' : 's'}
					</span>
					<span>{developer?.memberViews ?? 0} views</span>
					<span>Joined {moment(developer?.createdAt).format('MMM YYYY')}</span>
				</p>
			</div>

			<button
				type="button"
				className={`gv-dv-like ${isLiked ? 'is-liked' : ''}`}
				aria-pressed={isLiked}
				aria-label={`${isLiked ? 'Unlike' : 'Like'} ${name}, ${likes} likes`}
				onClick={() => likeMemberHandler(user, developer?._id)}
			>
				{isLiked ? <FavoriteRoundedIcon aria-hidden /> : <FavoriteBorderRoundedIcon aria-hidden />}
				{likes}
			</button>

			<EastIcon className="gv-dv-row__arrow" aria-hidden />
		</article>
	);
};

export default DeveloperRow;
