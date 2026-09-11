import test from "node:test";
import assert from "node:assert/strict";
import {
  formatMeasurement, frameBounds, hangerOnWall, isInside, measure,
  originPoint, parseMeasurement, relativeToOrigin, spacing, toNumber,
} from "../lib/geometry.ts";
import { sampleProject } from "../lib/project.ts";

const equal = (actual: { n: number; d: number }, expected: { n: number; d: number }) => assert.deepEqual(actual, expected);

test("parses decimals, fractions, spaces, mixed fractions, and inch marks", () => {
  ["8 5/8", "8-5/8", "8 5/8\"", "8.625"].forEach((value) => equal(parseMeasurement(value), measure(69, 8)));
  equal(parseMeasurement("83/128"), measure(83, 128));
  equal(parseMeasurement("4-83/128"), measure(595, 128));
});

test("formats exact fractions and rounds to tape-measure precision", () => {
  assert.equal(formatMeasurement(measure(595, 128), "exact"), "4-83/128″");
  assert.equal(formatMeasurement(measure(595, 128), "1/16"), "4-5/8″");
  assert.equal(formatMeasurement(measure(-19, 8), "exact"), "−2-3/8″");
});

test("calculates a fixed hanger coordinate from frame position", () => {
  const nail = hangerOnWall({ x: measure(8), y: measure(13, 2), width: measure(69, 8), height: measure(179, 16), rotation: 0 }, { id: "h", x: measure(69, 16), y: measure(3, 4) });
  equal(nail.x, measure(197, 16)); equal(nail.y, measure(29, 4));
});

test("calculates every point for a multiple-hanger frame", () => {
  const frame = { x: measure(455, 16), y: measure(23, 2), width: measure(241, 16), height: measure(153, 8), rotation: 0 as const };
  const points = [{ id: "l", x: measure(59, 16), y: measure(19, 64) }, { id: "r", x: measure(91, 8), y: measure(19, 64) }].map((hanger) => hangerOnWall(frame, hanger));
  equal(points[0].x, measure(257, 8)); equal(points[1].x, measure(637, 16));
});

test("transforms hanger coordinates for a 90 degree clockwise rotation", () => {
  const nail = hangerOnWall({ x: measure(10), y: measure(5), width: measure(8), height: measure(12), rotation: 90 }, { id: "h", x: measure(2), y: measure(3) });
  equal(nail.x, measure(19)); equal(nail.y, measure(7));
});

test("recalculates coordinates from alternate origins", () => {
  const wallW = measure(72), wallH = measure(42), nail = { x: measure(50), y: measure(10) };
  assert.deepEqual(relativeToOrigin(nail, originPoint("top-center", wallW, wallH)), { x: measure(14), y: measure(10) });
  assert.deepEqual(relativeToOrigin(nail, originPoint("top-right", wallW, wallH)), { x: measure(-22), y: measure(10) });
  assert.deepEqual(relativeToOrigin(nail, originPoint("center", wallW, wallH)), { x: measure(14), y: measure(-11) });
});

test("checks rotated layout bounds", () => {
  const frame = { x: measure(60), y: measure(28), width: measure(14), height: measure(10), rotation: 90 as const };
  assert.equal(isInside(frame, { x: measure(0), y: measure(0), width: measure(72), height: measure(42) }), true);
  equal(frameBounds(frame).right, measure(70));
});

test("calculates edge gaps and center distance", () => {
  const a = { x: measure(0), y: measure(0), width: measure(8), height: measure(10), rotation: 0 as const };
  const b = { x: measure(10), y: measure(0), width: measure(8), height: measure(10), rotation: 0 as const };
  const result = spacing(a, b);
  equal(result.horizontalGap, measure(2)); equal(result.verticalGap, measure(0)); assert.equal(toNumber(result.centerDistance), 10);
});

test("verifies every nail in the preloaded sample project", () => {
  const expected = ["12-5/16″","23-5/16″","48-11/16″","59-11/16″","11-83/128″","23-1/16″","48-15/16″","60-43/128″","32-5/32″","39-27/32″"];
  const actual = sampleProject.frames.flatMap((frame) => {
    const type = sampleProject.frameTypes.find((item) => item.id === frame.typeId)!;
    return type.hangers.map((hanger) => formatMeasurement(hangerOnWall({ x: frame.x, y: frame.y, width: type.width, height: type.height, rotation: frame.rotation }, hanger).x, "exact"));
  });
  assert.deepEqual(actual, expected);
  const zeldaType = sampleProject.frameTypes.find((type) => type.id === "zelda")!;
  const zelda = sampleProject.frames.find((frame) => frame.id === "z1")!;
  assert.deepEqual(zeldaType.hangers.map((hanger) => formatMeasurement(hangerOnWall({ x: zelda.x, y: zelda.y, width: zeldaType.width, height: zeldaType.height, rotation: zelda.rotation }, hanger).y, "exact")), ["11-51/64″", "11-51/64″"]);
});
