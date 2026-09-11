import test from "node:test";
import assert from "node:assert/strict";
import { arrangementIsValid, autoArrange, type ArrangementStyle } from "../lib/arrange.ts";
import { frameBounds, framesOverlap, isInside, measure } from "../lib/geometry.ts";
import { sampleProject } from "../lib/project.ts";

const styles: ArrangementStyle[] = ["symmetrical", "grid", "organic", "equal", "compact"];

for (const style of styles) {
  test(`${style} auto-arrange never overlaps frames`, () => {
    const frames = autoArrange(sampleProject, style);
    assert.equal(arrangementIsValid(sampleProject, frames), true);
    for (let left = 0; left < frames.length; left++) {
      const leftType = sampleProject.frameTypes.find((type) => type.id === frames[left].typeId)!;
      const leftGeometry = { ...frames[left], width: leftType.width, height: leftType.height };
      assert.equal(isInside(leftGeometry, { x: measure(0), y: measure(0), ...sampleProject.wall }), true);
      for (let right = left + 1; right < frames.length; right++) {
        const rightType = sampleProject.frameTypes.find((type) => type.id === frames[right].typeId)!;
        assert.equal(framesOverlap(leftGeometry, { ...frames[right], width: rightType.width, height: rightType.height }), false, `${frames[left].label} overlaps ${frames[right].label}`);
      }
      assert.ok(frameBounds(leftGeometry).width.n > 0);
    }
  });
}
