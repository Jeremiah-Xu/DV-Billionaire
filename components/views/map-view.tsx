"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"
import { Button } from "@/components/ui/button"
import type { Billionaire } from "@/types/billionaire"

interface MapViewProps {
  billionaires: Billionaire[]
}

export default function MapView({ billionaires }: MapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [wealthType, setWealthType] = useState<"all" | "selfmade" | "inherited">("all")

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

    // Create a projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 6)
      .translate([width / 2, height / 2])

    // Create a path generator
    const path = d3.geoPath().projection(projection)

    // Load world map data
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((data: any) => {
      // Convert TopoJSON to GeoJSON
      const countries = feature(data, data.objects.countries)

      // Filter billionaires based on selected wealth type
      const filteredBillionaires = billionaires.filter((b) => {
        if (wealthType === "all") return true
        if (wealthType === "selfmade") return b.isSelfMade
        if (wealthType === "inherited") return !b.isSelfMade
        return true
      })

      // Normalize country names for better matching
      const normalizeCountry = (country: string): string => {
        // Convert to lowercase for case-insensitive matching
        const lowerCountry = country.toLowerCase()

        // US/USA variations
        if (
          lowerCountry === "united states" ||
          lowerCountry === "usa" ||
          lowerCountry === "u.s." ||
          lowerCountry === "us" ||
          lowerCountry === "united states of america" ||
          lowerCountry.includes("america")
        ) {
          return "United States"
        }

        // UK variations
        if (
          lowerCountry === "united kingdom" ||
          lowerCountry === "uk" ||
          lowerCountry === "great britain" ||
          lowerCountry === "england"
        ) {
          return "United Kingdom"
        }

        // Other common variations
        const countryMap: Record<string, string> = {
          russia: "Russia",
          "russian federation": "Russia",
          china: "China",
          "hong kong": "China",
          taiwan: "Taiwan",
          uae: "United Arab Emirates",
          "united arab emirates": "United Arab Emirates",
          canada: "Canada",
          germany: "Germany",
          france: "France",
          india: "India",
          japan: "Japan",
          brazil: "Brazil",
          australia: "Australia",
          switzerland: "Switzerland",
          italy: "Italy",
          spain: "Spain",
          mexico: "Mexico",
          "south korea": "South Korea",
          korea: "South Korea",
          "republic of korea": "South Korea",
          "saudi arabia": "Saudi Arabia",
          singapore: "Singapore",
          netherlands: "Netherlands",
          "the netherlands": "Netherlands",
          sweden: "Sweden",
          turkey: "Turkey",
          indonesia: "Indonesia",
          israel: "Israel",
          thailand: "Thailand",
          ireland: "Ireland",
          norway: "Norway",
          denmark: "Denmark",
          belgium: "Belgium",
          austria: "Austria",
          philippines: "Philippines",
          "the philippines": "Philippines",
          malaysia: "Malaysia",
          chile: "Chile",
          colombia: "Colombia",
          egypt: "Egypt",
          finland: "Finland",
          greece: "Greece",
          portugal: "Portugal",
          argentina: "Argentina",
          "south africa": "South Africa",
          "new zealand": "New Zealand",
          "czech republic": "Czech Republic",
          czechia: "Czech Republic",
          poland: "Poland",
          hungary: "Hungary",
          vietnam: "Vietnam",
          peru: "Peru",
          qatar: "Qatar",
          kuwait: "Kuwait",
          morocco: "Morocco",
          ukraine: "Ukraine",
          romania: "Romania",
          kazakhstan: "Kazakhstan",
          nigeria: "Nigeria",
          pakistan: "Pakistan",
          bangladesh: "Bangladesh",
          algeria: "Algeria",
          venezuela: "Venezuela",
          iraq: "Iraq",
          iran: "Iran",
          syria: "Syria",
          libya: "Libya",
          jordan: "Jordan",
          lebanon: "Lebanon",
          oman: "Oman",
          bahrain: "Bahrain",
          cyprus: "Cyprus",
          iceland: "Iceland",
          luxembourg: "Luxembourg",
          monaco: "Monaco",
          liechtenstein: "Liechtenstein",
          andorra: "Andorra",
          "san marino": "San Marino",
          "vatican city": "Vatican City",
          malta: "Malta",
          estonia: "Estonia",
          latvia: "Latvia",
          lithuania: "Lithuania",
          belarus: "Belarus",
          moldova: "Moldova",
          slovakia: "Slovakia",
          slovenia: "Slovenia",
          croatia: "Croatia",
          bosnia: "Bosnia and Herzegovina",
          "bosnia and herzegovina": "Bosnia and Herzegovina",
          serbia: "Serbia",
          montenegro: "Montenegro",
          "north macedonia": "North Macedonia",
          macedonia: "North Macedonia",
          albania: "Albania",
          bulgaria: "Bulgaria",
        }

        return countryMap[lowerCountry] || country
      }

      // Group billionaires by normalized country and calculate total wealth
      const countryGroups = new Map<string, Billionaire[]>()

      filteredBillionaires.forEach((b) => {
        const normalizedCountry = normalizeCountry(b.citizenship)
        if (!countryGroups.has(normalizedCountry)) {
          countryGroups.set(normalizedCountry, [])
        }
        countryGroups.get(normalizedCountry)?.push(b)
      })

      // Calculate total wealth by country
      const countryWealthMap = new Map<string, number>()
      countryGroups.forEach((billionaires, country) => {
        countryWealthMap.set(
          country,
          d3.sum(billionaires, (d) => d.netWorth),
        )
      })

      // Calculate total global wealth
      const totalGlobalWealth = d3.sum(filteredBillionaires, (d) => d.netWorth)

      // Calculate percentage of global wealth by country
      const countryPercentageMap = new Map<string, number>()
      countryWealthMap.forEach((wealth, country) => {
        countryPercentageMap.set(country, (wealth / totalGlobalWealth) * 100)
      })

      // Create color scale for countries
      const colorScale = d3
        .scaleSequential(d3.interpolateGreens)
        .domain([0, d3.max(Array.from(countryPercentageMap.values())) || 0])

      // Function to match country names between our data and the map data
      const matchCountry = (mapCountryName: string): number => {
        // Direct match
        if (countryPercentageMap.has(mapCountryName)) {
          return countryPercentageMap.get(mapCountryName) || 0
        }

        // Special case for United States
        if (mapCountryName === "United States of America") {
          return countryPercentageMap.get("United States") || 0
        }

        // Try to find a partial match
        for (const [key, value] of countryPercentageMap.entries()) {
          if (
            mapCountryName.includes(key) ||
            key.includes(mapCountryName) ||
            normalizeCountry(mapCountryName) === normalizeCountry(key)
          ) {
            return value
          }
        }

        return 0
      }

      // Draw countries
      g.selectAll("path")
        .data(countries.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d) => {
          const countryName = d.properties.name
          const percentage = matchCountry(countryName)
          return percentage > 0 ? colorScale(percentage) : "#f1f5f9"
        })
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 0.5)
        .append("title")
        .text((d) => {
          const countryName = d.properties.name
          const percentage = matchCountry(countryName)
          const wealth = (percentage / 100) * totalGlobalWealth
          return `${countryName}: $${wealth.toFixed(1)}B (${percentage.toFixed(1)}% of global billionaire wealth)`
        })

      // Add legend
      const legendWidth = 200
      const legendHeight = 20
      const legendX = width - legendWidth - margin.right
      const legendY = height - legendHeight - margin.bottom

      const legendScale = d3
        .scaleLinear()
        .domain([0, d3.max(Array.from(countryPercentageMap.values())) || 0])
        .range([0, legendWidth])

      const legendAxis = d3
        .axisBottom(legendScale)
        .tickFormat((d) => `${d}%`)
        .ticks(5)

      const defs = svg.append("defs")
      const linearGradient = defs
        .append("linearGradient")
        .attr("id", "wealth-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")

      linearGradient
        .selectAll("stop")
        .data(d3.range(0, 1.01, 0.1))
        .join("stop")
        .attr("offset", (d) => `${d * 100}%`)
        .attr("stop-color", (d) => colorScale(d * (d3.max(Array.from(countryPercentageMap.values())) || 0)))

      svg
        .append("rect")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#wealth-gradient)")

      svg
        .append("g")
        .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
        .call(legendAxis)

      svg
        .append("text")
        .attr("x", legendX)
        .attr("y", legendY - 5)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text("Percentage of Global Billionaire Wealth")

      // Add title based on wealth type
      let titleText = "Global Distribution of Billionaire Wealth"
      if (wealthType === "selfmade") {
        titleText = "Global Distribution of Self-Made Billionaire Wealth"
      } else if (wealthType === "inherited") {
        titleText = "Global Distribution of Inherited Billionaire Wealth"
      }

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(titleText)
    })
  }, [billionaires, wealthType])

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
    </div>
  )
}
