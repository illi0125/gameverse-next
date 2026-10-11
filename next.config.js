const isProd = process.env.NODE_ENV === 'production';

/** API origins from the same env vars the app uses (http(s) for GraphQL/uploads, ws(s) for chat) **/
const origin = (url) => {
	try {
		return url ? new URL(url).origin : '';
	} catch (err) {
		return '';
	}
};
const apiOrigins = [process.env.REACT_APP_API_URL, process.env.REACT_APP_API_GRAPHQL_URL, process.env.REACT_APP_API_WS]
	.map(origin)
	.filter(Boolean)
	.join(' ');

/**
 * Content Security Policy, REPORT-ONLY for now: the browser logs violations to the console but blocks nothing.
 * Switch the header name to `Content-Security-Policy` once production shows no unexpected reports.
 */
const contentSecurityPolicy = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' data: https://fonts.gstatic.com",
	`img-src 'self' data: blob: https: ${apiOrigins}`,
	`media-src 'self' blob: https: ${apiOrigins}`,
	`connect-src 'self' ${apiOrigins}`,
	'frame-src https://www.youtube.com https://www.youtube-nocookie.com',
	"frame-ancestors 'none'",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
].join('; ');

const securityHeaders = [
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
	// HTTPS-only header, and a CSP report-only header would flood dev with reports from Next's dev runtime
	...(isProd
		? [
				{ key: 'Strict-Transport-Security', value: 'max-age=15552000' },
				{ key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
		  ]
		: []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	async headers() {
		return [{ source: '/:path*', headers: securityHeaders }];
	},
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
