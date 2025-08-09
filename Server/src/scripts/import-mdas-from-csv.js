#!/usr/bin/env node

/**
 * Script to import MDAs from CSV file
 * This script will:
 * 1. Read the mdas.csv file from the root directory
 * 2. Parse and clean the data
 * 3. Group sites by organization/MDA
 * 4. Create MDAs with their associated reports
 * 5. Handle duplicates and validation errors
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import MDA from "../models/MDA.js";

// Load environment variables
dotenv.config();

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importMDAsFromCSV = async () => {
  try {
    console.log("📊 Starting MDA import from CSV...\n");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Read CSV file
    const csvPath = path.join(__dirname, "../../datas/mdas.csv");
    console.log(`📁 Reading CSV file: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      throw new Error("CSV file not found at: " + csvPath);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    console.log("✅ CSV file read successfully\n");

    // Parse CSV content
    console.log("🔍 Parsing CSV data...");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    console.log(`Headers found: ${headers.join(", ")}`);
    console.log(`Total lines: ${lines.length}`);

    // Parse data rows
    const rawData = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      // Handle CSV parsing with potential commas in quoted fields
      const row = parseCSVLine(line);
      if (row.length >= 2 && row[0] && row[1]) {
        rawData.push({
          siteName: row[0].trim(),
          url: row[1].trim(),
        });
      }
    }

    console.log(`✅ Parsed ${rawData.length} valid data rows\n`);

    // Clean and validate URLs
    console.log("🧹 Cleaning and validating data...");
    const cleanedData = rawData
      .filter((item) => item.siteName && item.url)
      .map((item) => ({
        siteName: item.siteName,
        url: cleanURL(item.url),
      }))
      .filter((item) => isValidURL(item.url));

    console.log(`✅ ${cleanedData.length} valid entries after cleaning\n`);

    // Group sites by MDA (extract MDA name from site name)
    console.log("🏢 Grouping sites by MDA...");
    const mdaGroups = groupSitesByMDA(cleanedData);

    console.log(`✅ Found ${Object.keys(mdaGroups).length} unique MDAs:`);
    Object.keys(mdaGroups).forEach((mdaName) => {
      console.log(`   - ${mdaName}: ${mdaGroups[mdaName].length} reports`);
    });

    // Create MDAs in database
    console.log("\n💾 Creating MDAs in database...");
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [mdaName, sites] of Object.entries(mdaGroups)) {
      try {
        // Check if MDA already exists
        const existingMDA = await MDA.findOne({ name: mdaName });
        if (existingMDA) {
          console.log(`⚠️  MDA "${mdaName}" already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Prepare reports data
        const reports = sites.map((site) => ({
          title: site.siteName,
          url: site.url,
          isActive: true,
        }));

        // Create MDA
        const mda = new MDA({
          name: mdaName,
          reports: reports,
          isActive: true,
        });

        await mda.save();
        console.log(
          `✅ Created MDA: "${mdaName}" with ${reports.length} reports`
        );
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating MDA "${mdaName}": ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log("\n📊 Import Summary:");
    console.log(`✅ Successfully created: ${createdCount} MDAs`);
    console.log(`⚠️  Skipped (already exist): ${skippedCount} MDAs`);
    console.log(`❌ Errors: ${errorCount} MDAs`);
    console.log(`📊 Total processed: ${Object.keys(mdaGroups).length} MDAs`);

    // Show final database state
    const totalMDAs = await MDA.countDocuments();
    console.log(`\n🏢 Total MDAs in database: ${totalMDAs}`);

    console.log("\n🎉 MDA import completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Check the admin interface to verify MDAs were created");
    console.log("2. Review and edit MDA names if needed");
    console.log("3. Create users and assign them to MDAs");
    console.log("4. Test the report links to ensure they work");
  } catch (error) {
    console.error("\n❌ Import failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

/**
 * Parse a CSV line handling quoted fields with commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Clean and normalize URLs
 */
