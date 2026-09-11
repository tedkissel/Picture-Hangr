import { measure, parseMeasurement } from "./geometry.ts";
import type { HangerPoint, Measure, OriginKind, Precision } from "./geometry.ts";

export type HangerType = "Keyhole" | "Sawtooth" | "D-ring" | "Triangle ring" | "Fixed hook" | "Wire" | "Two-point" | "Custom";
export type FrameType = { id: string; name: string; width: Measure; height: Measure; hangerType: HangerType; hangers: HangerPoint[]; notes?: string };
export type FrameInstance = { id: string; label: string; typeId: string; x: Measure; y: Measure; rotation: 0 | 90; locked?: boolean; image?: string };
export type WallProject = {
  name: string;
  wall: { width: Measure; height: Measure };
  target: { enabled: boolean; x: Measure; y: Measure; width: Measure; height: Measure };
  origin: { kind: OriginKind; customX: Measure; customY: Measure };
  precision: Precision;
  frameTypes: FrameType[];
  frames: FrameInstance[];
};

const m = (value: string | number) => typeof value === "number" ? measure(value) : parseMeasurement(value);
const hp = (id: string, x: string, y: string, label?: string): HangerPoint => ({ id, x: m(x), y: m(y), label });

export const sampleProject: WallProject = {
  name: "Gallery wall study",
  wall: { width: m(72), height: m(42) },
  target: { enabled: true, x: m(6), y: m(6), width: m(60), height: m(30) },
  origin: { kind: "top-left", customX: m(0), customY: m(0) },
  precision: "1/16",
  frameTypes: [
    { id: "character", name: "CHARACTER", width: m("8-5/8"), height: m("11-3/16"), hangerType: "Keyhole", hangers: [hp("c-h1", "4-5/16", "3/4")] },
    { id: "game", name: "GAME", width: m("9-5/16"), height: m("11-5/16"), hangerType: "Sawtooth", hangers: [hp("g-h1", "4-83/128", "13/32")] },
    { id: "zelda", name: "ZELDA", width: m("15-1/16"), height: m("19-1/8"), hangerType: "Two-point", hangers: [hp("z-h1", "3-11/16", "19/64", "Left nail"), hp("z-h2", "11-3/8", "19/64", "Right nail")] },
  ],
  frames: [
    { id: "c1", label: "Upper Character 1", typeId: "character", x: m(8), y: m("6-1/2"), rotation: 0 },
    { id: "c2", label: "Upper Character 2", typeId: "character", x: m(19), y: m("6-1/2"), rotation: 0 },
    { id: "c3", label: "Upper Character 3", typeId: "character", x: m("44-3/8"), y: m("6-1/2"), rotation: 0 },
    { id: "c4", label: "Upper Character 4", typeId: "character", x: m("55-3/8"), y: m("6-1/2"), rotation: 0 },
    { id: "g1", label: "Left Game", typeId: "game", x: m(7), y: m("24-1/2"), rotation: 0 },
    { id: "c5", label: "Lower Character 1", typeId: "character", x: m("18-3/4"), y: m("24-1/2"), rotation: 0 },
    { id: "c6", label: "Lower Character 2", typeId: "character", x: m("44-5/8"), y: m("24-1/2"), rotation: 0 },
    { id: "g2", label: "Right Game", typeId: "game", x: m("55-11/16"), y: m("24-1/2"), rotation: 0 },
    { id: "z1", label: "Zelda", typeId: "zelda", x: m("28-15/32"), y: m("11-1/2"), rotation: 0 },
  ],
};

export const cloneProject = (project: WallProject): WallProject => JSON.parse(JSON.stringify(project));
