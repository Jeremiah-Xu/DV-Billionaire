import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "billionaires.json"
    );
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load preprocessed data:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
