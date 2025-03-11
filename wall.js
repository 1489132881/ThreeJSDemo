import { is3DMode, toggle3DMode, convert2Dto3D } from './wall3D.js'
import { calculateExtendedIntersection1, calculateExtendedIntersection2 } from './supply.js'
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

let isDrawing = false
let startPoint = null
let currentPreview = null
const walls = [] // 存储所有已绘制的墙体
let continuousDrawing = false // 添加一个标记来追踪是否继续绘制

// 添加鼠标位置追踪
let mousePos = { x: 0, y: 0 }

// 添加一个新变量来控制是否显示连线
let showDistanceLine = true

// 添加一个新变量来单独控制墙体测量线的显示
let showWallMeasurement = true

const wallCorners = [] // 用于存储所有墙角信息

let currentWalls = [] // 用于存储当前绘制的墙体

function saveWallCorner(corner) {
  wallCorners.push(corner)
}

function drawAndSaveWallCorners(wall1, wall2) {
  const result1 = calculateExtendedIntersection1(wall1, wall2)
  const result2 = calculateExtendedIntersection2(wall1, wall2)

  // 设置填充颜色
  ctx.fillStyle = '#ddd' // 假设墙1和墙2有相同的颜色属性

  // 绘制并保存第一个墙角
  ctx.beginPath()
  ctx.moveTo(result1.line1End.x, result1.line1End.y)
  ctx.lineTo(result1.intersection.x, result1.intersection.y)
  ctx.lineTo(result1.line2Start.x, result1.line2Start.y)
  ctx.lineTo(wall1.end.x, wall1.end.y)
  ctx.closePath()
  ctx.fill()

  saveWallCorner({
    points: [
      { x: result1.line1End.x, y: result1.line1End.y },
      { x: result1.intersection.x, y: result1.intersection.y },
      { x: result1.line2Start.x, y: result1.line2Start.y },
      { x: wall1.end.x, y: wall1.end.y }
    ]
  })

  // 绘制并保存第二个墙角
  ctx.beginPath()
  ctx.moveTo(result2.line1End.x, result2.line1End.y)
  ctx.lineTo(result2.intersection.x, result2.intersection.y)
  ctx.lineTo(result2.line2Start.x, result2.line2Start.y)
  ctx.lineTo(wall1.end.x, wall1.end.y)
  ctx.closePath()
  ctx.fill()

  saveWallCorner({
    points: [
      { x: result2.line1End.x, y: result2.line1End.y },
      { x: result2.intersection.x, y: result2.intersection.y },
      { x: result2.line2Start.x, y: result2.line2Start.y },
      { x: wall1.end.x, y: wall1.end.y }
    ]
  })
}

// 鼠标按下：开始绘制
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect()

  // 右键点击，完全断开绘制
  if (e.button === 2) { // 2 表示右键
    startPoint = null
    currentPreview = null
    isDrawing = false
    showDistanceLine = false  // 只控制点到点的距离线，不影响墙体测量线

    // 将当前墙体添加到总墙体数组中
    walls.push(...currentWalls)
    currentWalls = [] // 重置当前墙体数组
    redrawCanvas()
    return
  }

  // 左键点击时恢复显示连线
  if (e.button === 0) { // 0 表示左键
    showDistanceLine = true

    // 只有在没有起点的情况下才设置新的起点
    if (!startPoint) {
      const x = snapToGrid(e.clientX - rect.left)
      const y = snapToGrid(e.clientY - rect.top)
      startPoint = { x, y }
      isDrawing = true
    }
  }
})

// 鼠标移动：实时绘制预览线
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  mousePos.x = e.clientX - rect.left
  mousePos.y = e.clientY - rect.top

  if (!startPoint) return // 如果没有起点就返回

  const shiftKeyPressed = e.shiftKey

  // 更新：使用实际鼠标位置而不是网格对齐的位置来计算预览线
  let endX = e.clientX - rect.left
  let endY = e.clientY - rect.top

  if (shiftKeyPressed) {
    const dx = endX - startPoint.x
    const dy = endY - startPoint.y
    if (Math.abs(dx) > Math.abs(dy)) {
      endY = startPoint.y
    } else {
      endX = startPoint.x
    }
  }

  currentPreview = calculateWall(startPoint, { x: endX, y: endY })
  redrawCanvas()
})

