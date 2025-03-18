// 导入 Three.js 相关模块
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ThreeBSP } from 'three-js-csg-es6'
import * as TWEEN from '@tweenjs/tween.js'

let scene, camera, renderer, controls
let is3DMode = false
const tGroup = new TWEEN.Group()



// 清除场景（120版本没有scene.clear()）
function clearScene(scene) {
  while (scene.children.length > 0) {
    const child = scene.children[0]
    scene.remove(child)

    // 如果对象有几何体或材质，记得释放内存
    if (child.geometry) {
      child.geometry.dispose()
    }
    if (child.material) {
      // 检查材质是否是一个数组
      if (Array.isArray(child.material)) {
        child.material.forEach(material => material.dispose())
      } else {
        child.material.dispose()
      }
    }
  }
}

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
  camera.position.set(750, 1100, 750) // 调整相机位置到中心点上方
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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // 半强度的环境光
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(1, 1, 1).normalize()
  scene.add(directionalLight)

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
  const euler = new THREE.Euler(-Math.PI / 2, 0, 0)
  ground.quaternion.setFromEuler(euler)
  ground.position.set(750, -0.1, 400) // 地面中心对齐画布中心
  ground.receiveShadow = true
  scene.add(ground)

  // 添加辅助坐标轴（可选，帮助调试）
  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)
}

// 调整坐标到画布中心
function transformPoint(x, y) {
  const gridSize = 50 // 网格大小
  const centeredX = x - gridSize / 2
  const centeredY = y - gridSize / 2
  return {
    x: 750 - centeredX - 700,
    y: 400 - centeredY - 400
  }
}

// 将2D墙体转换为3D模型
function createWall3D(wall) {
  const wallHeight = Number(document.getElementById('wallHeight').value) || 100
  // 转换所有墙的坐标
  const transformedPoints = wall.points.map(point =>
    transformPoint(point.x, point.y)
  )
  // 二维墙体
  const shape = new THREE.Shape()
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

  // 创建墙以及材质
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  const material = new THREE.MeshPhongMaterial({
    color: 0x808080, //深灰色
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide,
  })

  // 在网格上添加墙体
  const wallMesh = new THREE.Mesh(geometry, material)
  wallMesh.position.y = wallHeight
  const euler = new THREE.Euler(Math.PI / 2, 0, Math.PI)
  wallMesh.quaternion.setFromEuler(euler)

  return wallMesh
}

// 创建门和门框的逻辑(带D的为门的坐标)
function createDoor3D(door) {
  const wallHeight = Number(document.getElementById('wallHeight').value) || 100
  // 转换门框的坐标
  const transformedPoints = door.points.map(point =>
    transformPoint(point.x, point.y)
  )
  // 转换门的坐标
  const transformedPointsD = door.pointsD.map(point =>
    transformPoint(point.x, point.y)
  )

  // 二维门框
  const doorShape = new THREE.Shape()
  // const leftTop = transformPoint(door.points[0].x, door.points[0].y) // 左上角
  // const rightTop = transformPoint(door.points[1].x, door.points[1].y) // 右上角
  // const rightBottom = transformPoint(door.points[2].x, door.points[2].y) // 右下角
  // const leftBottom = transformPoint(door.points[3].x, door.points[3].y) // 左下角
  doorShape.moveTo(transformedPoints[0].x, transformedPoints[0].y)
  transformedPoints.forEach((point, i) => {
    if (i > 0) doorShape.lineTo(point.x, point.y)
  })
  doorShape.lineTo(transformedPoints[0].x, transformedPoints[0].y)

  // 二维门
  const doorShapeD = new THREE.Shape()
  doorShapeD.moveTo(transformedPointsD[0].x, transformedPointsD[0].y)
  transformedPointsD.forEach((point, i) => {
    if (i > 0) doorShapeD.lineTo(point.x, point.y)
  })
  doorShapeD.lineTo(transformedPointsD[0].x, transformedPointsD[0].y)

  // 门的拉伸设置
  const doorExtrudeSettings = {
    steps: 1,
    depth: wallHeight * 0.75,
    bevelEnabled: false
  }

  // 门框的拉伸设置
  const doorFrameExtrudeSettings = {
    steps: 1,
    depth: wallHeight * 0.8,
    bevelEnabled: false
  }

  // 创建门和门框以及材质
  const doorGeometry = new THREE.ExtrudeGeometry(doorShapeD, doorExtrudeSettings)
  const doorFrameGeometry = new THREE.ExtrudeGeometry(doorShape, doorFrameExtrudeSettings)
  const doorMaterial = new THREE.MeshPhongMaterial({
    color: 0x008000,
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide,
  })

  // 在网格上添加门
  const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial)
  doorMesh.position.y = wallHeight * 0.75
  doorMesh.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI))

  // 在网格上添加门框
  const doorFrameMesh = new THREE.Mesh(doorFrameGeometry, doorMaterial)
  doorFrameMesh.position.y = wallHeight * 0.8
  doorFrameMesh.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI))
  return [doorMesh, doorFrameMesh]
}

