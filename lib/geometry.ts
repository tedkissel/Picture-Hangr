export type Measure = { n: number; d: number };

export type HangerPoint = { id: string; x: Measure; y: Measure; label?: string };
export type FrameGeometry = {
  x: Measure;
  y: Measure;
  width: Measure;
  height: Measure;
  rotation: 0 | 90;
};
export type OriginKind = "top-left" | "top-center" | "top-right" | "center" | "custom";
export type Precision = "1/4" | "1/8" | "1/16" | "1/32" | "exact";

const gcd = (a: number, b: number): number => {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export function measure(n: number, d = 1): Measure {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) throw new Error("Invalid measurement");
  const sign = d < 0 ? -1 : 1;
  const divisor = gcd(n, d);
  return { n: (Math.round(n) * sign) / divisor, d: Math.abs(Math.round(d)) / divisor };
}

export const fromNumber = (value: number, denominator = 1024) => measure(Math.round(value * denominator), denominator);
export const toNumber = (value: Measure) => value.n / value.d;
export const add = (a: Measure, b: Measure) => measure(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Measure, b: Measure) => measure(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Measure, b: Measure) => measure(a.n * b.n, a.d * b.d);
export const div = (a: Measure, b: Measure) => measure(a.n * b.d, a.d * b.n);
export const abs = (a: Measure) => measure(Math.abs(a.n), a.d);

export function parseMeasurement(raw: string): Measure {
  const input = raw.trim().replace(/["″]/g, "").replace(/\s+/g, " ");
  if (!input) throw new Error("Enter a measurement");
  const mixed = input.match(/^([+-]?\d+)\s*(?:-|\s)\s*(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (!denominator || numerator >= denominator) throw new Error("Invalid fraction");
    const sign = whole < 0 ? -1 : 1;
    return measure(whole * denominator + sign * numerator, denominator);
  }
  const fraction = input.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (!denominator) throw new Error("Invalid fraction");
    return measure(Number(fraction[1]), denominator);
  }
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(input)) {
    if (!input.includes(".")) return measure(Number(input));
    const sign = input.startsWith("-") ? -1 : 1;
    const unsigned = input.replace(/^[+-]/, "");
    const [whole, decimal = ""] = unsigned.split(".");
    return measure(sign * (Number(whole || 0) * 10 ** decimal.length + Number(decimal || 0)), 10 ** decimal.length);
  }
  throw new Error(`Could not read “${raw}”`);
}

function roundTo(value: Measure, denominator: number) {
  return measure(Math.round(toNumber(value) * denominator), denominator);
}

export function formatMeasurement(value: Measure, precision: Precision = "1/16", unit = true): string {
  const denominators: Record<Exclude<Precision, "exact">, number> = { "1/4": 4, "1/8": 8, "1/16": 16, "1/32": 32 };
  const rounded = precision === "exact" ? value : roundTo(value, denominators[precision]);
  const sign = rounded.n < 0 ? "−" : "";
  const numerator = Math.abs(rounded.n);
  const whole = Math.floor(numerator / rounded.d);
  const remainder = numerator % rounded.d;
  const body = remainder ? `${whole ? `${whole}-` : ""}${remainder}/${rounded.d}` : `${whole}`;
  return `${sign}${body}${unit ? "″" : ""}`;
}

export const rotatedSize = (frame: FrameGeometry) => frame.rotation === 90
  ? { width: frame.height, height: frame.width }
  : { width: frame.width, height: frame.height };

export function hangerOnWall(frame: FrameGeometry, hanger: HangerPoint) {
  if (frame.rotation === 0) return { x: add(frame.x, hanger.x), y: add(frame.y, hanger.y) };
  return {
    x: add(frame.x, sub(frame.height, hanger.y)),
    y: add(frame.y, hanger.x),
  };
}

export function originPoint(kind: OriginKind, wallWidth: Measure, wallHeight: Measure, custom?: { x: Measure; y: Measure }) {
  const half = measure(1, 2);
  if (kind === "top-center") return { x: mul(wallWidth, half), y: measure(0) };
  if (kind === "top-right") return { x: wallWidth, y: measure(0) };
  if (kind === "center") return { x: mul(wallWidth, half), y: mul(wallHeight, half) };
  if (kind === "custom" && custom) return custom;
  return { x: measure(0), y: measure(0) };
}

export function relativeToOrigin(point: { x: Measure; y: Measure }, origin: { x: Measure; y: Measure }) {
  return { x: sub(point.x, origin.x), y: sub(point.y, origin.y) };
}

export function frameBounds(frame: FrameGeometry) {
  const size = rotatedSize(frame);
  return { left: frame.x, top: frame.y, right: add(frame.x, size.width), bottom: add(frame.y, size.height), ...size };
}

export function isInside(frame: FrameGeometry, bounds: { x: Measure; y: Measure; width: Measure; height: Measure }) {
  const f = frameBounds(frame);
  return toNumber(f.left) >= toNumber(bounds.x) && toNumber(f.top) >= toNumber(bounds.y)
    && toNumber(f.right) <= toNumber(add(bounds.x, bounds.width))
    && toNumber(f.bottom) <= toNumber(add(bounds.y, bounds.height));
}

export function framesOverlap(a: FrameGeometry, b: FrameGeometry) {
  const aa = frameBounds(a); const bb = frameBounds(b);
  return toNumber(aa.left) < toNumber(bb.right) && toNumber(aa.right) > toNumber(bb.left)
    && toNumber(aa.top) < toNumber(bb.bottom) && toNumber(aa.bottom) > toNumber(bb.top);
}

export function spacing(a: FrameGeometry, b: FrameGeometry) {
  const aa = frameBounds(a); const bb = frameBounds(b);
  const horizontalGap = Math.max(0, Math.max(toNumber(bb.left) - toNumber(aa.right), toNumber(aa.left) - toNumber(bb.right)));
  const verticalGap = Math.max(0, Math.max(toNumber(bb.top) - toNumber(aa.bottom), toNumber(aa.top) - toNumber(bb.bottom)));
  const ax = (toNumber(aa.left) + toNumber(aa.right)) / 2;
  const ay = (toNumber(aa.top) + toNumber(aa.bottom)) / 2;
  const bx = (toNumber(bb.left) + toNumber(bb.right)) / 2;
  const by = (toNumber(bb.top) + toNumber(bb.bottom)) / 2;
  return {
    horizontalGap: fromNumber(horizontalGap),
    verticalGap: fromNumber(verticalGap),
    centerDistance: fromNumber(Math.hypot(bx - ax, by - ay)),
  };
}
