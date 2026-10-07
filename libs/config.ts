export const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;

const thisYear = new Date().getFullYear();

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

/** GAME **/
export const topGameRank = 2;

export const gamePriceMax = 1000;

export const gameReleaseYears: number[] = [];

for (let i = thisYear + 2; i >= 1980; i--) {
	gameReleaseYears.push(i);
}

export const gameSortOptions = [
	{ id: 'new', label: 'Newest', sort: 'createdAt', direction: 'DESC' },
	{ id: 'popular', label: 'Most Popular', sort: 'gameRank', direction: 'DESC' },
	{ id: 'release', label: 'Latest Release', sort: 'gameReleaseDate', direction: 'DESC' },
	{ id: 'lowest', label: 'Lowest Price', sort: 'gamePrice', direction: 'ASC' },
	{ id: 'highest', label: 'Highest Price', sort: 'gamePrice', direction: 'DESC' },
];
