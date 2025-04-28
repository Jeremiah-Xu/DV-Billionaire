import type { Billionaire } from "@/types/billionaire"

export async function fetchBillionaireData(): Promise<Billionaire[]> {
  try {
    const response = await fetch("/api/billionaires")
    if (!response.ok) {
      throw new Error("Failed to fetch billionaire data")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching billionaire data:", error)
    throw error
  }
}
