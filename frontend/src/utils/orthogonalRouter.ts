import type { AnchorDirection, CanvasBlock, XYPosition } from '../state/types';

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const CARD_WIDTH = 256;
const CARD_HEIGHT = 128;
const OBSTACLE_PADDING = 16;
const GRID_MARGIN = 32;
const TURN_PENALTY = 100;
const EPSILON = 0.1;

function getRunwayPoint(
  base: XYPosition,
  direction: AnchorDirection,
  offset: number,
): XYPosition {
  const pt = { ...base };
  if (direction === 'top') pt.y -= offset;
  else if (direction === 'bottom') pt.y += offset;
  else if (direction === 'left') pt.x -= offset;
  else if (direction === 'right') pt.x += offset;
  return pt;
}

function createBlockBoxes(allBlocks: CanvasBlock[]): BoundingBox[] {
  return allBlocks
    .filter((block): block is CanvasBlock & { position: XYPosition } =>
      Boolean(block.position),
    )
    .map((block) => ({
      id: block.id,
      x: block.position.x,
      y: block.position.y,
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
    }));
}

function inflateBox(box: BoundingBox, padding = OBSTACLE_PADDING): BoundingBox {
  return {
    ...box,
    x: box.x - padding,
    y: box.y - padding,
    w: box.w + padding * 2,
    h: box.h + padding * 2,
  };
}

function isPointInsideBox(point: XYPosition, box: BoundingBox): boolean {
  return (
    point.x > box.x + EPSILON &&
    point.x < box.x + box.w - EPSILON &&
    point.y > box.y + EPSILON &&
    point.y < box.y + box.h - EPSILON
  );
}

function segmentHitsObstacle(
  a: XYPosition,
  b: XYPosition,
  box: BoundingBox,
): boolean {
  if (Math.abs(a.x - b.x) < EPSILON) {
    const x = a.x;
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    const overlapsX = x > box.x + EPSILON && x < box.x + box.w - EPSILON;
    const overlapsY = maxY > box.y + EPSILON && minY < box.y + box.h - EPSILON;
    return overlapsX && overlapsY;
  }

  if (Math.abs(a.y - b.y) < EPSILON) {
    const y = a.y;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const overlapsY = y > box.y + EPSILON && y < box.y + box.h - EPSILON;
    const overlapsX = maxX > box.x + EPSILON && minX < box.x + box.w - EPSILON;
    return overlapsY && overlapsX;
  }

  return false;
}

function dedupeAndSimplify(points: XYPosition[]): XYPosition[] {
  if (points.length <= 2) return points;

  const deduped = points.filter((point, index) => {
    if (index === 0) return true;
    const prev = points[index - 1];
    return (
      Math.abs(point.x - prev.x) > EPSILON ||
      Math.abs(point.y - prev.y) > EPSILON
    );
  });

  if (deduped.length <= 2) return deduped;

  const simplified: XYPosition[] = [deduped[0]];
  for (let i = 1; i < deduped.length - 1; i += 1) {
    const prev = simplified[simplified.length - 1];
    const current = deduped[i];
    const next = deduped[i + 1];
    const sameX =
      Math.abs(prev.x - current.x) < EPSILON &&
      Math.abs(current.x - next.x) < EPSILON;
    const sameY =
      Math.abs(prev.y - current.y) < EPSILON &&
      Math.abs(current.y - next.y) < EPSILON;
    if (!sameX && !sameY) simplified.push(current);
  }
  simplified.push(deduped[deduped.length - 1]);

  return simplified;
}

