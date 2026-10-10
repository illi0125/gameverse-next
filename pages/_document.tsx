import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				{/* Dark canvas until the app's styles arrive. In dev, Next hides <body> until its injected CSS is ready,
				    which showed the browser's white canvas before the intro; scss/app.scss sets the normal white
				    background back once the stylesheet applies, so pages look the same afterwards. */}
				<style>{`html{background:#000}`}</style>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />

				{/* Homepage display + HUD faces (used only inside .gv-home) */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500&family=Unbounded:wght@700..900&display=swap"
				/>

				{/* Homepage intro plays once per session: hide it before first paint when already seen.
				    The rule is inline so it applies before any stylesheet arrives. */}
				<style>{`html[data-gv-intro=skip] .gv-intro:not(.is-playing){display:none}`}</style>
				<script
					dangerouslySetInnerHTML={{
						__html: "try{if(sessionStorage.getItem('gv-intro-seen')==='1')document.documentElement.setAttribute('data-gv-intro','skip')}catch(e){}",
					}}
				/>

				{/* SEO */}
				<meta name="keyword" content={'gameverse, game store, pc games, console games, mobile games'} />
				<meta
					name={'description'}
					content={
						'Discover, compare and collect games for PC, PlayStation, Xbox, Nintendo and mobile on Gameverse | ' +
						'Открывайте, сравнивайте и собирайте игры для ПК, PlayStation, Xbox, Nintendo и мобильных устройств на Gameverse | ' +
						'Gameverse에서 PC, PlayStation, Xbox, Nintendo, 모바일 게임을 발견하고 비교하고 모아보세요'
					}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
