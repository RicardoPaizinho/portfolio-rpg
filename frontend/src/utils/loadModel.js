import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()

/**
 * Cria um Sprite de texto (nome do local/NPC) usando um canvas como textura.
 */
function createLabel(text) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = 256
  canvas.height = 64

  ctx.fillStyle = 'rgba(13, 27, 42, 0.85)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#e0e1dd'
  ctx.lineWidth = 3
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

  ctx.fillStyle = '#e0e1dd'
  ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2.5, 0.6, 1)
  return sprite
}

/**
 * Fallback: desenha o retângulo da área (footprint) com o nome do objeto
 * flutuando acima, usado quando o modelo .glb não existe/não carrega.
 */
function createPlaceholder({ name, color = '#64748b', width = 2, depth = 2, height = 1.6 }) {
  const group = new THREE.Group()

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.85 })
  )
  box.position.y = height / 2
  group.add(box)

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(box.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  )
  edges.position.y = height / 2
  group.add(edges)

  const label = createLabel(name)
  label.position.y = height + 0.5
  group.add(label)

  group.userData.isPlaceholder = true
  return group
}

/**
 * Tenta carregar `${modelsBasePath}/${fileName}`. Se o arquivo não existir
 * ou falhar ao carregar, retorna o placeholder (retângulo + nome) no lugar.
 *
 * @param {object} opts
 * @param {string} opts.fileName - nome do arquivo .glb (ex: "workshop.glb")
 * @param {string} opts.name - nome exibido no placeholder/label
 * @param {string} [opts.color] - cor do placeholder
 * @param {{width:number, depth:number}} [opts.footprint] - dimensões da área
 * @param {string} [opts.modelsBasePath] - pasta onde os modelos ficam (default "/models")
 */
export function loadModelOrPlaceholder({
  fileName,
  name,
  color,
  footprint = { width: 2, depth: 2 },
  modelsBasePath = '/models',
}) {
  return new Promise((resolve) => {
    if (!fileName) {
      resolve(createPlaceholder({ name, color, ...footprint }))
      return
    }

    const path = `${modelsBasePath}/${fileName}`

    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene
        model.userData.isPlaceholder = false
        model.userData.name = name
        resolve(model)
      },
      undefined,
      () => {
        // Arquivo não encontrado na pasta /models (ou falhou ao parsear) → fallback
        console.warn(`[loadModel] "${path}" não encontrado — desenhando placeholder para "${name}".`)
        resolve(createPlaceholder({ name, color, ...footprint }))
      }
    )
  })
}
