#!/usr/bin/env node
/*
 * genart.js — generate a PNG via Google's Nano Banana (gemini-2.5-flash-image)
 * and save it to assets/<filename>.
 *
 * Usage:
 *   node scripts/genart.js <output-filename> "<prompt>"
 *   node scripts/genart.js boss-1-portrait.png "pixel art portrait, neon-lit boiler room boss in pinstripe suit"
 *
 * Optional env:
 *   GEMINI_API_KEY        — required. Read from .env.local in repo root if present.
 *   GEMINI_MODEL          — defaults to gemini-2.5-flash-image. Other choices: gemini-3-pro-image-preview,
 *                           imagen-4.0-generate-001, imagen-4.0-ultra-generate-001.
 *   GEMINI_OUT_DIR        — defaults to assets/.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');

// Load .env.local if present (simple parser; no dependency)
const envFile = path.join(ROOT, '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
const OUT_DIR = path.resolve(ROOT, process.env.GEMINI_OUT_DIR || 'assets');

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not set. Add it to .env.local or export it.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/genart.js <output-filename> "<prompt>"');
  process.exit(1);
}
const outName = args[0];
const prompt = args.slice(1).join(' ');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, outName);

const body = JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
});

const opts = {
  method: 'POST',
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
  headers: {
    'Content-Type': 'application/json',
    'X-goog-api-key': API_KEY,
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log(`[genart] model=${MODEL}`);
console.log(`[genart] prompt=${prompt.slice(0, 120)}${prompt.length > 120 ? '…' : ''}`);
console.log(`[genart] out=${outPath}`);

const req = https.request(opts, (res) => {
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    if (res.statusCode !== 200) {
      console.error(`[genart] HTTP ${res.statusCode}`);
      console.error(buf.toString('utf8').slice(0, 1000));
      process.exit(1);
    }
    let json;
    try { json = JSON.parse(buf.toString('utf8')); }
    catch (e) {
      console.error('[genart] failed to parse JSON response');
      console.error(buf.toString('utf8').slice(0, 500));
      process.exit(1);
    }
    // Find the first inlineData (base64 image) in the response
    const parts = json?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p) => p.inlineData && p.inlineData.data);
    if (!imgPart) {
      // Sometimes the model returns text only (refused / clarifying). Surface that.
      const textPart = parts.find((p) => p.text);
      console.error('[genart] no image in response.');
      if (textPart) console.error('[genart] model said:', textPart.text.slice(0, 500));
      else console.error('[genart] full response:', JSON.stringify(json).slice(0, 800));
      process.exit(1);
    }
    const bytes = Buffer.from(imgPart.inlineData.data, 'base64');
    fs.writeFileSync(outPath, bytes);
    console.log(`[genart] wrote ${bytes.length} bytes to ${outPath}`);
  });
});
req.on('error', (e) => { console.error('[genart] request error:', e.message); process.exit(1); });
req.write(body);
req.end();
