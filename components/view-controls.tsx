"use client"

import { Button } from "@/components/ui/button"
import type { ViewType } from "./billionaire-visualization"

interface ViewControlsProps {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
}

export default function ViewControls({ currentView, setCurrentView }: ViewControlsProps) {
  const views: { id: ViewType; label: string }[] = [
    { id: "scatter", label: "Scatter" },
    { id: "timeline", label: "Timeline" },
    { id: "selfmade", label: "Self-Made vs Inherited" },
    { id: "age", label: "Age Distribution" },
    { id: "industry", label: "Industry" },
    { id: "map", label: "Global Distribution" },
    { id: "conclusion", label: "Conclusion" },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {views.map((view) => (
        <Button
          key={view.id}
          variant={currentView === view.id ? "default" : "outline"}
          onClick={() => setCurrentView(view.id)}
        >
          {view.label}
        </Button>
      ))}
    </div>
  )
}
