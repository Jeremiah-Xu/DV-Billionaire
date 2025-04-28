import BillionaireVisualization from "@/components/billionaire-visualization"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-bold text-center my-8">What Does It Mean to Be a "Self-Made" Billionaire?</h1>
        <BillionaireVisualization />
      </div>
    </main>
  )
}
