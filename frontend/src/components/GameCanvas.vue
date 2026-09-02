<template>
  <div class="game-root">
    <div ref="canvasContainer" class="game-canvas"></div>

    <div class="ui-overlay">
      <transition name="fade">
        <div v-if="activeDialog" class="dialog-box">
          <p class="dialog-name">{{ activeDialog.npcName }}</p>
          <p class="dialog-text">{{ activeDialog.text }}</p>
          <p class="dialog-hint">Pressione E para continuar</p>
        </div>
      </transition>

      <button class="pause-btn" @click="showStatus = !showStatus">MENU</button>

      <transition name="fade">
        <div v-if="showStatus" class="status-panel">
          <h2>{{ character.name }}</h2>
          <p class="class-line">{{ character.class }} · Lvl {{ character.level }}</p>
          <ul class="skills">
            <li v-for="skill in character.skills" :key="skill.name">
              <span>{{ skill.icon }} {{ skill.name }}</span>
              <div class="bar"><div class="bar-fill" :style="{ width: skill.value + '%' }"></div></div>
            </li>
          </ul>
        </div>
      </transition>

      <div v-if="loading" class="loading-badge">Carregando mapa…</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { loadModelOrPlaceholder } from '../utils/loadModel.js'
import localLocations from '../data/locations.json'

const canvasContainer = ref(null)
const showStatus = ref(false)
const activeDialog = ref(null)
const loading = ref(true)

const character = reactive({
  name: 'Ricardo',
  class: 'Java Developer / Hardware Engineer',
  level: 25,
  skills: [
    { icon: '⚔️', name: 'C# / Java', value: 88 },
    { icon: '🛡️', name: 'Segurança da Informação', value: 85 },
    { icon: '🔮', name: 'Vue / Three.js', value: 80 },
    { icon: '🐍', name: 'Python (em estudo)', value: 60 },
    { icon: '🔧', name: 'Reparo de Hardware', value: 95 },
  ],
})

// Endpoint do backend Java. Se a chamada falhar, cai para o JSON local.
const API_URL = '/api/locations'

let scene, camera, renderer, animationId
let player
const keysPressed = {}
const interactables = [] // { mesh, name, dialog }

async function fetchLocations() {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error('bad response')
    return await res.json()
  } catch (err) {
    console.warn('[GameCanvas] Backend indisponível, usando dados locais.', err)
    return localLocations
  }
}

function initScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  const w = canvasContainer.value.clientWidth
  const h = canvasContainer.value.clientHeight

  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
  camera.position.set(0, 9, 9)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  canvasContainer.value.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 5)
  scene.add(dirLight)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x2d2d44 })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  player = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )
  player.position.y = 0.8
  scene.add(player)
}

async function buildWorld(data) {
  for (const loc of data.locations) {
    // Casa/prédio — usa o footprint real do local; se não achar o .glb em
    // /models, desenha o retângulo da área com o nome do local flutuando acima.
    const house = await loadModelOrPlaceholder({
      fileName: loc.model,
      name: loc.name,
      color: loc.color,
      footprint: loc.footprint,
    })
    house.position.set(loc.position.x, loc.offsetY ?? 0, loc.position.z)
    if (loc.scale) house.scale.setScalar(loc.scale)
    scene.add(house)
    interactables.push({ mesh: house, name: loc.name, dialog: [`Você está em: ${loc.name}`] })

    // NPCs do local
    for (const npc of loc.npcs || []) {
      const npcObj = await loadModelOrPlaceholder({
        fileName: npc.model,
        name: npc.name,
        color: '#94a3b8',
        footprint: { width: 0.9, depth: 0.9 },
      })
      npcObj.position.set(npc.position.x, npc.offsetY ?? 0, npc.position.z)
      if (npc.scale) npcObj.scale.setScalar(npc.scale)
      scene.add(npcObj)
      interactables.push({ mesh: npcObj, name: npc.name, dialog: npc.dialog })
    }
  }
}

function checkProximity() {
  const near = interactables.find(
    (obj) => obj.mesh.position.distanceTo(player.position) < 1.6
  )
  activeDialog.value = near
    ? { npcName: near.name, text: near.dialog[0] }
    : null
}

function updatePlayer() {
  const speed = 0.08
  if (keysPressed['w'] || keysPressed['arrowup']) player.position.z -= speed
  if (keysPressed['s'] || keysPressed['arrowdown']) player.position.z += speed
  if (keysPressed['a'] || keysPressed['arrowleft']) player.position.x -= speed
  if (keysPressed['d'] || keysPressed['arrowright']) player.position.x += speed

  camera.position.x = player.position.x
  camera.position.z = player.position.z + 9
  camera.lookAt(player.position.x, 0, player.position.z)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  updatePlayer()
  checkProximity()
  renderer.render(scene, camera)
}

function onKeyDown(e) { keysPressed[e.key.toLowerCase()] = true }
function onKeyUp(e) { keysPressed[e.key.toLowerCase()] = false }

function onResize() {
  if (!canvasContainer.value) return
  const w = canvasContainer.value.clientWidth
  const h = canvasContainer.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(async () => {
  initScene()
  const data = await fetchLocations()
  await buildWorld(data)
  loading.value = false
  animate()

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', onResize)
  renderer?.dispose()
})
</script>

<style scoped>
.game-root { position: relative; width: 100%; height: 100vh; font-family: 'Press Start 2P', 'VT323', monospace; overflow: hidden; }
.game-canvas { width: 100%; height: 100%; }
.ui-overlay { position: absolute; inset: 0; pointer-events: none; }
.dialog-box, .status-panel, .pause-btn { pointer-events: auto; }

.dialog-box {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  width: min(560px, 90%); background: #0d1b2a; border: 4px solid #e0e1dd;
  border-radius: 6px; padding: 16px 20px; color: #e0e1dd; font-size: 12px; line-height: 1.6;
}
.dialog-name { color: #ffd166; margin-bottom: 6px; }
.dialog-hint { opacity: 0.6; font-size: 9px; margin-top: 8px; text-align: right; }

.pause-btn {
  position: absolute; top: 16px; right: 16px; background: #0d1b2a; color: #e0e1dd;
  border: 3px solid #e0e1dd; border-radius: 4px; padding: 8px 14px; font-family: inherit;
  font-size: 10px; cursor: pointer;
}

.status-panel {
  position: absolute; top: 60px; right: 16px; width: 260px; background: #0d1b2a;
  border: 4px solid #e0e1dd; border-radius: 6px; padding: 16px; color: #e0e1dd;
}
.status-panel h2 { font-size: 13px; margin: 0 0 4px; }
.class-line { font-size: 9px; opacity: 0.7; margin-bottom: 12px; }
.skills { list-style: none; padding: 0; margin: 0; }
.skills li { margin-bottom: 10px; font-size: 9px; }
.bar { background: #1b263b; height: 6px; border-radius: 3px; margin-top: 4px; }
.bar-fill { background: #ffd166; height: 100%; border-radius: 3px; }

.loading-badge {
  position: absolute; top: 16px; left: 16px; background: #0d1b2a; color: #e0e1dd;
  border: 3px solid #e0e1dd; border-radius: 4px; padding: 6px 12px; font-size: 9px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
