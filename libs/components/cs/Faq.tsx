import React, { useEffect, useState } from 'react';
import { Notice } from '../../types/notice/notice';
import { faqTopics, matchesText, topicMeta } from './csMeta';
import { pad } from '../homepage/homeMotion';

interface FaqProps {
	faqs: Notice[];
	loading: boolean;
	error: boolean;
	topicKey: string;
	topicCounts: Record<string, number>;
	onTopicChange: (key: string) => void;
	searchText: string;
	onSearchChange: (text: string) => void;
}

/** Wraps literal (case-insensitive) matches of `text` in <mark> **/
const Highlight = ({ value, text }: { value: string; text: string }) => {
	const needle = text.trim();
	if (!needle) return <>{value}</>;
	const lower = value.toLowerCase();
	const target = needle.toLowerCase();
	const parts: React.ReactNode[] = [];
	let from = 0;
	let at = lower.indexOf(target);
	while (at !== -1) {
		if (at > from) parts.push(value.slice(from, at));
		parts.push(<mark key={at}>{value.slice(at, at + needle.length)}</mark>);
		from = at + needle.length;
		at = lower.indexOf(target, from);
	}
	parts.push(value.slice(from));
	return <>{parts}</>;
};

/** Public FAQ (entries are managed in Admin › Support › FAQ): topic rail, one open answer at a time, instant search **/
const Faq = (props: FaqProps) => {
	const { faqs, loading, error, topicKey, topicCounts, onTopicChange, searchText, onSearchChange } = props;
	const [expanded, setExpanded] = useState<string | false>(false);

	const searching = searchText.trim().length > 0;
	const topic = faqTopics.find((entry) => entry.key === topicKey) ?? faqTopics[0];
	const list = searching
		? faqs.filter((faq) => matchesText(searchText, faq.noticeTitle, faq.noticeContent))
		: faqs.filter((faq) => faq.noticeTopic === topic.topic);

	// A new topic or search starts with every answer closed (as switching tabs did before)
	useEffect(() => setExpanded(false), [topicKey, searching]);

	/** HANDLERS **/
	const changeCategoryHandler = (key: string) => {
		onTopicChange(key);
		if (searching) onSearchChange('');
	};

	const handleChange = (panel: string) => setExpanded((current) => (current === panel ? false : panel));

	return (
		<div className="gv-cs-faq">
			<nav className="gv-cs-topics" aria-label="FAQ topics">
				<p className="gv-cs-topics__title">Topics</p>
				<ul>
					{faqTopics.map((entry, index) => {
						const current = !searching && entry.key === topic.key;
						return (
							<li key={entry.key}>
								<button
									type="button"
									className={`gv-cs-topic ${current ? 'is-current' : ''}`}
									aria-current={current ? 'true' : undefined}
									onClick={() => changeCategoryHandler(entry.key)}
								>
									<span className="gv-cs-topic__index">{pad(index + 1)}</span>
									<span className="gv-cs-topic__name">{entry.label}</span>
									<span className="gv-cs-topic__count">{loading ? '—' : topicCounts[entry.key] ?? 0}</span>
								</button>
							</li>
						);
					})}
				</ul>
			</nav>

			<div className="gv-cs-faq__main">
				<header className="gv-cs-section-head">
					<p className="gv-chapter" aria-hidden>
						<span>01</span>FAQ
					</p>
					<h2 className="gv-cs-section-head__title" aria-live="polite">
						{searching ? `Results for “${searchText.trim()}”` : topic.label}
					</h2>
					<p className="gv-cs-section-head__desc">
						{searching
							? `${list.length} answer${list.length === 1 ? '' : 's'} across every topic`
							: topic.desc}
					</p>
					{searching && (
						<button type="button" className="gv-cs-textlink" onClick={() => onSearchChange('')}>
							Clear search and browse {topic.label}
						</button>
					)}
				</header>

				{list.length === 0 ? (
					<div className="gv-cs-empty" role="status">
						<p className="gv-cs-empty__title">
							{loading
								? 'Loading answers…'
								: error
								? 'Answers are unavailable right now.'
								: searching
								? 'No answer matches that.'
								: 'No questions in this topic yet.'}
						</p>
						{!loading && !error && (
							<p className="gv-cs-empty__desc">
								{searching ? 'Try a shorter word, or ask the team in Ask us.' : 'Pick another topic, or ask the team in Ask us.'}
							</p>
						)}
					</div>
				) : (
					<ol className="gv-cs-qa">
						{list.map((faq: Notice, index: number) => {
							const open = expanded === faq._id;
							return (
								<li className={`gv-cs-qa__item ${open ? 'is-open' : ''}`} key={faq._id}>
									<h3 className="gv-cs-qa__q">
										<button
											type="button"
											id={`faq-q-${faq._id}`}
											aria-expanded={open}
											aria-controls={`faq-a-${faq._id}`}
											onClick={() => handleChange(faq._id)}
										>
											<span className="gv-cs-qa__num">Q.{pad(index + 1)}</span>
											<span className="gv-cs-qa__text">
												<Highlight value={faq.noticeTitle} text={searchText} />
												{searching && <span className="gv-cs-qa__topic">{topicMeta(faq.noticeTopic).label}</span>}
											</span>
											<span className="gv-cs-qa__icon" aria-hidden />
										</button>
									</h3>
									<div
										className="gv-cs-qa__panel"
										id={`faq-a-${faq._id}`}
										role="region"
										aria-labelledby={`faq-q-${faq._id}`}
										hidden={!open}
									>
										<div className="gv-cs-qa__answer">
											<span className="gv-cs-qa__a" aria-hidden>
												A.
											</span>
											<p>
												<Highlight value={faq.noticeContent} text={searchText} />
											</p>
										</div>
									</div>
								</li>
							);
						})}
					</ol>
				)}
			</div>
		</div>
	);
};

export default Faq;
