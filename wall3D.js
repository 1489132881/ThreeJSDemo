// 导入 Three.js 相关模块
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ThreeBSP } from 'imports-loader?THREE=three!threebsp'
// 3D场景相关变量
let scene, camera, renderer, controls
let is3DMode = false

// 初始化3D场景
function init3DScene() {
  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xFFFFFF)

  const canvas3d = document.getElementById('canvas3d')
  const width = 1500 // 新的宽度
  const height = 800 // 保持高度

  // 更新canvas尺寸
  canvas3d.width = width
  canvas3d.height = height

  // 调整相机位置和视角
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000)
  camera.position.set(750, 1150, 750) // 调整相机位置到中心点上方
  camera.lookAt(750, 0, 400)         // 看向画布中心

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: canvas3d,
    antialias: true // 添加抗锯齿
  })
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true

  // 添加轨道控制器并设置限制
  controls = new OrbitControls(camera, renderer.domElement)

  // 启用阻尼效果，使移动更平滑
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // 启用平移
  controls.enablePan = true         // 启用平移（拖动）
  controls.panSpeed = 1.0           // 平移速度
  controls.screenSpacePanning = true // 使平移始终跟随屏幕空间

  // 设置缩放限制
  controls.minDistance = 100        // 最小缩放距离
  controls.maxDistance = 3000       // 最大缩放距离

  // 设置垂直旋转角度限制
  controls.minPolarAngle = 0        // 最小仰角
  controls.maxPolarAngle = Math.PI / 2 // 最大仰角（90度）

  // 设置初始目标点
  controls.target.set(750, 0, 400)

  // 添加环境光和定向光
  const ambientLight = new THREE.AmbientLight(0x404040, 1)
  scene.add(ambientLight)

  // 主光源
  const mainLight = new THREE.DirectionalLight(0xffffff, 1)
  mainLight.position.set(1500, 1500, 1500)
  mainLight.castShadow = true

  mainLight.shadow.camera.left = -1500
  mainLight.shadow.camera.right = 1500
  mainLight.shadow.camera.top = 1500
  mainLight.shadow.camera.bottom = -1500
  mainLight.shadow.camera.far = 3000

  scene.add(mainLight)

  // 添加网格辅助线
  const gridHelper = new THREE.GridHelper(1500, 60, 0xf5f5f5, 0xF0F0F0)
  gridHelper.position.set(750, 0, 400) // 网格中心对齐画布中心
  scene.add(gridHelper)

  // 添加地面
  const groundGeometry = new THREE.PlaneGeometry(1500, 1500)
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(750, -0.1, 400) // 地面中心对齐画布中心
  ground.receiveShadow = true
  scene.add(ground)

  // 添加辅助坐标轴（可选，帮助调试）
  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)
}

// 将2D墙体转换为3D模型
function createWall3D(wall, doors) {
  const wallHeight = Number(document.getElementById('wallHeight').value) || 100
  const shape = new THREE.Shape()
  const gridSize = 50 // 网格大小

  // 调整坐标到画布中心
  function transformPoint(x, y) {
    const centeredX = x - gridSize / 2
    const centeredY = y - gridSize / 2
    return {
      x: 750 - centeredX - 700,
      y: 400 - centeredY - 400
    }
  }

  // 转换所有点的坐标
  const transformedPoints = wall.points.map(point =>
    transformPoint(point.x, point.y)
  )

  // 创建形状
  shape.moveTo(transformedPoints[0].x, transformedPoints[0].y)
  transformedPoints.forEach((point, i) => {
    if (i > 0) shape.lineTo(point.x, point.y)
  })
  shape.lineTo(transformedPoints[0].x, transformedPoints[0].y)

  // 拉伸设置
  const extrudeSettings = {
    steps: 1,
    depth: wallHeight,
    bevelEnabled: false
  }

  // 创建几何体和材质
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  const material = new THREE.MeshPhongMaterial({
    color: 0xe0e0e0,
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide,
  })

  // 创建墙体网格
  const wallMesh = new THREE.Mesh(geometry, material)
  wallMesh.position.y = wallHeight
  wallMesh.rotation.x = Math.PI / 2
  wallMesh.rotation.z = Math.PI

  // 使用 ThreeBSP 处理门洞
  let wallBSP = new ThreeBSP(wallMesh)

  // 为每个门创建 BSP 对象并从墙体中减去
  doors.forEach(door => {
    const leftTop = transformPoint(door.points[0].x, door.points[0].y)
    const rightTop = transformPoint(door.points[1].x, door.points[1].y)
    const rightBottom = transformPoint(door.points[2].x, door.points[2].y)
    const leftBottom = transformPoint(door.points[3].x, door.points[3].y)

    // 计算门的宽度和高度
    const width = Math.sqrt(
      Math.pow(rightTop.x - leftTop.x, 2) +
      Math.pow(rightTop.y - leftTop.y, 2)
    )
    const height = wallHeight * 0.8 // 门高度设为墙高的80%

    // 创建门的几何体
    const doorGeometry = new THREE.BoxGeometry(width, height, wallHeight * 0.3)
    const doorMesh = new THREE.Mesh(doorGeometry)

    // 设置门的位置
    const centerX = (leftTop.x + rightTop.x) / 2
    const centerY = (leftTop.y + rightTop.y) / 2
    doorMesh.position.set(centerX, wallHeight / 2, centerY)

    // 计算门的旋转角度
    const angle = Math.atan2(rightTop.y - leftTop.y, rightTop.x - leftTop.x)
    doorMesh.rotation.y = angle

    // 从墙体中减去门
    const doorBSP = new ThreeBSP(doorMesh)
    wallBSP = wallBSP.subtract(doorBSP)
  })

  // 转换回 Mesh
  const resultMesh = wallBSP.toMesh()
  resultMesh.material = material
  resultMesh.castShadow = true
  resultMesh.receiveShadow = true

  return resultMesh
}

