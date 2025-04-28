"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { Billionaire } from "@/types/billionaire";
import { useTooltip } from "@/hooks/use-tooltip";

interface AgeViewProps {
  billionaires: Billionaire[];
}

export default function AgeView({ billionaires }: AgeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip, tooltipRef, tooltipData } = useTooltip();
  const showRef = useRef(showTooltip);
  const hideRef = useRef(hideTooltip);
  useEffect(() => {
    showRef.current = showTooltip;
    hideRef.current = hideTooltip;
  }, [showTooltip, hideTooltip]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const years = useMemo(() => {
    const ys = Array.from(
      new Set(
        billionaires.map((b) => b.year).filter((y): y is number => y != null)
      )
    );
    ys.sort((a, b) => a - b);
    return ys;
  }, [billionaires]);

  useEffect(() => {
    if (years.length && selectedYear === null) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);
  useEffect(() => {
    if (!svgRef.current || selectedYear === null) return;

    const data = billionaires.filter(
      (b) => b.year === selectedYear && b.age != null
    );

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale + axis
    const xScale = d3.scaleLinear().domain([20, 100]).range([0, innerWidth]);
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([20, 30, 40, 50, 60, 70, 80, 90, 100])
      .tickFormat((d) => d.toString());

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .append("text")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .text("Age");

    // Grid lines
    const gridLines = g.append("g").attr("class", "grid-lines");
    [30, 40, 50, 60, 70, 80, 90].forEach((age) => {
      gridLines
        .append("line")
        .attr("x1", xScale(age))
        .attr("y1", 0)
        .attr("x2", xScale(age))
        .attr("y2", innerHeight)
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1);
    });

    // Divider + labels
    g.append("line")
      .attr("x1", 0)
      .attr("y1", innerHeight / 2)
      .attr("x2", innerWidth)
      .attr("y2", innerHeight / 2)
      .attr("stroke", "black")
      .attr("stroke-dasharray", "4")
      .attr("stroke-width", 1);

    g.append("text")
      .attr("x", 10)
      .attr("y", innerHeight / 4)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Self-Made");

    g.append("text")
      .attr("x", 10)
      .attr("y", (3 * innerHeight) / 4)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Inherited");

    // Radius scale
    const maxNetWorth = d3.max(data, (d) => d.netWorth) || 1;
    const radiusScale = d3.scaleSqrt().domain([0, maxNetWorth]).range([3, 20]);

    // Force simulation: we throttle alphaDecay so it cools quickly
    const simulation = d3
      .forceSimulation(data as any)
      .force("x", d3.forceX((d: any) => xScale(d.age)).strength(0.9))
      .force(
        "y",
        d3
          .forceY((d: any) =>
            d.isSelfMade ? innerHeight / 4 : (3 * innerHeight) / 4
          )
          .strength(0.4)
      )
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => radiusScale(d.netWorth) + 1)
      )
      .alphaDecay(0.05) // cool down faster
      .on("tick", ticked)
      .on("end", () => simulation.stop()); // stop once it’s stable

    // Circles
    const circles = g
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("r", (d) => radiusScale(d.netWorth))
      .attr("fill", (d) => (d.isSelfMade ? "#4ade80" : "#f87171"))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        // position tooltip relative to SVG container
        const { left, top } = svgRef.current!.getBoundingClientRect();
        showRef.current(d, event.clientX - left, event.clientY - top);
        d3.select(event.currentTarget)
          .attr("stroke", "#000")
          .attr("stroke-width", 2)
          .attr("opacity", 1);
      })
      .on("mouseout", (event) => {
        hideRef.current();
        d3.select(event.currentTarget)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("opacity", 0.7);
      });

    function ticked() {
      circles.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    }

    return () => {
      simulation.stop();
    };
  }, [billionaires, selectedYear]); // ← tooltip refs are stable, so not here

  return (
    <div className="w-full h-[700px] flex">
      {/* Chart */}
      <div className="flex-1 relative">
        <svg ref={svgRef} width="100%" height="100%"></svg>
        {tooltipData && (
          <div
            ref={tooltipRef}
            className="absolute bg-white p-3 rounded shadow-lg border z-10 max-w-xs"
          >
            <h3 className="font-bold mb-1">{tooltipData.name}</h3>
            <p>
              <span className="font-semibold">Net Worth:</span> $
              {tooltipData.netWorth}B
            </p>
            <p>
              <span className="font-semibold">Industry:</span>{" "}
              {tooltipData.industry}
            </p>
            <p>
              <span className="font-semibold">Self-Made:</span>{" "}
              {tooltipData.isSelfMade ? "Yes" : "No"}
            </p>
            {tooltipData.age != null && (
              <p>
                <span className="font-semibold">Age:</span> {tooltipData.age}
              </p>
            )}
            <p>
              <span className="font-semibold">Country:</span>{" "}
              {tooltipData.citizenship}
            </p>
          </div>
        )}
      </div>

      {/* Year selector */}
      <div className="ml-4 w-32 flex-shrink-0">
        <label htmlFor="year-select" className="block mb-1 font-medium">
          Select Year
        </label>
        <select
          id="year-select"
          value={selectedYear ?? undefined}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full border rounded p-2"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
