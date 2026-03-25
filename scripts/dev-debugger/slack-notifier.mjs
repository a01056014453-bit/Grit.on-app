/**
 * slack-notifier.mjs
 * 에러 발생 시 Slack Webhook으로 알림을 전송한다.
 *
 * 환경 변수: SLACK_WEBHOOK_URL
 */

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const SEVERITY_EMOJI = {
  critical: ':rotating_light:',
  high: ':red_circle:',
  medium: ':large_orange_circle:',
  low: ':white_circle:',
};

const CATEGORY_LABEL = {
  build: '빌드 에러',
  runtime: '런타임 에러',
  api: 'API 에러',
  type: '타입 에러',
  network: '네트워크 에러',
  unknown: '미분류 에러',
};

/**
 * Slack으로 에러 알림을 보낸다.
 * @param {Object} params
 * @param {import('./error-classifier.mjs').ClassifiedError} params.error
 * @param {boolean} params.isKnown - 기존에 알려진 에러인지
 * @param {string} [params.previousSolution] - 이전 해결법
 * @returns {Promise<boolean>} 전송 성공 여부
 */
export async function notifySlack({ error, isKnown, previousSolution }) {
  if (!WEBHOOK_URL) {
    console.log('[slack] SLACK_WEBHOOK_URL 미설정 — 알림 건너뜀');
    return false;
  }

  const emoji = SEVERITY_EMOJI[error.severity] ?? ':question:';
  const label = CATEGORY_LABEL[error.category] ?? error.category;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} [SEMPRE] ${label} 감지`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*심각도:* ${error.severity}` },
        { type: 'mrkdwn', text: `*카테고리:* ${label}` },
        { type: 'mrkdwn', text: `*파일:* \`${error.file || '알 수 없음'}\`` },
        { type: 'mrkdwn', text: `*시각:* ${error.timestamp}` },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*에러 내용:*\n\`\`\`${error.title}\`\`\``,
      },
    },
  ];

  if (isKnown && previousSolution) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:bulb: *이전 해결법:*\n${previousSolution}`,
      },
    });
  }

  if (isKnown) {
    blocks.push({
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: ':repeat: 이전에 발생했던 에러입니다.' },
      ],
    });
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error(`[slack] 전송 실패: ${response.status}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[slack] 전송 에러: ${err.message}`);
    return false;
  }
}
