/**
 * Slack 에이전트 레지스트리
 * .claude/agents/*.md 파일 기반 시스템 프롬프트 관리
 */

export type AgentId =
  | 'orchestrator'
  | 'frontend'
  | 'backend'
  | 'ai-ml'
  | 'classical-music'
  | 'planner'
  | 'tester'
  | 'auditor';

interface AgentConfig {
  readonly id: AgentId;
  readonly name: string;
  readonly emoji: string;
  readonly aliases: readonly string[];
  readonly description: string;
}

export const AGENTS: Record<AgentId, AgentConfig> = {
  orchestrator: {
    id: 'orchestrator',
    name: '오케스트레이터',
    emoji: ':conductor:',
    aliases: ['오케스트레이터', '총괄', 'orchestrator', 'orch'],
    description: '총괄 분배 & 보고. 어떤 에이전트에게 물어야 할지 모를 때 기본값.',
  },
  frontend: {
    id: 'frontend',
    name: '프론트엔드',
    emoji: ':art:',
    aliases: ['프론트엔드', '프론트', 'frontend', 'fe'],
    description: 'UI/UX, 컴포넌트, Tailwind, 디자인 시스템',
  },
  backend: {
    id: 'backend',
    name: '백엔드',
    emoji: ':gear:',
    aliases: ['백엔드', '백', 'backend', 'be', 'api', 'db'],
    description: 'Supabase, API Route, DB, 인증, RLS',
  },
  'ai-ml': {
    id: 'ai-ml',
    name: 'AI/ML',
    emoji: ':robot_face:',
    aliases: ['ai', 'ml', 'ai/ml', 'aiml'],
    description: 'AI 곡 분석, YAMNet, 오디오 감지, Claude/OpenAI 연동',
  },
  'classical-music': {
    id: 'classical-music',
    name: '클래식음악',
    emoji: ':violin:',
    aliases: ['클래식', '음악', 'classical', 'music', '클래식음악'],
    description: '화성학, 악기별 연습법, 입시, 곡 분석 기준',
  },
  planner: {
    id: 'planner',
    name: '기획',
    emoji: ':clipboard:',
    aliases: ['기획', '플래너', 'planner', 'prd'],
    description: '기능 스펙, PRD, 유저 플로우, 비즈니스 로직',
  },
  tester: {
    id: 'tester',
    name: '테스트',
    emoji: ':test_tube:',
    aliases: ['테스트', '테스터', 'tester', 'test', 'qa'],
    description: 'E2E 테스트, 버그 재현, 시나리오',
  },
  auditor: {
    id: 'auditor',
    name: '감사',
    emoji: ':mag:',
    aliases: ['감사', '감사관', 'auditor', 'audit', '리뷰'],
    description: '코드 리뷰, 품질 검토, 감사 루프',
  },
} as const;

const AGENT_LIST = Object.values(AGENTS);

/**
 * 메시지에서 에이전트 지정 파싱
 * 예: "@프론트엔드 버튼 색상 바꿔줘" → { agentId: 'frontend', message: '버튼 색상 바꿔줘' }
 * 예: "[백엔드] API 만들어줘" → { agentId: 'backend', message: 'API 만들어줘' }
 * 지정 없으면 → orchestrator
 */
export function parseAgentFromMessage(text: string): {
  agentId: AgentId;
  cleanMessage: string;
} {
  const trimmed = text.trim();

  // 패턴 1: @에이전트명 메시지
  const mentionMatch = trimmed.match(/^@(\S+)\s*([\s\S]*)$/);
  if (mentionMatch) {
    const found = findAgentByAlias(mentionMatch[1]);
    if (found) {
      return { agentId: found.id, cleanMessage: mentionMatch[2].trim() };
    }
  }

  // 패턴 2: [에이전트명] 메시지
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  if (bracketMatch) {
    const found = findAgentByAlias(bracketMatch[1]);
    if (found) {
      return { agentId: found.id, cleanMessage: bracketMatch[2].trim() };
    }
  }

  // 기본값: 오케스트레이터
  return { agentId: 'orchestrator', cleanMessage: trimmed };
}

function findAgentByAlias(keyword: string): AgentConfig | undefined {
  const lower = keyword.toLowerCase();
  return AGENT_LIST.find((agent) =>
    agent.aliases.some((alias) => alias === lower)
  );
}

/** 사용 가능한 에이전트 목록 텍스트 (Slack 포맷) */
export function getAgentListText(): string {
  return AGENT_LIST.map(
    (a) => `${a.emoji} *${a.name}* (\`@${a.aliases[0]}\`) — ${a.description}`
  ).join('\n');
}
