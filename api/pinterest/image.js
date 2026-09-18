function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrapText(text, maxChars = 27, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + '…';
  }

  return lines;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const title = String(req.query.title || 'AGT Studio Digital Tool');
  const src = String(req.query.src || '');
  const price = String(req.query.price || '');
  const lines = wrapText(title);

  const titleSvg = lines
    .map(
      (line, index) =>
        `<text x="78" y="${830 + index * 58}" fill="#f5d77a" font-family="Arial, sans-serif" font-size="48" font-weight="700">${escapeXml(line)}</text>`
    )
    .join('');

  const image = src
    ? `<image href="${escapeXml(src)}" x="78" y="120" width="844" height="620" preserveAspectRatio="xMidYMid slice" rx="28"/>`
    : '<rect x="78" y="120" width="844" height="620" rx="28" fill="#151515"/>';

  const priceSvg = price
    ? `<text x="78" y="1040" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="600">${escapeXml(price)}</text>`
    : '';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="1500" viewBox="0 0 1000 1500">
  <rect width="1000" height="1500" fill="#080808"/>
  <rect x="38" y="38" width="924" height="1424" rx="38" fill="#111111" stroke="#c9a84a" stroke-width="2"/>
  <text x="78" y="88" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="4">AGT STUDIO</text>
  ${image}
  ${titleSvg}
  ${priceSvg}
  <line x1="78" y1="1110" x2="922" y2="1110" stroke="#3a3323"/>
  <text x="78" y="1170" fill="#ffffff" font-family="Arial, sans-serif" font-size="27">Digital tools for creators &amp; sellers</text>
  <text x="78" y="1215" fill="#a99f8b" font-family="Arial, sans-serif" font-size="22">Explore on Etsy</text>
  <text x="78" y="1385" fill="#c9a84a" font-family="Arial, sans-serif" font-size="25" font-weight="700">AGTStudioCo</text>
  <text x="922" y="1385" text-anchor="end" fill="#77716a" font-family="Arial, sans-serif" font-size="18">1000 × 1500</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.status(200).send(svg);
}
