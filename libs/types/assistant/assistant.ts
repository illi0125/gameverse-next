import { AssistantReplyStatus, AssistantRole } from '../../enums/assistant.enum';

export interface AssistantStatus {
	enabled: boolean;
}

export interface AssistantReply {
	status: AssistantReplyStatus;
	/** Plain text; render as text, never as HTML **/
	answer: string;
	sourceIds: string[];
	suggestInquiry: boolean;
}

export interface AssistantTurnInput {
	role: AssistantRole;
	text: string;
}

export interface AssistantInput {
	question: string;
	history?: AssistantTurnInput[];
}
