// 导入 Three.js 相关模块
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ThreeBSP } from 'three-js-csg-es6'
import * as TWEEN from '@tweenjs/tween.js'
import { shaderMaterial, shaderRender, getTexture, groundMaterial, wallMaterial } from './shader.js'

import groundTexture from './textures/ground.png'
import wallContentTexture from './textures/wall1.jpg'
import wallTexture from './textures/wall.png'
import initSky from './sky.js'
import { walls, wallCorners } from './wall.js'
import { doors } from './door.js'
let is3DMode = false
const width = 1550
const height = 850
let scene = null, renderer, controls, raycaster, ring
let INTERSECTED
let camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000)
const tGroup = new TWEEN.Group()
let ground = new THREE.Mesh()
const pointer = new THREE.Vector2()



const changeViewBtn = document.getElementById('view3d')


const walls1 = [
  {
    start: { x: 250, y: 250 },
    end: { x: 1341, y: 250 },
    thickness: 10,
    angle: 0,
    points: [
      { x: 250, y: 245 },
      { x: 250, y: 255 },
      { x: 1341, y: 255 },
      { x: 1341, y: 245 }
    ],
    wallLength: 1091
  },
  {
    start: { x: 1341, y: 250 },
    end: { x: 1341, y: 765 },
    thickness: 10,
    angle: 1.5707963267948966,
    points: [
      { x: 1346, y: 250 },
      { x: 1336, y: 250 },
      { x: 1336, y: 765 },
      { x: 1346, y: 765 }
    ],
    wallLength: 515
  },
  {
    start: { x: 1341, y: 765 },
    end: { x: 260, y: 765 },
    thickness: 10,
    angle: 3.141592653589793,
    points: [
      { x: 1341, y: 770 },
      { x: 1341, y: 760 },
      { x: 260, y: 760 },
      { x: 260, y: 770 }
    ],
    wallLength: 1081
  },
  {
    start: { x: 260, y: 765 },
    end: { x: 250, y: 250 },
    thickness: 10,
    angle: -1.5902113626972147,
    points: [
      { x: 255.00094232944673, y: 765.0970690809817 },
      { x: 264.99905767055327, y: 764.9029309190183 },
      { x: 254.99905767055327, y: 249.9029309190184 },
      { x: 245.00094232944673, y: 250.0970690809816 }
    ],
    wallLength: 515.097078228949
  }
]

const corner1 = [
  {
    points: [
      { x: 1341, y: 255 },
      { x: 1336, y: 255 },
      { x: 1336, y: 250 },
      { x: 1341, y: 250 }
    ]
  },
  {
    points: [
      { x: 1341, y: 245 },
      { x: 1346, y: 245 },
      { x: 1346, y: 250 },
      { x: 1341, y: 250 }
    ]
  },
  {
    points: [
      { x: 1336, y: 765 },
      { x: 1336, y: 760 },
      { x: 1341, y: 760 },
      { x: 1341, y: 765 }
    ]
  },
  {
    points: [
      { x: 1346, y: 765 },
      { x: 1346, y: 770 },
      { x: 1341, y: 770 },
      { x: 1341, y: 765 }
    ]
  },
  {
    points: [
      { x: 260, y: 760 },
      { x: 264.90385512843636, y: 760 },
      { x: 264.99905767055327, y: 764.9029309190183 },
      { x: 260, y: 765 }
    ]
  },
  {
    points: [
      { x: 260, y: 770 },
      { x: 255.09614487156364, y: 770 },
      { x: 255.00094232944673, y: 765.0970690809817 },
      { x: 260, y: 765 }
    ]
  },
  {
    points: [
      { x: 250, y: 255 },
      { x: 255.09802988571795, y: 255 },
      { x: 254.99905767055327, y: 249.9029309190184 },
      { x: 250, y: 250 }
    ]
  },
  {
    points: [
      { x: 250, y: 245 },
      { x: 244.90197011428205, y: 245 },
      { x: 245.00094232944673, y: 250.0970690809816 },
      { x: 250, y: 250 }
    ]
  }
]

