import React, { useState } from 'react';
import Link from 'next/link';
import Moment from 'react-moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { getJwtToken } from '../../auth';
import { CREATE_INQUIRY } from '../../../apollo/user/mutation';
import { GET_MY_INQUIRIES } from '../../../apollo/user/query';
import { Inquiry as InquiryItem } from '../../types/inquiry/inquiry';
import { InquiryStatus, SupportTopic } from '../../enums/notice.enum';
import { sweetErrorHandling } from '../../sweetAlert';
import {
	INQUIRY_CONTENT_MAX,
	INQUIRY_CONTENT_MIN,
	INQUIRY_TITLE_MAX,
	INQUIRY_TITLE_MIN,
	faqTopics,
	inquiryStatusMeta,
	topicMeta,
} from './csMeta';

const PAGE_SIZE = 5;

type Field = 'title' | 'content';

/** 1:1 inquiries: members send a question and follow its status and the team's reply (Admin › Support › Inquiries) **/
const Inquiry = () => {
	const user = useReactiveVar(userVar);
	const signedIn = Boolean(user?._id);

	const [topic, setTopic] = useState<SupportTopic>(SupportTopic.GAMES);
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [touched, setTouched] = useState<Record<Field, boolean>>({ title: false, content: false });
	const [sending, setSending] = useState(false);
	const [sentId, setSentId] = useState<string | null>(null);
	const [limit, setLimit] = useState(PAGE_SIZE);

	/** APOLLO REQUESTS **/
	const [createInquiry] = useMutation(CREATE_INQUIRY);

	const {
		loading: myLoading,
		data: myData,
		error: myError,
		refetch: myRefetch,
	} = useQuery(GET_MY_INQUIRIES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit } },
		skip: !signedIn,
		notifyOnNetworkStatusChange: true,
	});
	const mine: InquiryItem[] = myData?.getMyInquiries?.list ?? [];
	const mineTotal: number = myData?.getMyInquiries?.metaCounter?.[0]?.total ?? 0;

	/** VALIDATION (mirrors the API limits) **/
	const titleError =
		title.trim().length < INQUIRY_TITLE_MIN ? `Give it a title of at least ${INQUIRY_TITLE_MIN} characters.` : '';
	const contentError =
		content.trim().length < INQUIRY_CONTENT_MIN
			? `Describe the problem in at least ${INQUIRY_CONTENT_MIN} characters.`
			: '';

	/** HANDLERS **/
	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		setTouched({ title: true, content: true });
		if (titleError || contentError || sending) return;
		try {
			setSending(true);
			const result = await createInquiry({
				variables: { input: { inquiryTopic: topic, inquiryTitle: title.trim(), inquiryContent: content.trim() } },
			});
			setSentId(result?.data?.createInquiry?._id ?? null);
			setTitle('');
			setContent('');
			setTouched({ title: false, content: false });
			await myRefetch({ input: { page: 1, limit } });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setSending(false);
		}
	};

	// On a full load the layout restores the user from the saved token just after the first render
	if (!signedIn && typeof window !== 'undefined' && getJwtToken()) {
		return (
			<div className="gv-cs-ask">
				<div className="gv-cs-empty" role="status">
					<p className="gv-cs-empty__title">Loading your inquiries…</p>
				</div>
			</div>
		);
	}

	if (!signedIn) {
		return (
			<div className="gv-cs-ask">
				<header className="gv-cs-section-head">
					<p className="gv-chapter" aria-hidden>
						<span>03</span>Ask us
					</p>
					<h2 className="gv-cs-section-head__title">Ask the team</h2>
					<p className="gv-cs-section-head__desc">
						Sign in to send a question. Your inquiries and the team's replies are kept here, so you can come back to them.
					</p>
				</header>
				<div className="gv-cs-gate">
					<p className="gv-cs-gate__title">Sign in to ask</p>
					<p className="gv-cs-gate__desc">It takes a GameVerse account so the reply can reach you.</p>
					<Link href="/account/join" className="gv-cs-cta gv-cs-cta--solid">
						Sign in or join
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="gv-cs-ask">
			<header className="gv-cs-section-head">
				<p className="gv-chapter" aria-hidden>
					<span>03</span>Ask us
				</p>
				<h2 className="gv-cs-section-head__title">Ask the team</h2>
				<p className="gv-cs-section-head__desc">
					Pick a topic and describe what happened. The reply appears in your history on the right.
				</p>
			</header>

			<div className="gv-cs-ask__grid">
				<form className="gv-cs-form" onSubmit={submitHandler} noValidate>
					<fieldset className="gv-cs-form__topics">
						<legend className="gv-cs-field__label">Topic</legend>
						<div className="gv-cs-chips">
							{faqTopics.map((entry) => (
								<label key={entry.topic} className={`gv-cs-chip ${topic === entry.topic ? 'is-on' : ''}`}>
									<input
										type="radio"
										name="inquiryTopic"
										value={entry.topic}
										checked={topic === entry.topic}
										onChange={() => setTopic(entry.topic)}
									/>
									<span>{entry.label}</span>
								</label>
							))}
						</div>
					</fieldset>

					<label className="gv-cs-field">
						<span className="gv-cs-field__label">
							Title
							<span className="gv-cs-field__count">
								{title.length}/{INQUIRY_TITLE_MAX}
							</span>
						</span>
						<input
							type="text"
							value={title}
							maxLength={INQUIRY_TITLE_MAX}
							placeholder="For example: My purchase does not show up"
							onChange={(e) => {
								setTitle(e.target.value);
								setSentId(null);
							}}
							onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
							aria-invalid={touched.title && Boolean(titleError)}
							aria-describedby={touched.title && titleError ? 'cs-title-error' : undefined}
						/>
						{touched.title && titleError && (
							<span className="gv-cs-field__error" id="cs-title-error">
								{titleError}
							</span>
						)}
					</label>

					<label className="gv-cs-field">
						<span className="gv-cs-field__label">
							Message
							<span className="gv-cs-field__count">
								{content.length}/{INQUIRY_CONTENT_MAX}
							</span>
						</span>
						<textarea
							rows={7}
							value={content}
							maxLength={INQUIRY_CONTENT_MAX}
							placeholder="What did you try, what did you expect, and what happened instead?"
							onChange={(e) => {
								setContent(e.target.value);
								setSentId(null);
							}}
							onBlur={() => setTouched((prev) => ({ ...prev, content: true }))}
							aria-invalid={touched.content && Boolean(contentError)}
							aria-describedby={touched.content && contentError ? 'cs-content-error' : undefined}
						/>
						{touched.content && contentError && (
							<span className="gv-cs-field__error" id="cs-content-error">
								{contentError}
							</span>
						)}
					</label>

					<div className="gv-cs-form__foot">
						<p className="gv-cs-form__as">
							Sending as <strong>{user.memberNick}</strong>
						</p>
						<button type="submit" className="gv-cs-cta gv-cs-cta--solid" disabled={sending}>
							{sending ? 'Sending…' : 'Send inquiry'}
						</button>
					</div>

					{sentId && (
						<p className="gv-cs-form__sent" role="status">
							Sent. It is now in your history as “Waiting for reply”.
						</p>
					)}
				</form>

				<section className="gv-cs-history" aria-labelledby="cs-history-title">
					<header className="gv-cs-history__head">
						<h3 id="cs-history-title">Your inquiries</h3>
						<span>{myData ? mineTotal : '—'}</span>
					</header>

					{mine.length === 0 ? (
						<div className="gv-cs-empty is-small" role="status">
							<p className="gv-cs-empty__title">
								{myLoading ? 'Loading…' : myError ? 'Your inquiries could not be loaded.' : 'Nothing sent yet.'}
							</p>
							{!myLoading && !myError && (
								<p className="gv-cs-empty__desc">When you send a question, it shows up here with its status.</p>
							)}
						</div>
					) : (
						<ol className="gv-cs-tickets">
							{mine.map((inquiry: InquiryItem) => {
								const status = inquiryStatusMeta[inquiry.inquiryStatus] ?? {
									label: inquiry.inquiryStatus,
									desc: '',
								};
								return (
									<li
										className={`gv-cs-ticket is-${inquiry.inquiryStatus.toLowerCase()} ${
											inquiry._id === sentId ? 'is-new' : ''
										}`}
										key={inquiry._id}
									>
										<p className="gv-cs-ticket__meta">
											<span className={`gv-cs-status is-${inquiry.inquiryStatus.toLowerCase()}`}>{status.label}</span>
											<span>{topicMeta(inquiry.inquiryTopic).label}</span>
											<Moment format="DD.MM.YYYY">{inquiry.createdAt}</Moment>
										</p>
										<h4 className="gv-cs-ticket__title">{inquiry.inquiryTitle}</h4>
										<p className="gv-cs-ticket__text">{inquiry.inquiryContent}</p>
										{inquiry.answerContent ? (
											<div className="gv-cs-ticket__reply">
												<p className="gv-cs-ticket__who">
													GameVerse team
													{inquiry.answeredAt && (
														<>
															{' · '}
															<Moment format="DD.MM.YYYY">{inquiry.answeredAt}</Moment>
														</>
													)}
												</p>
												<p>{inquiry.answerContent}</p>
											</div>
										) : (
											inquiry.inquiryStatus === InquiryStatus.PENDING && (
												<p className="gv-cs-ticket__wait">{status.desc}</p>
											)
										)}
									</li>
								);
							})}
						</ol>
					)}

					{mine.length < mineTotal && (
						<button
							type="button"
							className="gv-cs-cta gv-cs-cta--wide"
							disabled={myLoading}
							onClick={() => setLimit((current) => current + PAGE_SIZE)}
						>
							{myLoading ? 'Loading…' : `Show more (${mineTotal - mine.length})`}
						</button>
					)}
				</section>
			</div>
		</div>
	);
};

export default Inquiry;