// 鼠标释放：保存墙体
canvas.addEventListener('mouseup', (e) => {
  if (e.button === 2) return // 忽略右键释放

  if (currentPreview) {
    currentWalls.push(currentPreview)
    walls.push(...currentWalls)
    startPoint = currentPreview.end // 将终点设置为下一次绘制的起点
    currentPreview = null
    isDrawing = false

    // 保存墙角信息
    if (currentWalls.length >= 2) {
      const wall1 = currentWalls[currentWalls.length - 2]
      const wall2 = currentWalls[currentWalls.length - 1]
      drawAndSaveWallCorners(wall1, wall2)
    }

    redrawCanvas()
  }
})

// 添加右键菜单禁用
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault() // 阻止默认的右键菜单
})

function calculateWall(start, end) {
  const thickness = Number(document.getElementById('wallThickness').value)
  const length = Number(document.getElementById('wallLength').value)

  // 计算向量方向
  const dx = end.x - start.x
  const dy = end.y - start.y
  const angle = Math.atan2(dy, dx)

  // 使用指定的长度计算新的终点
  const newEnd = length ? {
    x: start.x + length * Math.cos(angle),
    y: start.y + length * Math.sin(angle)
  } : { ...end }

  // 墙体的四个顶点坐标
  const halfThickness = thickness / 2
  const offsetX = halfThickness * Math.sin(-angle)
  const offsetY = halfThickness * Math.cos(angle)

  let points = [
    { x: start.x - offsetX, y: start.y - offsetY },
    { x: start.x + offsetX, y: start.y + offsetY },
    { x: newEnd.x + offsetX, y: newEnd.y + offsetY },
    { x: newEnd.x - offsetX, y: newEnd.y - offsetY },
  ]

  return {
    start: { ...start },
    end: newEnd,
    thickness,
    angle,
    points
  }
}

