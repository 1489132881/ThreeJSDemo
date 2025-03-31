import * as THREE from 'high-three'

// 创建自定义着色器材质
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('https://threejs.org/manual/examples/resources/images/bayer.png')
texture.minFilter = THREE.LinearFilter
texture.magFilter = THREE.LinearFilter
texture.wrapS = THREE.RepeatWrapping
texture.wrapT = THREE.RepeatWrapping
const wallTexture = textureLoader.load('./textures/wall1.jpg', () => console.log('Texture loaded successfully'),
  undefined,
  (err) => console.error('Error loading texture', err)
)
// wallTexture.minFilter = THREE.LinearFilter
// wallTexture.magFilter = THREE.LinearFilter
wallTexture.wrapS = THREE.RepeatWrapping
wallTexture.wrapT = THREE.RepeatWrapping
wallTexture.repeat.set(1, 1)

const uniforms = {
  iTime: { value: 0 },
  iResolution: { value: new THREE.Vector3() },
  iChannel0: { value: texture },
}
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  // vertexShader: `
  //   varying vec2 vUv; // 用于传递纹理坐标
  //   void main() {
  //     vUv = uv; // 传递纹理坐标
  //     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //   }
  // `,
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
  requestAnimationFrame(shaderRender)
}

const imgTexture = new THREE.CanvasTexture('./textures/wall1.jpg')
imgTexture.colorSpace = THREE.SRGBColorSpace
const imgMaterial = new THREE.MeshBasicMaterial({ map: imgTexture })

export { shaderMaterial, shaderRender, wallTexture, imgMaterial }
