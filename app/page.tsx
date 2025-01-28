"use client"

import { useState, useEffect, useCallback } from "react"
import GameArea from "@/components/GameArea"
import Keyboard from "@/components/Keyboard"
import LoadingScreen from "@/components/LoadingScreen"
import StartScreen from "@/components/StartScreen"
import GameOverScreen from "@/components/GameOverScreen"
import DevOverlay from "@/components/DevOverlay"
import { startGame, submitGameSummary } from "@/utils/gameUtils"
import styles from "@/styles/Game.module.css"
import AppInitializer from "@/components/AppInitializer"
import {
  initializeSounds,
  setAutoplayAllowed,
  playWordCompletedSound,
  playGameOverSound,
  playGetReadyBeep,
  playLevelCompletionFanfare,
  playGoSound,
  playGodModeCorrectLetterSound,
  playGodModeIncorrectLetterSound,
  playGodModeEnterSound,
  playGodModeExitSound,
  playCorrectLetterSound,
  playIncorrectLetterSound,
  playBackgroundMusic,
} from "@/utils/sounds"
import { useGameLogic } from "@/hooks/useGameLogic"
import { gameSettings, calculateWordComplexityMultiplier } from "@/utils/gameSettings"

interface GameState {
  currentWord: string
  currentHint: string
  attempts: number
  score: number
  usedLetters: string[]
  correctLetters: string[]
  multiplier: number
  wordsCompleted: number
}

type GameStateType = "loading" | "start" | "transition" | "playing" | "gameOver"

