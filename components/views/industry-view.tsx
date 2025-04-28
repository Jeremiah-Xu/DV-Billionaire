"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Button } from "@/components/ui/button"
import type { Billionaire } from "@/types/billionaire"
import { useTooltip } from "@/hooks/use-tooltip"

interface IndustryViewProps {
  billionaires: Billionaire[]
}

type WealthType = "all" | "selfmade" | "inherited"

// Function to create valid CSS class names from industry names
function createValidClassName(str: string): string {
  // Replace special characters and spaces with hyphens
  return str
    .replace(/[&]/g, "and") // Replace & with "and"
    .replace(/[^a-zA-Z0-9-_]/g, "-") // Replace other special chars with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .toLowerCase() // Convert to lowercase for consistency
}

export default function IndustryView({ billionaires }: IndustryViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { showTooltip, hideTooltip, tooltipRef, tooltipData } = useTooltip()
  const [wealthType, setWealthType] = useState<WealthType>("all")

  useEffect(() => {
    if (!svgRef.current || billionaires.length === 0) return

    // Filter billionaires based on selected wealth type
    const filteredBillionaires = billionaires.filter((b) => {
      if (wealthType === "all") return true
      if (wealthType === "selfmade") return b.isSelfMade
      if (wealthType === "inherited") return !b.isSelfMade
      return true
    })

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const margin = { top: 60, right: 120, bottom: 60, left: 200 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Clear previous content
    svg.selectAll("*").remove()

    // Create a group for the visualization
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Group billionaires by industry and calculate total wealth
    const industryGroups = d3.group(filteredBillionaires, (d) => d.industry)

    // Get top 10 industries by total wealth
    const topIndustries = Array.from(industryGroups, ([industry, billionaires]) => {
      return {
        industry,
        totalWealth: d3.sum(billionaires, (d) => d.netWorth),
        count: billionaires.length,
        billionaires: billionaires,
      }
    })
      .sort((a, b) => b.totalWealth - a.totalWealth)
      .slice(0, 10)

    // Create y scale for industries
    const yScale = d3
      .scaleBand()
      .domain(topIndustries.map((d) => d.industry))
      .range([0, innerHeight])
      .padding(0.2)

    // Create x scale for wealth (5x bigger)
    const maxTotalWealth = d3.max(topIndustries, (d) => d.totalWealth) || 0
    const xScale = d3
      .scaleLinear()
      .domain([0, maxTotalWealth * 5]) // 5x bigger x-axis
      .range([0, innerWidth])

    // Create color scale for industries
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(topIndustries.map((d) => d.industry))
      .range(d3.schemeTableau10)

    // Add y-axis (industries)
    const yAxis = d3.axisLeft(yScale)

    g.append("g").call(yAxis).attr("font-size", "12px")

    // Add x-axis (wealth)
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => `$${d}B`)

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .append("text")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .text("Total Wealth (Billions USD)")

    // Add horizontal grid lines for each industry
    topIndustries.forEach((industryData) => {
      const y = yScale(industryData.industry)
      if (y !== undefined) {
        g.append("line")
          .attr("x1", 0)
          .attr("y1", y + yScale.bandwidth() / 2)
          .attr("x2", innerWidth)
          .attr("y2", y + yScale.bandwidth() / 2)
          .attr("stroke", "#e5e7eb")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4")
      }
    })

    // Scale for circle radius based on net worth
    const maxNetWorth = d3.max(filteredBillionaires, (d) => d.netWorth) || 1
    const radiusScale = d3.scaleSqrt().domain([0, maxNetWorth]).range([3, 25])

    // Create a simulation for each industry
    topIndustries.forEach((industryData) => {
      const y = yScale(industryData.industry)
      if (y === undefined) return

      // Create a valid class name for this industry
      const industryClassName = createValidClassName(industryData.industry)

      // Create a simulation with forces
      const simulation = d3
        .forceSimulation(industryData.billionaires)
        .force("x", d3.forceX((d: any) => xScale(d.netWorth / 5)).strength(0.8)) // Position based on net worth
        .force("y", d3.forceY(y + yScale.bandwidth() / 2).strength(0.9)) // Center in the industry band
        .force(
          "collision",
          d3
            .forceCollide()
            .radius((d: any) => radiusScale(d.netWorth) + 1), // Reduced padding
        )
        .velocityDecay(0.4) // Added to slow down movement
        .stop() // Don't start the simulation yet

      // Run the simulation manually
      for (let i = 0; i < 120; i++) simulation.tick()

      // Create circles for each billionaire in this industry
      g.selectAll(`.circle-${industryClassName}`)
        .data(industryData.billionaires)
        .join("circle")
        .attr("class", `circle-${industryClassName}`)
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y)
        .attr("r", (d) => radiusScale(d.netWorth))
        .attr("fill", colorScale(industryData.industry))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
          // Don't change appearance on hover to prevent movement
          showTooltip(d, event.pageX, event.pageY)
        })
        .on("mouseout", () => {
          hideTooltip()
        })

      // Add industry label with count and total wealth
      g.append("text")
        .attr("x", innerWidth + 10)
        .attr("y", y + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`${industryData.count} billionaires, $${industryData.totalWealth.toFixed(0)}B`)
    })

    // Add title based on wealth type
    let titleText = "Industry Distribution of Billionaire Wealth"
    if (wealthType === "selfmade") {
      titleText = "Industry Distribution of Self-Made Billionaire Wealth"
    } else if (wealthType === "inherited") {
      titleText = "Industry Distribution of Inherited Billionaire Wealth"
    }

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(titleText)
  }, [billionaires, wealthType, showTooltip, hideTooltip])

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <Button size="sm" variant={wealthType === "all" ? "default" : "outline"} onClick={() => setWealthType("all")}>
          All Wealth
        </Button>
        <Button
          size="sm"
          variant={wealthType === "selfmade" ? "default" : "outline"}
          onClick={() => setWealthType("selfmade")}
        >
          Self-Made
        </Button>
        <Button
          size="sm"
          variant={wealthType === "inherited" ? "default" : "outline"}
          onClick={() => setWealthType("inherited")}
        >
          Inherited
        </Button>
      </div>
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
