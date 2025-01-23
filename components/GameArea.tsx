import { useState, useEffect } from "react"
import { Star, Heart, Zap, Clock, Shield, Sparkles } from "lucide-react"
import styles from "@/styles/GameArea.module.css"

interface GameAreaProps {
  currentWord: string
  currentHint: string
  score: number
  correctKeys: Set<string>
  timeRemaining: number
  multiplier: number
  showAnimation: boolean
  totalAttempts: number
  level: number
  isGetReadyPhase: boolean
  showGetReadyAnimation: boolean
  setShowGetReadyAnimation: (value: boolean) => void
  showGameOverAnimation: boolean
  levelDuration: number
  bonusLifeEarned: boolean
  isGodMode: boolean
  godModePressesLeft: number
  isTargetedResolution: boolean
}

export default function GameArea({
  currentWord,
  currentHint,
  score,
  correctKeys,
  timeRemaining,
  multiplier,
  showAnimation,
  totalAttempts,
  level,
  isGetReadyPhase,
  showGetReadyAnimation,
  setShowGetReadyAnimation,
  showGameOverAnimation,
  levelDuration,
  bonusLifeEarned,
  isGodMode,
  godModePressesLeft,
  isTargetedResolution,
}: GameAreaProps) {
  const [displayMultiplier, setDisplayMultiplier] = useState(multiplier)
  const [animatedScore, setAnimatedScore] = useState(score)
  const [countdown, setCountdown] = useState(5)
  const [showGo, setShowGo] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMultiplier((prev) => {
        const diff = multiplier - prev
        if (Math.abs(diff) < 0.1) return multiplier
        return prev + diff * 0.1
      })
    }, 50)
    return () => clearInterval(interval)
  }, [multiplier])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedScore((prev) => {
        const diff = score - prev
        if (Math.abs(diff) < 1) return score
        return prev + Math.sign(diff) * Math.ceil(Math.abs(diff) * 0.1)
      })
    }, 50)
    return () => clearInterval(interval)
  }, [score])

  useEffect(() => {
    console.log("Get Ready phase changed:", isGetReadyPhase)
    if (isGetReadyPhase) {
      setCountdown(5)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          console.log("Countdown:", prev)
          if (prev > 0) {
            return prev - 1
          } else {
            clearInterval(timer)
            return 0
          }
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isGetReadyPhase])

  useEffect(() => {
    if (countdown === 0 && isGetReadyPhase) {
      setShowGo(true)
      setTimeout(() => {
        setShowGo(false)
        setShowGetReadyAnimation(false)
      }, 1000)
    }
  }, [countdown, isGetReadyPhase, setShowGetReadyAnimation])

  const renderLetter = (letter: string, index: number) => {
    const isNonAlphabetic = !/^[A-Z]$/i.test(letter)
    const isRevealed = correctKeys.has(letter) || isNonAlphabetic
    const isLongWord = currentWord.length > 12

    return (
      <span
        key={index}
        className={`${styles.letter} ${isRevealed ? styles.revealed : ""} ${
          isNonAlphabetic ? styles.nonAlphabetic : ""
        } ${isLongWord ? styles.longWord : ""}`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {isRevealed ? letter : "_"}
      </span>
    )
  }

  const renderMultiplierStars = () => {
    const starCount = Math.floor(displayMultiplier || 0)
    const fractionalPart = (displayMultiplier || 0) - starCount
    const stars = []

    for (let i = 0; i < 5; i++) {
      if (i < starCount) {
        stars.push(<Star key={i} className={`${styles.multiplierStar} ${styles.active}`} />)
      } else if (i === starCount && fractionalPart > 0) {
        stars.push(
          <Star
            key={i}
            className={`${styles.multiplierStar} ${styles.active}`}
            style={{ clipPath: `inset(0 ${100 - fractionalPart * 100}% 0 0)` }}
          />,
        )
      } else {
        stars.push(<Star key={i} className={styles.multiplierStar} />)
      }
    }

    return stars
  }

  return (
    <div className={`${styles.gameArea} ${isTargetedResolution ? styles.targetedResolution : ""}`}>
      <div className={styles.scoreInfoGrid}>
        <div className={styles.scoreItem}>
          <Star className={styles.scoreIcon} />
          <span className={styles.label}>SCORE</span>
          <span className={styles.value}>{Math.round(animatedScore)}</span>
        </div>
        <div className={styles.scoreItem}>
          <Heart className={styles.scoreIcon} />
          <span className={styles.label}>LIVES</span>
          <span className={styles.value}>{totalAttempts}</span>
        </div>
        <div className={styles.scoreItem}>
          <Shield className={styles.scoreIcon} />
          <span className={styles.label}>LEVEL</span>
          <span className={styles.value}>{level}</span>
        </div>
        <div className={styles.scoreItem}>
          <Zap className={styles.scoreIcon} />
          <span className={styles.label}>MULTIPLIER</span>
          <div className={styles.multiplierStars}>{renderMultiplierStars()}</div>
          <span className={styles.multiplierValue}>x{displayMultiplier.toFixed(2)}</span>
        </div>
      </div>
      <div className={styles.timeBonusContainer}>
        <div
          className={styles.timeBonusBar}
          style={{
            width: `${(timeRemaining / levelDuration) * 100}%`,
            backgroundColor: timeRemaining > levelDuration / 2 ? "var(--primary-color)" : "var(--secondary-color)",
          }}
        ></div>
        <Clock className={styles.timeBonusIcon} />
        <span className={styles.timeBonusText}>{`TIME: ${timeRemaining}s`}</span>
      </div>
      <div className={styles.gameContent}>
        <div className={`${styles.wordContainer} ${currentWord.length > 12 ? styles.longWordContainer : ""}`}>
          {currentWord.split("").map(renderLetter)}
        </div>
        <div className={styles.hint}>{currentHint.toUpperCase()}</div>
      </div>
      {showAnimation && (
        <div className={styles.wordCompletionAnimation}>
          <span>WELL DONE!</span>
        </div>
      )}
      {(showGetReadyAnimation || isGetReadyPhase || showGo) && (
        <div className={`${styles.getReadyAnimation} ${!isGetReadyPhase && !showGo ? styles.fadeOut : ""}`}>
          {countdown > 0 ? (
            <>
              <span>GET READY!</span>
              <span className={styles.countdown}>{countdown}</span>
            </>
          ) : (
            <span className={styles.goMessage}>GO!</span>
          )}
        </div>
      )}
      {showGameOverAnimation && (
        <div className={styles.gameOverAnimation}>
          <span>GAME OVER!</span>
        </div>
      )}
      {bonusLifeEarned && (
        <div className={styles.bonusLifeNotification}>
          <Heart className={styles.bonusLifeIcon} />
          <span>Bonus Life Earned!</span>
        </div>
      )}
      {isGodMode && (
        <div className={styles.godModeNotification}>
          <Sparkles className={styles.godModeIcon} />
          <span>GOD MODE: {godModePressesLeft} PRESSES LEFT</span>
        </div>
      )}
    </div>
  )
}

