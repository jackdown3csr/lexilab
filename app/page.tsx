"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import GameArea from "@/components/GameArea"
import Keyboard from "@/components/Keyboard"
import LoadingScreen from "@/components/LoadingScreen"
import StartScreen from "@/components/StartScreen"
import GameOverScreen from "@/components/GameOverScreen"
import DevOverlay from "@/components/DevOverlay"
import { startGame, getFinalScore } from "@/utils/gameUtils"
import styles from "@/styles/Game.module.css"
import AppInitializer from "@/components/AppInitializer"
import {
  initializeSounds,
  setAutoplayAllowed,
  playCorrectLetterSound,
  playIncorrectLetterSound,
  playWordCompletedSound,
  playGameOverSound,
  changeBackgroundMusic,
  playGetReadyBeep,
  playLevelCompletionFanfare,
  playGoSound,
  playGodModeCorrectLetterSound,
  playGodModeIncorrectLetterSound,
  playGodModeEnterSound,
  playGodModeExitSound,
} from "@/utils/sounds"

type GameState = "loading" | "start" | "transition" | "playing" | "gameOver"

interface GameStateData {
  currentWord: string
  currentHint: string
  attempts: number
  score: number
  multiplier: number
  wordsCompleted: number
  usedLetters?: string[]
  correctLetters?: string[]
}