// 创建门的逻辑
function createDoor3D(door) {
  const doorShape = new THREE.Shape()
  const leftTop = transformPoint(door.points[0].x, door.points[0].y) // 左上角
  const rightTop = transformPoint(door.points[1].x, door.points[1].y) // 右上角
  const rightBottom = transformPoint(door.points[2].x, door.points[2].y) // 右下角
  const leftBottom = transformPoint(door.points[3].x, door.points[3].y) // 左下角

  // 创建门的形状
  doorShape.moveTo(leftTop.x, leftTop.y)
  doorShape.lineTo(rightTop.x, rightTop.y)
  doorShape.lineTo(rightBottom.x, rightBottom.y)
  doorShape.lineTo(leftBottom.x, leftBottom.y)

  // 门的拉伸设置
  const doorExtrudeSettings = {
    steps: 1,
    depth: 80, // 门的深度
    bevelEnabled: false
  }

  // 创建门的几何体和材质
  const doorGeometry = new THREE.ExtrudeGeometry(doorShape, doorExtrudeSettings)
  const doorMaterial = new THREE.MeshPhongMaterial({
    color: 0x0000FF, // 修改门的颜色为蓝色
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide,
  })

  // 创建门的网格
  const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial)
  doorMesh.position.y = 40 // 根据需要调整门的位置
  doorMesh.rotation.x = Math.PI / 2
  doorMesh.rotation.z = Math.PI // 旋转180度

  doorMesh.castShadow = true
  doorMesh.receiveShadow = true

  return doorMesh
}

// 转换所有墙体为3D
function convert2Dto3D(walls, doors) {
  scene.clear()
  init3DScene() // 重新初始化场景

  // 转换每面墙
  walls.forEach(wall => {
    const wall3D = createWall3D(wall, doors) // 传递门的数组
    scene.add(wall3D)
  })
}

// 动画循环
function animate() {
  if (!is3DMode) return

  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

// 切换2D/3D模式
function toggle3DMode(walls, corner, doors) {
  const theWall = walls.concat(corner)
  console.log(theWall)
  is3DMode = !is3DMode
  const button = document.getElementById('toggle3d')
  const canvas2d = document.getElementById('canvas')
  const canvas3d = document.getElementById('canvas3d')
  const controlsInfo = document.getElementById('controls-info')

  if (is3DMode) {
    button.classList.add('active')
    canvas2d.style.display = 'none'
    canvas3d.style.display = 'block'
    controlsInfo.style.display = 'block'  // 显示控制说明
    if (!scene) {
      init3DScene()
    }
    convert2Dto3D(theWall, doors)
    animate()
    return true
  } else {
    button.classList.remove('active')
    canvas3d.style.display = 'none'
    canvas2d.style.display = 'block'
    controlsInfo.style.display = 'none'  // 隐藏控制说明
    return false
  }
}

// 导出需要的函数和变量
export {
  is3DMode,
  toggle3DMode,
  convert2Dto3D
}
