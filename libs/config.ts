export const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;

export const availableOptions = ['propertyBarter', 'propertyRent'];

const thisYear = new Date().getFullYear();

export const propertyYears: any = [];

for (let i = 1970; i <= thisYear; i++) {
	propertyYears.push(String(i));
}

export const propertySquare = [0, 25, 50, 75, 100, 125, 150, 200, 300, 500];

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

export const topPropertyRank = 2;

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
