/**
 * UUID v7 — time-ordered UUID using millisecond Unix timestamp.
 * RFC draft: https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.txt
 */
function uuidv7() {
  const now = BigInt(Date.now());

  // 48-bit timestamp (ms)
  const tsMsHigh = (now >> 16n) & 0xffffffffn;
  const tsMsLow  = now & 0xffffn;

  // 12 random bits (ver=7 nibble + 12 rand bits)
  const randA = (BigInt(Math.floor(Math.random() * 0x1000)));
  // 62 random bits (var=10 + 62 bits)
  const randB = BigInt(Math.floor(Math.random() * 0x3fffffffffffffff));

  const high =
    (tsMsHigh << 32n) |
    (tsMsLow  << 16n) |
    (0x7000n)         |   // version 7
    randA;

  const low =
    (0x8000000000000000n) | // variant 10xx
    randB;

  function hex(val, len) {
    return val.toString(16).padStart(len, '0');
  }

  const h = hex(high, 16);
  const l = hex(low,  16);

  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    l.slice(0, 4),
    l.slice(4),
  ].join('-');
}

module.exports = { uuidv7 };
