import React from 'react';
import Link from 'next/link';
import { Member } from '../../types/member/member';
import { formatEnumLabel } from '../../utils';

interface TopAgentProps {
	agent: Member;
	index?: number;
	active?: boolean;
	onSelect?: (index: number) => void;
}

/** Character-select tile: cut-corner portrait, name and role; hovering or focusing it selects the agent **/
const TopAgentCard = (props: TopAgentProps) => {
	const { agent, index = 0, active = false, onSelect } = props;
	const agentImage = agent?.memberImage
		? `${process.env.REACT_APP_API_URL}/${agent?.memberImage}`
		: '/img/profile/defaultUser.svg';

	return (
		<Link
			href={`/agent/detail?agentId=${agent?._id}`}
			className={`gv-agent-tile ${active ? 'is-active' : ''}`}
			onMouseEnter={() => onSelect?.(index)}
			onFocus={() => onSelect?.(index)}
		>
			<span className="gv-agent-tile__portrait">
				<img src={agentImage} alt="" loading="lazy" decoding="async" />
			</span>
			<span className="gv-agent-tile__name">{agent?.memberNick}</span>
			<span className="gv-agent-tile__role">{formatEnumLabel(agent?.memberType)}</span>
		</Link>
	);
};

export default TopAgentCard;
