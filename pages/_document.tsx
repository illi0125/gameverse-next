import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/png" href="/img/logo/favicon.svg" />

				{/* Homepage display + HUD faces (used only inside .gv-home) */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500&family=Unbounded:wght@700..900&display=swap"
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