function generateSVGPath(points: XYPosition[]): string {
  const cleanPoints = dedupeAndSimplify(points);

  return cleanPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

function getBounds(points: XYPosition[], obstacles: BoundingBox[]) {
  const allX = [
    ...points.map((p) => p.x),
    ...obstacles.flatMap((o) => [o.x, o.x + o.w]),
  ];
  const allY = [
    ...points.map((p) => p.y),
    ...obstacles.flatMap((o) => [o.y, o.y + o.h]),
  ];

  return {
    minX: Math.min(...allX) - GRID_MARGIN,
    maxX: Math.max(...allX) + GRID_MARGIN,
    minY: Math.min(...allY) - GRID_MARGIN,
    maxY: Math.max(...allY) + GRID_MARGIN,
  };
}

interface RouteNode extends XYPosition {
  id: number;
}

type AxisDirection = 'none' | 'horizontal' | 'vertical';

function buildRouteGraphNodes(
  sourceRunway: XYPosition,
  targetRunway: XYPosition,
  start: XYPosition,
  end: XYPosition,
  obstacles: BoundingBox[],
): RouteNode[] {
  const bounds = getBounds([sourceRunway, targetRunway, start, end], obstacles);

  const xSet = new Set<number>([
    sourceRunway.x,
    targetRunway.x,
    start.x,
    end.x,
    bounds.minX,
    bounds.maxX,
  ]);
  const ySet = new Set<number>([
    sourceRunway.y,
    targetRunway.y,
    start.y,
    end.y,
    bounds.minY,
    bounds.maxY,
  ]);

  for (const box of obstacles) {
    xSet.add(box.x);
    xSet.add(box.x + box.w);
    ySet.add(box.y);
    ySet.add(box.y + box.h);
  }

  const xValues = [...xSet];
  const yValues = [...ySet];
  const nodes: RouteNode[] = [];

  for (const x of xValues) {
    for (const y of yValues) {
      const point = { x, y };
      const blocked = obstacles.some((box) => isPointInsideBox(point, box));
      if (!blocked) {
        nodes.push({ id: nodes.length, x, y });
      }
    }
  }

  return nodes;
}

function isSegmentClear(
  a: XYPosition,
  b: XYPosition,
  obstacles: BoundingBox[],
): boolean {
  if (Math.abs(a.x - b.x) > EPSILON && Math.abs(a.y - b.y) > EPSILON) {
    return false;
  }

  return !obstacles.some((box) => segmentHitsObstacle(a, b, box));
}

function buildAdjacency(
  nodes: RouteNode[],
  obstacles: BoundingBox[],
): Map<number, number[]> {
  const adjacency = new Map<number, number[]>();
  for (const node of nodes) adjacency.set(node.id, []);

  const byX = new Map<number, RouteNode[]>();
  const byY = new Map<number, RouteNode[]>();

  for (const node of nodes) {
    if (!byX.has(node.x)) byX.set(node.x, []);
    if (!byY.has(node.y)) byY.set(node.y, []);
    byX.get(node.x)!.push(node);
    byY.get(node.y)!.push(node);
  }

  for (const list of byX.values()) {
    list.sort((a, b) => a.y - b.y);
    for (let i = 0; i < list.length - 1; i += 1) {
      const current = list[i];
      const next = list[i + 1];
      if (isSegmentClear(current, next, obstacles)) {
        adjacency.get(current.id)!.push(next.id);
        adjacency.get(next.id)!.push(current.id);
      }
    }
  }

  for (const list of byY.values()) {
    list.sort((a, b) => a.x - b.x);
    for (let i = 0; i < list.length - 1; i += 1) {
      const current = list[i];
      const next = list[i + 1];
      if (isSegmentClear(current, next, obstacles)) {
        adjacency.get(current.id)!.push(next.id);
        adjacency.get(next.id)!.push(current.id);
      }
    }
  }

  return adjacency;
}

function segmentDirection(a: XYPosition, b: XYPosition): AxisDirection {
  if (Math.abs(a.x - b.x) < EPSILON) return 'vertical';
  if (Math.abs(a.y - b.y) < EPSILON) return 'horizontal';
  return 'none';
}

function findNodeId(nodes: RouteNode[], point: XYPosition): number {
  const node = nodes.find(
    (n) =>
      Math.abs(n.x - point.x) < EPSILON && Math.abs(n.y - point.y) < EPSILON,
  );
  return node?.id ?? -1;
}

function reconstructPath(
  parent: Map<string, string>,
  nodes: RouteNode[],
  endKey: string,
): XYPosition[] {
  const path: XYPosition[] = [];
  let currentKey: string | undefined = endKey;

  while (currentKey) {
    const [nodeIdRaw] = currentKey.split('|');
    const nodeId = Number(nodeIdRaw);
    const node = nodes[nodeId];
    path.push({ x: node.x, y: node.y });
    currentKey = parent.get(currentKey);
  }

  path.reverse();
  return path;
}

function findOrthogonalPath(
  sourceRunway: XYPosition,
  targetRunway: XYPosition,
  obstacles: BoundingBox[],
  start: XYPosition,
  end: XYPosition,
): XYPosition[] | null {
  if (isSegmentClear(sourceRunway, targetRunway, obstacles)) {
    return [sourceRunway, targetRunway];
  }

  const nodes = buildRouteGraphNodes(
    sourceRunway,
    targetRunway,
    start,
    end,
    obstacles,
  );
  const startId = findNodeId(nodes, sourceRunway);
  const targetId = findNodeId(nodes, targetRunway);

  if (startId < 0 || targetId < 0) return null;

  const adjacency = buildAdjacency(nodes, obstacles);
  const distances = new Map<string, number>();
  const parent = new Map<string, string>();
  const open: Array<{
    key: string;
    nodeId: number;
    dir: AxisDirection;
    cost: number;
  }> = [];

  const startKey = `${startId}|none`;
  distances.set(startKey, 0);
  open.push({ key: startKey, nodeId: startId, dir: 'none', cost: 0 });

  const popLowest = () => {
    let bestIndex = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (open[i].cost < open[bestIndex].cost) bestIndex = i;
    }
    return open.splice(bestIndex, 1)[0];
  };

  let bestEndKey: string | null = null;
  let bestEndCost = Number.POSITIVE_INFINITY;

  while (open.length > 0) {
    const current = popLowest();
    const knownCost = distances.get(current.key);
    if (knownCost === undefined || current.cost > knownCost + EPSILON) continue;

    if (current.nodeId === targetId && current.cost < bestEndCost) {
      bestEndCost = current.cost;
      bestEndKey = current.key;
    }

    const neighbors = adjacency.get(current.nodeId) ?? [];
    for (const nextId of neighbors) {
      const a = nodes[current.nodeId];
      const b = nodes[nextId];
      const moveDir = segmentDirection(a, b);
      if (moveDir === 'none') continue;

      const segmentLength = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const turnCost =
        current.dir !== 'none' && current.dir !== moveDir ? TURN_PENALTY : 0;
      const nextCost = current.cost + segmentLength + turnCost;

      const nextKey = `${nextId}|${moveDir}`;
      const prevBest = distances.get(nextKey);
      if (prevBest === undefined || nextCost + EPSILON < prevBest) {
        distances.set(nextKey, nextCost);
        parent.set(nextKey, current.key);
        open.push({
          key: nextKey,
          nodeId: nextId,
          dir: moveDir,
          cost: nextCost,
        });
      }
    }
  }

  if (!bestEndKey) return null;
  return reconstructPath(parent, nodes, bestEndKey);
}

