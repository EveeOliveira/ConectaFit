"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"

interface CustomSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max: number
  step?: number
  className?: string
}

export function CustomSlider({ value, onValueChange, min = 0, max, step = 1, className = "" }: CustomSliderProps) {
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(index)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging === null || !sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const newValue = min + (percentage / 100) * (max - min)
      const steppedValue = Math.round(newValue / step) * step

      const newValues = [...value]
      newValues[isDragging] = Math.max(min, Math.min(max, steppedValue))

      // Para range slider, garantir ordem correta
      if (value.length === 2) {
        if (isDragging === 0 && newValues[0] > newValues[1]) {
          newValues[0] = newValues[1]
        }
        if (isDragging === 1 && newValues[1] < newValues[0]) {
          newValues[1] = newValues[0]
        }
      }

      onValueChange(newValues)
    },
    [isDragging, min, max, step, value, onValueChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Event listeners
  React.useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const isRange = value.length === 2
  const leftPercentage = getPercentage(value[0])
  const rightPercentage = isRange ? getPercentage(value[1]) : 100

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trilha base */}
      <div ref={sliderRef} className="relative h-2 bg-gray-700 rounded-full cursor-pointer">
        {/* Range ativo */}
        <div
          className="absolute h-2 bg-red-600 rounded-full"
          style={{
            left: isRange ? `${leftPercentage}%` : "0%",
            width: isRange ? `${rightPercentage - leftPercentage}%` : `${leftPercentage}%`,
          }}
        />

        {/* Handles */}
        {value.map((val, index) => (
          <div
            key={index}
            className="absolute w-5 h-5 bg-red-600 border-2 border-red-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 top-1/2"
            style={{ left: `${getPercentage(val)}%` }}
            onMouseDown={handleMouseDown(index)}
          />
        ))}
      </div>
    </div>
  )
}
