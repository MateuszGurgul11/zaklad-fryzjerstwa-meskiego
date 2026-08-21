/* Eksport napisów odręcznych do statycznych plików SVG.
   Używa dokładnie tego samego algorytmu co worker oryginału. */
const fs = require('fs');
const path = require('path');
const opentype = require('../js/vendor/opentype.min.js');

const buf = fs.readFileSync(path.join(__dirname, '..', 'fonts', 'GreatRebellion.ttf'));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const FONT_SIZE = 100, STROKE = 2, LS = 0;

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
  const h = STROKE / 2;
  return {
    paths,
    viewBox: `${x1 - h} ${y1 - h} ${x2 - x1 + STROKE} ${y2 - y1 + STROKE}`
  };
}

const ITEMS = [
  ['works', '#578bfc'], ['artem shcherbakov', '#578bfc'], ['contact', '#578bfc'],
  ['hey', '#00FE40'], ['cgi', '#00FE40'], ['live action', '#578bfc'], ['33', '#00FE40'],
  ['The Spark', '#fff700'], ['Pause Fest intro', '#8819c8'], ['Russ snippet', '#ff00cf'],
  ['Yandex', '#f64747'], ['Winline', '#ffa200'], ['Haval', '#26ff00'], ['Dota2', '#ff0000'],
  ['Rush Royale', '#f7ff00'], ['Iron Harvest', '#ff1c00'], ['Hero Wars', '#ff8200'],
  ['moooore', '#00ff21'], ['Sber', '#6cea19'], ['T-Mobile', '#fff700']
];

const outDir = path.join(__dirname, '..', 'svg', 'handwrite');
fs.mkdirSync(outDir, { recursive: true });

for (const [text, color] of ITEMS) {
  const d = build(text);
  const body = d.paths
    .map(p => `  <path d="${p}" stroke="${color}" stroke-width="${STROKE}" fill="none"/>`)
    .join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="200%" viewBox="${d.viewBox}" fill="none" preserveAspectRatio="xMidYMid meet">\n${body}\n</svg>\n`;
  const name = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.svg';
  fs.writeFileSync(path.join(outDir, name), svg);
  console.log(name.padEnd(24), d.paths.length + ' paths', 'viewBox:', d.viewBox);
}
