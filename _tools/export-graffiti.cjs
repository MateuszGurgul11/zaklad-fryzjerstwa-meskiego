/*
 * Eksport "graffiti" — napisów odręcznych do tła stopki.
 *
 * Ten sam algorytm co w handwrite.js (i co w workerze oryginału):
 * opentype.js zamienia tekst z fontu Great Rebellion na ścieżki, jeden
 * <path> na znak. Różnica wobec _tools/export-handwrite.cjs jest taka, że
 * tutaj pliki mają wymiary zgodne z viewBox (żeby <img> znał proporcje)
 * i od razu wypełnienie w kolorze marki — nie są rysowane po kolei,
 * tylko leżą gotowe w tle.
 *
 *   node _tools/export-graffiti.cjs
 */
const fs = require('fs');
const path = require('path');
const opentype = require('../js/vendor/opentype.min.js');

const buf = fs.readFileSync(path.join(__dirname, '..', 'fonts', 'GreatRebellion.ttf'));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const FONT_SIZE = 100;
const LS = 0;
const KOLOR = '#9db596';       // --brand-green-300

/* słowa do tła stopki — to, czym zakład się zajmuje */
const SLOWA = ['Wilda', 'fade', 'broda', 'combo', 'barber', 'Poznań'];

function build(text) {
  const chars = [...text];
  const paths = [];
  let x = 0, x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const ch of chars) {
    const p = font.getPath(ch, x, FONT_SIZE, FONT_SIZE);
    paths.push(p.toPathData(2));
    const bb = p.getBoundingBox();
    if (isFinite(bb.x1)) {
      x1 = Math.min(x1, bb.x1); y1 = Math.min(y1, bb.y1);
      x2 = Math.max(x2, bb.x2); y2 = Math.max(y2, bb.y2);
    }
    x += font.getAdvanceWidth(ch, FONT_SIZE) + FONT_SIZE * LS;
  }
  const pad = 6;                                   // margines, żeby nie ucinało krojów
  return {
    paths,
    x: x1 - pad, y: y1 - pad,
    w: x2 - x1 + pad * 2, h: y2 - y1 + pad * 2
  };
}

const outDir = path.join(__dirname, '..', 'svg', 'graffiti');
fs.mkdirSync(outDir, { recursive: true });

for (const slowo of SLOWA) {
  const d = build(slowo);
  const body = d.paths.map(p => `  <path d="${p}"/>`).join('\n');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d.w.toFixed(2)}" height="${d.h.toFixed(2)}" ` +
    `viewBox="${d.x.toFixed(2)} ${d.y.toFixed(2)} ${d.w.toFixed(2)} ${d.h.toFixed(2)}" ` +
    `fill="${KOLOR}">\n${body}\n</svg>\n`;
  const nazwa = slowo.toLowerCase()
    .replace(/[ąćęłńóśźż]/g, c => 'acelnoszz'['ąćęłńóśźż'.indexOf(c)])
    .replace(/[^a-z0-9]+/g, '-') + '.svg';
  fs.writeFileSync(path.join(outDir, nazwa), svg);
  console.log(nazwa.padEnd(16), d.paths.length + ' ścieżek', `${d.w.toFixed(0)}×${d.h.toFixed(0)}`);
}
