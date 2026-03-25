/**
 * error-classifier.mjs
 * 에러 메시지를 분석하여 카테고리와 심각도를 분류한다.
 */

/** @typedef {'build' | 'runtime' | 'api' | 'type' | 'network' | 'unknown'} ErrorCategory */
/** @typedef {'critical' | 'high' | 'medium' | 'low'} Severity */

/**
 * @typedef {Object} ClassifiedError
 * @property {ErrorCategory} category
 * @property {Severity} severity
 * @property {string} title - 에러 요약 (1줄)
 * @property {string} rawMessage - 원본 에러 메시지
 * @property {string} file - 관련 파일 경로 (추출 가능한 경우)
 * @property {number | null} line - 관련 라인 번호
 * @property {string} timestamp
 */

const PATTERNS = [
  // Build errors
  {
    category: 'build',
    severity: 'critical',
    patterns: [
      /Module not found/i,
      /Failed to compile/i,
      /Build error occurred/i,
      /Cannot find module/i,
      /SyntaxError:.*Unexpected token/i,
    ],
  },
  // Type errors
  {
    category: 'type',
    severity: 'high',
    patterns: [
      /Type error:/i,
      /TS\d{4,5}:/,
      /Property .+ does not exist on type/i,
      /Argument of type .+ is not assignable/i,
      /Type '.+' is not assignable to type/i,
    ],
  },
  // API errors
  {
    category: 'api',
    severity: 'high',
    patterns: [
      /\b(4\d{2}|5\d{2})\b.*(?:error|fail)/i,
      /API.*(?:error|fail|timeout)/i,
      /fetch.*(?:error|fail)/i,
      /ECONNREFUSED/i,
      /Supabase.*error/i,
      /PostgrestError/i,
    ],
  },
  // Runtime errors
  {
    category: 'runtime',
    severity: 'high',
    patterns: [
      /Unhandled Runtime Error/i,
      /ReferenceError:/i,
      /TypeError:/i,
      /RangeError:/i,
      /Error: (?!Warning)/i,
      /Cannot read propert/i,
      /is not a function/i,
      /Hydration.*mismatch/i,
    ],
  },
  // Network errors
  {
    category: 'network',
    severity: 'medium',
    patterns: [
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /network.*error/i,
    ],
  },
];

// 파일 경로 추출 패턴
const FILE_PATH_REGEX = /(?:\/[\w.-]+)+\.\w+(?::(\d+)(?::(\d+))?)?/;
const RELATIVE_PATH_REGEX = /(?:src|app|pages|components|lib)\/[\w/.-]+\.\w+(?::(\d+))?/;

/**
 * 에러 메시지를 분류한다.
 * @param {string} rawMessage
 * @returns {ClassifiedError}
 */
export function classifyError(rawMessage) {
  const matched = PATTERNS.find((group) =>
    group.patterns.some((pattern) => pattern.test(rawMessage))
  );

  const category = matched?.category ?? 'unknown';
  const severity = matched?.severity ?? 'low';

  const fileMatch =
    rawMessage.match(FILE_PATH_REGEX) ||
    rawMessage.match(RELATIVE_PATH_REGEX);

  const file = fileMatch ? fileMatch[0].split(':')[0] : '';
  const line = fileMatch?.[1] ? parseInt(fileMatch[1], 10) : null;

  const title = extractTitle(rawMessage, category);

  return {
    category,
    severity,
    title,
    rawMessage: rawMessage.slice(0, 2000), // 과도한 메시지 방지
    file,
    line,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 에러 메시지에서 핵심 1줄 제목을 추출한다.
 * @param {string} message
 * @param {ErrorCategory} category
 * @returns {string}
 */
function extractTitle(message, category) {
  const firstLine = message.split('\n')[0].trim();

  if (firstLine.length <= 120) {
    return firstLine;
  }

  return `[${category}] ${firstLine.slice(0, 100)}...`;
}

/**
 * 에러의 고유 핑거프린트를 생성한다.
 * 동일 에러 중복 감지에 사용.
 * @param {ClassifiedError} error
 * @returns {string}
 */
export function fingerprint(error) {
  const normalized = error.title
    .replace(/\d+/g, 'N')
    .replace(/['"][^'"]*['"]/g, 'STR')
    .trim();

  return `${error.category}::${normalized}::${error.file}`;
}
