import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useReactiveVar } from '@apollo/client';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { userVar } from '../../../apollo/store';
import { getJwtToken } from '../../auth';
import { ASK_ASSISTANT } from '../../../apollo/user/mutation';
import { AssistantReply, AssistantTurnInput } from '../../types/assistant/assistant';
import { AssistantReplyStatus, AssistantRole } from '../../enums/assistant.enum';
import { Notice as NoticeItem } from '../../types/notice/notice';
import { NoticeCategory } from '../../enums/notice.enum';

/** API limits (AssistantInput): question 2–500, up to 6 earlier turns of 1500 characters **/
const QUESTION_MIN = 2;
const QUESTION_MAX = 500;
const HISTORY_MAX = 6;
const TURN_MAX = 1500;

const STARTERS = ['Can I buy games on Gameverse?', 'How do I list my game as a developer?', 'How are top games chosen?'];

const OFFLINE_ANSWER = "Sorry, I couldn't reach the assistant. Please try again, or send your question to our team.";

interface Turn {
	id: number;
	role: AssistantRole;
	text: string;
	status?: AssistantReplyStatus;
	sourceIds?: string[];
	suggestInquiry?: boolean;
}

interface AssistantProps {
	/** Published FAQ entries and notices, to show the sources an answer used **/
	sources: NoticeItem[];
	onOpenSource: (source: NoticeItem) => void;
	onAskTeam: () => void;
}