export default function Game() {
  const [gameState, setGameState] = useState<GameStateType>("loading")
  const [error, setError] = useState<{ message: string; details?: string } | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [isSoundInitialized, setIsSoundInitialized] = useState(false)
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [isGameOverAnimating, setIsGameOverAnimating] = useState(false)
  const [isGetReadyPhase, setIsGetReadyPhase] = useState(false)
  const [showGetReadyAnimation, setShowGetReadyAnimation] = useState(false)
  const [isTargetedResolution] = useState(false)
  const [isMobileViewportAdjusted] = useState(false)
  const [showDevOverlay, setShowDevOverlay] = useState(false)
  const [dbInteractions, setDbInteractions] = useState(0)
  const [longWordBonus] = useState<number | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [currentWordLength] = useState(0)
  const [bonusLifeEarned, setBonusLifeEarned] = useState(false)
  const [lifeBonusEarned, setLifeBonusEarned] = useState(false)
  const [freeLifeAwardedThisLevel, setFreeLifeAwardedThisLevel] = useState(false)

  const playGetReadySequence = useCallback(() => {
    const playBeep = (index: number) => {
      if (index < 5) {
        playGetReadyBeep()
        setTimeout(() => playBeep(index + 1), 1000)
      }
    }
    playBeep(0)
  }, [])

  const playGoSequence = useCallback(() => {
    setTimeout(playGoSound, 5000)
  }, [])

  const {
    currentWord,
    setCurrentWord,
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
    bonusLifeEarned: bonusLifeEarnedFromHook,
    setBonusLifeEarned: setBonusLifeEarnedFromHook,
    handleKeyPress: gameLogicHandleKeyPress,
    updateTimeMultiplier,
    resetKeyboard,
    correctGuessesCount,

    resetCorrectGuessesCount,

    setCurrentWordLength,
    //checkForFreeLife,
    totalCorrectGuesses,
    setTotalCorrectGuesses,
    increaseLevel,
    godModeReady,
    setGodModeReady,
    resetForNewLevel,
    consecutiveCorrectGuessesForExtraLife,
    calculateCurrentMultiplier,
    getSafeScore,
  } = useGameLogic({
    currentWord: "",
    currentHint: "",
    score: 0,
    totalAttempts: gameSettings.initialAttempts,
    level: gameSettings.initialLevel,
    timeRemaining: gameSettings.initialLevelDuration,
    levelDuration: gameSettings.initialLevelDuration,
  })

  const updateGameState = useCallback(
    (state: GameState) => {
      setCurrentWord(state.currentWord.toUpperCase())
      setCurrentHint(state.currentHint.toUpperCase())
      setTotalAttempts(state.attempts)
      setScore(Math.round(state.score))
      setBaseMultiplier(state.multiplier)
      setLevel(state.wordsCompleted + 1)
      setUsedKeys(new Set(state.usedLetters?.map((letter: string) => letter.toUpperCase()) || []))
      setCorrectKeys(
        new Set([
          ...(state.correctLetters?.map((letter: string) => letter.toUpperCase()) || []),
          ...Array.from(state.currentWord.toUpperCase()).filter(
            (char): char is string => typeof char === "string" && !/^[A-Z]$/i.test(char),
          ),
        ]),
      )

      const newWordComplexityMultiplier = calculateWordComplexityMultiplier(state.currentWord)
      setWordComplexityMultiplier(newWordComplexityMultiplier)
      setTimeMultiplier(gameSettings.initialTimeMultiplier)
      setCurrentWordLength(state.currentWord.length)
    },
    [
      setCurrentWord,
      setCurrentHint,
      setTotalAttempts,
      setScore,
      setBaseMultiplier,
      setLevel,
      setUsedKeys,
      setCorrectKeys,
      setWordComplexityMultiplier,
      setTimeMultiplier,
      setCurrentWordLength,
    ],
  )

  const handleGameOver = useCallback(async () => {
    setIsGameOverAnimating(true)
    playGameOverSound()

    try {
      const currentScore = Math.round(getSafeScore())
      const gameSummary = {
        gameId: gameId!,
        score: currentScore,
        wordsCompleted: level - 1,
        totalCorrectGuesses: Array.from(correctKeys).filter(
          (key): key is string => typeof key === "string" && /^[A-Z]$/.test(key),
        ).length,
        timeTaken: Math.max(0, levelDuration * (level - 1) - timeRemaining),
      }

      const { validatedScore, finalWordsCompleted } = await submitGameSummary(gameSummary)

      setFinalScore(validatedScore)
      setLevel(finalWordsCompleted + 1)

      await new Promise((resolve) => setTimeout(resolve, 3000))

      setIsGameOverAnimating(false)
      setGameState("gameOver")
    } catch (error) {
      setError({
        message: "Failed to submit game summary. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      setIsGameOverAnimating(false)
      setGameState("gameOver")
    }
  }, [gameId, getSafeScore, level, correctKeys, levelDuration, timeRemaining, setLevel])

  const initializeGame = useCallback(async () => {
    setGameState("transition")
    let retries = 3
    while (retries > 0) {
      try {
        if (!isSoundInitialized) {
          await initializeSounds()
          setIsSoundInitialized(true)
          setAutoplayAllowed(true)
          await playBackgroundMusic()
        }
        const { gameId: newGameId, initialState, dbInteractions: initialDbInteractions } = await startGame()
        if (!newGameId || !initialState) {
          throw new Error("Invalid game data received from startGame")
        }
        setGameId(newGameId)
        updateGameState(initialState)
        setDbInteractions(initialDbInteractions)
        resetKeyboard()
        resetCorrectGuessesCount()

        setLevelDuration(gameSettings.initialLevelDuration)
        setTimeMultiplier(gameSettings.initialTimeMultiplier)

        setIsGetReadyPhase(true)
        setShowGetReadyAnimation(true)

        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            playGetReadyBeep()
          }, i * 1000)
        }

        setTimeout(() => {
          playGoSound()
        }, 5000)

        await new Promise((resolve) => setTimeout(resolve, 6000))

        setFreeLifeAwardedThisLevel(false)
        console.log("Initializing game:")
        console.log(`Initial level: ${level}`)
        console.log(`Initial total attempts: ${totalAttempts}`)
        console.log(`Initial freeLifeAwardedThisLevel: ${freeLifeAwardedThisLevel}`)
        setGameState("playing")
        setIsGetReadyPhase(false)
        setShowGetReadyAnimation(false)
        setTimeRemaining(gameSettings.initialLevelDuration)
        return
      } catch (error) {
        retries--
        if (retries === 0) {
          setError({
            message: "Failed to initialize game",
            details: error instanceof Error ? error.message : "Unknown error. Please refresh the page and try again.",
          })
          setGameState("start")
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }
  }, [
    isSoundInitialized,
    updateGameState,
    resetKeyboard,
    resetCorrectGuessesCount,
    setLevelDuration,
    setTimeMultiplier,
    setTimeRemaining,
    level,
    totalAttempts,
    freeLifeAwardedThisLevel,
  ])

  const startNewWord = useCallback(
    async (currentGameId: string) => {
      console.log(`Starting new word. Current level: ${level}, New level: ${level + 1}`)
      console.log(`Current total attempts: ${totalAttempts}`)
      console.log(`Free life awarded this level: ${freeLifeAwardedThisLevel}`)
      try {
        if (!currentGameId) {
          throw new Error("Game ID is not set")
        }
        const newLevel = level + 1
        if (newLevel % gameSettings.freeLifeInterval === 0 && !freeLifeAwardedThisLevel) {
          console.log(`Eligible for free life. Level ${newLevel} is divisible by ${gameSettings.freeLifeInterval}`)
          setTotalAttempts((prevAttempts) => {
            const newAttempts = prevAttempts + 1
            console.log(`Awarding free life. Previous attempts: ${prevAttempts}, New attempts: ${newAttempts}`)
            return newAttempts
          })
          setBonusLifeEarned(true)
          setFreeLifeAwardedThisLevel(true)
          console.log("Bonus life earned and freeLifeAwardedThisLevel set to true")
        } else {
          console.log(`Not eligible for free life. Level ${newLevel} or free life already awarded this level.`)
        }
        increaseLevel()
        resetForNewLevel()
        const response = await fetch("/api/get-new-word", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ gameId: currentGameId, usedWords }),
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (!data.word || !data.hint) {
          throw new Error("Invalid data received from server")
        }

        setCurrentWord(data.word.toUpperCase())
        setCurrentHint(data.hint)
        setUsedWords((prevUsedWords) => [...prevUsedWords, data.word.toUpperCase()])
        resetKeyboard()
        const newLevelDuration = Math.max(
          gameSettings.minLevelDuration,
          levelDuration - gameSettings.levelDurationDecrement,
        )
        setLevelDuration(newLevelDuration)
        setTimeRemaining(newLevelDuration)
        setBaseMultiplier(gameSettings.initialBaseMultiplier)

        setIsGetReadyPhase(true)
        setShowGetReadyAnimation(true)

        const playSequences = async () => {
          await playGetReadySequence()
          await playGoSequence()
        }
        playSequences().catch((error) => {
          console.error("Error in playSequences:", error)
        })

        await new Promise((resolve) => setTimeout(resolve, 6000))

        setShowGetReadyAnimation(false)
        setIsGetReadyPhase(false)
        setFreeLifeAwardedThisLevel(false)
        console.log("freeLifeAwardedThisLevel reset to false for the next level")
      } catch (error) {
        setError({
          message: "Failed to fetch new word",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    },
    [
      usedWords,
      levelDuration,
      setCurrentWord,
      setCurrentHint,
      setLevelDuration,
      setTimeRemaining,
      resetKeyboard,
      setBaseMultiplier,
      resetForNewLevel,
      playGetReadySequence,
      playGoSequence,
      setTotalAttempts,
      setBonusLifeEarned,
      setFreeLifeAwardedThisLevel,
      level,
      increaseLevel,
      setError,
      setIsGetReadyPhase,
      setShowGetReadyAnimation,
      setUsedWords,
      freeLifeAwardedThisLevel,
      totalAttempts,
    ],
  )

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing" || isGetReadyPhase) {
        return
      }

      if (key === "GODMODE" && godModeReady) {
        setIsGodMode(true)
        setGodModePressesLeft(gameSettings.godModePresses)
        playGodModeEnterSound()
        setGodModeReady(false)
        setTotalCorrectGuesses(0)
        return
      }

      const result = gameLogicHandleKeyPress(key)
      setCorrectKeys(result.newCorrectKeys)
      setTotalAttempts(result.newAttempts)

      const wordCompleted = currentWord
        .split("")
        .every(
          (letter: string) =>
            result.newCorrectKeys.has(letter.toUpperCase()) || letter === " " || !/^[A-Z]$/i.test(letter),
        )

      if (wordCompleted) {
        setShowAnimation(true)
        playWordCompletedSound()
        playLevelCompletionFanfare()
        if (isGodMode) {
          playGodModeExitSound()
          setIsGodMode(false)
        }

        setTimeout(() => {
          setShowAnimation(false)
          if (gameId) {
            startNewWord(gameId)
          } else {
            setError({
              message: "Failed to start new word",
              details: "Game ID is not set",
            })
          }
        }, gameSettings.wordCompletionDelay)
      } else {
        if (isGodMode) {
          if (result.newCorrectKeys.size > correctKeys.size) {
            playGodModeCorrectLetterSound()
          } else {
            playGodModeIncorrectLetterSound()
          }
        } else {
          if (result.newCorrectKeys.size > correctKeys.size) {
            playCorrectLetterSound()
          } else {
            playIncorrectLetterSound()
          }
        }
      }

      if (result.newAttempts === 0) {
        handleGameOver()
      }
      // if (checkForFreeLife()) {
      //   setLifeBonusEarned(true);
      // }
    },
    [
      gameState,
      isGetReadyPhase,
      gameLogicHandleKeyPress,
      currentWord,
      setShowAnimation,
      gameId,
      startNewWord,
      setError,
      handleGameOver,
      isGodMode,
      setIsGodMode,
      setGodModePressesLeft,
      correctKeys,
      godModeReady,
      setGodModeReady,
      setTotalAttempts,
      setCorrectKeys,
      setTotalCorrectGuesses,
    ],
  )

  useEffect(() => {
    if (gameState === "loading") {
      setGameState("start")
    }
  }, [gameState])

  useEffect(() => {
    const initSound = async () => {
      if (!isSoundInitialized) {
        await initializeSounds()
        setIsSoundInitialized(true)
        setAutoplayAllowed(true)
      }
    }
    initSound()
  }, [isSoundInitialized])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === "playing" && !isGetReadyPhase && !isGameOverAnimating) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime: number) => {
          if (prevTime <= 1) {
            clearInterval(timer)
            handleGameOver()
            return 0
          }
          return prevTime - 1
        })

        updateTimeMultiplier()
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [gameState, isGetReadyPhase, isGameOverAnimating, handleGameOver, updateTimeMultiplier, setTimeRemaining])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase()
      if (/^[A-Z]$/.test(key) && gameState === "playing") {
        handleKeyPress(key)
      }
      if (event.key === "F9") {
        setShowDevOverlay((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, handleKeyPress])

  useEffect(() => {
    if (bonusLifeEarned) {
      const timer = setTimeout(() => {
        setBonusLifeEarned(false)
      }, 3000) // Display for 3 seconds
      return () => clearTimeout(timer)
    }
  }, [bonusLifeEarned, setBonusLifeEarned])

  useEffect(() => {
    if (lifeBonusEarned) {
      console.log(`lifeBonusEarned effect triggered. Current totalAttempts: ${totalAttempts}`)
      setTotalAttempts((prevAttempts: number) => {
        console.log(`Setting totalAttempts in lifeBonusEarned effect: ${prevAttempts} -> ${prevAttempts + 1}`)
        return prevAttempts + 1
      })
      setBonusLifeEarned(true)
      setTimeout(() => {
        setLifeBonusEarned(false)
        setBonusLifeEarned(false)
      }, 3000)
    }
  }, [lifeBonusEarned, setTotalAttempts, setBonusLifeEarned])

  useEffect(() => {
    console.log(`totalAttempts changed in Game component: ${totalAttempts}`)
    if (totalAttempts === 0 || timeRemaining === 0) {
      setIsGodMode(false)
      setGodModeReady(false)
      handleGameOver()
    }
  }, [totalAttempts, timeRemaining, handleGameOver, setIsGodMode, setGodModeReady, totalAttempts])

  useEffect(() => {
    if (bonusLifeEarnedFromHook) {
      setBonusLifeEarned(true)
      const timer = setTimeout(() => {
        setBonusLifeEarned(false)
        setBonusLifeEarnedFromHook(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [bonusLifeEarnedFromHook, setBonusLifeEarned, setBonusLifeEarnedFromHook])

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h1>ERROR</h1>
        <p>{error.message}</p>
        {error.details && <p>{error.details}</p>}
        <button
          onClick={() => {
            setError(null)
            initializeGame()
          }}
        >
          TRY AGAIN
        </button>
      </div>
    )
  }

  return (
    <>
      <AppInitializer />
      {showDevOverlay && (
        <DevOverlay
          baseMultiplier={baseMultiplier}
          timeMultiplier={timeMultiplier}
          wordComplexityMultiplier={wordComplexityMultiplier}
          score={getSafeScore()}
          isGodMode={isGodMode}
          totalAttempts={totalAttempts}
          level={level}
          timeRemaining={timeRemaining}
          dbInteractions={dbInteractions}
          correctGuessesCount={correctGuessesCount}
          currentWordLength={currentWordLength}
          godModeThreshold={gameSettings.godModeThreshold}
          freeLifeInterval={gameSettings.freeLifeInterval}
          consecutiveCorrectGuessesForExtraLife={consecutiveCorrectGuessesForExtraLife}
          totalCorrectGuesses={totalCorrectGuesses}
          bonusLifeCorrectGuesses={gameSettings.bonusLifeCorrectGuesses}
          gameSettings={gameSettings}
        />
      )}
      <div
        className={`${styles.gameContainer} ${isTargetedResolution ? styles.targetedResolution : ""} ${isMobileViewportAdjusted ? styles.mobileViewportAdjust : ""}`}
      >
        <div className={styles.fullHeightContent}>
          {gameState === "start" && (
            <StartScreen
              onStartGame={initializeGame}
              isTargetedResolution={isTargetedResolution}
              isMobileViewportAdjusted={isMobileViewportAdjusted}
            />
          )}
          {gameState === "loading" && <LoadingScreen />}
          {(gameState === "transition" || gameState === "playing" || isGameOverAnimating) && (
            <>
              <GameArea
                currentWord={currentWord}
                currentHint={currentHint}
                score={Math.round(score)}
                correctKeys={correctKeys}
                timeRemaining={timeRemaining}
                multiplier={calculateCurrentMultiplier()}
                showAnimation={showAnimation}
                totalAttempts={totalAttempts}
                level={level}
                isGetReadyPhase={isGetReadyPhase}
                showGetReadyAnimation={showGetReadyAnimation}
                setShowGetReadyAnimation={setShowGetReadyAnimation}
                showGameOverAnimation={isGameOverAnimating}
                levelDuration={levelDuration}
                bonusLifeEarned={bonusLifeEarned}
                isGodMode={isGodMode}
                godModePressesLeft={godModePressesLeft}
                isTargetedResolution={isTargetedResolution}
                isMobileViewportAdjusted={isMobileViewportAdjusted}
                longWordBonus={longWordBonus}
              />
              <Keyboard
                onKeyPress={handleKeyPress}
                usedKeys={usedKeys}
                totalAttempts={totalAttempts}
                disabled={isGetReadyPhase || isGameOverAnimating}
                isTargetedResolution={isTargetedResolution}
                isMobileViewportAdjusted={isMobileViewportAdjusted}
                godModeReady={godModeReady}
              />
            </>
          )}
          {gameState === "gameOver" && !isGameOverAnimating && (
            <GameOverScreen
              score={Math.round(Math.max(finalScore, getSafeScore()))}
              onPlayAgain={initializeGame}
              isTargetedResolution={isTargetedResolution}
              isMobileViewportAdjusted={isMobileViewportAdjusted}
              gameId={gameId || ""}
            />
          )}
        </div>
      </div>
    </>
  )
}

