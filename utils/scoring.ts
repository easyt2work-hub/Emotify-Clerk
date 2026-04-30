import { REQOL10_REVERSE_ITEMS } from '@/constants/Screening';

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

/** Calculate WSAS total (sum of 5 items, 0-8 each, max 40) */
export function scoreWSAS(answers: number[]): { total: number } {
  return { total: answers.reduce((sum, val) => sum + val, 0) };
}

/** Calculate ReQoL-10 total with reverse scoring for items 3, 5, 7 (0-indexed: 2, 4, 6) */
export function scoreReQoL10(answers: number[]): { total: number } {
  let total = 0;
  answers.forEach((val, index) => {
    const itemNumber = index + 1;
    if (REQOL10_REVERSE_ITEMS.includes(itemNumber)) {
      total += (4 - val); // reverse score
    } else {
      total += val;
    }
  });
  return { total };
}
