/** Calculate PHQ-9 total and item 9 flag */
export function scorePHQ9(answers: number[]): { total: number; item9Score: number; item9Flag: boolean } {
  const total = answers.reduce((sum, val) => sum + val, 0);
  const item9Score = answers[8] ?? 0;
  return { total, item9Score, item9Flag: item9Score > 0 };
}

/** Calculate GAD-7 total */
export function scoreGAD7(answers: number[]): { total: number } {
  return { total: answers.reduce((sum, val) => sum + val, 0) };
}

/** Calculate PQ-16 total (count of "Yes" endorsements) */
export function scorePQ16(answers: number[]): { total: number } {
  return { total: answers.reduce((sum, val) => sum + val, 0) };
}
