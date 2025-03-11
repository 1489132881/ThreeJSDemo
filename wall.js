import { is3DMode, toggle3DMode, convert2Dto3D } from './wall3D.js'

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

let isDrawing = false
let startPoint = null
let currentPreview = null
const walls = [] // 存储所有已绘制的墙体
let continuousDrawing = false // 添加一个标记来追踪是否继续绘制

// 鼠标按下：开始绘制
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect()

  // 右键点击，完全断开绘制
  if (e.button === 2) { // 2 表示右键
    startPoint = null
    currentPreview = null
    isDrawing = false
    redrawCanvas()
    return
  }

  // 只有在没有起点的情况下才设置新的起点
  if (!startPoint) {
    const x = snapToGrid(e.clientX - rect.left)
    const y = snapToGrid(e.clientY - rect.top)
    startPoint = { x, y }
    isDrawing = true
  }
})

// 鼠标移动：实时绘制预览线
canvas.addEventListener('mousemove', (e) => {
  if (!startPoint) return // 如果没有起点就返回

  const rect = canvas.getBoundingClientRect()
  const shiftKeyPressed = e.shiftKey

  let endX = snapToGrid(e.clientX - rect.left)
  let endY = snapToGrid(e.clientY - rect.top)

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
    walls.push(currentPreview)
    startPoint = currentPreview.end // 将终点设置为下一次绘制的起点
    currentPreview = null
    isDrawing = false
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
  console.log(walls.points)
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
  const is2D = !toggle3DMode(walls)
  if (is2D) {
    redrawCanvas()
  }
})

// 监听墙体高度变化
document.getElementById('wallHeight').addEventListener('input', () => {
  if (is3DMode) {
    convert2Dto3D(walls)
  }
})
