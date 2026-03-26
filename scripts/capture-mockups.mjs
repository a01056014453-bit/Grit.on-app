import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const features = [
  "home",
  "practice",
  "ai-analysis",
  "stats",
  "feedback",
  "help",
  "ranking",
  "metronome",
  "music-terms",
  "rooms",
  "teachers",
  "recordings",
  "records",
  "goals",
  "routines",
  "profile",
  "songs",
  "notifications",
  "practice-complete",
  "practice-main",
  "ai-report",
  "lesson",
  "room-detail",
  "practice-plan",
];

const BASE_URL = "http://localhost:3003";
const OUTPUT_DIR = path.resolve(process.env.HOME, "Desktop/sempre-mockups");
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 3 }; // iPhone 14 Pro @3x

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("브라우저 시작...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  for (const feature of features) {
    const url = `${BASE_URL}/mockups/${feature}`;
    console.log(`캡처 중: ${feature}`);

    await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500)); // 렌더링 대기

    const filePath = path.join(OUTPUT_DIR, `${feature}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  → ${filePath}`);
  }

  await browser.close();
  console.log(`\n완료! ${features.length}개 스크린샷 → ${OUTPUT_DIR}`);
}

main().catch(console.error);
