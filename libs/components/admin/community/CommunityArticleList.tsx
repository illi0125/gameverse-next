import React from 'react';
import Link from 'next/link';
import { Fade, Menu, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import Moment from 'react-moment';
import { BoardArticle } from '../../../types/board-article/board-article';
import { REACT_APP_API_URL } from '../../../config';
import { BoardArticleStatus } from '../../../enums/board-article.enum';
import { articleHref, articleImage, boardMeta } from '../../community/communityMeta';
import { AdminEmpty, ChipTone, Density, StatusChip } from '../ui/AdminUi';

const statusTone: Record<string, ChipTone> = {
	[BoardArticleStatus.ACTIVE]: 'live',
	[BoardArticleStatus.DELETE]: 'off',
};

const statusLabels: Record<string, string> = {
	[BoardArticleStatus.ACTIVE]: 'Active',
	[BoardArticleStatus.DELETE]: 'Deleted',
};
const statusLabel = (status: string) => statusLabels[status] ?? status;

interface CommunityArticleListProps {
	articles: BoardArticle[];
	loading?: boolean;
	error?: boolean;
	density?: Density;
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateArticleHandler: any;
	removeArticleHandler: any;
}

/** Admin article table; the status chip opens the same menu as before, deleted articles can be restored or removed for good **/
const CommunityArticleList = (props: CommunityArticleListProps) => {
	const {
		articles,
		loading = false,
		error = false,
		density = 'comfortable',
		anchorEl,
		menuIconClickHandler,
		menuIconCloseHandler,
		updateArticleHandler,
		removeArticleHandler,
	} = props;

	return (
		<TableContainer className={`gv-admin-table is-${density}`}>
			<Table aria-label="Articles">
				<TableHead>
					<TableRow>
						<TableCell>Article</TableCell>
						<TableCell>Board</TableCell>
						<TableCell>Writer</TableCell>
						<TableCell align="right">Views</TableCell>
						<TableCell align="right">Likes</TableCell>
						<TableCell>Posted</TableCell>
						<TableCell>Status</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{articles.length === 0 && (
						<TableRow>
							<TableCell colSpan={7} className="gv-admin-table__empty">
								{loading ? (
									<AdminEmpty title="Loading articles…" />
								) : error ? (
									<AdminEmpty title="Articles could not be loaded." desc="Check the connection and try again." />
								) : (
									<AdminEmpty title="No articles match." desc="Try another status or board." />
								)}
							</TableCell>
						</TableRow>
					)}
					{articles.map((article: BoardArticle, index: number) => {
						const isDeleted = article.articleStatus === BoardArticleStatus.DELETE;
						const writerImage = article?.memberData?.memberImage
							? `${REACT_APP_API_URL}/${article.memberData.memberImage}`
							: '/img/profile/defaultUser.svg';
						const title = (
							<>
								<span className="gv-admin-person__avatar gv-admin-game__thumb">
									<img src={articleImage(article)} alt="" />
								</span>
								<span>
									<span className="gv-admin-article__title">{article.articleTitle}</span>
									<span className="gv-admin-person__id">{article._id}</span>
								</span>
							</>
						);

						return (
							<TableRow hover key={article._id} className={isDeleted ? 'is-dimmed' : undefined}>
								<TableCell>
									{isDeleted ? (
										<span className="gv-admin-person">{title}</span>
									) : (
										<Link href={articleHref(article)} className="gv-admin-person">
											{title}
										</Link>
									)}
								</TableCell>
								<TableCell>{boardMeta(article.articleCategory).label}</TableCell>
								<TableCell>
									{article.memberData ? (
										<Link href={`/member?memberId=${article.memberData._id}`} className="gv-admin-writer">
											<img src={writerImage} alt="" />
											<span className="gv-admin-link">{article.memberData.memberNick}</span>
										</Link>
									) : (
										<span className="gv-admin-muted">—</span>
									)}
								</TableCell>
								<TableCell align="right" className="gv-admin-mono">
									{article.articleViews}
								</TableCell>
								<TableCell align="right" className="gv-admin-mono">
									{article.articleLikes}
								</TableCell>
								<TableCell className="gv-admin-mono">
									<Moment format={'DD.MM.YY HH:mm'}>{article.createdAt}</Moment>
								</TableCell>
								<TableCell>
									<span className="gv-admin-row-actions">
										<StatusChip
											label={statusLabel(article.articleStatus)}
											tone={statusTone[article.articleStatus] ?? 'neutral'}
											ariaLabel={`Change status of ${article.articleTitle}, now ${statusLabel(article.articleStatus)}`}
											onClick={(e: any) => menuIconClickHandler(e, index)}
										/>
										{isDeleted && (
											<Tooltip title="Remove permanently">
												<button
													type="button"
													className="gv-admin-iconbtn is-danger"
													aria-label={`Remove ${article.articleTitle} permanently`}
													onClick={() => removeArticleHandler(article._id)}
												>
													<DeleteForeverOutlinedIcon aria-hidden />
												</button>
											</Tooltip>
										)}
									</span>
									<Menu
										className={'gv-admin-menu'}
										anchorEl={anchorEl[index]}
										open={Boolean(anchorEl[index])}
										onClose={menuIconCloseHandler}
										TransitionComponent={Fade}
									>
										<li className="gv-admin-menu__label">{isDeleted ? 'Restore' : 'Change status to'}</li>
										{Object.values(BoardArticleStatus)
											.filter((status) => status !== article.articleStatus)
											.map((status: string) => (
												<MenuItem
													onClick={() => updateArticleHandler({ _id: article._id, articleStatus: status })}
													key={status}
												>
													{status === BoardArticleStatus.DELETE
														? 'Delete'
														: isDeleted
														? `Restore as ${statusLabel(status)}`
														: statusLabel(status)}
												</MenuItem>
											))}
									</Menu>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default CommunityArticleList;
