export function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

export function fmtDate(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
}

// Deterministic decorative grid — not a scannable QR, purely visual for the
// prototype's checkout step.
export function renderFakeQr(seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const size = 9;
  const cell = 12;
  let rects = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isAnchor = (x < 2 && y < 2) || (x > size - 3 && y < 2) || (x < 2 && y > size - 3);
      if (isAnchor || rand() > 0.52) {
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell - 2}" height="${cell - 2}" fill="#111827"/>`;
      }
    }
  }
  return `<svg width="${size * cell}" height="${size * cell}" viewBox="0 0 ${size * cell} ${size * cell}">${rects}</svg>`;
}