// 带有门洞的墙（处理墙和门）
function createDoorHole3D(wallMeshes, doorFrameMeshes) {
  // 合并所有门框的BSP对象，合并所有墙的BSP对象
  let combinedDoorBSP = null
  let combinedWallBSP = null

  doorFrameMeshes.forEach(doorFrameMesh => {
    const doorBSP = new ThreeBSP(doorFrameMesh)
    combinedDoorBSP = combinedDoorBSP ? combinedDoorBSP.union(doorBSP) : doorBSP
  })

  wallMeshes.forEach(wallMesh => {
    const wallBSP = new ThreeBSP(wallMesh)
    combinedWallBSP = combinedWallBSP ? combinedWallBSP.union(wallBSP) : wallBSP
  })

  // 从墙体中减去所有门框
  const resultBSP = combinedWallBSP.subtract(combinedDoorBSP)
  const resultMesh = resultBSP.toMesh()

  // 创建门洞墙以及材质
  const material = new THREE.MeshPhongMaterial({
    color: 0x808080, // 深灰色
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide,
  })

  resultMesh.material = material
  return resultMesh
}

// 转换所有墙体为3D
function convert2Dto3D(walls, doors) {
  clearScene(scene)
  init3DScene() // 重新初始化场景
  // 存储Mesh
  let wallMeshs = []
  let doorFrameMeshs = []

  // 没门的情况
  if (doors.length === 0) {
    walls.forEach(wall => {
      const wall3D = createWall3D(wall)
      scene.add(wall3D)
    })
    return
  }

  // 转换每面墙
  walls.forEach(wall => {
    const wall3D = createWall3D(wall)
    // scene.add(wall3D)
    wallMeshs.push(wall3D)
  })

  // 转换每扇门
  doors.forEach(door => {
    const door3D = createDoor3D(door)
    // scene.add(door3D[0])
    doorFrameMeshs.push(door3D[1])
  })

  // 转换门洞
  const doorHole3D = createDoorHole3D(wallMeshs, doorFrameMeshs)
  scene.add(doorHole3D)

}

// 点击按钮移动相机
const viewFrontBtn = document.getElementById('viewFront')
const viewSideBtn = document.getElementById('viewSide')
const viewTopBtn = document.getElementById('viewTop')
viewFrontBtn.addEventListener('click', () => setCameraView('front'))
viewSideBtn.addEventListener('click', () => setCameraView('side'))
viewTopBtn.addEventListener('click', () => setCameraView('top'))

// 计算目标四元数的函数
function getTargetQuaternion(targetPos) {
  const tempObject = new THREE.Object3D()
  tempObject.position.copy(targetPos)
  tempObject.lookAt(targetPos)
  return tempObject.quaternion.clone()
}

// 相机移动方法
function setCameraView(view) {
  let targetPosition = new THREE.Vector3()
  let targetQuaternion = new THREE.Quaternion()
  const currentPosition = camera.position.clone()
  const currentQuaternion = camera.quaternion.clone()

  switch (view) {
    case 'front':
      targetPosition = new THREE.Vector3(750, 100, 1200)
      targetQuaternion = getTargetQuaternion(targetPosition)
      break
    case 'side':
      targetPosition = new THREE.Vector3(750, 700, 1000)
      targetQuaternion = getTargetQuaternion(targetPosition)
      break
    case 'top':
      targetPosition = new THREE.Vector3(750, 1100, 501)
      targetQuaternion = getTargetQuaternion(targetPosition)
      break
    default:
      return
  }

  // 使用quaternion
  new TWEEN.Tween({ pos: currentPosition, quat: currentQuaternion }, tGroup)
    .to({ pos: targetPosition, quat: targetQuaternion }, 1000)
    .onUpdate((object) => {
      camera.position.copy(object.pos)
      camera.quaternion.copy(object.quat)
      if (controls) controls.update()
      controls.enabled = false
    })
    .onComplete(() => {
      controls.enabled = true
    })
    .start()

  // 使用set
  // new TWEEN.Tween(camera.position, tGroup)
  //   .to(targetPosition, 1000)
  //   .easing(TWEEN.Easing.Linear.None)
  //   .onUpdate(() => {
  //     // camera.quaternion.slerp(getTargetQuaternion(camera.position, targetPosition), 1)
  //     camera.lookAt(750, 0, 400)//会有视角突变
  //   })
  //   .start()


}

// 动画循环
function animate() {
  if (!is3DMode) return

  requestAnimationFrame(animate)
  controls.update()
  tGroup.update() // 更新TWEEN动画
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
  const controlsViewBtn = document.getElementById('controls-viewBtn')
  if (is3DMode) {
    button.classList.add('active')
    canvas2d.style.display = 'none'
    canvas3d.style.display = 'block'
    controlsInfo.style.display = 'block'  // 显示控制说明
    controlsViewBtn.style.display = 'block'
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
    controlsViewBtn.style.display = 'none'
    return false
  }
}

// 导出需要的函数和变量
export {
  is3DMode,
  toggle3DMode,
  convert2Dto3D
}
