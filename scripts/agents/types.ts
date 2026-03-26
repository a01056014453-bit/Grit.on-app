export interface AgentResult {
  readonly agentId: string;
  readonly summary: string;
  readonly details: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

export interface SlackBlock {
  readonly type: string;
  readonly text?: { type: string; text: string; emoji?: boolean };
  readonly elements?: readonly { type: string; text: string }[];
  readonly fields?: readonly { type: string; text: string }[];
}

export type AgentCommand =
  | 'review-push'
  | 'review-pr'
  | 'classify-issue'
  | 'daily-summary';

export const BUDGET: Record<AgentCommand, number> = {
  'review-push': 0.05,
  'review-pr': 0.08,
  'classify-issue': 0.02,
  'daily-summary': 0.03,
} as const;

export const MAX_TURNS: Record<AgentCommand, number> = {
  'review-push': 5,
  'review-pr': 8,
  'classify-issue': 3,
  'daily-summary': 5,
} as const;

export const MODEL = 'claude-haiku-4-5' as const;
