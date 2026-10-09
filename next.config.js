/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	env: {
		REACT_APP_API_URL: process.env.REACT_APP_API_URL,
		REACT_APP_API_GRAPHQL_URL: process.env.REACT_APP_API_GRAPHQL_URL,
		REACT_APP_API_WS: process.env.REACT_APP_API_WS,
	},
	// Temporary redirect for legacy Nestar catalog links (remove after migration)
	async redirects() {
		return [
			{ source: '/property', destination: '/game', permanent: false },
			{ source: '/property/detail', destination: '/game/detail', permanent: false },
			{ source: '/_admin/properties', destination: '/_admin/games', permanent: false },
			// Game owners are called Developers in the UI (backend role stays AGENT)
			{ source: '/agent', destination: '/developer', permanent: false },
			{ source: '/agent/detail', destination: '/developer/detail', permanent: false },
		];
	},
};

const { i18n } = require('./next-i18next.config');
nextConfig.i18n = i18n;

module.exports = nextConfig;
