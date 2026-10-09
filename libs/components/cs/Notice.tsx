import React, { useState } from 'react';
import moment from 'moment';
import { Notice as NoticeItem } from '../../types/notice/notice';
import { pad } from '../homepage/homeMotion';

/** Bodies longer than this start clamped with a Read more toggle **/
const LONG_BODY = 260;

interface NoticeProps {
	notices: NoticeItem[];
	loading: boolean;
	error: boolean;
}

/** Public notices, managed in Admin › Support › Notices: newest first, numbered, events flagged **/
const Notice = ({ notices, loading, error }: NoticeProps) => {
	const [openIds, setOpenIds] = useState<string[]>([]);

	const toggle = (id: string) =>
		setOpenIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

	return (
		<div className="gv-cs-notices">
			<header className="gv-cs-section-head">
				<p className="gv-chapter" aria-hidden>
					<span>02</span>Notices
				</p>
				<h2 className="gv-cs-section-head__title">From the team</h2>
				<p className="gv-cs-section-head__desc">Announcements and events, newest first.</p>
			</header>

			{notices.length === 0 ? (
				<div className="gv-cs-empty" role="status">
					<p className="gv-cs-empty__title">
						{loading ? 'Loading notices…' : error ? 'Notices are unavailable right now.' : 'No notices yet.'}
					</p>
				</div>
			) : (
				<ol className="gv-cs-log">
					{notices.map((notice: NoticeItem, index: number) => {
						const body = notice.noticeContent && notice.noticeContent !== notice.noticeTitle ? notice.noticeContent : '';
						const long = body.length > LONG_BODY;
						const open = openIds.includes(notice._id);
						return (
							<li className={`gv-cs-log__entry ${notice.noticeEvent ? 'is-event' : ''}`} key={notice._id}>
								<div className="gv-cs-log__rail">
									<span className="gv-cs-log__num">{pad(index + 1)}</span>
									<time className="gv-cs-log__date" dateTime={moment(notice.createdAt).format('YYYY-MM-DD')}>
										{moment(notice.createdAt).format('DD.MM.YYYY')}
									</time>
								</div>
								<div className="gv-cs-log__body">
									{notice.noticeEvent && <span className="gv-cs-flag">Event</span>}
									<h3 className="gv-cs-log__title">{notice.noticeTitle}</h3>
									{body && (
										<>
											<p className={`gv-cs-log__text ${long && !open ? 'is-clamped' : ''}`} id={`notice-${notice._id}`}>
												{body}
											</p>
											{long && (
												<button
													type="button"
													className="gv-cs-textlink"
													aria-expanded={open}
													aria-controls={`notice-${notice._id}`}
													onClick={() => toggle(notice._id)}
												>
													{open ? 'Show less' : 'Read more'}
												</button>
											)}
										</>
									)}
								</div>
							</li>
						);
					})}
				</ol>
			)}
		</div>
	);
};

export default Notice;
