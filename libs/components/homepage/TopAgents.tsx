import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import TopAgentCard from './TopAgentCard';
import { Member } from '../../types/member/member';
import { AgentsInquiry } from '../../types/member/member.input';
import { useQuery } from '@apollo/client';
import { GET_AGENTS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { formatEnumLabel } from '../../utils';
import { SCENE_QUERY } from './homeMotion';

interface TopAgentsProps {
	initialInput: AgentsInquiry;
}

const TopAgents = (props: TopAgentsProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
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

		return () => mm.revert();
	}, [agents.length]);

	return (
		<section className="gv-roster" id="top-agents" aria-labelledby="top-agents-heading" ref={rootRef}>
			<div className="gv-roster__inner">
				<header className="gv-roster__head">
					<p className="gv-chapter" aria-hidden>
						<span>04</span>Character select
					</p>
					<Link href={'/agent'} className="gv-ink-cta">
						See all agents
					</Link>
				</header>

				<h2 className="gv-roster__word" id="top-agents-heading">
					<span className="gv-visually-hidden">Top </span>Agents
				</h2>

				{agents.length === 0 ? (
					<p className="gv-roster__empty">
						No agents yet. <Link href={'/agent'}>Visit the agents page</Link>
					</p>
				) : (
					<div className="gv-roster__stage">
						<div className="gv-roster__selected" aria-live="polite">
							<p className="gv-roster__selected-kicker">
								Selected / {String(selected + 1).padStart(2, '0')}
							</p>
							<p className="gv-roster__selected-name">{chosen?.memberNick}</p>
							<p className="gv-roster__selected-stats">
								<span>{formatEnumLabel(chosen?.memberType)}</span>
								<span>{chosen?.memberGames ?? 0} games</span>
								<span>{chosen?.memberLikes ?? 0} likes</span>
								<span>{chosen?.memberViews ?? 0} views</span>
							</p>
							<Link href={`/agent/detail?agentId=${chosen?._id}`} className="gv-ink-cta gv-ink-cta--solid">
								View profile
							</Link>
						</div>

						<ul className={`gv-roster__grid ${device === 'mobile' ? 'is-compact' : ''}`} aria-label="Top agents">
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
