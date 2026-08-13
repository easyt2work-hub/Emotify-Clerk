import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const CONVEX_URL = "https://usable-stork-789.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const LOCAL_VIDEOS_DIR = "C:/Users/arulc/Downloads/final-20260805T131143Z-1-001/final";

const VIDEO_STEPS = [
  { stepIndex: 0, title: "Introduction", filename: "video-1.mp4" },
  { stepIndex: 1, title: "Hands & Fists", filename: "video-2.mp4" },
  { stepIndex: 2, title: "Forearms", filename: "video-3.mp4" },
  { stepIndex: 3, title: "Upper Arms", filename: "video-4.mp4" },
  { stepIndex: 4, title: "Shoulders", filename: "video-5.mp4" },
  { stepIndex: 5, title: "Face & Jaw", filename: "video-6.mp4" },
  { stepIndex: 6, title: "Neck", filename: "video-7.mp4" },
  { stepIndex: 7, title: "Chest", filename: "video-8.mp4" },
  { stepIndex: 8, title: "Stomach", filename: "video-9.mp4" },
  { stepIndex: 9, title: "Back", filename: "video-10.mp4" },
  { stepIndex: 10, title: "Thighs & Legs", filename: "video-11.mp4" },
  { stepIndex: 11, title: "Calves", filename: "video-12.mp4" },
  { stepIndex: 12, title: "Feet", filename: "video-13.mp4" },
  { stepIndex: 13, title: "Full Body", filename: "video-14.mp4" },
  { stepIndex: 14, title: "Reflection", filename: "video-15.mp4" },
];

async function updateAll() {
  console.log("🧹 Clearing old JPMR video records and storage files...");
  try {
    const res = await client.mutation(api.jpmrVideos.clearAllJpmrVideos);
    console.log(`✅ Cleared ${res?.clearedCount ?? 0} previous video records.`);
  } catch (e) {
    console.warn("Notice during clear:", e.message || e);
  }

  console.log("🚀 Starting upload of 15 new JPMR videos from local directory to Convex Storage...");

  for (const step of VIDEO_STEPS) {
    const filePath = path.join(LOCAL_VIDEOS_DIR, step.filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: ${step.filename} not found at ${filePath}. Skipping.`);
      continue;
    }

    const stats = fs.statSync(filePath);
    console.log(`Uploading step ${step.stepIndex} (${step.title} - ${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

    // 1. Get upload URL from Convex
    const uploadUrl = await client.mutation(api.jpmrVideos.generateUploadUrl);

    // 2. Upload file blob via POST
    const fileData = fs.readFileSync(filePath);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "video/mp4" },
      body: fileData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${step.filename}: ${response.statusText}`);
    }

    const { storageId } = await response.json();

    // 3. Save metadata record to Convex DB
    await client.mutation(api.jpmrVideos.saveVideoRecord, {
      stepIndex: step.stepIndex,
      title: step.title,
      storageId,
    });

    console.log(`✅ Uploaded step ${step.stepIndex} (${step.title}) -> Storage ID: ${storageId}`);
  }

  console.log("🎉 All 15 JPMR videos successfully updated in Convex Storage!");
}

updateAll().catch(console.error);