const doors1 = [
  {
    start: { x: 411, y: 250 },
    end: { x: 461, y: 250 },
    points: [
      { x: 411, y: 256 },
      { x: 461, y: 256 },
      { x: 461, y: 244 },
      { x: 411, y: 244 }
    ],
    pointsD: [
      { x: 411, y: 255 },
      { x: 461, y: 255 },
      { x: 461, y: 246 },
      { x: 411, y: 246 }
    ],
    middle: [
      { x: 436, y: 256 },
      { x: 436, y: 244 }
    ],
    width: 50
  },
  {
    start: { x: 1128, y: 250 },
    end: { x: 1178, y: 250 },
    points: [
      { x: 1128, y: 256 },
      { x: 1178, y: 256 },
      { x: 1178, y: 244 },
      { x: 1128, y: 244 }
    ],
    pointsD: [
      { x: 1128, y: 255 },
      { x: 1178, y: 255 },
      { x: 1178, y: 246 },
      { x: 1128, y: 246 }
    ],
    middle: [
      { x: 1153, y: 256 },
      { x: 1153, y: 244 }
    ],
    width: 50
  },
  {
    start: { x: 1341, y: 501 },
    end: { x: 1341, y: 551 },
    points: [
      { x: 1335, y: 501 },
      { x: 1335, y: 551 },
      { x: 1347, y: 551 },
      { x: 1347, y: 501 }
    ],
    pointsD: [
      { x: 1337, y: 501 },
      { x: 1337, y: 551 },
      { x: 1346, y: 551 },
      { x: 1346, y: 501 }
    ],
    middle: [
      { x: 1335, y: 526 },
      { x: 1347, y: 526 }
    ],
    width: 50
  },
  {
    start: { x: 985, y: 765 },
    end: { x: 935, y: 765 },
    points: [
      { x: 985, y: 759 },
      { x: 935, y: 759 },
      { x: 935, y: 771 },
      { x: 985, y: 771 }
    ],
    pointsD: [
      { x: 985, y: 761 },
      { x: 935, y: 761 },
      { x: 935, y: 770 },
      { x: 985, y: 770 }
    ],
    middle: [
      { x: 960, y: 759 },
      { x: 960, y: 771 }
    ],
    width: 50
  },
  {
    start: { x: 256.7820597380571, y: 599.2760765099407 },
    end: { x: 255.81136892824094, y: 549.2854998044081 },
    points: [
      { x: 263, y: 600 },
      { x: 262, y: 550 },
      { x: 250, y: 550 },
      { x: 251, y: 600 }
    ],
    pointsD: [
      { x: 262, y: 600 },
      { x: 261, y: 550 },
      { x: 252, y: 550 },
      { x: 252, y: 600 }
    ],
    middle: [
      { x: 262.5, y: 575 },
      { x: 250.5, y: 575 }
    ],
    width: 50
  }
]

// 定位点，相机点，朝向点
const camera1 = [
  { lookAtPosition: { x: 800, y: 100, z: 350 }, locationPosition: { x: 800, y: 100, z: 300 }, cameraPosition: { x: 800, y: 100, z: 450 } },
  { lookAtPosition: { x: 1140, y: 100, z: 330 }, locationPosition: { x: 1200, y: 100, z: 330 }, cameraPosition: { x: 1100, y: 100, z: 330 } },
  { lookAtPosition: { x: 757, y: 100, z: 620 }, locationPosition: { x: 757, y: 100, z: 600 }, cameraPosition: { x: 757, y: 100, z: 550 } },
  { lookAtPosition: { x: 336, y: 100, z: 630 }, locationPosition: { x: 286, y: 100, z: 630 }, cameraPosition: { x: 436, y: 100, z: 630 } },
]


// 按下p打印相机当前坐标
const CameraPosition = () => {
  console.log(camera.position, 'camera')
  // 当前相机lookat坐标
  console.log(camera.getWorldDirection(new THREE.Vector3()), 'camera.lookAt()')
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'p') {
    CameraPosition()
  }
  if (e.key === 'ArrowUp') {
    camera.position.x += 1
  }
  if (e.key === 'ArrowDown') {
    camera.position.x -= 1
  }
  if (e.key === 'ArrowRight') {
    camera.position.z += 1
  }
  if (e.key === 'ArrowLeft') {
    camera.position.z -= 1
  }
  if (e.key === 'w') {
    camera.position.y += 1
  }
  if (e.key === 's') {
    camera.position.y -= 1
  }
})

// 切换正交/投影
let isOrthographic = false
changeViewBtn.addEventListener('click', () => {
  isOrthographic = !isOrthographic
  toggleOrthographic(isOrthographic)
  // reRender3D(walls, wallCorners, doors)
  reRender3D(walls1, corner1, doors1)
})
function toggleOrthographic(isOrthographic) {
  INTERSECTED = null
  if (isOrthographic) {
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000)
  } else {
    camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 5000)
  }
}

