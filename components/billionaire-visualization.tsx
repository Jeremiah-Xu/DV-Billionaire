"use client"

import { useEffect, useState } from "react"
import { fetchBillionaireData } from "@/lib/data"
import ScatterView from "./views/scatter-view"
import TimelineView from "./views/timeline-view"
import SelfMadeView from "./views/self-made-view"
import AgeView from "./views/age-view"
import IndustryView from "./views/industry-view"
import MapView from "./views/map-view"
import ConclusionView from "./views/conclusion-view"
import ViewControls from "./view-controls"
import type { Billionaire } from "@/types/billionaire"

export type ViewType = "scatter" | "timeline" | "selfmade" | "age" | "industry" | "map" | "conclusion"

export default function BillionaireVisualization() {
  const [billionaires, setBillionaires] = useState<Billionaire[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewType>("scatter")

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBillionaireData()
        setBillionaires(data)
      } catch (error) {
        console.error("Failed to load billionaire data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const renderView = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-[600px]">Loading data...</div>
    }

    switch (currentView) {
      case "scatter":
        return <ScatterView billionaires={billionaires} />
      case "timeline":
        return <TimelineView billionaires={billionaires} />
      case "selfmade":
        return <SelfMadeView billionaires={billionaires} />
      case "age":
        return <AgeView billionaires={billionaires} />
      case "industry":
        return <IndustryView billionaires={billionaires} />
      case "map":
        return <MapView billionaires={billionaires} />
      case "conclusion":
        return <ConclusionView billionaires={billionaires} />
      default:
        return <ScatterView billionaires={billionaires} />
    }
  }

  return (
    <div className="w-full">
      <ViewControls currentView={currentView} setCurrentView={setCurrentView} />
      <div className="border rounded-lg bg-white p-4 h-[600px] relative">{renderView()}</div>
    </div>
  )
}
