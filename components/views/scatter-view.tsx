"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { Billionaire } from "@/types/billionaire"
import { useTooltip } from "@/hooks/use-tooltip"

interface ScatterViewProps {
  billionaires: Billionaire[]
}

export default function ScatterView({ billionaires }: ScatterViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { showTooltip, hideTooltip, tooltipRef, tooltipData } = useTooltip()

  useEffect(() => {
    if (!svgRef.current || billionaires.length === 0) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous content
    svg.selectAll("*").remove()

    // Scale for circle radius based on net worth
    const maxNetWorth = d3.max(billionaires, (d) => d.netWorth) || 1
    const radiusScale = d3.scaleSqrt().domain([0, maxNetWorth]).range([3, 25])

    // Create a simulation with forces
    const simulation = d3
      .forceSimulation(billionaires)
      .force("charge", d3.forceManyBody().strength(1)) // Reduced strength
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d: any) => radiusScale(d.netWorth) + 1), // Reduced padding
      )
      .velocityDecay(0.4) // Added to slow down movement
      .on("tick", ticked)

    // Create circles for each billionaire
    const circles = svg
      .selectAll("circle")
      .data(billionaires)
      .join("circle")
      .attr("r", (d) => radiusScale(d.netWorth))
      .attr("fill", (d) => (d.isSelfMade ? "#4ade80" : "#f87171"))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("stroke", "#000000").attr("stroke-width", 2).attr("opacity", 1)

        showTooltip(d, event.pageX, event.pageY)
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("stroke", "#ffffff").attr("stroke-width", 1).attr("opacity", 0.7)

        hideTooltip()
      })

    function ticked() {
      circles.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)
    }

    return () => {
      simulation.stop()
    }
  }, [billionaires, showTooltip, hideTooltip])

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} width="100%" height="100%"></svg>
      {tooltipData && (
        <div ref={tooltipRef} className="absolute bg-white p-3 rounded shadow-lg border z-10 max-w-xs">
          <h3 className="font-bold">{tooltipData.name}</h3>
          <p>
            <span className="font-semibold">Net Worth:</span> ${tooltipData.netWorth}B
          </p>
          <p>
            <span className="font-semibold">Industry:</span> {tooltipData.industry}
          </p>
          <p>
            <span className="font-semibold">Self-Made:</span> {tooltipData.isSelfMade ? "Yes" : "No"}
          </p>
          {tooltipData.age && (
            <p>
              <span className="font-semibold">Age:</span> {tooltipData.age}
            </p>
          )}
          <p>
            <span className="font-semibold">Country:</span> {tooltipData.citizenship}
          </p>
        </div>
      )}
    </div>
  )
}
