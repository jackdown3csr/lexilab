export const gameSettings = {
  initialAttempts: 10,
  initialLevel: 1,
  initialLevelDuration: 120,
  initialTimeMultiplier: 1.75,
  initialBaseMultiplier: 1.02,
  maxBaseMultiplier: 1.75,
  minBaseMultiplier: 1.02,
  maxWordComplexityMultiplier: 1.9,
  minWordComplexityMultiplier: 1.2,
  godModePresses: 3,
  bonusLifeWordLength: 9,
  baseLetterScore: 10,
  maxLetterScoreMultiplier: 3.5,
  wordCompletionBaseScore: 50,
  baseMultiplierIncrement: 0.1,
  baseMultiplierDecrement: 0.05,
  levelDurationDecrement: 5,
  minLevelDuration: 60,
  wordCompletionDelay: 1500,
  godModeThreshold: 25, // Number of correct guesses to enter God Mode
  freeLifeInterval: 5, // Interval of levels at which a free life is awarded
  bonusLifeCorrectGuesses: 10, // Number of consecutive correct guesses to earn a bonus life
}

export const calculateTimeMultiplier = (timeRemaining: number, levelDuration: number): number => {
  if (timeRemaining > levelDuration - 60) {
    return 1 + (timeRemaining - (levelDuration - 60)) / 120
  }
  return 1
}

export const calculateWordComplexityMultiplier = (word: string): number => {
  const wordLength = word.length
  const uniqueLetters = new Set(word.toUpperCase()).size
  const rawComplexity = 1 + wordLength * 0.03 + uniqueLetters * 0.02
  return Math.min(
    gameSettings.maxWordComplexityMultiplier,
    Math.max(gameSettings.minWordComplexityMultiplier, rawComplexity),
  )
}

export const letterFrequency = {
  A: 8.12,
  B: 1.49,
  C: 2.71,
  D: 4.32,
  E: 12.02,
  F: 2.3,
  G: 2.03,
  H: 5.92,
  I: 6.97,
  J: 0.15,
  K: 0.77,
  L: 4.03,
  M: 2.41,
  N: 6.75,
  O: 7.51,
  P: 1.93,
  Q: 0.1,
  R: 6.02,
  S: 6.28,
  T: 9.1,
  U: 2.8,
  V: 0.98,
  W: 2.36,
  X: 0.15,
  Y: 1.97,
  Z: 0.07,
}

