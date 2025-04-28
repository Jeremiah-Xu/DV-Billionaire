import { NextResponse } from "next/server"
import { parse } from "csv-parse/sync"
import { readFileSync } from "fs"
import path from "path"
import type { Billionaire } from "@/types/billionaire"

export async function GET() {
  try {
    const years = [
      1997, 1998, 1999, 2000, 2001, 2002, 2003,
      2004, 2005, 2006, 2007, 2008, 2009, 2010,
      2011, 2012, 2013, 2014, 2015, 2016, 2017,
      2018, 2019, 2020, 2021, 2022, 2023, 2024
    ]

    const allBillionaires: Billionaire[] = []

    for (const year of years) {
      const filePath = path.join(process.cwd(), "public", `billionaires_${year}.csv`)

      const csvText = readFileSync(filePath, "utf-8")

      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
      })

      const billionaires: Billionaire[] = records.map((record: any) => {
        const netWorthMatch = record.net_worth?.match(/(\d+(?:\.\d+)?)\s*B/)
        const netWorth = netWorthMatch ? Number.parseFloat(netWorthMatch[1]) : 0
        const age = record.age && !isNaN(Number.parseInt(record.age)) ? Number.parseInt(record.age) : null

        let industries: string[] = []
        try {
          if (record.business_industries) {
            if (record.business_industries.startsWith("[") && record.business_industries.endsWith("]")) {
              industries = record.business_industries
                .slice(1, -1)
                .split(",")
                .map((s: string) => s.trim().replace(/^'|'$/g, "").replace(/&#38;/g, "&"))
            } else {
              industries = [record.business_industries]
            }
          }
        } catch (e) {
          console.error("Error parsing business industries:", e)
        }

        const industry = record.business_category || (industries.length > 0 ? industries[0] : "Unknown")
        const isSelfMade = record.self_made?.toLowerCase() === "true"
        const yearParsed = record.year ? Number.parseInt(record.year) : null

        return {
          name: record.full_name || `${record.first_name || ""} ${record.last_name || ""}`.trim(),
          age: age,
          netWorth: netWorth,
          industry: industry,
          sourceOfWealth: industries.join(", "),
          title: record.position_in_organization || "",
          organization: record.organization_name || "",
          isSelfMade: isSelfMade,
          selfMadeScore: 0,
          philanthropyScore: 0,
          residence: record.city_of_residence || "",
          citizenship: record.country_of_citizenship || "",
          gender: record.gender || "",
          maritalStatus: "",
          children: "",
          education: "",
          year: yearParsed,
          wealthStatus: record.wealth_status || "",
        }
      })

      allBillionaires.push(...billionaires)
    }

    return NextResponse.json(allBillionaires)
  } catch (error) {
    console.error("Error processing billionaire data:", error)
    return NextResponse.json({ error: "Failed to process billionaire data" }, { status: 500 })
  }
}
