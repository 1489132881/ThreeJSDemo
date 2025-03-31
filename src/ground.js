import * as THREE from 'high-three'

import { GUI } from 'high-three/addons/libs/lil-gui.module.min.js'
import { GroundedSkybox } from 'high-three/addons/objects/GroundedSkybox.js'
import { GLTFLoader } from 'high-three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'high-three/addons/loaders/DRACOLoader.js'
import { RGBELoader } from 'high-three/addons/loaders/RGBELoader.js'

const params = {
  height: 9,
  radius: 800,
  enabled: true,
}

let skybox

export async function initGround(camera, scene, renderer) {

  const hdrLoader = new RGBELoader()
  const envMap = await hdrLoader.loadAsync('./static/blouberg_sunrise_2_1k.hdr')
  envMap.mapping = THREE.EquirectangularReflectionMapping

  skybox = new GroundedSkybox(envMap, params.height, params.radius)
  skybox.position.set(750, 0, 400)
  skybox.position.y = params.height - 0.01
  scene.add(skybox)

  scene.environment = envMap

  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('./static/gltf/')

  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)

  const shadow = new THREE.TextureLoader().load('./static/ferrari_ao.png')

  loader.load('./static/ferrari.glb', function (gltf) {

    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x000000, metalness: 1.0, roughness: 0.8,
      clearcoat: 1.0, clearcoatRoughness: 0.2
    })

    const detailsMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, metalness: 1.0, roughness: 0.5
    })

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0
    })

    const carModel = gltf.scene.children[0]
    carModel.scale.multiplyScalar(4)
    carModel.rotation.y = Math.PI

    carModel.getObjectByName('body').material = bodyMaterial

    carModel.getObjectByName('rim_fl').material = detailsMaterial
    carModel.getObjectByName('rim_fr').material = detailsMaterial
    carModel.getObjectByName('rim_rr').material = detailsMaterial
    carModel.getObjectByName('rim_rl').material = detailsMaterial
    carModel.getObjectByName('trim').material = detailsMaterial

    carModel.getObjectByName('glass').material = glassMaterial

    // shadow
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
      new THREE.MeshBasicMaterial({
        map: shadow, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true
      })
    )
    mesh.rotation.x = - Math.PI / 2
    carModel.add(mesh)

    scene.add(carModel)

    renderer.render(scene, camera)

  })


  //   const gui = new GUI()

  //   gui.add(params, 'enabled').name('Grounded').onChange(function (value) {

  //     if (value) {

  //       scene.add(skybox)
  //       scene.background = null

  //     } else {

  //       scene.remove(skybox)
  //       scene.background = scene.environment

  //     }

  //     render()

  //   })

  //   gui.open()

}