function fallbackPath(
  sourceRunway: XYPosition,
  targetRunway: XYPosition,
): XYPosition[] {
  const horizontalFirst = [
    sourceRunway,
    { x: targetRunway.x, y: sourceRunway.y },
    targetRunway,
  ];
  const verticalFirst = [
    sourceRunway,
    { x: sourceRunway.x, y: targetRunway.y },
    targetRunway,
  ];

  const hLen =
    Math.abs(horizontalFirst[0].x - horizontalFirst[1].x) +
    Math.abs(horizontalFirst[1].y - horizontalFirst[2].y);
  const vLen =
    Math.abs(verticalFirst[0].y - verticalFirst[1].y) +
    Math.abs(verticalFirst[1].x - verticalFirst[2].x);

  return hLen <= vLen ? horizontalFirst : verticalFirst;
}

export function routeConnection(
  start: XYPosition,
  end: XYPosition,
  sourceDir: AnchorDirection,
  targetDir: AnchorDirection,
  allBlocks: CanvasBlock[],
  _sourceId: string,
  _targetId: string,
  runwayOffset = 40,
  tipX?: number,
  tipY?: number,
): string {
  const finalPoint = { x: tipX ?? end.x, y: tipY ?? end.y };
  const sourceRunway = getRunwayPoint(start, sourceDir, runwayOffset);
  const targetRunway = getRunwayPoint(end, targetDir, runwayOffset);

  // Keep all cards as obstacles for the core route. The only allowed card crossings
  // are the explicit anchor legs we append: start->sourceRunway and targetRunway->end.
  const obstacles = createBlockBoxes(allBlocks).map((box) => inflateBox(box));

  const routedCore =
    findOrthogonalPath(sourceRunway, targetRunway, obstacles, start, end) ??
    fallbackPath(sourceRunway, targetRunway);

  const fullPath = [start, ...routedCore, end, finalPoint];
  return generateSVGPath(fullPath);
}
