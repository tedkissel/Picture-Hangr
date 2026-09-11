import { framesOverlap, fromNumber, isInside, measure, rotatedSize, toNumber } from "./geometry.ts";
import type { FrameInstance, WallProject } from "./project.ts";

export type ArrangementStyle = "symmetrical" | "grid" | "organic" | "equal" | "compact";

type Rect = { x: number; y: number; width: number; height: number };
type Placed = { frame: FrameInstance; x: number; y: number };

function sizeOf(project: WallProject, frame: FrameInstance) {
  const type = project.frameTypes.find((candidate) => candidate.id === frame.typeId);
  if (!type) throw new Error(`Missing frame type ${frame.typeId}`);
  const size = rotatedSize({ x: frame.x, y: frame.y, width: type.width, height: type.height, rotation: frame.rotation });
  return { width: toNumber(size.width), height: toNumber(size.height) };
}

function packRows(project: WallProject, frames: FrameInstance[], region: Rect, gap: number, style: ArrangementStyle): Placed[] | null {
  if (!frames.length) return [];
  const candidates: { placed: Placed[]; score: number }[] = [];
  const preferredColumns = style === "compact" ? Math.ceil(Math.sqrt(frames.length * 1.5)) : Math.ceil(Math.sqrt(frames.length));

  for (let columns = 1; columns <= frames.length; columns++) {
    const rows: FrameInstance[][] = [];
    for (let index = 0; index < frames.length; index += columns) rows.push(frames.slice(index, index + columns));
    const rowWidths = rows.map((row) => row.reduce((sum, frame) => sum + sizeOf(project, frame).width, 0) + gap * Math.max(0, row.length - 1));
    const rowHeights = rows.map((row) => Math.max(...row.map((frame) => sizeOf(project, frame).height)));
    const blockWidth = Math.max(...rowWidths);
    const blockHeight = rowHeights.reduce((sum, height) => sum + height, 0) + gap * Math.max(0, rows.length - 1);
    if (blockWidth > region.width + 1e-8 || blockHeight > region.height + 1e-8) continue;

    const placed: Placed[] = [];
    let y = region.y + (region.height - blockHeight) / 2;
    rows.forEach((row, rowIndex) => {
      let x = region.x + (region.width - rowWidths[rowIndex]) / 2;
      row.forEach((frame) => {
        const size = sizeOf(project, frame);
        placed.push({ frame, x, y: y + (rowHeights[rowIndex] - size.height) / 2 });
        x += size.width + gap;
      });
      y += rowHeights[rowIndex] + gap;
    });
    const waste = region.width * region.height - blockWidth * blockHeight;
    const score = Math.abs(columns - preferredColumns) * 1000 + waste;
    candidates.push({ placed, score });
  }
  return candidates.sort((a, b) => a.score - b.score)[0]?.placed ?? null;
}

function galleryPack(project: WallProject, frames: FrameInstance[], region: Rect, gap: number, style: ArrangementStyle): Placed[] | null {
  if (!frames.length) return [];
  const sorted = [...frames].sort((a, b) => {
    const aa = sizeOf(project, a), bb = sizeOf(project, b);
    return bb.width * bb.height - aa.width * aa.height;
  });
  const anchor = sorted[0];
  const anchorSize = sizeOf(project, anchor);
  if (anchorSize.width > region.width || anchorSize.height > region.height) return null;

  const anchorX = region.x + (region.width - anchorSize.width) / 2;
  const anchorY = region.y + (region.height - anchorSize.height) / 2;
  const sideWidth = (region.width - anchorSize.width) / 2 - gap;
  if (sideWidth <= 0 && sorted.length > 1) return null;

  const left: FrameInstance[] = [];
  const right: FrameInstance[] = [];
  let leftArea = 0, rightArea = 0;
  sorted.slice(1).forEach((frame) => {
    const size = sizeOf(project, frame);
    if (leftArea <= rightArea) { left.push(frame); leftArea += size.width * size.height; }
    else { right.push(frame); rightArea += size.width * size.height; }
  });

  const leftPlaced = packRows(project, left, { x: region.x, y: region.y, width: sideWidth, height: region.height }, gap, style);
  const rightPlaced = packRows(project, right, { x: anchorX + anchorSize.width + gap, y: region.y, width: sideWidth, height: region.height }, gap, style);
  if (!leftPlaced || !rightPlaced) return null;
  return [{ frame: anchor, x: anchorX, y: anchorY }, ...leftPlaced, ...rightPlaced];
}

export function autoArrange(project: WallProject, style: ArrangementStyle): FrameInstance[] {
  if (!project.frames.length) return [];
  const target: Rect = project.target.enabled
    ? { x: toNumber(project.target.x), y: toNumber(project.target.y), width: toNumber(project.target.width), height: toNumber(project.target.height) }
    : { x: 0, y: 0, width: toNumber(project.wall.width), height: toNumber(project.wall.height) };
  const wall: Rect = { x: 0, y: 0, width: toNumber(project.wall.width), height: toNumber(project.wall.height) };
  const gap = style === "compact" ? 0.5 : style === "equal" ? 1 : 0.75;
  const ordered = style === "grid" || style === "equal" ? [...project.frames] : [...project.frames].sort((a, b) => sizeOf(project, b).height - sizeOf(project, a).height);

  // Prefer the requested shape, then a gallery pack in the target, and finally
  // use the full wall. Every successful strategy uses explicit frame bounds.
  const placed = (style === "symmetrical" || style === "organic" ? galleryPack(project, ordered, target, gap, style) : packRows(project, ordered, target, gap, style))
    ?? galleryPack(project, ordered, target, gap, style)
    ?? packRows(project, ordered, wall, gap, style)
    ?? galleryPack(project, ordered, wall, Math.min(gap, 0.25), style);

  if (!placed) return project.frames;
  const positions = new Map(placed.map((item) => [item.frame.id, item]));
  return project.frames.map((frame) => {
    const position = positions.get(frame.id);
    return position ? { ...frame, x: fromNumber(position.x), y: fromNumber(position.y) } : frame;
  });
}

export function arrangementIsValid(project: WallProject, frames: FrameInstance[]) {
  for (let index = 0; index < frames.length; index++) {
    const type = project.frameTypes.find((candidate) => candidate.id === frames[index].typeId);
    if (!type) return false;
    const current = { ...frames[index], width: type.width, height: type.height };
    if (!isInside(current, { x: measure(0), y: measure(0), ...project.wall })) return false;
    for (let other = index + 1; other < frames.length; other++) {
      const otherType = project.frameTypes.find((candidate) => candidate.id === frames[other].typeId);
      if (!otherType || framesOverlap(current, { ...frames[other], width: otherType.width, height: otherType.height })) return false;
    }
  }
  return true;
}
