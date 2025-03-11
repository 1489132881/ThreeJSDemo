export function calculateExtendedIntersection1(wall1, wall2) {
  // 计算墙1的外侧线
  const offset1X = wall1.thickness / 2 * Math.sin(-wall1.angle)
  const offset1Y = wall1.thickness / 2 * Math.cos(wall1.angle)
  const line1Start = { x: wall1.start.x + offset1X, y: wall1.start.y + offset1Y }
  const line1End = { x: wall1.end.x + offset1X, y: wall1.end.y + offset1Y }

  // 计算墙2的外侧线
  const offset2X = wall2.thickness / 2 * Math.sin(-wall2.angle)
  const offset2Y = wall2.thickness / 2 * Math.cos(wall2.angle)
  const line2Start = { x: wall2.start.x + offset2X, y: wall2.start.y + offset2Y }
  const line2End = { x: wall2.end.x + offset2X, y: wall2.end.y + offset2Y }

  // 计算交点
  const intersection = calculateLineIntersection(line1Start, line1End, line2Start, line2End)

  return {
    line1End,
    line2Start,
    intersection
  }
}

// 用于计算另一侧，墙1和墙2的外侧线都在另一侧了
export function calculateExtendedIntersection2(wall1, wall2) {
  // 计算墙1的外侧线
  const offset1X = -wall1.thickness / 2 * Math.sin(-wall1.angle)
  const offset1Y = -wall1.thickness / 2 * Math.cos(wall1.angle)
  const line1Start = { x: wall1.start.x + offset1X, y: wall1.start.y + offset1Y }
  const line1End = { x: wall1.end.x + offset1X, y: wall1.end.y + offset1Y }

  // 计算墙2的外侧线
  const offset2X = -wall2.thickness / 2 * Math.sin(-wall2.angle)
  const offset2Y = -wall2.thickness / 2 * Math.cos(wall2.angle)
  const line2Start = { x: wall2.start.x + offset2X, y: wall2.start.y + offset2Y }
  const line2End = { x: wall2.end.x + offset2X, y: wall2.end.y + offset2Y }

  // 计算交点
  const intersection = calculateLineIntersection(line1Start, line1End, line2Start, line2End)

  return {
    line1End,
    line2Start,
    intersection
  }
}


// 计算两条线的交点
function calculateLineIntersection(p1, p2, p3, p4) {
  const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
  if (denominator === 0) return null // 平行或重合

  const x = ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / denominator
  const y = ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / denominator

  return { x, y }
}

// 计算两墙的交点
export function findIntersection(wall1, wall2) {
  const { start: p1, end: p2 } = wall1
  const { start: p3, end: p4 } = wall2

  const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)

  // 如果分母为0，说明两条线段平行或重合
  if (denominator === 0) return null

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denominator

  // 检查 t 和 u 是否在 [0, 1] 范围内
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    // 计算交点坐标
    const intersectionX = p1.x + t * (p2.x - p1.x)
    const intersectionY = p1.y + t * (p2.y - p1.y)
    return { x: intersectionX, y: intersectionY }
  }

  return null
}


