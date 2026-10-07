import React from 'react';
import Link from 'next/link';
import { Member } from '../../types/member/member';
import { formatEnumLabel } from '../../utils';

interface TopAgentProps {
	agent: Member;
}

const TopAgentCard = (props: TopAgentProps) => {
	const { agent } = props;
	const agentImage = agent?.memberImage
		? `${process.env.REACT_APP_API_URL}/${agent?.memberImage}`
		: '/img/profile/defaultUser.svg';

	return (
		<Link href={`/agent/detail?agentId=${agent?._id}`} className="gv-agent">
			<span className="gv-agent__avatar">
				<img src={agentImage} alt="" width={96} height={96} loading="lazy" decoding="async" />
			</span>
			<span className="gv-agent__name">{agent?.memberNick}</span>
			<span className="gv-agent__role">{formatEnumLabel(agent?.memberType)}</span>
		</Link>
	);
};

export default TopAgentCard;
