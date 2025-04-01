import * as THREE from 'high-three'
import wall1 from './textures/wall1.jpg'
import wall from './textures/wall.png'
import groundTexture from './textures/ground.png'

// 创建自定义着色器材质
const textureLoader = new THREE.TextureLoader()
// const texture = textureLoader.load('https://threejs.org/manual/examples/resources/images/bayer.png')
const texture = textureLoader.load(wall)
texture.minFilter = THREE.LinearFilter
texture.magFilter = THREE.LinearFilter
texture.wrapS = THREE.RepeatWrapping
texture.wrapT = THREE.RepeatWrapping

const uniforms = {
  iTime: { value: 0 },
  iResolution: { value: new THREE.Vector3() },
  iChannel0: { value: texture },
}
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: `
    varying vec2 vUv; // 用于传递纹理坐标
    void main() {
      vUv = uv; // 传递纹理坐标
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
  #include <common>

  uniform vec3 iResolution;
  uniform float iTime;
  uniform sampler2D iChannel0;
  uniform sampler2D shadowMap;

  #define TIMESCALE 0.5
  #define TILES 8

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    // 计算随时间变化的渐变色
    float timeFactor = 0.5 + 0.5 * sin(iTime * TIMESCALE);
    vec3 color1 = vec3(0.2, 0.2, 0.2); // 起始颜色
    vec3 color2 = vec3(0.9, 0.9, 0.9); // 结束颜色
    vec3 gradientColor = mix(color1, color2, uv.y * timeFactor); // 根据y坐标和时间线性插值

    fragColor = vec4(gradientColor, 1.0);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `,
})

const shaderRender = (time) => {
  time *= 0.001
  uniforms.iResolution.value.set(1500, 800, 1)
  uniforms.iTime.value = time
}

const imgTexture = new THREE.CanvasTexture('./textures/wall1.jpg')
imgTexture.colorSpace = THREE.SRGBColorSpace
const imgMaterial = new THREE.MeshBasicMaterial({ map: imgTexture })


// 纹理
const getTexture = (url) => {
  const texture = new THREE.TextureLoader().load(url)
  texture.minFilter = THREE.LinearMipMapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const fragmentShader = `
  uniform float iTime; // 添加时间变量以实现动态效果

  void main() {
    // 使用时间生成平滑的噪声
    float noise = (sin(iTime * 10.0) + sin(iTime * 10.1)) * 0.25 + 0.5; // 生成更平滑的噪声
    vec3 color = vec3(1.0, 0.0, 0.0); // 保持颜色不变
    gl_FragColor = vec4(color * noise, 1.0); // 根据噪声调整透明度
  }
`

const groundMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(1500, 1500, 1) },
    iChannel0: { value: getTexture(groundTexture) },
  },
  fragmentShader: fragmentShader,
})


const wallTexture = getTexture(wall)
wallTexture.repeat.set(2, 2)
wallTexture.offset.set(0.1, 0.1)
const wallMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(1100, 300, 1) },
    iChannel0: { value: wallTexture },
  },
  // vertexShader: `
  //   varying vec2 vUv; // 用于传递纹理坐标
  //   void main() {
  //     vUv = uv; // 传递纹理坐标
  //     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //   }
  // `,
  // fragmentShader: `
  //   varying vec2 vUv; // 接收从顶点着色器传递的纹理坐标
  //   uniform sampler2D iChannel0; // 纹理采样器

  //   void main() {
  //     vec4 textureColor = texture2D(iChannel0, vUv); // 使用纹理坐标采样纹理
  //     gl_FragColor = textureColor; // 将采样到的颜色作为片段颜色输出
  //   }
  // `,
})

export { shaderMaterial, shaderRender, imgMaterial, getTexture, groundMaterial, wallMaterial }
