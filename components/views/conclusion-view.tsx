"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Billionaire } from "@/types/billionaire"

interface ConclusionViewProps {
  billionaires: Billionaire[]
}

export default function ConclusionView({ billionaires }: ConclusionViewProps) {
  const pieChartRef = useRef<SVGSVGElement>(null)
  const barChartRef = useRef<SVGSVGElement>(null)
  const timelineRef = useRef<SVGSVGElement>(null)
  const [stats, setStats] = useState({
    totalBillionaires: 0,
    totalWealth: 0,
    selfMadeCount: 0,
    selfMadeWealth: 0,
    inheritedCount: 0,
    inheritedWealth: 0,
    avgAge: 0,
    topIndustries: [] as { industry: string; count: number; wealth: number }[],
    topCountries: [] as { country: string; count: number; wealth: number }[],
    yearlyData: [] as {
      year: number
      count: number
      totalWealth: number
      selfMadeCount: number
      inheritedCount: number
      selfMadeWealth: number
      inheritedWealth: number
    }[],
  })

  useEffect(() => {
    if (billionaires.length === 0) return

    // Filter out billionaires with no year data
    const billionairesWithYear = billionaires.filter((b) => b.year !== null && b.year !== undefined)

    // Calculate statistics
    const totalBillionaires = billionairesWithYear.length
    const totalWealth = d3.sum(billionairesWithYear, (d) => d.netWorth)

    const selfMadeBillionaires = billionairesWithYear.filter((b) => b.isSelfMade)
    const selfMadeCount = selfMadeBillionaires.length
    const selfMadeWealth = d3.sum(selfMadeBillionaires, (d) => d.netWorth)

    const inheritedBillionaires = billionairesWithYear.filter((b) => !b.isSelfMade)
    const inheritedCount = inheritedBillionaires.length
    const inheritedWealth = d3.sum(inheritedBillionaires, (d) => d.netWorth)

    const billionairesWithAge = billionairesWithYear.filter((b) => b.age !== null)
    const avgAge = d3.mean(billionairesWithAge, (d) => d.age) || 0

    // Top industries
    const industryGroups = d3.group(billionairesWithYear, (d) => d.industry)
    const topIndustries = Array.from(industryGroups, ([industry, billionaires]) => {
      return {
        industry,
        count: billionaires.length,
        wealth: d3.sum(billionaires, (d) => d.netWorth),
      }
    })
      .sort((a, b) => b.wealth - a.wealth)
      .slice(0, 5)

    // Top countries
    const countryGroups = d3.group(billionairesWithYear, (d) => d.citizenship)
    const topCountries = Array.from(countryGroups, ([country, billionaires]) => {
      return {
        country,
        count: billionaires.length,
        wealth: d3.sum(billionaires, (d) => d.netWorth),
      }
    })
      .sort((a, b) => b.wealth - a.wealth)
      .slice(0, 5)

    // Yearly data
    const yearGroups = d3.group(billionairesWithYear, (d) => d.year)
    const yearlyData = Array.from(yearGroups, ([year, billionaires]) => {
      const yearSelfMade = billionaires.filter((b) => b.isSelfMade)
      const yearInherited = billionaires.filter((b) => !b.isSelfMade)

      return {
        year: Number(year),
        count: billionaires.length,
        totalWealth: d3.sum(billionaires, (d) => d.netWorth),
        selfMadeCount: yearSelfMade.length,
        inheritedCount: yearInherited.length,
        selfMadeWealth: d3.sum(yearSelfMade, (d) => d.netWorth),
        inheritedWealth: d3.sum(yearInherited, (d) => d.netWorth),
      }
    }).sort((a, b) => a.year - b.year)

    setStats({
      totalBillionaires,
      totalWealth,
      selfMadeCount,
      selfMadeWealth,
      inheritedCount,
      inheritedWealth,
      avgAge,
      topIndustries,
      topCountries,
      yearlyData,
    })

    // Create pie chart for self-made vs inherited
    if (pieChartRef.current) {
      const svg = d3.select(pieChartRef.current)
      const width = pieChartRef.current.clientWidth
      const height = pieChartRef.current.clientHeight
      const radius = Math.min(width, height) / 2

      svg.selectAll("*").remove()

      const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`)

      const pieData = [
        { type: "Self-Made", value: selfMadeWealth, count: selfMadeCount },
        { type: "Inherited", value: inheritedWealth, count: inheritedCount },
      ]

      const pie = d3
        .pie<any>()
        .value((d) => d.value)
        .sort(null)

      const arc = d3
        .arc<any>()
        .innerRadius(0)
        .outerRadius(radius - 20)

      const colorScale = d3.scaleOrdinal<string>().domain(["Self-Made", "Inherited"]).range(["#4ade80", "#f87171"])

      const arcs = g.selectAll(".arc").data(pie(pieData)).enter().append("g").attr("class", "arc")

      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d: any) => colorScale(d.data.type))
        .attr("stroke", "white")
        .style("stroke-width", "2px")

      // Add labels
      const labelArc = d3
        .arc<any>()
        .innerRadius(radius - 80)
        .outerRadius(radius - 80)

      arcs
        .append("text")
        .attr("transform", (d: any) => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text((d: any) => `${d.data.type}: ${Math.round((d.data.value / totalWealth) * 100)}%`)

      // Add count labels
      const countArc = d3
        .arc<any>()
        .innerRadius(radius - 50)
        .outerRadius(radius - 50)

      arcs
        .append("text")
        .attr("transform", (d: any) => `translate(${countArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .text((d: any) => `(${d.data.count} billionaires)`)
    }

    // Create bar chart for top industries
    if (barChartRef.current) {
      const svg = d3.select(barChartRef.current)
      const width = barChartRef.current.clientWidth
      const height = barChartRef.current.clientHeight
      const margin = { top: 20, right: 30, bottom: 60, left: 120 }
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      svg.selectAll("*").remove()

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

      // Create scales
      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(topIndustries, (d) => d.wealth) || 0])
        .range([0, innerWidth])

      const yScale = d3
        .scaleBand()
        .domain(topIndustries.map((d) => d.industry))
        .range([0, innerHeight])
        .padding(0.2)

      // Create axes
      const xAxis = d3.axisBottom(xScale).tickFormat((d: any) => `$${d}B`)

      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis)
        .append("text")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", 40)
        .text("Total Wealth (Billions USD)")

      const yAxis = d3.axisLeft(yScale)

      g.append("g").call(yAxis)

      // Create bars
      g.selectAll(".bar")
        .data(topIndustries)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d: any) => yScale(d.industry) || 0)
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", (d: any) => xScale(d.wealth))
        .attr("fill", "#4ade80")
        .attr("opacity", 0.8)

      // Add value labels
      g.selectAll(".value-label")
        .data(topIndustries)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("y", (d: any) => (yScale(d.industry) || 0) + yScale.bandwidth() / 2)
        .attr("x", (d: any) => xScale(d.wealth) + 5)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text((d: any) => `$${d.wealth.toFixed(0)}B (${d.count} billionaires)`)
    }

    // Create timeline chart
    if (timelineRef.current && stats.yearlyData.length > 0) {
      const svg = d3.select(timelineRef.current)
      const width = timelineRef.current.clientWidth
      const height = timelineRef.current.clientHeight
      const margin = { top: 20, right: 80, bottom: 40, left: 60 }
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      svg.selectAll("*").remove()

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

      // Create scales
      const xScale = d3.scaleLinear().domain([1997, 2013]).range([0, innerWidth])

      const yScaleCount = d3
        .scaleLinear()
        .domain([0, d3.max(stats.yearlyData, (d) => d.count) || 0])
        .range([innerHeight, 0])

      const yScaleWealth = d3
        .scaleLinear()
        .domain([0, d3.max(stats.yearlyData, (d) => d.totalWealth) || 0])
        .range([innerHeight, 0])

      // Create axes
      const xAxis = d3
        .axisBottom(xScale)
        .tickFormat((d) => d.toString())
        .ticks(17) // One tick per year

      const yAxisCount = d3.axisLeft(yScaleCount).tickFormat((d) => d.toString())

      const yAxisWealth = d3.axisRight(yScaleWealth).tickFormat((d: any) => `$${d}B`)

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

      g.append("g")
        .call(yAxisCount)
        .append("text")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -40)
        .text("Number of Billionaires")

      g.append("g")
        .attr("transform", `translate(${innerWidth}, 0)`)
        .call(yAxisWealth)
        .append("text")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", 40)
        .text("Total Wealth (Billions USD)")

      // Create line for count
      const countLine = d3
        .line<any>()
        .x((d) => xScale(d.year))
        .y((d) => yScaleCount(d.count))
        .curve(d3.curveMonotoneX)

      g.append("path")
        .datum(stats.yearlyData)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("d", countLine)

      // Create line for wealth
      const wealthLine = d3
        .line<any>()
        .x((d) => xScale(d.year))
        .y((d) => yScaleWealth(d.totalWealth))
        .curve(d3.curveMonotoneX)

      g.append("path")
        .datum(stats.yearlyData)
        .attr("fill", "none")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 2)
        .attr("d", wealthLine)

      // Add circles for data points
      g.selectAll(".count-circle")
        .data(stats.yearlyData)
        .join("circle")
        .attr("class", "count-circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScaleCount(d.count))
        .attr("r", 4)
        .attr("fill", "#3b82f6")

      g.selectAll(".wealth-circle")
        .data(stats.yearlyData)
        .join("circle")
        .attr("class", "wealth-circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScaleWealth(d.totalWealth))
        .attr("r", 4)
        .attr("fill", "#10b981")

      // Add legend
      const legend = svg.append("g").attr("transform", `translate(${margin.left + 10}, ${margin.top + 10})`)

      // Count legend
      legend.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 4).attr("fill", "#3b82f6")

      legend
        .append("text")
        .attr("x", 10)
        .attr("y", 4)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text("Number of Billionaires")

      // Wealth legend
      legend.append("circle").attr("cx", 0).attr("cy", 20).attr("r", 4).attr("fill", "#10b981")

      legend
        .append("text")
        .attr("x", 10)
        .attr("y", 24)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text("Total Wealth (Billions USD)")
    }
  }, [billionaires, stats.topIndustries])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-auto">
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>What Does It Mean to Be a "Self-Made" Billionaire?</CardTitle>
          <CardDescription>Key findings from our analysis of billionaire data from 1997-2013</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Our analysis of {stats.totalBillionaires} billionaires with a combined wealth of $
            {stats.totalWealth.toFixed(0)} billion reveals that {stats.selfMadeCount} (
            {Math.round((stats.selfMadeCount / stats.totalBillionaires) * 100)}%) are classified as "self-made,"
            controlling ${stats.selfMadeWealth.toFixed(0)} billion (
            {Math.round((stats.selfMadeWealth / stats.totalWealth) * 100)}%) of the total wealth.
          </p>
          <p className="mt-2 text-lg">
            The average age of billionaires is {Math.round(stats.avgAge)} years, with most concentrated in the{" "}
            {stats.topIndustries[0]?.industry}, {stats.topIndustries[1]?.industry}, and{" "}
            {stats.topIndustries[2]?.industry} industries.
          </p>
          <p className="mt-2 text-lg">
            Geographically, {stats.topCountries[0]?.country}, {stats.topCountries[1]?.country}, and{" "}
            {stats.topCountries[2]?.country} host the largest concentrations of billionaire wealth.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Self-Made vs. Inherited Wealth</CardTitle>
          <CardDescription>Distribution of billionaire wealth by origin</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <svg ref={pieChartRef} width="100%" height="100%"></svg>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Industries by Wealth</CardTitle>
          <CardDescription>Industries with the highest concentration of billionaire wealth</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <svg ref={barChartRef} width="100%" height="100%"></svg>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Billionaire Trends (1997-2013)</CardTitle>
          <CardDescription>Growth in billionaire count and total wealth over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <svg ref={timelineRef} width="100%" height="100%"></svg>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Conclusion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            The data reveals that while "self-made" billionaires outnumber those who inherited their wealth, the
            definition of "self-made" remains complex. Many "self-made" billionaires benefited from advantages such as
            education, connections, and initial capital that aren't available to everyone.
          </p>
          <p className="mt-2 text-lg">
            The concentration of wealth in specific industries and countries highlights the role of structural factors
            in wealth creation. Finance, technology, and manufacturing continue to be the dominant sectors for wealth
            generation during this period.
          </p>
          <p className="mt-2 text-lg">
            This visualization aims to prompt reflection on what it truly means to be "self-made" in a world where
            opportunity is not equally distributed, and success often builds upon various forms of privilege and
            advantage.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
