"use client"

import { useRef, useState } from "react"
import type { Billionaire } from "@/types/billionaire"

export function useTooltip() {
  const [tooltipData, setTooltipData] = useState<Billionaire | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const showTooltip = (data: Billionaire, x: number, y: number) => {
    setTooltipData(data)

    if (tooltipRef.current) {
      // Position the tooltip
      const tooltipWidth = tooltipRef.current.offsetWidth
      const tooltipHeight = tooltipRef.current.offsetHeight

      // Adjust position to ensure tooltip stays within viewport
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let left = x + 10
      let top = y - tooltipHeight / 2

      // Adjust horizontally if needed
      if (left + tooltipWidth > viewportWidth - 10) {
        left = x - tooltipWidth - 10
      }

      // Adjust vertically if needed
      if (top < 10) {
        top = 10
      } else if (top + tooltipHeight > viewportHeight - 10) {
        top = viewportHeight - tooltipHeight - 10
      }

      tooltipRef.current.style.left = `${left}px`
      tooltipRef.current.style.top = `${top}px`
    }
  }

  const hideTooltip = () => {
    setTooltipData(null)
  }

  return {
    tooltipData,
    tooltipRef,
    showTooltip,
    hideTooltip,
  }
}