/** AI help: answers from the published FAQ and notices; the conversation lives only in this component **/
const Assistant = ({ sources, onOpenSource, onAskTeam }: AssistantProps) => {
	const user = useReactiveVar(userVar);
	const signedIn = Boolean(user?._id);

	const [turns, setTurns] = useState<Turn[]>([]);
	const [question, setQuestion] = useState('');
	const [sending, setSending] = useState(false);
	const logRef = useRef<HTMLOListElement>(null);
	const nextId = useRef(1);

	/** APOLLO REQUESTS **/
	const [askAssistant] = useMutation(ASK_ASSISTANT);

	useEffect(() => {
		const log = logRef.current;
		if (log) log.scrollTop = log.scrollHeight;
	}, [turns, sending]);

	/** HANDLERS **/
	const ask = async (text: string) => {
		const clean = text.trim();
		if (clean.length < QUESTION_MIN || sending) return;

		// Earlier answered exchanges only; failed replies are not context
		const history: AssistantTurnInput[] = turns
			.filter((turn) => turn.role === AssistantRole.USER || turn.status === AssistantReplyStatus.OK)
			.slice(-HISTORY_MAX)
			.map((turn) => ({ role: turn.role, text: turn.text.slice(0, TURN_MAX) }));

		setTurns((prev) => [...prev, { id: nextId.current++, role: AssistantRole.USER, text: clean }]);
		setQuestion('');
		setSending(true);
		try {
			const result = await askAssistant({ variables: { input: { question: clean, history } } });
			const reply: AssistantReply | undefined = result?.data?.askAssistant;
			setTurns((prev) => [
				...prev,
				reply
					? {
							id: nextId.current++,
							role: AssistantRole.ASSISTANT,
							text: reply.answer,
							status: reply.status,
							sourceIds: reply.sourceIds,
							suggestInquiry: reply.suggestInquiry,
					  }
					: {
							id: nextId.current++,
							role: AssistantRole.ASSISTANT,
							text: OFFLINE_ANSWER,
							status: AssistantReplyStatus.UNAVAILABLE,
							suggestInquiry: true,
					  },
			]);
		} catch (err) {
			// GraphQL errors are already shown by the Apollo error link; keep the conversation readable
			setTurns((prev) => [
				...prev,
				{
					id: nextId.current++,
					role: AssistantRole.ASSISTANT,
					text: OFFLINE_ANSWER,
					status: AssistantReplyStatus.UNAVAILABLE,
					suggestInquiry: true,
				},
			]);
		} finally {
			setSending(false);
		}
	};

	const submitHandler = (event: React.FormEvent) => {
		event.preventDefault();
		ask(question).then();
	};

	const keyDownHandler = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Enter sends, Shift+Enter adds a line (not while an IME is composing Korean text)
		if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			ask(question).then();
		}
	};

	const header = (
		<header className="gv-cs-section-head">
			<p className="gv-chapter" aria-hidden>
				<span>04</span>Ask AI
			</p>
			<h2 className="gv-cs-section-head__title">Ask the assistant</h2>
			<p className="gv-cs-section-head__desc">
				Instant answers from our FAQ and notices. For anything about your own account, the team is one click away.
			</p>
		</header>
	);

	// On a full load the layout restores the user from the saved token just after the first render
	if (!signedIn && typeof window !== 'undefined' && getJwtToken()) {
		return (
			<div className="gv-cs-ai">
				<div className="gv-cs-empty" role="status">
					<p className="gv-cs-empty__title">Loading the assistant…</p>
				</div>
			</div>
		);
	}

	if (!signedIn) {
		return (
			<div className="gv-cs-ai">
				{header}
				<div className="gv-cs-gate">
					<p className="gv-cs-gate__title">Sign in to ask</p>
					<p className="gv-cs-gate__desc">The assistant is available to GameVerse members.</p>
					<Link href="/account/join" className="gv-cs-cta gv-cs-cta--solid">
						Sign in or join
					</Link>
				</div>
			</div>
		);
	}

	const sourceById = new Map(sources.map((source) => [source._id, source]));
	const tooShort = question.trim().length < QUESTION_MIN;

	return (
		<div className="gv-cs-ai">
			{header}

			<div className="gv-cs-ai__box">
				<ol className="gv-cs-ai__log" ref={logRef} aria-live="polite" aria-busy={sending}>
					{turns.length === 0 && (
						<li className="gv-cs-ai__intro">
							<p>Hi! Ask me about games, developers, your account or the community. Try one of these:</p>
							<div className="gv-cs-ai__starters">
								{STARTERS.map((starter) => (
									<button type="button" key={starter} className="gv-cs-chip" onClick={() => ask(starter)}>
										<span>{starter}</span>
									</button>
								))}
							</div>
						</li>
					)}

					{turns.map((turn) => {
						const mine = turn.role === AssistantRole.USER;
						const used = (turn.sourceIds ?? [])
							.map((id) => sourceById.get(id))
							.filter((source): source is NoticeItem => Boolean(source));
						return (
							<li
								key={turn.id}
								className={`gv-cs-ai__turn ${mine ? 'is-mine' : ''} ${
									turn.status && turn.status !== AssistantReplyStatus.OK ? 'is-off' : ''
								}`}
							>
								<p className="gv-cs-ai__who">{mine ? 'You' : 'Assistant'}</p>
								<p className="gv-cs-ai__text">{turn.text}</p>
								{used.length > 0 && (
									<div className="gv-cs-ai__sources">
										<span>Sources</span>
										{used.map((source) => (
											<button type="button" key={source._id} onClick={() => onOpenSource(source)}>
												{source.noticeCategory === NoticeCategory.NOTICE ? 'Notice: ' : ''}
												{source.noticeTitle}
											</button>
										))}
									</div>
								)}
								{!mine && turn.suggestInquiry && (
									<button type="button" className="gv-cs-ai__handoff" onClick={onAskTeam}>
										Ask the team →
									</button>
								)}
							</li>
						);
					})}

					{sending && (
						<li className="gv-cs-ai__turn gv-cs-ai__typing" role="status">
							<p className="gv-cs-ai__who">Assistant</p>
							<p className="gv-cs-ai__dots" aria-label="Writing an answer">
								<span />
								<span />
								<span />
							</p>
						</li>
					)}
				</ol>

				<form className="gv-cs-ai__form gv-cs-field" onSubmit={submitHandler}>
					<label className="gv-cs-field__label" htmlFor="cs-ai-question">
						<span>Your question</span>
						<span className="gv-cs-field__count">
							{question.length}/{QUESTION_MAX}
						</span>
					</label>
					<div className="gv-cs-ai__input">
						<textarea
							id="cs-ai-question"
							rows={2}
							maxLength={QUESTION_MAX}
							placeholder="Type a question… (Enter to send)"
							value={question}
							onChange={(event) => setQuestion(event.target.value)}
							onKeyDown={keyDownHandler}
							disabled={sending}
						/>
						<button
							type="submit"
							className="gv-cs-ai__send"
							disabled={sending || tooShort}
							aria-label="Send question"
						>
							<SendRoundedIcon aria-hidden />
						</button>
					</div>
					<p className="gv-cs-ai__note">
						AI answers can be wrong. Don't share passwords or personal details here. For problems with your own
						account, use{' '}
						<button type="button" onClick={onAskTeam}>
							Ask us
						</button>
						.
					</p>
				</form>
			</div>
		</div>
	);
};

export default Assistant;
