/** Каркасные многогранники для полигональной графики: фон по краям и пыль в первом экране */

export type V3 = [number, number, number];
export interface Mesh {
  v: V3[];
  e: Array<[number, number]>;
}

/** Рёбра — пары вершин на минимальном расстоянии друг от друга */
function mesh(v: V3[]): Mesh {
  const len = Math.hypot(...v[0]!);
  const norm = v.map((p) => p.map((c) => c / len) as V3);
  let min = Infinity;
  const d = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 0; i < norm.length; i++) for (let j = i + 1; j < norm.length; j++) min = Math.min(min, d(norm[i]!, norm[j]!));
  const e: Mesh['e'] = [];
  for (let i = 0; i < norm.length; i++)
    for (let j = i + 1; j < norm.length; j++) if (d(norm[i]!, norm[j]!) < min * 1.01) e.push([i, j]);
  return { v: norm, e };
}

const PHI = (1 + Math.sqrt(5)) / 2;
export const MESHES: Mesh[] = [
  mesh([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]),
  mesh([
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]),
  mesh(
    [
      [0, 1, PHI],
      [0, 1, -PHI],
      [0, -1, PHI],
      [0, -1, -PHI],
      [1, PHI, 0],
      [1, -PHI, 0],
      [-1, PHI, 0],
      [-1, -PHI, 0],
      [PHI, 0, 1],
      [PHI, 0, -1],
      [-PHI, 0, 1],
      [-PHI, 0, -1],
    ] as V3[],
  ),
];

/** Поворот точки по трём осям (углы в радианах) */
export function rotate([vx, vy, vz]: V3, [ax, ay, az]: V3): V3 {
  const ca = Math.cos(ax);
  const sa = Math.sin(ax);
  const cb = Math.cos(ay);
  const sb = Math.sin(ay);
  const cc = Math.cos(az);
  const sc = Math.sin(az);
  let y1 = vy * ca - vz * sa;
  let z1 = vy * sa + vz * ca;
  const x2 = vx * cb + z1 * sb;
  z1 = -vx * sb + z1 * cb;
  const x3 = x2 * cc - y1 * sc;
  y1 = x2 * sc + y1 * cc;
  return [x3, y1, z1];
}
