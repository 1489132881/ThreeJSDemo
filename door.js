import { walls } from './wall.js'
// 添加门和门框
const doorWidth = Number(document.getElementById('doorWidth').value) || 50
const doorHeight = Number(document.getElementById('wallHeight').value) - 20 || 80
const doorThickness = Number(document.getElementById('wallThickness').value) || 10
let isDrawingDoor = false
let doors = []

// 添加门按钮事件监听
document.getElementById('drawDoor').addEventListener('click', () => {
  // 如果有墙体才可以添加门
  if (walls.length > 0) {
    addDoor()
  }
})


function addDoor() {
  isDrawingDoor = !isDrawingDoor
  const button = document.getElementById('drawDoor')
  if (isDrawingDoor) {
    button.classList.add('active')
  } else {
    button.classList.remove('active')
  }
}

// 获取最近的墙体以及鼠标到墙体的垂点坐标（门的起点）
function findNearestWallAndDoorStartPoint(x, y) {
  let nearestWall = walls[0]
  let minDistance = 9999999999
  let doorStartPoint = null
  let doorEndPoint = null

  walls.forEach(wall => {
    const { distance, footOfPerpendicular, endPoint } = getFootOfPerpendicular(x, y, wall.start.x, wall.start.y, wall.end.x, wall.end.y)
    if (distance < minDistance) {
      minDistance = distance
      nearestWall = wall
      doorStartPoint = footOfPerpendicular
      doorEndPoint = endPoint
    }
  })

  return { nearestWall, doorStartPoint, doorEndPoint, minDistance }
}

// 限制绘制只能在线段内
function isInSegment(x1, x2, x3, x4) {
  // 判断点是否在线段上
  if ((x3 < x1 && x1 < x2 && x2 < x4) ||
    (x3 < x2 && x2 < x1 && x1 < x4) ||
    (x4 < x1 && x1 < x2 && x2 < x3) ||
    (x4 < x2 && x2 < x1 && x1 < x3)) {
    return true
  } else {
    return false
  }
}

// 绘制门框（矩形）
function drawDoor(startPoint, endPoint, ctx) {

  // 矩形的左右中心坐标和长度厚度
  const leftCenter = startPoint
  const rightCenter = endPoint

  // 计算矩形的倾斜角度
  const angle = Math.atan2(rightCenter.y - leftCenter.y, rightCenter.x - leftCenter.x)

  // 计算矩形的四个顶点坐标
  const topLeft = {
    x: leftCenter.x - doorThickness / 2 * Math.sin(angle),
    y: leftCenter.y + doorThickness / 2 * Math.cos(angle)
  }
  const topRight = {
    x: rightCenter.x - doorThickness / 2 * Math.sin(angle),
    y: rightCenter.y + doorThickness / 2 * Math.cos(angle)
  }
  const bottomLeft = {
    x: leftCenter.x + doorThickness / 2 * Math.sin(angle),
    y: leftCenter.y - doorThickness / 2 * Math.cos(angle)
  }
  const bottomRight = {
    x: rightCenter.x + doorThickness / 2 * Math.sin(angle),
    y: rightCenter.y - doorThickness / 2 * Math.cos(angle)
  }

  console.log('矩形四个顶点坐标', topLeft, topRight, bottomLeft, bottomRight)

  // 计算矩形中间的竖线坐标
  const middleLeft = { x: (topLeft.x + topRight.x) / 2, y: (topLeft.y + topRight.y) / 2 }
  const middleRight = { x: (bottomLeft.x + bottomRight.x) / 2, y: (bottomLeft.y + bottomRight.y) / 2 }


  // 绘制矩形 矩形中间有根竖线
  ctx.fillStyle = '#aaa' // 填充颜色
  ctx.beginPath()
  ctx.moveTo(topLeft.x, topLeft.y)
  ctx.lineTo(topRight.x, topRight.y)
  ctx.lineTo(bottomRight.x, bottomRight.y)
  ctx.lineTo(bottomLeft.x, bottomLeft.y)
  ctx.closePath()
  ctx.fill()

  // 绘制竖线
  ctx.beginPath()
  ctx.moveTo(middleLeft.x, middleLeft.y)
  ctx.lineTo(middleRight.x, middleRight.y)
  ctx.stroke()

  // 绘制边框
  ctx.strokeStyle = '#000000' // 边框颜色
  ctx.stroke()

  // 保存门框
  doors.push({
    start: startPoint,
    end: endPoint,
    points: [topLeft, topRight, bottomRight, bottomLeft],
    middle: [middleLeft, middleRight],
    width: doorWidth,
    height: doorHeight
  })

  return {
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    middleLeft,
    middleRight
  }
}

// 根据鼠标坐标和墙体坐标计算垂点坐标和距离
function getFootOfPerpendicular(mouseX, mouseY, x1, y1, x2, y2) {
  // 计算线段的方向向量
  const dx = x2 - x1
  const dy = y2 - y1

  // 计算线段的长度
  const lineLength = Math.sqrt(dx * dx + dy * dy)

  // 计算单位向量
  const unitVector = {
    x: dx / lineLength,
    y: dy / lineLength
  }

  // 计算点到线段起点的向量
  const vector = {
    x: mouseX - x1,
    y: mouseY - y1
  }

  // 计算投影长度
  const projectionLength = vector.x * unitVector.x + vector.y * unitVector.y

  // 计算垂点坐标（矩形门框的起点）
  const footOfPerpendicular = {
    x: x1 + projectionLength * unitVector.x,
    y: y1 + projectionLength * unitVector.y
  }

  // 已知宽度，计算终点坐标
  const endPoint = {
    x: footOfPerpendicular.x + doorWidth * unitVector.x,
    y: footOfPerpendicular.y + doorWidth * unitVector.y
  }

  // 计算垂点到 (mouseX, mouseY) 的距离
  const distance = Math.sqrt(
    (mouseX - footOfPerpendicular.x) ** 2 +
    (mouseY - footOfPerpendicular.y) ** 2
  )

  return {
    footOfPerpendicular,
    distance,
    endPoint
  }
}

export {
  isDrawingDoor,
  findNearestWallAndDoorStartPoint,
  isInSegment,
  drawDoor,
  doors
}