const letterFrequency = {
  E: 11.1607,
  A: 8.4966,
  R: 7.5809,
  I: 7.5448,
  O: 7.1635,
  T: 6.9509,
  N: 6.6544,
  S: 5.7351,
  L: 5.4893,
  C: 4.5388,
  U: 3.6308,
  D: 3.3844,
  P: 3.1671,
  M: 3.0129,
  H: 3.0034,
  G: 2.4705,
  B: 2.072,
  F: 1.8121,
  Y: 1.7779,
  W: 1.2899,
  K: 1.1016,
  V: 1.0074,
  X: 0.2902,
  Z: 0.2722,
  J: 0.1965,
  Q: 0.1962,
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("loading")
  const [error, setError] = useState<{ message: string; details?: string } | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [currentWord, setCurrentWord] = useState("")
  const [currentHint, setCurrentHint] = useState("")
  const [totalAttempts, setTotalAttempts] = useState(10)
  const [score, setScore] = useState(0)
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set())
  const [correctKeys, setCorrectKeys] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [baseMultiplier, setBaseMultiplier] = useState(1)
  const [timeMultiplier, setTimeMultiplier] = useState(1.5)
  const [showAnimation, setShowAnimation] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [isGetReadyPhase, setIsGetReadyPhase] = useState(false)
  const [showGetReadyAnimation, setShowGetReadyAnimation] = useState(false)
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [isSoundInitialized, setIsSoundInitialized] = useState(false)
  const [levelDuration, setLevelDuration] = useState(120)
  const [isGameOverAnimating, setIsGameOverAnimating] = useState(false)
  const [bonusLifeEarned, setBonusLifeEarned] = useState(false)
  const [wordComplexityMultiplier, setWordComplexityMultiplier] = useState(1)
  const [isGodMode, setIsGodMode] = useState(false)
  const [godModePressesLeft, setGodModePressesLeft] = useState(0)
  const [isTargetedResolution, setIsTargetedResolution] = useState(false)
  const [isMobileViewportAdjusted, setIsMobileViewportAdjusted] = useState(false)
  const [showDevOverlay, setShowDevOverlay] = useState(false)

  const lastKeyPressTime = useRef(0)
  const processingGuess = useRef(false)

  const handleGameOver = useCallback(async () => {
    console.log("handleGameOver called")
    setIsGameOverAnimating(true)
    console.log("Starting game over animation")
    playGameOverSound()

    try {
      const currentScore = score
      console.log("Fetching final score for gameId:", gameId, "currentScore:", currentScore)
      const { finalScore, wordsCompleted } = await getFinalScore(gameId!, currentScore)

      if (finalScore === undefined || finalScore === null) {
        throw new Error("Invalid final score received")
      }

      console.log("Final score received:", finalScore, "Words completed:", wordsCompleted)
      setFinalScore(finalScore)
      setLevel(wordsCompleted + 1)

      // Allow time for the animation to play
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setIsGameOverAnimating(false)
      console.log("Transitioning to game over state")
      setGameState("gameOver")
    } catch (error) {
      console.error("Error in handleGameOver:", error)
      setError({
        message: "Failed to get final score. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      setIsGameOverAnimating(false)
      setGameState("gameOver")
    }
  }, [gameId, score, setFinalScore, setLevel, setIsGameOverAnimating, setGameState, setError])

  useEffect(() => {
    console.log("Game component mounted")
    if (gameState === "loading") {
      console.log("Setting game state to start")
      setGameState("start")
    }
  }, [gameState])

  useEffect(() => {
    console.log(
      "Timer effect running. Game state:",
      gameState,
      "Is get ready phase:",
      isGetReadyPhase,
      "Is game over animating:",
      isGameOverAnimating,
    )
    let timer: NodeJS.Timeout
    if (gameState === "playing" && !isGetReadyPhase && !isGameOverAnimating) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            console.log("Time's up! Triggering game over")
            clearInterval(timer)
            handleGameOver()
            return 0
          }
          return prevTime - 1
        })

        setTimeMultiplier(() => {
          if (timeRemaining > levelDuration - 60) {
            // Calculate a value between 1.5 and 1 based on the time remaining
            return 1 + (timeRemaining - (levelDuration - 60)) / 120
          }
          return 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [gameState, isGetReadyPhase, isGameOverAnimating, levelDuration, timeRemaining, handleGameOver])

  useEffect(() => {
    console.log("Initializing sounds")
    initializeSounds().catch(console.error)
  }, [])

  useEffect(() => {
    const checkResolution = () => {
      const { innerWidth, innerHeight } = window
      setIsTargetedResolution(
        (innerWidth === 1024 && innerHeight === 600) || (innerWidth === 1200 && innerHeight === 800),
      )
    }

    checkResolution()
    window.addEventListener("resize", checkResolution)
    return () => window.removeEventListener("resize", checkResolution)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobileViewportAdjusted(window.innerHeight < 500)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const initializeGame = async () => {
    console.log("Initializing game")
    setGameState("transition")
    let retries = 3
    while (retries > 0) {
      try {
        if (!isSoundInitialized) {
          console.log("Initializing sound manager")
          await initializeSounds()
          setIsSoundInitialized(true)
          setAutoplayAllowed(true)
          await changeBackgroundMusic()
          console.log("Sound manager initialized")
        }
        console.log("Starting new game")
        const { gameId, initialState } = await startGame()
        console.log("Game started with ID:", gameId)
        setGameId(gameId)
        updateGameState(initialState)

        setLevelDuration(120)
        setTimeMultiplier(1.5)

        console.log("Starting Get Ready phase")
        setIsGetReadyPhase(true)
        setShowGetReadyAnimation(true)

        // Play get ready beeps
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            playGetReadyBeep()
          }, i * 1000)
        }

        // Play "GO!" sound after the countdown
        setTimeout(() => {
          playGoSound()
        }, 5000)

        // Use a Promise to ensure the full duration of the Get Ready phase
        await new Promise((resolve) => setTimeout(resolve, 6000))

        console.log("Transition to playing state")
        setGameState("playing")
        setIsGetReadyPhase(false)
        setShowGetReadyAnimation(false)
        setTimeRemaining(120)
        return // Exit the function if successful
      } catch (error) {
        console.error("Error initializing game:", error)
        retries--
        if (retries === 0) {
          setError({
            message: "Failed to initialize game",
            details: error instanceof Error ? error.message : "Unknown error. Please refresh the page and try again.",
          })
          setGameState("start")
        } else {
          console.log(`Retrying... (${retries} attempts left)`)
          await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds before retrying
        }
      }
    }
  }

  const startNewWord = useCallback(
    async (currentGameId: string) => {
      console.log("Starting new word for game ID:", currentGameId)
      console.log("Current God Mode state before reset:", isGodMode)
      try {
        if (!currentGameId) {
          throw new Error("Game ID is not set")
        }
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

        console.log("New word received and set:", data.word)
        setCurrentWord(data.word.toUpperCase())
        setCurrentHint(data.hint)
        setUsedWords((prevUsedWords) => [...prevUsedWords, data.word.toUpperCase()])
        setUsedKeys(new Set())
        setCorrectKeys(new Set())
        const newLevelDuration = Math.max(60, levelDuration - 5)
        setLevelDuration(newLevelDuration)
        setTimeRemaining(newLevelDuration)
        setTimeMultiplier(1.5)
        setBaseMultiplier(1) // Reset base multiplier to 1
        setIsGodMode(false) // Reset God Mode
        setGodModePressesLeft(0) // Reset God Mode presses
        console.log("God Mode reset for new word")

        setIsGetReadyPhase(true)
        setShowGetReadyAnimation(true)

        console.log("Starting Get Ready phase for new word")
        // Play get ready beeps
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            playGetReadyBeep()
          }, i * 1000)
        }

        // Play "GO!" sound after the countdown
        setTimeout(() => {
          playGoSound()
        }, 5000)

        // Use a Promise to ensure the full duration of the Get Ready phase
        await new Promise((resolve) => setTimeout(resolve, 6000))

        console.log("Ending Get Ready phase, starting game")
        setShowGetReadyAnimation(false)
        setIsGetReadyPhase(false)
      } catch (error) {
        console.error("Error fetching new word:", error)
        setError({
          message: "Failed to fetch new word",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    },
    [usedWords, levelDuration, isGodMode],
  )

  const updateGameState = (state: GameStateData) => {
    console.log("Updating game state:", state)
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

    // Calculate word complexity multiplier
    const wordLength = state.currentWord.length
    const uniqueLetters = new Set(state.currentWord.toUpperCase()).size
    const rawComplexity = 1 + wordLength * 0.05 + uniqueLetters * 0.025
    const newWordComplexityMultiplier = Math.min(1.5, Math.max(1, rawComplexity))
    setWordComplexityMultiplier(newWordComplexityMultiplier)
  }

  const handleKeyPress = useCallback(
    (key: string) => {
      console.log("handleKeyPress called with key:", key)
      console.log("Current multiplier:", baseMultiplier * timeMultiplier * wordComplexityMultiplier)
      console.log("Current God Mode state:", isGodMode)
      const now = Date.now()
      if (now - lastKeyPressTime.current < 100 || processingGuess.current || isGetReadyPhase) {
        return
      }
      lastKeyPressTime.current = now
      processingGuess.current = true

      if (!gameId || usedKeys.has(key) || totalAttempts <= 0 || timeRemaining <= 0) {
        processingGuess.current = false
        return
      }

      const isCorrect = currentWord.includes(key)
      const newUsedKeys = new Set(usedKeys).add(key)
      const newCorrectKeys = isCorrect ? new Set(correctKeys).add(key) : new Set(correctKeys)
      let newAttempts = totalAttempts

      // Play appropriate sound based on correctness and God Mode state
      if (isGodMode) {
        if (isCorrect) {
          playGodModeCorrectLetterSound()
        } else {
          playGodModeIncorrectLetterSound()
        }
      } else {
        if (isCorrect) {
          playCorrectLetterSound()
        } else {
          playIncorrectLetterSound()
        }
      }

      // Update God Mode logic
      if (!isCorrect) {
        if (isGodMode && godModePressesLeft > 0) {
          setGodModePressesLeft((prev) => prev - 1)
        } else {
          newAttempts -= 1
        }
      }

      // Calculate currentMultiplier before using it
      const currentMultiplier = baseMultiplier * timeMultiplier * wordComplexityMultiplier

      // Update God Mode activation logic
      if (currentMultiplier >= 3.3 && !isGodMode) {
        console.log("God Mode activated! Current Multiplier:", currentMultiplier)
        setIsGodMode(true)
        setGodModePressesLeft(5)
        playGodModeEnterSound()
      }

      // Update God Mode deactivation logic
      if (isGodMode && godModePressesLeft === 0) {
        console.log("God Mode deactivated due to no more presses left")
        setIsGodMode(false)
        playGodModeExitSound()
      }

      // Adjusted scoring system
      const letterScore = isCorrect ? Math.round(1 / (letterFrequency[key as keyof typeof letterFrequency] / 100)) : 0
      const newScore = score + letterScore * currentMultiplier
      const newBaseMultiplier = isCorrect ? Math.min(3, baseMultiplier + 0.02) : Math.max(1, baseMultiplier - 0.01)

      setUsedKeys(new Set(newUsedKeys))
      setCorrectKeys(new Set(newCorrectKeys))
      setTotalAttempts(newAttempts)
      setScore(Math.round(newScore))
      setBaseMultiplier(newBaseMultiplier)

      const wordCompleted = currentWord
        .split("")
        .every((letter) => newCorrectKeys.has(letter) || !/^[A-Z]$/i.test(letter))

      if (wordCompleted) {
        setShowAnimation(true)
        setLevel((prevLevel) => {
          const newLevel = prevLevel + 1
          if (newLevel % 3 === 0) {
            setTotalAttempts((prevAttempts) => {
              const newAttempts = prevAttempts + 1
              setBonusLifeEarned(true)
              setTimeout(() => setBonusLifeEarned(false), 3000) // Hide bonus life notification after 3 seconds
              return newAttempts
            })
          }
          return newLevel
        })
        playWordCompletedSound()
        playLevelCompletionFanfare()
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
        }, 1500)
      }

      if (newAttempts <= 0) {
        handleGameOver()
      }

      processingGuess.current = false
    },
    [
      gameId,
      currentWord,
      usedKeys,
      correctKeys,
      totalAttempts,
      timeRemaining,
      score,
      baseMultiplier,
      timeMultiplier,
      wordComplexityMultiplier,
      isGetReadyPhase,
      startNewWord,
      isGodMode,
      godModePressesLeft,
      handleGameOver,
    ],
  )

  const handlePlayAgain = () => {
    console.log("Play Again button clicked")
    setGameState("start")
    setScore(0)
    setUsedKeys(new Set())
    setCorrectKeys(new Set())
    setTimeRemaining(120)
    setBaseMultiplier(1)
    setTimeMultiplier(1.5)
    setLevel(1)
    setError(null)
    setCurrentWord("")
    setCurrentHint("")
    setGameId(null)
    setFinalScore(0)
    setUsedWords([])
    setIsSoundInitialized(false)
    changeBackgroundMusic()
    setLevelDuration(120)
    setIsGameOverAnimating(false)
    setBonusLifeEarned(false)
    setWordComplexityMultiplier(1)
    setIsGodMode(false)
    setGodModePressesLeft(0)
    setIsMobileViewportAdjusted(false)
    setShowDevOverlay(false)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase()
      if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key)
      }
      if (event.key === "F9") {
        setShowDevOverlay((prev) => !prev)
      }
    }

    if (gameState === "playing") {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameState, handleKeyPress])

  useEffect(() => {
    console.log("God Mode state changed:", isGodMode)
    console.log("God Mode presses left:", godModePressesLeft)
  }, [isGodMode, godModePressesLeft])

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h1>ERROR</h1>
        <p>{error.message.toUpperCase()}</p>
        {error.details && <p>{error.details.toUpperCase()}</p>}
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
          score={score}
          isGodMode={isGodMode}
        />
      )}
      <div
        className={`${styles.gameWrapper} ${isTargetedResolution ? styles.targetedResolution : ""} ${isMobileViewportAdjusted ? styles.mobileViewportAdjust : ""}`}
      >
        <div className={styles.gameContainer}>
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
                  score={score}
                  correctKeys={correctKeys}
                  timeRemaining={timeRemaining}
                  multiplier={baseMultiplier * timeMultiplier * wordComplexityMultiplier}
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
                />
                <Keyboard
                  onKeyPress={handleKeyPress}
                  usedKeys={usedKeys}
                  totalAttempts={totalAttempts}
                  disabled={isGetReadyPhase || isGameOverAnimating}
                  isTargetedResolution={isTargetedResolution}
                  isMobileViewportAdjusted={isMobileViewportAdjusted}
                />
              </>
            )}
            {gameState === "gameOver" && !isGameOverAnimating && (
              <GameOverScreen
                score={Math.max(finalScore, score)}
                onPlayAgain={handlePlayAgain}
                isTargetedResolution={isTargetedResolution}
                isMobileViewportAdjusted={isMobileViewportAdjusted}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

