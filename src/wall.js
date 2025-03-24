import { is3DMode, toggle3DMode, convert2Dto3D } from './wall3D.js'
import { calculateExtendedIntersection1, calculateExtendedIntersection2, findIntersection } from './supply.js'
import { isDrawingDoor, drawDoor, doors, findNearestWallAndDoorStartPoint, isInSegment } from './door.js'
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

let isDrawing = false
let startPoint = null
let currentPreview = null
export const walls = [] // 存储所有已绘制的墙体

// 添加鼠标位置追踪
let mousePos = { x: 0, y: 0 }

// 添加一个新变量来控制是否显示连线
let showDistanceLine = true

export const wallCorners = [] // 用于存储所有墙角信息

let currentWalls = [] // 用于存储当前绘制的墙体


function saveWallCorner(corner) {
  wallCorners.push(corner)
}

function drawAndSaveWallCorners1(wall1, wall2) {
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

function drawAndSaveWallCorners2(existingWall, newWall) {
  const result1 = calculateExtendedIntersection1(existingWall, newWall)
  const result2 = calculateExtendedIntersection2(existingWall, newWall)

  // 设置填充颜色
  ctx.fillStyle = '#ddd' // 假设墙1和墙2有相同的颜色属性

  // 绘制并保存第一种墙角
  ctx.beginPath()
  ctx.moveTo(result1.line1Start.x, result1.line1Start.y)
  ctx.lineTo(result1.intersection.x, result1.intersection.y)
  ctx.lineTo(result1.line2End.x, result1.line2End.y)
  ctx.lineTo(existingWall.start.x, existingWall.start.y)

  ctx.closePath()
  ctx.fill()


  saveWallCorner({
    points: [
      { x: result1.line1Start.x, y: result1.line1Start.y },
      { x: result1.intersection.x, y: result1.intersection.y },
      { x: result1.line2End.x, y: result1.line2End.y },
      { x: existingWall.start.x, y: existingWall.start.y }
    ]
  })

  // 绘制并保存第二种墙角
  ctx.beginPath()
  ctx.moveTo(result2.line1Start.x, result2.line1Start.y)
  ctx.lineTo(result2.intersection.x, result2.intersection.y)
  ctx.lineTo(result2.line2End.x, result2.line2End.y)
  ctx.lineTo(existingWall.start.x, existingWall.start.y)

  ctx.closePath()
  ctx.fill()


  saveWallCorner({
    points: [
      { x: result2.line1Start.x, y: result2.line1Start.y },
      { x: result2.intersection.x, y: result2.intersection.y },
      { x: result2.line2End.x, y: result2.line2End.y },
      { x: existingWall.start.x, y: existingWall.start.y }
    ]
  })
}

// 鼠标按下：开始绘制
canvas.addEventListener('mousedown', (e) => {
  if (isDrawingDoor) {
    return
  }
  const rect = canvas.getBoundingClientRect()

  // 右键点击，完全断开绘制
  if (e.button === 2) { // 2 表示右键
    startPoint = null
    currentPreview = null
    isDrawing = false
    showDistanceLine = false  // 只控制点到点的距离线，不影响墙体测量线

    // 将当前墙体添加到总墙体数组中
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

function snapToNearestWallEnd(point, walls, threshold = 50) {
  let nearestPoint = point
  let minDistance = threshold

  walls.forEach(wall => {
    const endpoints = [wall.start, wall.end]
    endpoints.forEach(endpoint => {
      const distance = Math.sqrt(
        Math.pow(point.x - endpoint.x, 2) + Math.pow(point.y - endpoint.y, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestPoint = endpoint
      }
    })
  })

  return nearestPoint
}

// 鼠标移动：实时绘制预览线
canvas.addEventListener('mousemove', (e) => {
  if (isDrawingDoor) {
    return
  }
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

  // 自动吸附到最近的墙体终点
  const snappedEnd = snapToNearestWallEnd({ x: endX, y: endY }, walls)

  currentPreview = calculateWall(startPoint, snappedEnd)

  redrawCanvas()
})

// 鼠标释放：保存墙体
canvas.addEventListener('mouseup', (e) => {
  if (e.button === 2) return // 忽略右键释放

  if (currentPreview) {
    currentWalls.push(currentPreview)
    walls.push(currentPreview)
    console.log('walls', walls)
    startPoint = currentPreview.end // 将终点设置为下一次绘制的起点
    currentPreview = null
    isDrawing = false

    // 保存墙角信息
    if (currentWalls.length >= 2) {
      const wall1 = currentWalls[currentWalls.length - 2]
      const wall2 = currentWalls[currentWalls.length - 1]
      drawAndSaveWallCorners1(wall1, wall2)

      // 检查新墙体与所有现有墙体的相交情况
      const newWall = currentWalls[currentWalls.length - 1]
      walls.forEach(existingWall => {
        if (existingWall !== newWall && existingWall !== currentWalls[currentWalls.length - 2]) {
          const intersection = findIntersection(newWall, existingWall)
          // 如果交点等于existingWall的起点或newWall的终点，则绘制墙角
          if (intersection && intersection.x === existingWall.start.x && intersection.y === existingWall.start.y && intersection.x === newWall.end.x && intersection.y === newWall.end.y) {
            drawAndSaveWallCorners2(existingWall, newWall)
          }
        }
      })
    }



    redrawCanvas()
  }

  // 绘制所有门
  if (isDrawingDoor) {
    const rect = canvas.getBoundingClientRect()
    // 查找距离鼠标现在在画布上的最近的墙体
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const { nearestWall, doorStartPoint, doorEndPoint, minDistance } = findNearestWallAndDoorStartPoint(mouseX, mouseY)
    if (isInSegment(doorStartPoint.x, doorEndPoint.x, nearestWall.start.x, nearestWall.end.x, doorStartPoint.y, doorEndPoint.y, nearestWall.start.y, nearestWall.end.y) && minDistance < 100) {
      drawDoor(doorStartPoint, doorEndPoint, ctx, nearestWall.thickness * 1.2) // 只在墙体上绘制门

    }
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
    points,
    wallLength: length ? length : Math.sqrt(dx * dx + dy * dy)
  }
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
    const offsetDistance = wall.thickness
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

    // 文本平行于墙体
    const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x)
    // 如果角度超过90度，就再加180度
    const adjustedAngle = angle > Math.PI / 2 ? angle + Math.PI : angle < -Math.PI / 2 ? angle - Math.PI : angle

    ctx.save() // 保存当前状态
    angle > 0
    const textX = midX - 10
    const textY = midY - 10
    ctx.translate(textX, textY) // 移动到文本中心
    ctx.rotate(adjustedAngle) // 旋转文本
    ctx.fillText(`${length}px`, 0, 0) // 绘制文本
    ctx.restore() // 恢复状态

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

  // 绘制所有门
  doors.forEach(door => {
    // 绘制矩形 矩形中间有根竖线
    ctx.fillStyle = '#aaa' // 填充颜色
    ctx.beginPath()
    ctx.moveTo(door.points[0].x, door.points[0].y)
    ctx.lineTo(door.points[1].x, door.points[1].y)
    ctx.lineTo(door.points[2].x, door.points[2].y)
    ctx.lineTo(door.points[3].x, door.points[3].y)
    ctx.closePath()
    ctx.fill()

    // 绘制竖线
    ctx.beginPath()
    ctx.moveTo(door.middle[0].x, door.middle[0].y)
    ctx.lineTo(door.middle[1].x, door.middle[1].y)
    ctx.stroke()

    // 绘制边框
    ctx.strokeStyle = '#000000' // 边框颜色
    ctx.stroke()
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
  const is2D = !toggle3DMode(walls, wallCorners, doors)
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
