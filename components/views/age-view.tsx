"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { Billionaire } from "@/types/billionaire"
import { useTooltip } from "@/hooks/use-tooltip"

interface AgeViewProps {
  billionaires: Billionaire[]
}

export default function AgeView({ billionaires }: AgeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { showTooltip, hideTooltip, tooltipRef, tooltipData } = useTooltip()

  useEffect(() => {
    if (!svgRef.current || billionaires.length === 0) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const margin = { top: 20, right: 30, bottom: 40, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Clear previous content
    svg.selectAll("*").remove()

    // Create a group for the visualization
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Filter out billionaires with no age data
    const billionairesWithAge = billionaires.filter((b) => b.age !== null)

    // Create x scale for age (20-100)
    const xScale = d3.scaleLinear().domain([20, 100]).range([0, innerWidth])

    // Create x-axis with ticks every 10 years
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([20, 30, 40, 50, 60, 70, 80, 90, 100])
      .tickFormat((d) => d.toString())

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .append("text")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .text("Age")

    // Add grid lines for age intervals
    const gridLines = g.append("g").attr("class", "grid-lines")
    ;[30, 40, 50, 60, 70, 80, 90].forEach((age) => {
      gridLines
        .append("line")
        .attr("x1", xScale(age))
        .attr("y1", 0)
        .attr("x2", xScale(age))
        .attr("y2", innerHeight)
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1)
    })

    // Add a dotted line in the middle to separate self-made and inherited
    g.append("line")
      .attr("x1", 0)
      .attr("y1", innerHeight / 2)
      .attr("x2", innerWidth)
      .attr("y2", innerHeight / 2)
      .attr("stroke", "black")
      .attr("stroke-dasharray", "4")
      .attr("stroke-width", 1)

    // Add labels for self-made and inherited
    g.append("text")
      .attr("x", 10)
      .attr("y", innerHeight / 4)
      .attr("text-anchor", "start")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Self-Made")

    g.append("text")
      .attr("x", 10)
      .attr("y", (3 * innerHeight) / 4)
      .attr("text-anchor", "start")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Inherited")

    // Scale for circle radius based on net worth
    const maxNetWorth = d3.max(billionaires, (d) => d.netWorth) || 1
    const radiusScale = d3.scaleSqrt().domain([0, maxNetWorth]).range([3, 20])

    // Create a simulation with forces
    const simulation = d3
      .forceSimulation(billionairesWithAge)
      .force("x", d3.forceX((d: any) => xScale(d.age)).strength(0.9)) // Increased x-force strength
      .force("y", d3.forceY((d: any) => (d.isSelfMade ? innerHeight / 4 : (3 * innerHeight) / 4)).strength(0.4)) // Increased y-force strength
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d: any) => radiusScale(d.netWorth) + 1), // Reduced padding
      )
      .velocityDecay(0.4) // Added to slow down movement
      .on("tick", ticked)

    // Create circles for each billionaire
    const circles = g
      .selectAll("circle")
      .data(billionairesWithAge)
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