let moveTimeout

// 计算指针位置
function onPointerMove(event) {
  ring.visible = true
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 更新圆环位置
  raycaster.setFromCamera(pointer, camera)
  const ringIntersects = raycaster.intersectObject(ground)
  if (ringIntersects.length > 0) {
    ring.position.copy(ringIntersects[0].point)
    ring.position.y += 2
  }

  clearTimeout(moveTimeout)
  moveTimeout = setTimeout(() => {
    ring.visible = false // 两秒后隐藏圆环
  }, 2000)

}

// 初始化3D场景
function init3DScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xFFFFFF)

  // 创建canvas3d
  const canvas3d = document.getElementById('canvas3d')
  canvas3d.width = width
  canvas3d.height = height
  camera.position.set(750, 1100, 750) // 调整相机位置到中心点上方
  // camera.lookAt(750, 0, 400)         // 看向画布中心

  // 创建射线投射器
  raycaster = new THREE.Raycaster()
  document.addEventListener('mousemove', onPointerMove) // 计算指针位置
  INTERSECTED = null
  ring = new THREE.Mesh(
    new THREE.RingGeometry(11, 15, 30, 30),
    new THREE.MeshBasicMaterial({ color: 0xcbcccc, side: THREE.DoubleSide, opacity: 0.5, transparent: true }) //白色半透明环 
  )
  ring.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
  scene.add(ring)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: canvas3d,
    antialias: true // 添加抗锯齿
  })
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true
  renderer.autoClearColor = false

  // 添加轨道控制器并设置限制
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true // 启用阻尼效果，使移动更平滑
  controls.dampingFactor = 0.05
  controls.enablePan = true         // 启用平移（拖动）
  controls.panSpeed = 1.0           // 平移速度
  controls.minDistance = 100        // 最小缩放距离
  controls.maxDistance = 3000       // 最大缩放距离
  controls.minPolarAngle = 0        // 最小仰角
  controls.maxPolarAngle = Math.PI / 2  // 最大仰角（90度）
  controls.target.set(750, 100, 500)  // 设置初始目标点
  //随着平移同步改变
  let previousPosition = new THREE.Vector3(750, 100, 500)
  controls.addEventListener('change', () => {
    previousPosition.copy(camera.position)
    const delta = new THREE.Vector3().subVectors(camera.position, previousPosition)
    controls.target.add(delta)
    previousPosition.copy(camera.position)
    // console.log(controls.target, 'controls.target')
  })

  initSky(scene, camera, renderer)

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
  // const gridHelper = new THREE.GridHelper(1500, 60, 0xf5f5f5, 0xF0F0F0)
  // gridHelper.position.set(750, 0, 400) // 网格中心对齐画布中心
  // scene.add(gridHelper)

  // initGround(camera, scene, renderer)

  // 添加地面
  const groundGeometry = new THREE.PlaneGeometry(1500, 1500)
  const gTexture = getTexture(groundTexture)
  gTexture.repeat.set(6, 6)
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide,
    map: gTexture
  })
  ground = new THREE.Mesh(groundGeometry, groundMaterial)
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

// 创建墙
function createWall3D(wall) {
  const wallHeight = Number(document.getElementById('wallHeight').value) || 100
  // 转换所有墙的坐标
  const transformedPoints = wall.points.map(point =>
    transformPoint(point.x, point.y)
  )

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
  // wallMesh.quaternion.setFromEuler(euler)
  wallMesh.setRotationFromEuler(euler)

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
  doorMesh.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI))

  // 在网格上添加门框
  const doorFrameMesh = new THREE.Mesh(doorFrameGeometry, doorMaterial)
  doorFrameMesh.position.y = wallHeight * 0.8
  doorFrameMesh.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI))
  return [doorMesh, doorFrameMesh]
}