function cleanURL(url) {
  if (!url) return "";

  // Remove extra spaces and normalize
  url = url.trim();

  // Fix common URL issues
  url = url.replace(/\s+/g, ""); // Remove all spaces
  url = url.replace(/\/+/g, "/"); // Replace multiple slashes with single
  url = url.replace("http:/", "http://"); // Fix protocol
  url = url.replace("https:/", "https://"); // Fix protocol

  // Ensure protocol exists
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return url;
}

/**
 * Validate URL format
 */
function isValidURL(url) {
  try {
    new URL(url);
    return /^https?:\/\/.+/.test(url);
  } catch {
    return false;
  }
}

/**
 * Group sites by MDA name (extracted from site name)
 */
function groupSitesByMDA(sites) {
  const groups = {};

  for (const site of sites) {
    const mdaName = extractMDAName(site.siteName);

    if (!groups[mdaName]) {
      groups[mdaName] = [];
    }

    groups[mdaName].push(site);
  }

  return groups;
}

/**
 * Extract MDA name from site name
 * This function tries to identify the main organization from the site name
 */
function extractMDAName(siteName) {
  // Remove common suffixes and prefixes
  let mdaName = siteName
    .replace(/\s+(HQ|Headquarters|Head Office|Office|Annex|New|Old|\d+)$/i, "")
    .replace(
      /^(Fed\s+Min\s+of|Federal\s+Ministry\s+of|Ministry\s+of)\s+/i,
      "Ministry of "
    )
    .trim();

  // Handle special cases and abbreviations
  const specialCases = {
    "NHIS Wuse": "NHIS",
    "NHIS UTako": "NHIS",
    "TAJ Bank": "TAJ Bank",
    "Jaiz Bank": "Jaiz Bank",
    "Fraser Suites": "Fraser Suites",
    "Huawei Asokoro Apt": "Huawei",
    "Huawei Office": "Huawei",
    CHEC: "CHEC",
    "NNPC CBT Port Harcourt": "NNPC",
    "NDC HQ": "NDC",
    "NDC Piwoyi": "NDC",
    "FIRS HQ": "FIRS",
    "ONSA Z4": "ONSA",
    "ONSA White House": "ONSA",
    "Law School Bwari": "Nigerian Law School",
    "NJC Kaduna": "NJC",
    "NJC HQ": "NJC",
    "Women Center": "National Centre for Women Development",
    "Fed Min of Works": "Ministry of Works",
    "Fed Min of Housing": "Ministry of Housing",
    "Fed Min of Agric": "Ministry of Agriculture",
    "Corrections HQ": "Nigerian Correctional Service",
    "Abuja Clnics Maitama": "Abuja Clinics",
    "FM Lands New": "Ministry of Lands",
    "FM Lands Old": "Ministry of Lands",
    "FM Environment": "Ministry of Environment",
    "Court of Appeal": "Court of Appeal",
    "Customary court Of Appeal Utako": "Customary Court of Appeal",
    "National Library": "National Library of Nigeria",
    "Surveyor General": "Office of the Surveyor General",
    "Budget Office": "Budget Office of the Federation",
    "Audit House": "Office of the Auditor General",
    "NITDA Annex": "NITDA",
    "NITDA HQ": "NITDA",
    "NITDA Lagos": "NITDA",
    "NCC Mbora": "NCC",
    "NIPOST Area 10": "NIPOST",
    "Ministry of Power": "Ministry of Power",
    "Ministry of Defence": "Ministry of Defence",
    "NPA Lagos Port Complex": "NPA",
    "NAPET-KRPC": "NAPET",
    "NAPET-WRPC": "NAPET",
    "NAPET PH": "NAPET",
    "NAPET ENSERVE": "NAPET",
    "NAPET Mukhtar El- Yakub": "NAPET",
    "NUIMC-NAPET": "NAPET",
    "WRPC-NNPC": "NNPC",
    "KRPC-NNPC": "NNPC",
  };

  // Check for exact matches first
  for (const [pattern, replacement] of Object.entries(specialCases)) {
    if (siteName.toLowerCase().includes(pattern.toLowerCase())) {
      return replacement;
    }
  }

  // Extract main acronym or name
  const words = mdaName.split(/\s+/);
  if (words.length === 1 || words[0].length <= 6) {
    return words[0].toUpperCase();
  }

  return mdaName;
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Run the import
importMDAsFromCSV();
