"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import GameArea from "@/components/GameArea"
import Keyboard from "@/components/Keyboard"
import LoadingScreen from "@/components/LoadingScreen"
import StartScreen from "@/components/StartScreen"
import GameOverScreen from "@/components/GameOverScreen"
import { startGame, getFinalScore } from "@/utils/gameUtils"
import styles from "@/styles/Game.module.css"
import AppInitializer from "@/components/AppInitializer"
import {
  initializeSounds,
  setAutoplayAllowed,
  isSoundManagerReady,
  playCorrectLetterSound,
  playIncorrectLetterSound,
  playButtonClickSound,
  playWordCompletedSound,
  playGameOverSound,
  changeBackgroundMusic,
} from "@/utils/sounds"

type GameState = "loading" | "start" | "playing" | "gameOver"

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
  const [timeBonus, setTimeBonus] = useState(100)
  const [multiplier, setMultiplier] = useState(1)
  const [showAnimation, setShowAnimation] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [isTimeBonusActive, setIsTimeBonusActive] = useState(false)
  const [isGetReadyPhase, setIsGetReadyPhase] = useState(false)
  const [showGetReadyAnimation, setShowGetReadyAnimation] = useState(false)
  const [showGameOverAnimation, setShowGameOverAnimation] = useState(false)
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [isSoundInitialized, setIsSoundInitialized] = useState(false)

  const lastKeyPressTime = useRef(0)
  const processingGuess = useRef(false)

  useEffect(() => {
    if (gameState === "loading") {
      setGameState("start")
    }
  }, [gameState])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === "playing" && isTimeBonusActive) {
      timer = setInterval(() => {
        setTimeBonus((prevBonus) => {
          const newBonus = Math.max(prevBonus - 1, 0)
          return newBonus
        })
      }, 100) // Update every 100ms for smoother animation
    }
    return () => clearInterval(timer)
  }, [gameState, isTimeBonusActive])

  useEffect(() => {
    initializeSounds().catch(console.error)
  }, [])

  const initializeGame = async () => {
    setGameState("loading")
    try {
      if (!isSoundInitialized) {
        await initializeSounds()
        setIsSoundInitialized(true)
        setAutoplayAllowed(true)
        await changeBackgroundMusic()
      }
      const { gameId, initialState } = await startGame()
      setGameId(gameId)
      updateGameState(initialState)
      setGameState("playing")
      await startNewWord(gameId)
    } catch (error) {
      setError({
        message: "Failed to initialize game",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      setGameState("start")
    }
  }

  const startNewWord = useCallback(
    async (currentGameId: string) => {
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

        setCurrentWord(data.word.toUpperCase())
        setCurrentHint(data.hint)
        setUsedWords((prevUsedWords) => [...prevUsedWords, data.word.toUpperCase()])
        setTimeBonus(100)
        setIsTimeBonusActive(false)
        setIsGetReadyPhase(true)
        setShowGetReadyAnimation(true)
        setUsedKeys(new Set())
        setCorrectKeys(
          new Set(
            Array.from(data.word.toUpperCase()).filter(
              (char): char is string => typeof char === "string" && !/^[A-Z]$/i.test(char),
            ),
          ),
        )

        setTimeout(() => {
          setShowGetReadyAnimation(false)
          setIsGetReadyPhase(false)
          setIsTimeBonusActive(true)
        }, 5000)
      } catch (error) {
        setError({
          message: "Failed to fetch new word",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    },
    [usedWords],
  )

  const updateGameState = (state: GameStateData) => {
    setCurrentWord(state.currentWord.toUpperCase())
    setCurrentHint(state.currentHint.toUpperCase())
    setTotalAttempts(state.attempts)
    setScore(Math.round(state.score))
    setMultiplier(state.multiplier)
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
  }

  const handleKeyPress = useCallback(
    (key: string) => {
      const now = Date.now()
      if (now - lastKeyPressTime.current < 100 || processingGuess.current) {
        return
      }
      lastKeyPressTime.current = now
      processingGuess.current = true

      if (!gameId || usedKeys.has(key) || totalAttempts <= 0 || !isTimeBonusActive) {
        processingGuess.current = false
        return
      }

      const isCorrect = currentWord.includes(key)
      const newUsedKeys = new Set(usedKeys).add(key)
      const newCorrectKeys = isCorrect ? new Set(correctKeys).add(key) : new Set(correctKeys)
      const newAttempts = isCorrect ? totalAttempts : totalAttempts - 1
      const letterFrequency = currentWord.split(key).length - 1
      const newScore = score + (isCorrect ? 10 * letterFrequency * multiplier : 0)
      const newMultiplier = isCorrect ? multiplier + 0.1 : Math.max(1, multiplier - 0.1)

      setUsedKeys(new Set(newUsedKeys))
      setCorrectKeys(new Set(newCorrectKeys))
      setTotalAttempts(newAttempts)
      setScore(Math.round(newScore))
      setMultiplier(newMultiplier)

      if (isCorrect) {
        playCorrectLetterSound()
      } else {
        playIncorrectLetterSound()
      }

      const wordCompleted = currentWord
        .split("")
        .every((letter) => newCorrectKeys.has(letter) || !/^[A-Z]$/i.test(letter))

      if (wordCompleted) {
        setShowAnimation(true)
        setIsTimeBonusActive(false)
        setLevel((prevLevel) => prevLevel + 1)
        playWordCompletedSound()
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
        const handleGameOver = async () => {
          setIsTimeBonusActive(false)
          setShowGameOverAnimation(true)
          playGameOverSound()

          try {
            const currentScore = score
            const { finalScore, wordsCompleted } = await getFinalScore(gameId!, currentScore)

            if (finalScore === undefined || finalScore === null) {
              throw new Error("Invalid final score received")
            }

            setFinalScore(finalScore)
            setLevel(wordsCompleted + 1)

            await new Promise((resolve) => setTimeout(resolve, 3000))

            setShowGameOverAnimation(false)
            setGameState("gameOver")
          } catch (error) {
            setError({
              message: "Failed to get final score. Please try again.",
              details: error instanceof Error ? error.message : "Unknown error",
            })
            setShowGameOverAnimation(false)
            setGameState("gameOver")
          }
        }
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
      isTimeBonusActive,
      score,
      multiplier,
      startNewWord,
      setIsTimeBonusActive,
      setShowGameOverAnimation,
      setFinalScore,
      setLevel,
      setError,
      setGameState,
    ],
  )

  const handlePlayAgain = () => {
    setGameState("start")
    setScore(0)
    setUsedKeys(new Set())
    setCorrectKeys(new Set())
    setTimeBonus(100)
    setIsTimeBonusActive(false)
    setMultiplier(1)
    setLevel(1)

    setError(null)
    setCurrentWord("")
    setCurrentHint("")
    setShowGameOverAnimation(false)
    setGameId(null)
    setFinalScore(0)
    setUsedWords([])
    setIsSoundInitialized(false)

    changeBackgroundMusic()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase()
      if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key)
      }
    }

    if (gameState === "playing") {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameState, handleKeyPress])

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h1>ERROR</h1>
        <p>{error.message.toUpperCase()}</p>
        {error.details && <p>{error.details.toUpperCase()}</p>}
        <button onClick={handlePlayAgain}>TRY AGAIN</button>
      </div>
    )
  }

  return (
    <>
      <AppInitializer />
      <div className={styles.gameWrapper}>
        <div className={styles.gameContainer}>
          {gameState === "start" && (
            <StartScreen
              onStartGame={async () => {
                if (isSoundManagerReady()) {
                  playButtonClickSound()
                }
                await initializeGame()
              }}
            />
          )}
          {gameState === "loading" && (
            <div className={styles.loadingContainer}>
              <LoadingScreen />
            </div>
          )}
          {(gameState === "playing" || showGameOverAnimation) && (
            <div className={styles.gameContent}>
              <GameArea
                currentWord={currentWord}
                currentHint={currentHint}
                score={score}
                correctKeys={correctKeys}
                timeBonus={timeBonus}
                multiplier={multiplier}
                showAnimation={showAnimation}
                totalAttempts={totalAttempts}
                level={level}
                isTimeBonusActive={isTimeBonusActive}
                isGetReadyPhase={isGetReadyPhase}
                showGetReadyAnimation={showGetReadyAnimation}
                setShowGetReadyAnimation={setShowGetReadyAnimation}
                showGameOverAnimation={showGameOverAnimation}
              />
              <Keyboard
                onKeyPress={handleKeyPress}
                usedKeys={usedKeys}
                totalAttempts={totalAttempts}
                disabled={!isTimeBonusActive || isGetReadyPhase || showGameOverAnimation}
              />
            </div>
          )}
          {gameState === "gameOver" && !showGameOverAnimation && (
            <div className={styles.gameContent}>
              <GameOverScreen score={Math.max(finalScore, score)} onPlayAgain={handlePlayAgain} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