// 带有门洞的墙（处理墙和门）
function createDoorHole3D(wallMesh, doorFrameMeshes, index) {
  // 合并所有门框的BSP对象，合并所有墙的BSP对象
  let combinedDoorBSP = null
  let combinedWallBSP = null

  doorFrameMeshes.forEach(doorFrameMesh => {
    const doorBSP = new ThreeBSP(doorFrameMesh)
    combinedDoorBSP = combinedDoorBSP ? combinedDoorBSP.union(doorBSP) : doorBSP
  })

  const wallBSP = new ThreeBSP(wallMesh)
  combinedWallBSP = combinedWallBSP ? combinedWallBSP.union(wallBSP) : wallBSP

  // 从墙体中减去所有门框
  const resultBSP = combinedWallBSP.subtract(combinedDoorBSP)
  const resultMesh = resultBSP.toMesh()

  // 创建门洞墙以及材质
  const material = new THREE.MeshLambertMaterial({
    color: 0x808080, // 深灰色
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide,
    map: getTexture(wallTexture)
  })

  resultMesh.material = material
  resultMesh.geometry.computeVertexNormals()

  // 重新计算UV映射
  resultMesh.geometry.computeBoundingBox()
  const max = resultMesh.geometry.boundingBox.max
  const min = resultMesh.geometry.boundingBox.min
  const offset = new THREE.Vector2(0 - min.x, 0 - min.y)
  const range = new THREE.Vector2(max.x - min.x, max.y - min.y)
  const faces = resultMesh.geometry.faces

  resultMesh.geometry.faceVertexUvs[0] = []
  for (let i = 0; i < faces.length; i++) {
    const v1 = resultMesh.geometry.vertices[faces[i].a]
    const v2 = resultMesh.geometry.vertices[faces[i].b]
    const v3 = resultMesh.geometry.vertices[faces[i].c]
    resultMesh.geometry.faceVertexUvs[0].push([
      new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
      new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
      new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
    ])
  }
  resultMesh.geometry.uvsNeedUpdate = true

  resultMesh.name = `doorhole${index}`
  return resultMesh
}

// 3d场景中创建一个圆圈
const circle3D = (cameraPos, index) => {
  const circleGeometry = new THREE.CircleGeometry(16, 32) // 半径为5的圆
  const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xcecece, opacity: 0.5, transparent: true })
  const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial)
  // 在每个相机位置创建一个圆圈

  circleMesh.position.set(cameraPos.locationPosition.x, 10, cameraPos.locationPosition.z)
  circleMesh.rotation.x = - Math.PI / 2 // 使圆圈平放在地面上
  // 添加点击事件
  circleMesh.userData = { cameraPosition: cameraPos.cameraPosition, lookAtPosition: cameraPos.lookAtPosition } // 存储目标位置
  circleMesh.name = `circle${index}`
  return circleMesh
}

