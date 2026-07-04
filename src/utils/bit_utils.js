
export function makeWord(b1, b2) {
    return (b1 << 8) + b2;
}
export function word2nibbles(w) {
  return [(w >> 8) & 0xFF, w & 0xFF];
}
export function getSigned(b) {
    return b & 0x80 ? b-256 : b;
}
export function getBit(b, i) {
    return (b >> i) & 1;
}
export function toChar(b) {
  return String.fromCharCode(b || 0x10000);
}
export function toHexStr(b) {
  return `0x${b.toString(16)}`;
}
export function parseByte(byte, masks) {
  const res = {};
  masks.forEach(({ name, i, mapping }) => {
    res[name] = byte & (1 << i) ? 1 : 0;
    if (mapping) res[name] = mapping[res[name]];
  });
  return res;
}
