import type {
  AnchorDirection,
  CanvasBlock,
  HoveredCanvasTarget,
  XYPosition,
} from '../../../state/types';

export const RUNWAY_OFFSET = 50;
export const LIVE_DIR_AXIS_HYSTERESIS = 20;
export const LIVE_DIR_SIGN_HYSTERESIS = 12;
export const LIVE_POINTER_SMOOTHING = 0.28;
export const LIVE_POINTER_SETTLE_EPSILON = 0.4;

const BLOCK_WIDTH = 256;
const BLOCK_HEIGHT = 128;
const HALF_BLOCK_WIDTH = 128;
const HALF_BLOCK_HEIGHT = 64;
const ARROWHEAD_OFFSET = 18;

export function getBlockCanvasOrigin(
  block: CanvasBlock,
  index: number,
): XYPosition {
  return {
    x: block.position?.x ?? 100 + index * 20,
    y: block.position?.y ?? 100 + index * 20,
  };
}

export function getAnchorPoint(
  origin: XYPosition,
  direction: AnchorDirection,
): XYPosition {
  if (direction === 'top') {
    return { x: origin.x + HALF_BLOCK_WIDTH, y: origin.y };
  }
  if (direction === 'bottom') {
    return { x: origin.x + HALF_BLOCK_WIDTH, y: origin.y + BLOCK_HEIGHT };
  }
  if (direction === 'left') {
    return { x: origin.x, y: origin.y + HALF_BLOCK_HEIGHT };
  }
  return { x: origin.x + BLOCK_WIDTH, y: origin.y + HALF_BLOCK_HEIGHT };
}

export function getArrowTipPoint(
  anchor: XYPosition,
  direction: AnchorDirection,
): XYPosition {
  if (direction === 'top') {
    return { x: anchor.x, y: anchor.y - ARROWHEAD_OFFSET };
  }
  if (direction === 'bottom') {
    return { x: anchor.x, y: anchor.y + ARROWHEAD_OFFSET };
  }
  if (direction === 'left') {
    return { x: anchor.x - ARROWHEAD_OFFSET, y: anchor.y };
  }
  return { x: anchor.x + ARROWHEAD_OFFSET, y: anchor.y };
}

export function inferTargetDirection(
  deltaX: number,
  deltaY: number,
  sourceDirection: AnchorDirection,
): AnchorDirection {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const preferredAxis =
    sourceDirection === 'left' || sourceDirection === 'right'
      ? 'horizontal'
      : 'vertical';

  let axis: 'horizontal' | 'vertical' = preferredAxis;
  if (absX > absY + LIVE_DIR_AXIS_HYSTERESIS) {
    axis = 'horizontal';
  } else if (absY > absX + LIVE_DIR_AXIS_HYSTERESIS) {
    axis = 'vertical';
  }

  if (axis === 'horizontal') {
    if (Math.abs(deltaX) <= LIVE_DIR_SIGN_HYSTERESIS) {
      return sourceDirection === 'right' ? 'left' : 'right';
    }
    return deltaX >= 0 ? 'left' : 'right';
  }

  if (Math.abs(deltaY) <= LIVE_DIR_SIGN_HYSTERESIS) {
    return sourceDirection === 'top' ? 'bottom' : 'top';
  }
  return deltaY >= 0 ? 'top' : 'bottom';
}

export function getHoveredAnchorPoint(
  hoveredTarget: HoveredCanvasTarget | null,
  blocks: CanvasBlock[],
): XYPosition | null {
  if (!hoveredTarget) return null;

  const hoveredBlock = blocks.find(
    (block) => block.id === hoveredTarget.blockId,
  );
  if (!hoveredBlock) return null;

  const hoveredIndex = blocks.indexOf(hoveredBlock);
  const hoveredOrigin = getBlockCanvasOrigin(hoveredBlock, hoveredIndex);
  return getAnchorPoint(hoveredOrigin, hoveredTarget.direction);
}
