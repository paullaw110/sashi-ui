#!/usr/bin/env npx ts-node

/**
 * SuperLandings Lead Scraper
 * 
 * Fetches businesses from Outscraper, calculates qualification scores,
 * and inserts them into the sashi-ui leads database.
 * 
 * Usage: npx ts-node scrape-leads.ts --industry "dentist" --location "Riverside, CA" --limit 10
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// Config
const OUTSCRAPER_KEY_PATH = path.join(process.env.HOME!, '.config/outscraper/api_key');
const DB_PATH = path.join(process.env.HOME!, 'clawd/sashi-ui/db/sashi.db');

// Types
interface OutscraperBusiness {
  name: string;
  address: string;
  phone: string;
  site?: string;
  website?: string;
  rating: number;
  reviews: number;
  category: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  business_status: string;
  verified: boolean;
  subtypes?: string;
}

interface Lead {
  id: string;
  business_name: string;
  industry: string;
  location: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_rating: number | null;
  review_count: number | null;
  pagespeed_score: number | null;
  mobile_friendly: number | null;
  has_ssl: number | null;
  tech_stack: string | null;
  qualification_score: number | null;
  issues_detected: string | null;
  status: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

// Calculate qualification score
function calculateScore(business: OutscraperBusiness): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];

  // No website = jackpot
  const website = business.site || business.website;
  if (!website) {
    score += 100;
    issues.push('No website');
    return { score, issues };
  }

  // Check HTTPS
  if (!website.startsWith('https')) {
    score += 20;
    issues.push('No SSL');
  }

  // Good business signals
  if (business.rating >= 4.5) {
    score += 25;
  } else if (business.rating >= 4.0) {
    score += 15;
  }

  if (business.reviews >= 100) {
    score += 20;
  } else if (business.reviews >= 50) {
    score += 15;
  } else if (business.reviews >= 20) {
    score += 10;
  }

  // Active and established
  if (business.reviews >= 30 && business.rating >= 4.0) {
    score += 10;
  }

  // Verified business
  if (business.verified) {
    score += 5;
  }

  return { score, issues };
}

// Fetch from Outscraper
async function fetchFromOutscraper(
  apiKey: string,
  industry: string,
  location: string,
  limit: number
): Promise<OutscraperBusiness[]> {
  const query = encodeURIComponent(`${industry} in ${location}`);
  const url = `https://api.app.outscraper.com/maps/search-v3?query=${query}&limit=${limit}&async=false`;

  console.log(`Fetching: ${industry} in ${location} (limit: ${limit})`);

  const response = await fetch(url, {
    headers: { 'X-API-KEY': apiKey },
  });

  if (!response.ok) {
    throw new Error(`Outscraper API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'Success' || !data.data?.[0]) {
    throw new Error(`Outscraper returned no data: ${JSON.stringify(data)}`);
  }

  return data.data[0];
}

// Insert leads into database
function insertLeads(db: Database.Database, leads: Lead[]): number {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO leads (
      id, business_name, industry, location, address, phone, email,
      website_url, google_rating, review_count, pagespeed_score,
      mobile_friendly, has_ssl, tech_stack, qualification_score,
      issues_detected, status, notes, created_at, updated_at
    ) VALUES (
      @id, @business_name, @industry, @location, @address, @phone, @email,
      @website_url, @google_rating, @review_count, @pagespeed_score,
      @mobile_friendly, @has_ssl, @tech_stack, @qualification_score,
      @issues_detected, @status, @notes, @created_at, @updated_at
    )
  `);

  let inserted = 0;
  for (const lead of leads) {
    const result = stmt.run(lead);
    if (result.changes > 0) inserted++;
  }

  return inserted;
}

// Main
async function main() {
  // Parse args
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string): string => {
    const index = args.indexOf(`--${name}`);
    return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
  };

  const industry = getArg('industry', 'dentist');
  const location = getArg('location', 'Riverside, CA');
  const limit = parseInt(getArg('limit', '10'), 10);

  // Load API key
  if (!fs.existsSync(OUTSCRAPER_KEY_PATH)) {
    console.error('Outscraper API key not found at:', OUTSCRAPER_KEY_PATH);
    process.exit(1);
  }
  const apiKey = fs.readFileSync(OUTSCRAPER_KEY_PATH, 'utf-8').trim();

  // Fetch businesses
  const businesses = await fetchFromOutscraper(apiKey, industry, location, limit);
  console.log(`Found ${businesses.length} businesses`);

  // Transform to leads
  const now = Date.now();
  const leads: Lead[] = businesses.map((b) => {
    const { score, issues } = calculateScore(b);
    const website = b.site || b.website;

    return {
      id: randomUUID(),
      business_name: b.name,
      industry: industry,
      location: `${b.city}, ${b.state}`,
      address: b.address || null,
      phone: b.phone || null,
      email: null,
      website_url: website || null,
      google_rating: b.rating ? Math.round(b.rating * 10) : null, // Store as 45 for 4.5
      review_count: b.reviews || null,
      pagespeed_score: null, // Will be filled by PageSpeed API later
      mobile_friendly: null,
      has_ssl: website?.startsWith('https') ? 1 : 0,
      tech_stack: null,
      qualification_score: score,
      issues_detected: issues.length > 0 ? JSON.stringify(issues) : null,
      status: 'new',
      notes: null,
      created_at: now,
      updated_at: now,
    };
  });

  // Insert into database
  const db = new Database(DB_PATH);
  const inserted = insertLeads(db, leads);
  db.close();

  console.log(`Inserted ${inserted} new leads (${leads.length - inserted} duplicates skipped)`);

  // Print top 5 by score
  console.log('\nTop 5 by qualification score:');
  leads
    .sort((a, b) => (b.qualification_score || 0) - (a.qualification_score || 0))
    .slice(0, 5)
    .forEach((l, i) => {
      console.log(
        `${i + 1}. [${l.qualification_score}] ${l.business_name} - ${l.google_rating ? l.google_rating / 10 : '?'}⭐ (${l.review_count} reviews)`
      );
    });
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
