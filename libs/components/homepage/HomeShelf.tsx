import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/** three.js is only downloaded where the 3D shelf is shown **/
const FiberContainer = dynamic(() => import('../common/FiberContainer'), { ssr: false });

/** Narrow windows and touch screens get the light strip instead of WebGL **/
const STRIP_QUERY = '(max-width: 899px), (hover: none)';

/** Same artwork, same order as the 3D shelf **/
const tiles = [7, 8, 1, 4, 5, 6, 2, 3];

/** Banner shelf: the 3D cover shelf on desktop, a drifting strip of cut-corner tiles on phones **/
const HomeShelf = () => {
	const [mode, setMode] = useState<'3d' | 'strip' | null>(null);

	useEffect(() => {
		const query = window.matchMedia(STRIP_QUERY);
		const update = () => setMode(query.matches ? 'strip' : '3d');
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	if (mode === '3d') return <FiberContainer />;
	if (mode !== 'strip') return null;

	return (
		<div className="gv-shelf-strip">
			<div className="gv-shelf-strip__track">
				{/* Two runs of the same tiles so the loop is seamless */}
				{[...tiles, ...tiles].map((tile, index) => (
					<span className="gv-shelf-strip__tile" key={index}>
						<img src={`/img/gameverse/tile-${tile}.jpg`} alt="" loading="lazy" decoding="async" />
					</span>
				))}
			</div>
		</div>
	);
};

export default HomeShelf;
