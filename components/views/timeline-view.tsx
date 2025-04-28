"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { Billionaire } from "@/types/billionaire"
import { useTooltip } from "@/hooks/use-tooltip"

interface TimelineViewProps {
  billionaires: Billionaire[]
}

export default function TimelineView({ billionaires }: TimelineViewProps) {
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

    // Create x scale for years (1997-2013)
    const xScale = d3.scaleLinear().domain([1997, 2013]).range([0, innerWidth])

    // Create x-axis with ticks for each year
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => d.toString())
      .ticks(17) // One tick per year

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")

    g.append("text")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .text("Year")

    // Scale for circle radius based on net worth
    const maxNetWorth = d3.max(billionaires, (d) => d.netWorth) || 1
    const radiusScale = d3.scaleSqrt().domain([0, maxNetWorth]).range([3, 20])

    // Filter billionaires with year data
    const billionairesWithYears = billionaires.filter((b) => b.year !== null && b.year !== undefined)

    // Create a simulation with forces
    const simulation = d3
      .forceSimulation(billionairesWithYears)
      .force("x", d3.forceX((d: any) => xScale(d.year || 2000)).strength(0.9)) // Position by actual year
      .force("y", d3.forceY(innerHeight / 2).strength(0.2))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => radiusScale(d.netWorth) + 1),
      )
      .velocityDecay(0.4)
      .on("tick", ticked)

    // Create circles for each billionaire
    const circles = g
      .selectAll("circle")
      .data(billionairesWithYears)
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

    // Add legend
    const legend = svg.append("g").attr("transform", `translate(${margin.left + 10}, ${margin.top + 10})`)

    // Self-made legend
    legend.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 6).attr("fill", "#4ade80")

    legend
      .append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .text("Self-Made")

    // Inherited legend
    legend.append("circle").attr("cx", 0).attr("cy", 20).attr("r", 6).attr("fill", "#f87171")

    legend
      .append("text")
      .attr("x", 10)
      .attr("y", 24)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .text("Inherited")

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
          {tooltipData.year && (
            <p>
              <span className="font-semibold">Year:</span> {tooltipData.year}
            </p>
          )}
          {tooltipData.wealthStatus && (
            <p>
              <span className="font-semibold">Wealth Status:</span> {tooltipData.wealthStatus}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
