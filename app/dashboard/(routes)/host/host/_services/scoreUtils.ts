// app/dashboard/_services/scoreUtils.ts
/**
 * Utilities that compare user answers to correctAnswers and return a numeric score.
 * They try to handle both index-based answers and value-based answers.
 */

function isArray(a: any): a is any[] {
  return Array.isArray(a);
}

function toNormalizedArray(v: any) {
  if (v === undefined || v === null) return [];
  return isArray(v) ? v.map(String) : [String(v)];
}

/**
 * Compare two arrays as sets of strings (order-insensitive).
 */
export function arraysEqualAsSets(a: any, b: any) {
  const A = new Set(toNormalizedArray(a));
  const B = new Set(toNormalizedArray(b));
  if (A.size !== B.size) return false;
  //@ts-ignore
  for (const x of A) if (!B.has(x)) return false;
  return true;
}

/**
 * Calculate score: iterate each question and check if user's answer matches correctAnswers.
 *
 * @param questions - array of question objects. Each question must have correctAnswers (JSON).
 * @param submissionAnswers - JSON object mapping question index (string) to selected answers.
 *
 * returns numeric count of correct questions (integer).
 */
export function calculateSubmissionScore(questions: any[], submissionAnswers: any): number {
  let score = 0;
  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const correct = q.correctAnswers ?? [];
    const userAns = submissionAnswers?.[String(idx)];

    if (arraysEqualAsSets(correct, userAns)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Normalize answers to a presentable string (used by modal to display choices).
 */
export function normalizeAnswer(ans: any): string {
  if (ans === undefined || ans === null) return '(no answer)';
  if (Array.isArray(ans)) return ans.map(a => String(a)).join(', ');
  return String(ans);
}