// 添加墙体内容
function wallContent(position, size) {
  const planeGeometry = new THREE.BoxGeometry(size.width, size.height, size.depth)
  const planeMaterial = new THREE.MeshPhongMaterial({ map: getTexture(wallContentTexture) })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)

  plane.position.set(position.x, position.y, position.z)

  scene.add(plane)
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
    camera1.forEach((cameraPos, index) => {
      scene.add(circle3D(cameraPos, index))
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
  wallMeshs.forEach((wallMesh, index) => {
    const doorHole3D = createDoorHole3D(wallMesh, doorFrameMeshs, index)
    scene.add(doorHole3D)
  })

  camera1.forEach((cameraPos, index) => {
    scene.add(circle3D(cameraPos, index))
  })

  wallContent({ x: 660, y: 50, z: 226 }, { width: 400, height: 99, depth: 10 })


}

// 点击按钮移动相机
const viewFrontBtn = document.getElementById('viewFront')
const viewSideBtn = document.getElementById('viewSide')
const viewTopBtn = document.getElementById('viewTop')
viewFrontBtn.addEventListener('click', () => setCameraView('front'))
viewSideBtn.addEventListener('click', () => setCameraView('side'))
viewTopBtn.addEventListener('click', () => setCameraView('top'))

// 计算目标四元数的函数
function getTargetQuaternion(targetPos, lookAtPos = new THREE.Vector3(750, 0, 400)) {
  const tempObject = new THREE.Object3D()
  tempObject.position.copy(targetPos)
  tempObject.lookAt(lookAtPos)
  return tempObject.quaternion.clone()
}

// 相机移动方法
function setCameraView(view) {
  let targetPosition = view.targetPosition || new THREE.Vector3()
  let targetQuaternion = view.targetQuaternion || new THREE.Quaternion()
  let lookAtPosition = view.lookAtPosition || new THREE.Vector3(750, 0, 400)
  const currentPosition = camera.position.clone()
  const currentQuaternion = camera.quaternion.clone()
  let isViewWall = false
  controls.maxPolarAngle = Math.PI / 2

  switch (view) {
    case 'front':
      targetPosition = new THREE.Vector3(750, 300, 1200)
      targetQuaternion = getTargetQuaternion(targetPosition)
      break
    case 'side':
      targetPosition = new THREE.Vector3(750, 700, 1000)
      targetQuaternion = getTargetQuaternion(targetPosition)
      break
    case 'top':
      targetPosition = new THREE.Vector3(750, 1150, 401)
      targetQuaternion = getTargetQuaternion(targetPosition)
      if (!isOrthographic) {
        // 禁止旋转
        controls.maxPolarAngle = 0

      }
      break
    default:
      isViewWall = true
      break
  }

  console.log('lookAtPosition', lookAtPosition, 'targetPosition', targetPosition)
  // 使用quaternion，依然存在视角突变
  // 网格复位
  new TWEEN.Tween(controls.target, tGroup)
    .to(view.lookAtPosition ? { x: view.lookAtPosition.x, y: view.lookAtPosition.y, z: view.lookAtPosition.z } : { x: 750, y: 100, z: 400 }, 800)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(() => {
      controls.enabled = false
    })
    .start()
    .onComplete(() => {
      controls.enabled = true
    })
  // 相机移动
  new TWEEN.Tween({ pos: currentPosition, quat: currentQuaternion, t: 0 }, tGroup)
    .to({ pos: targetPosition, quat: targetQuaternion, t: 1 }, 800)
    .easing(TWEEN.Easing.Linear.None)
    .delay(300)
    .onUpdate((object) => {
      camera.position.lerpVectors(currentPosition, targetPosition, object.t)
      // camera.quaternion.copy(currentQuaternion.clone().slerp(targetQuaternion, object.t))
      // camera.quaternion.copy(currentQuaternion.clone().slerp(targetQuaternion, object.t))
      // 重置alpha
      // camera.alpha = 0
      // controls.update()

    })
    .onComplete(() => {
      controls.enablePan = !isViewWall
    })
    .start()

}

function findIntersects() {

  raycaster.setFromCamera(pointer, camera) // 更新射线投射器
  // const intersects = raycaster.intersectObjects(scene.children.filter(child => child.name.includes('doorhole')), false)
  const intersects = raycaster.intersectObjects(scene.children.filter(child => child.name.includes('circle')), false)
  if (intersects.length > 0) {
    // console.log(intersects, 'intersects', pointer, scene.children)
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.opacity = 0.5
      }
      INTERSECTED = intersects[0].object
      INTERSECTED.material.opacity = 1
      const lookAtPosition = intersects[0].object.userData.lookAtPosition
      const cameraPosition = intersects[0].object.userData.cameraPosition
      console.log(lookAtPosition, cameraPosition, 'cameraPos')
      // 交点点击触发点击事件
      // 如果是正交相机，则改为投影相机再移动
      document.getElementById('canvas3d').addEventListener('dblclick', () => {
        if (!isOrthographic) {
          changeViewBtn.click()
        }
        moveCameraToWall(lookAtPosition, cameraPosition)
      }, { once: true })
    }
  }

  renderer.render(scene, camera)
}

function moveCameraToWall(lookAtPosition, cameraPosition) {
  const targetPosition = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z)
  const targetLookAtPosition = new THREE.Vector3(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z)
  console.log(targetPosition, targetLookAtPosition, 'targetPosition, targetLookAtPosition')
  const targetQuaternion = getTargetQuaternion(targetPosition, targetLookAtPosition)
  setCameraView({ targetPosition, targetQuaternion, lookAtPosition: targetLookAtPosition })
}

// 动画循环
function animate() {
  if (!is3DMode) return
  shaderRender(performance.now())
  // shaderRender(0)
  requestAnimationFrame(animate)
  controls.update()
  tGroup.update() // 更新TWEEN动画
  findIntersects()
}

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

// 切换2D/3D模式
function toggle3DMode(walls, corner, doors) {

  console.log(walls, 'walls', corner, 'corner', doors, 'doors')
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
    reRender3D(walls1, corner1, doors1)
    // reRender3D(walls, corner, doors)
    // 点击一次切换正交
    changeViewBtn.click()
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

//3d渲染
function reRender3D(walls, corner, doors) {
  const theWall = walls.concat(corner)
  convert2Dto3D(theWall, doors)
  animate()
}

// 导出需要的函数和变量
export {
  is3DMode,
  toggle3DMode,
  convert2Dto3D
}
