#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputDir = process.argv[3] || './diagrams';
const theme = process.argv[4] || 'neutral';

if (!inputFile) {
  console.error('Usage: render-diagrams.js <input.mmd> <output-dir> [theme]');
  process.exit(1);
}

// Detect Chrome for PUPPETEER_EXECUTABLE_PATH
if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
  const chromePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser'
  ];
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = p;
      break;
    }
  }
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const basename = path.basename(inputFile, path.extname(inputFile));
const svgOut = path.join(outputDir, basename + '.svg');
const pngOut = path.join(outputDir, basename + '.png');

const mmdcBin = path.join(
  __dirname, '..', 'node_modules', '.bin',
  process.platform === 'win32' ? 'mmdc.cmd' : 'mmdc'
);

if (!fs.existsSync(mmdcBin)) {
  const pluginDir = path.resolve(__dirname, '..');
  console.error(`[architect] Missing dependency '@mermaid-js/mermaid-cli'.\nRun: cd "${pluginDir}" && npm install`);
  process.exit(1);
}

try {
  execSync(`"${mmdcBin}" -i "${inputFile}" -o "${svgOut}" -t ${theme} -b transparent --width 1200`, { stdio: 'inherit' });
  execSync(`"${mmdcBin}" -i "${inputFile}" -o "${pngOut}" -t ${theme} -b white --width 1200 --scale 2`, { stdio: 'inherit' });
  console.log('SVG: ' + svgOut);
  console.log('PNG: ' + pngOut);
} catch (err) {
  console.error('Diagram rendering failed:', err.message);
  process.exit(1);
}
