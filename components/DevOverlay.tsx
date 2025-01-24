import type React from "react"

interface DevOverlayProps {
  baseMultiplier: number
  timeMultiplier: number
  wordComplexityMultiplier: number
  score: number
  isGodMode: boolean
}

const DevOverlay: React.FC<DevOverlayProps> = ({
  baseMultiplier,
  timeMultiplier,
  wordComplexityMultiplier,
  score,
  isGodMode,
}) => {
  const totalMultiplier = baseMultiplier * timeMultiplier * wordComplexityMultiplier

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        zIndex: 9999,
        fontFamily: "monospace",
      }}
    >
      <div>Base Multiplier: {baseMultiplier.toFixed(3)}</div>
      <div>Time Multiplier: {timeMultiplier.toFixed(3)}</div>
      <div>Word Complexity: {wordComplexityMultiplier.toFixed(3)}</div>
      <div>Total Multiplier: {totalMultiplier.toFixed(3)}</div>
      <div>Score: {score}</div>
      <div>God Mode: {isGodMode ? "Active" : "Inactive"}</div>
    </div>
  )
}

export default DevOverlay

