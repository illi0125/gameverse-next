import React, { useEffect, useState } from 'react';

const chapters = [
	{ id: 'trending-games', label: 'Trending' },
	{ id: 'popular-games', label: 'Popular' },
	{ id: 'top-games', label: 'Ranked' },
	{ id: 'top-agents', label: 'Agents' },
	{ id: 'community', label: 'Community' },
	{ id: 'events', label: 'Events' },
];

/** Fixed chapter index on the right edge (desktop): marks the chapter in view and jumps between them **/
const HomeChapters = () => {
	const [active, setActive] = useState<string | null>(null);

	useEffect(() => {
		const targets = chapters
			.map((chapter) => document.getElementById(chapter.id))
			.filter((element): element is HTMLElement => Boolean(element));
		if (targets.length === 0) return;

		// A chapter is current while it crosses the middle band of the viewport
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) setActive(entry.target.id);
					else setActive((prev) => (prev === entry.target.id ? null : prev));
				});
			},
			{ rootMargin: '-50% 0px -50% 0px' },
		);
		targets.forEach((target) => observer.observe(target));

		return () => observer.disconnect();
	}, []);

	const jump = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		const target = document.getElementById(id);
		if (!target) return;
		event.preventDefault();
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: reduceMotion ? 'auto' : 'smooth' });
	};

	return (
		<nav className={`gv-chapters ${active ? 'is-visible' : ''}`} aria-label="Homepage chapters">
			<ol>
				{chapters.map((chapter, index) => (
					<li key={chapter.id} className={active === chapter.id ? 'is-active' : ''}>
						<a
							href={`#${chapter.id}`}
							onClick={(event) => jump(event, chapter.id)}
							aria-current={active === chapter.id ? 'true' : undefined}
						>
							<span className="gv-chapters__index">{String(index + 1).padStart(2, '0')}</span>
							<span className="gv-chapters__label">{chapter.label}</span>
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
};

export default HomeChapters;