function isPointNearLine(point, lineStart, lineEnd, threshold = 10) {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y

  const dot = A * C + B * D
  const len_sq = C * C + D * D

  // 如果线段长度为0，直接返回到起点的距离
  if (len_sq === 0) return Math.sqrt(A * A + B * B)

  let param = dot / len_sq

  // 找到线段上最近的点
  let xx, yy

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * C
    yy = lineStart.y + param * D
  }

  const dx = point.x - xx
  const dy = point.y - yy
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance <= threshold
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制已完成的墙体
  walls.forEach(wall => {
    ctx.fillStyle = '#ddd'
    ctx.beginPath()
    wall.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.closePath()
    ctx.fill()

    // 移除对 showDistanceLine 的依赖，只要鼠标在墙体附近就显示测量线
    if (isPointNearLine(mousePos, wall.start, wall.end)) {
      // 添加墙体测量线
      const length = Math.sqrt(
        Math.pow(wall.end.x - wall.start.x, 2) +
        Math.pow(wall.end.y - wall.start.y, 2)
      ).toFixed(2)

      // 设置测量线样式
      ctx.strokeStyle = '#666'
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 1

      // 计算测量线的偏移位置（垂直于墙体）
      const offsetDistance = 10
      const offsetX = offsetDistance * Math.sin(-wall.angle)
      const offsetY = offsetDistance * Math.cos(wall.angle)

      // 绘制测量线
      ctx.beginPath()
      ctx.moveTo(wall.start.x - offsetX, wall.start.y - offsetY)
      ctx.lineTo(wall.end.x - offsetX, wall.end.y - offsetY)
      ctx.stroke()

      // 绘制测量线两端的短线
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(wall.start.x, wall.start.y)
      ctx.lineTo(wall.start.x - offsetX, wall.start.y - offsetY)
      ctx.moveTo(wall.end.x, wall.end.y)
      ctx.lineTo(wall.end.x - offsetX, wall.end.y - offsetY)
      ctx.stroke()

      // 添加尺寸文本
      ctx.fillStyle = 'black'
      ctx.font = '14px Arial'
      const midX = (wall.start.x + wall.end.x) / 2 - offsetX
      const midY = (wall.start.y + wall.end.y) / 2 - offsetY
      ctx.fillText(`${length}px`, midX, midY)
    }
  })

  // 绘制所有墙角
  wallCorners.forEach(corner => {
    ctx.fillStyle = '#ddd'
    ctx.beginPath()
    corner.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.closePath()
    ctx.fill()
  })

  // 绘制预览线
  if (currentPreview) {
    ctx.strokeStyle = 'blue'
    ctx.beginPath()
    ctx.moveTo(currentPreview.start.x, currentPreview.start.y)
    ctx.lineTo(currentPreview.end.x, currentPreview.end.y)
    ctx.stroke()

    // 计算并显示当前线条长度
    const length = Math.sqrt(
      Math.pow(currentPreview.end.x - currentPreview.start.x, 2) +
      Math.pow(currentPreview.end.y - currentPreview.start.y, 2)
    ).toFixed(2)

    ctx.fillStyle = 'black'
    ctx.font = '16px Arial'
    const midX = (currentPreview.start.x + currentPreview.end.x) / 2
    const midY = (currentPreview.start.y + currentPreview.end.y) / 2
    ctx.fillText(`${length}px`, midX, midY)
  }

  // 如果有起点且不在绘制中，显示起点标记
  if (startPoint && !isDrawing) {
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(startPoint.x, startPoint.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // 计算并显示鼠标到最近顶点的距离
  if (showDistanceLine) {
    let nearestPoint = null
    let minDistance = Infinity

    walls.forEach(wall => {
      // 检查墙体的起点和终点
      const points = [wall.start, wall.end]
      points.forEach(point => {
        const distance = Math.sqrt(
          Math.pow(mousePos.x - point.x, 2) +
          Math.pow(mousePos.y - point.y, 2)
        )
        if (distance < minDistance) {
          minDistance = distance
          nearestPoint = point
        }
      })
    })

    // 如果找到最近的点，绘制测量线
    if (nearestPoint) {
      // 设置测量线样式
      ctx.strokeStyle = '#2196F3'
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 1

      // 绘制从鼠标到最近点的连线
      ctx.beginPath()
      ctx.moveTo(mousePos.x, mousePos.y)
      ctx.lineTo(nearestPoint.x, nearestPoint.y)
      ctx.stroke()

      // 重置虚线设置
      ctx.setLineDash([])

      // 显示距离文本
      const distance = Math.sqrt(
        Math.pow(mousePos.x - nearestPoint.x, 2) +
        Math.pow(mousePos.y - nearestPoint.y, 2)
      ).toFixed(0)

      // 计算文本位置（在线的中间）
      const textX = (mousePos.x + nearestPoint.x) / 2
      const textY = (mousePos.y + nearestPoint.y) / 2 - 10

      // 绘制文本背景
      ctx.fillStyle = 'white'
      ctx.fillRect(textX - 20, textY - 15, 40, 20)

      // 绘制距离文本
      ctx.fillStyle = '#2196F3'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${distance}px`, textX, textY)
    }
  }
}

document.getElementById('wallThickness').addEventListener('input', () => {
  if (currentPreview) {
    currentPreview = calculateWall(startPoint, currentPreview.end)
    redrawCanvas()
  }
})

function snapToGrid(value) {
  const gridSize = 50 // 网格单位：50像素（对应实际尺寸如 500mm）
  return Math.round(value / gridSize) * gridSize
}

// 添加3D切换按钮事件监听
document.getElementById('toggle3d').addEventListener('click', () => {
  const lengthInfo = document.getElementById('length-info')
  const is2D = !toggle3DMode(walls, wallCorners)
  if (is2D) {
    redrawCanvas()
    lengthInfo.style.display = 'block'
  } else {
    lengthInfo.style.display = 'none'
  }
})

// 监听墙体高度变化
document.getElementById('wallHeight').addEventListener('input', () => {
  if (is3DMode) {
    convert2Dto3D(walls)
  }
})
