#!/usr/bin/env node

/**
 * SuperLandings Lead Scraper
 * 
 * Fetches businesses from Outscraper, calculates qualification scores,
 * and inserts them into the sashi-ui leads database.
 * 
 * Usage: node scrape-leads.mjs --industry "dentist" --location "Riverside, CA" --limit 10
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';

// Config
const HOME = process.env.HOME;
const OUTSCRAPER_KEY_PATH = path.join(HOME, '.config/outscraper/api_key');
const DB_PATH = path.join(HOME, 'clawd/sashi-ui/db/sashi.db');

// Calculate qualification score
function calculateScore(business) {
  let score = 0;
  const issues = [];

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
async function fetchFromOutscraper(apiKey, industry, location, limit) {
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
function insertLeads(db, leads) {
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
  const getArg = (name, defaultValue) => {
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
  const leads = businesses.map((b) => {
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
      google_rating: b.rating ? Math.round(b.rating * 10) : null,
      review_count: b.reviews || null,
      pagespeed_score: null,
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
