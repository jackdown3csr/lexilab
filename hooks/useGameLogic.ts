import { useState, useCallback, useRef, useEffect } from "react"
import {
  playCorrectLetterSound,
  playIncorrectLetterSound,
  playWordCompletedSound,
  playLevelCompletionFanfare,
  playGodModeCorrectLetterSound,
  playGodModeIncorrectLetterSound,
  playGodModeEnterSound,
  playGodModeExitSound,
  playBonusLifeSound,
} from "@/utils/sounds"
import {
  gameSettings,
  calculateTimeMultiplier,
  calculateWordComplexityMultiplier,
  letterFrequency,
} from "@/utils/gameSettings"

export function useGameLogic(initialState: {
  currentWord: string
  currentHint: string
  score: number
  totalAttempts: number
  level: number
  timeRemaining: number
  levelDuration: number
}) {
  const [currentWord, setCurrentWord] = useState(initialState.currentWord)
  const [currentHint, setCurrentHint] = useState(initialState.currentHint)
  const [score, setScore] = useState(initialState.score || 0)
  const [totalAttempts, setTotalAttempts] = useState(gameSettings.initialAttempts)
  const [level, setLevel] = useState(gameSettings.initialLevel)
  const [timeRemaining, setTimeRemaining] = useState(gameSettings.initialLevelDuration)
  const [levelDuration, setLevelDuration] = useState(gameSettings.initialLevelDuration)
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set())
  const [correctKeys, setCorrectKeys] = useState<Set<string>>(new Set())
  const [baseMultiplier, setBaseMultiplier] = useState(gameSettings.initialBaseMultiplier)
  const [timeMultiplier, setTimeMultiplier] = useState(gameSettings.initialTimeMultiplier)
  const [wordComplexityMultiplier, setWordComplexityMultiplier] = useState(gameSettings.minWordComplexityMultiplier)
  const [isGodMode, setIsGodMode] = useState(false)
  const [godModePressesLeft, setGodModePressesLeft] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)
  const [bonusLifeEarned, setBonusLifeEarned] = useState(false)
  const [correctGuessesCount, setCorrectGuessesCount] = useState(0)
  const [currentWordLength, setCurrentWordLength] = useState(initialState.currentWord.length)
  const [consecutiveCorrectGuesses, setConsecutiveCorrectGuesses] = useState(0)
  const [totalCorrectGuesses, setTotalCorrectGuesses] = useState(0)
  const [godModeReady, setGodModeReady] = useState(false)
  const [consecutiveCorrectGuessesForExtraLife, setConsecutiveCorrectGuessesForExtraLife] = useState(0)

  const lastKeyPressTime = useRef(0)
  const processingGuess = useRef(false)

  const handleKeyPress = useCallback(
    (key: string) => {
      const now = Date.now()
      if (now - lastKeyPressTime.current < 100 || processingGuess.current) {
        return { newCorrectKeys: correctKeys, newAttempts: totalAttempts }
      }
      lastKeyPressTime.current = now
      processingGuess.current = true

      if (totalAttempts <= 0 || timeRemaining <= 0) {
        processingGuess.current = false
        return { newCorrectKeys: correctKeys, newAttempts: totalAttempts }
      }

      if (usedKeys.has(key)) {
        processingGuess.current = false
        return { newCorrectKeys: correctKeys, newAttempts: totalAttempts }
      }

      const isCorrect = currentWord.toUpperCase().includes(key)
      const newUsedKeys = new Set(usedKeys).add(key)
      const newCorrectKeys = isCorrect ? new Set([...correctKeys, key]) : new Set(correctKeys)
      let newAttempts = totalAttempts

      if (correctKeys.has(key)) {
        processingGuess.current = false
        return { newCorrectKeys: correctKeys, newAttempts: totalAttempts }
      }

      if (isCorrect) {
        setConsecutiveCorrectGuesses((prev) => prev + 1)
        setConsecutiveCorrectGuessesForExtraLife((prev) => {
          const newCount = prev + 1
          if (newCount >= gameSettings.bonusLifeCorrectGuesses) {
            setTotalAttempts((prevAttempts) => prevAttempts + 1)
            setBonusLifeEarned(true)
            playBonusLifeSound()
            setTimeout(() => setBonusLifeEarned(false), 3000)
            return 0 // Reset the counter after awarding bonus life
          }
          return newCount
        })
        setTotalCorrectGuesses((prev) => {
          const newCount = prev + 1
          if (newCount >= gameSettings.godModeThreshold) {
            setGodModeReady(true)
          }
          return newCount
        })

        // Calculate score for correct guess
        const letterScore = Math.round(
          gameSettings.baseLetterScore * baseMultiplier * timeMultiplier * wordComplexityMultiplier,
        )
        const newScore = score + letterScore
        setScore(Math.round(newScore))
      } else {
        setConsecutiveCorrectGuesses(0)
        setConsecutiveCorrectGuessesForExtraLife(0)
        if (!isGodMode) {
          newAttempts = Math.max(0, newAttempts - 1)
          setTotalAttempts(newAttempts)
        }
      }

      // Check if the word is completed
      const wordCompleted = currentWord
        .split("")
        .every((letter) => newCorrectKeys.has(letter.toUpperCase()) || letter === " " || !/^[A-Z]$/i.test(letter))

      if (wordCompleted) {
        setShowAnimation(true)
        playWordCompletedSound()
        playLevelCompletionFanfare()

        // Reset base multiplier for new level
        setBaseMultiplier(gameSettings.initialBaseMultiplier)

        // If word is completed, add bonus score
        const wordCompletionScore = Math.round(
          gameSettings.wordCompletionBaseScore * baseMultiplier * timeMultiplier * wordComplexityMultiplier,
        )
        const newTotalScore = score + wordCompletionScore
        setScore(Math.round(newTotalScore))

        if (isGodMode) {
          setIsGodMode(false)
          playGodModeExitSound()
        }
      }

      // Play appropriate sound
      if (isGodMode) {
        isCorrect ? playGodModeCorrectLetterSound() : playGodModeIncorrectLetterSound()
      } else {
        isCorrect ? playCorrectLetterSound() : playIncorrectLetterSound()
      }

      // Update God Mode logic
      if (key === "GODMODE" && godModeReady) {
        setIsGodMode(true)
        setGodModePressesLeft(gameSettings.godModePresses)
        playGodModeEnterSound()
        setGodModeReady(false)
        setTotalCorrectGuesses(0)
      } else if (isGodMode) {
        setGodModePressesLeft((prev) => {
          const newPresses = prev - 1
          if (newPresses <= 0) {
            setIsGodMode(false)
            playGodModeExitSound()
            setTotalCorrectGuesses(0)
            setGodModeReady(false)
          }
          return Math.max(0, newPresses)
        })
      }

      setUsedKeys(newUsedKeys)
      setCorrectKeys(newCorrectKeys)
      setTotalAttempts(newAttempts)

      const newBaseMultiplier = isCorrect
        ? Math.min(gameSettings.maxBaseMultiplier, baseMultiplier + gameSettings.baseMultiplierIncrement)
        : Math.max(gameSettings.minBaseMultiplier, baseMultiplier - gameSettings.baseMultiplierDecrement)
      setBaseMultiplier(newBaseMultiplier)

      processingGuess.current = false
      return { newCorrectKeys, newAttempts }
    },
    [
      currentWord,
      usedKeys,
      correctKeys,
      totalAttempts,
      timeRemaining,
      score,
      baseMultiplier,
      timeMultiplier,
      wordComplexityMultiplier,
      isGodMode,
      godModeReady,
      setBonusLifeEarned,
      playBonusLifeSound,
      setScore,
    ],
  )

  const calculateCurrentMultiplier = useCallback(() => {
    return baseMultiplier * timeMultiplier * wordComplexityMultiplier
  }, [baseMultiplier, timeMultiplier, wordComplexityMultiplier])

  const increaseLevel = useCallback(() => {
    setLevel((prevLevel) => {
      const newLevel = prevLevel + 1
      if (newLevel % gameSettings.freeLifeInterval === 0) {
        setTotalAttempts((prevAttempts) => prevAttempts + 1)
        setBonusLifeEarned(true)
        setTimeout(() => {
          setBonusLifeEarned(false)
        }, 3000)
      }
      return newLevel
    })
  }, [setLevel])

  const updateTimeMultiplier = useCallback(() => {
    setTimeMultiplier(calculateTimeMultiplier(timeRemaining, levelDuration))
  }, [timeRemaining, levelDuration])

  const resetKeyboard = useCallback(() => {
    setUsedKeys(new Set())
    setCorrectKeys(new Set())
  }, [])

  const resetCorrectGuessesCount = useCallback(() => {
    setCorrectGuessesCount(0)
  }, [])

  const resetGodMode = useCallback(() => {
    setIsGodMode(false)
    setGodModePressesLeft(0)
  }, [])

  const setCurrentWordAndLength = useCallback((word: string) => {
    setCurrentWord(word)
    setCurrentWordLength(word.length)
  }, [])

  const checkForFreeLife = useCallback(() => {
    if (level % gameSettings.freeLifeInterval === 0) {
      setTotalAttempts((prevAttempts) => prevAttempts + 1)
      setBonusLifeEarned(true)
      playBonusLifeSound()
      setTimeout(() => {
        setBonusLifeEarned(false)
      }, 3000)
      return true
    }
    return false
  }, [level, setTotalAttempts, setBonusLifeEarned, playBonusLifeSound])

  const resetForNewLevel = useCallback(() => {
    setBaseMultiplier(gameSettings.initialBaseMultiplier)
    setUsedKeys(new Set())
    setCorrectKeys(new Set())
    setConsecutiveCorrectGuesses(0)
    // God Mode remains ready if the threshold is met
  }, [])

  const getSafeScore = useCallback(() => {
    return Math.round(score)
  }, [score])

  return {
    currentWord,
    setCurrentWord: setCurrentWordAndLength,
    currentHint,
    setCurrentHint,
    score,
    setScore,
    totalAttempts,
    setTotalAttempts,
    level,
    setLevel,
    timeRemaining,
    setTimeRemaining,
    levelDuration,
    setLevelDuration,
    usedKeys,
    setUsedKeys,
    correctKeys,
    setCorrectKeys,
    baseMultiplier,
    setBaseMultiplier,
    timeMultiplier,
    setTimeMultiplier,
    wordComplexityMultiplier,
    setWordComplexityMultiplier,
    isGodMode,
    setIsGodMode,
    godModePressesLeft,
    setGodModePressesLeft,
    showAnimation,
    setShowAnimation,
    bonusLifeEarned,
    setBonusLifeEarned,
    handleKeyPress,
    updateTimeMultiplier,
    resetKeyboard,
    correctGuessesCount,
    setCorrectGuessesCount,
    resetCorrectGuessesCount,
    resetGodMode,
    currentWordLength,
    setCurrentWordLength,
    consecutiveCorrectGuesses,
    setConsecutiveCorrectGuesses,
    totalCorrectGuesses,
    setTotalCorrectGuesses,
    increaseLevel,
    checkForFreeLife,
    godModeReady,
    setGodModeReady,
    resetForNewLevel,
    consecutiveCorrectGuessesForExtraLife,
    setConsecutiveCorrectGuessesForExtraLife,
    calculateCurrentMultiplier,
    getSafeScore,
  }
}

