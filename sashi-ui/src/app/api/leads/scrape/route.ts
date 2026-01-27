import { NextRequest, NextResponse } from "next/server";

// This endpoint is a placeholder for triggering lead scrapes.
// In production, Sashi handles the actual scraping via:
// 1. Outscraper API for Google Maps data
// 2. PageSpeed Insights API for website scoring
// 3. Direct insertion into the leads table
//
// The UI calls this to request a scrape, which gets queued for Sashi to process.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { industry, location, quantity = 10 } = body;

    if (!industry || !location) {
      return NextResponse.json(
        { error: "Industry and location are required" },
        { status: 400 }
      );
    }

    // For now, return a message indicating the scrape is queued
    // Sashi will pick this up and process it
    // TODO: Write to a queue table or trigger Sashi directly
    
    console.log(`[Leads Scrape] Requested: ${quantity} ${industry} businesses in ${location}`);

    return NextResponse.json({
      message: `Scrape queued: ${quantity} ${industry} businesses in ${location}`,
      status: "queued",
      params: { industry, location, quantity },
    });
  } catch (error) {
    console.error("Error queueing scrape:", error);
    return NextResponse.json(
      { error: "Failed to queue scrape" },
      { status: 500 }
    );
  }
}
