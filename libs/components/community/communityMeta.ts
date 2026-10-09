import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { REACT_APP_API_URL } from '../../config';
import { MemberStatus } from '../../enums/member.enum';

/** The four boards in tab order, with their UI names and one-line descriptions **/
export const communityBoards: { value: BoardArticleCategory; label: string; short: string; desc: string }[] = [
	{
		value: BoardArticleCategory.FREE,
		label: 'Free board',
		short: 'Free',
		desc: 'Anything gaming: questions, stories and squad calls.',
	},
	{
		value: BoardArticleCategory.RECOMMEND,
		label: 'Recommendations',
		short: 'Picks',
		desc: 'Games worth your time, picked by players.',
	},
	{
		value: BoardArticleCategory.NEWS,
		label: 'News',
		short: 'News',
		desc: 'Catalog updates and announcements.',
	},
	{
		value: BoardArticleCategory.HUMOR,
		label: 'Humor',
		short: 'Humor',
		desc: 'Clips, fails and 2 AM stories.',
	},
];

export const boardMeta = (category?: string) =>
	communityBoards.find((board) => board.value === category) ?? communityBoards[0];

export const articleImage = (article?: BoardArticle) =>
	article?.articleImage ? `${REACT_APP_API_URL}/${article.articleImage}` : '/img/gameverse/article-placeholder.svg';

/** Same destination CommunityCard's click handler pushes to **/
export const articleHref = (article?: BoardArticle) => ({
	pathname: '/community/detail',
	query: { articleCategory: article?.articleCategory, id: article?._id },
});

const entities: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' };

/** The editor's HTML as plain text (tags dropped, common entities decoded) **/
export const articlePlainText = (html?: string): string =>
	(html ?? '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, (entity) => entities[entity])
		.replace(/\s+/g, ' ')
		.trim();

/** Minutes at ~220 words per minute, never below one **/
export const readingMinutes = (html?: string): number =>
	Math.max(1, Math.round(articlePlainText(html).split(' ').filter(Boolean).length / 220));

/** Plain-text preview of the editor's HTML **/
export const articleExcerpt = (html?: string, max = 180): string => {
	const text = articlePlainText(html);
	return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
};

/** Author shown for a post; deleted accounts keep their posts but lose their name and profile link **/
export const activeAuthor = (article?: BoardArticle) =>
	article?.memberData && article.memberData.memberStatus !== MemberStatus.DELETE ? article.memberData : null;
