import React, { useState } from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TopAgentCard from './TopAgentCard';
import HomeSection from './HomeSection';
import { Member } from '../../types/member/member';
import { AgentsInquiry } from '../../types/member/member.input';
import { useQuery } from '@apollo/client';
import { GET_AGENTS } from '../../../apollo/user/query';
import { T } from '../../types/common';

interface TopAgentsProps {
	initialInput: AgentsInquiry;
}

const TopAgents = (props: TopAgentsProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topAgents, setTopAgents] = useState<Member[]>([]);

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

	return (
		<HomeSection
			id="top-agents"
			title="Top agents"
			description="The agents behind the catalog, ranked by activity."
			tone="raised"
			actions={
				<Link href={'/agent'} className="gv-link">
					See all agents
					<ArrowForwardRoundedIcon aria-hidden />
				</Link>
			}
		>
			{topAgents.length === 0 ? (
				<p className="gv-empty">No agents yet.</p>
			) : (
				<ul className={`gv-agents ${device === 'mobile' ? 'is-compact' : ''}`} aria-label="Top agents">
					{topAgents.map((agent: Member) => (
						<li key={agent?._id}>
							<TopAgentCard agent={agent} />
						</li>
					))}
				</ul>
			)}
		</HomeSection>
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
