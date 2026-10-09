import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TopAgentCard from './TopAgentCard';
import { Member } from '../../types/member/member';
import { AgentsInquiry } from '../../types/member/member.input';
import { useQuery } from '@apollo/client';
import { GET_AGENTS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { memberTypeLabel } from '../../utils';
import { SCENE_QUERY } from './homeMotion';

interface TopAgentsProps {
	initialInput: AgentsInquiry;
}

const TopAgents = (props: TopAgentsProps) => {
	const { initialInput } = props;
	const [topAgents, setTopAgents] = useState<Member[]>([]);
	const [selected, setSelected] = useState(0);
	const rootRef = useRef<HTMLElement>(null);

	/** APOLLO REQUESTS **/

	const {
		loading: getAgentsLoading,
		data: getAgentsData,
		error: getAgentsError,
		refetch: getAgentsRefetch,
	} = useQuery(GET_AGENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTopAgents(data?.getAgents?.list);
		},
		onError: (err) => {
    console.error('Apollo GET_AGENTS Error:', err);
  },
	});

	/** HANDLERS **/

	if (topAgents) console.log('topAgents:', topAgents);

	const agents: Member[] = topAgents ?? [];
	const chosen = agents[Math.min(selected, agents.length - 1)];

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root || agents.length === 0) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			const scroll = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.5 };

			// Depth: the word drifts one way, portrait columns float at three different speeds
			gsap.fromTo(root.querySelector('.gv-roster__word'), { xPercent: 4 }, { xPercent: -6, ease: 'none', scrollTrigger: scroll });
			root.querySelectorAll<HTMLElement>('.gv-roster__item').forEach((item, index) => {
				const depth = [-14, 10, -4][index % 3];
				gsap.fromTo(item, { yPercent: -depth }, { yPercent: depth, ease: 'none', scrollTrigger: scroll });
			});
		});

		mm.add('(max-width: 899px)', () => {
			// Character-select rail: the portrait in the middle of the screen is the selected one
			const rail = root.querySelector<HTMLElement>('.gv-roster__grid');
			const items = Array.from(root.querySelectorAll<HTMLElement>('.gv-roster__item'));
			if (!rail || typeof IntersectionObserver === 'undefined') return;
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (!entry.isIntersecting) return;
						const index = items.indexOf(entry.target as HTMLElement);
						if (index >= 0) setSelected(index);
					});
				},
				{ root: rail, rootMargin: '0px -45% 0px -45%' },
			);
			items.forEach((item) => observer.observe(item));
			return () => observer.disconnect();
		});

		return () => mm.revert();
	}, [agents.length]);

	return (
		<section className="gv-roster" id="top-agents" aria-labelledby="top-agents-heading" ref={rootRef}>
			<div className="gv-roster__inner">
				<header className="gv-roster__head">
					<p className="gv-chapter" aria-hidden>
						<span>04</span>Character select
					</p>
					<Link href={'/developer'} className="gv-ink-cta">
						See all developers
					</Link>
				</header>

				<h2 className="gv-roster__word" id="top-agents-heading">
					<span className="gv-visually-hidden">Top </span>Developers
				</h2>

				{agents.length === 0 ? (
					<p className="gv-roster__empty">
						No developers yet. <Link href={'/developer'}>Visit the developers page</Link>
					</p>
				) : (
					<div className="gv-roster__stage">
						<div className="gv-roster__selected" aria-live="polite">
							<p className="gv-roster__selected-kicker">
								Selected / {String(selected + 1).padStart(2, '0')}
							</p>
							<p className="gv-roster__selected-name">{chosen?.memberNick}</p>
							<p className="gv-roster__selected-stats">
								<span>{memberTypeLabel(chosen?.memberType)}</span>
								<span>{chosen?.memberGames ?? 0} games</span>
								<span>{chosen?.memberLikes ?? 0} likes</span>
								<span>{chosen?.memberViews ?? 0} views</span>
							</p>
							<Link href={`/developer/detail?developerId=${chosen?._id}`} className="gv-ink-cta gv-ink-cta--solid">
								View profile
							</Link>
						</div>

						<ul className="gv-roster__grid" aria-label="Top developers">
							{agents.map((agent: Member, index: number) => (
								<li className="gv-roster__item" key={agent?._id}>
									<TopAgentCard agent={agent} index={index} active={index === selected} onSelect={setSelected} />
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</section>
	);
};

TopAgents.defaultProps = {
	initialInput: {
		page: 1,
		limit: 10,
		sort: 'memberRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopAgents;
