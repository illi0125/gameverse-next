import React from 'react';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import MyPageHead from './MyPageHead';
//@ts-ignore
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	return (
		<div className="gv-mp-section gv-mp-write">
			<MyPageHead kicker="Community" title="Write an article" desc="Pick a board, give it a title, and write. Images upload as you add them." />
			<TuiEditor />
		</div>
	);
};

export default WriteArticle;
