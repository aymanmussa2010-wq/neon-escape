import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

const music = new Audio('./audio/music.m4a');
music.loop = true;
music.volume = 0.35;

const container = document.getElementById('game');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070918);
scene.fog = new THREE.Fog(0x070918, 35, 125);

const camera = new THREE.PerspectiveCamera(
  65, container.clientWidth / container.clientHeight, 0.1, 180
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 1, -7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9dbbff, 0x171020, 2));

const moonLight = new THREE.DirectionalLight(0xffffff, 2.2);
moonLight.position.set(-8, 15, 8);
moonLight.castShadow = true;
scene.add(moonLight);

const cyan = new THREE.MeshStandardMaterial({
  color: 0x00dfff,
  emissive: 0x00aaff,
  emissiveIntensity: 2
});

const pink = new THREE.MeshStandardMaterial({
  color: 0xff20ba,
  emissive: 0xd9008f,
  emissiveIntensity: 2
});

const asphalt = new THREE.MeshStandardMaterial({
  color: 0x161b2a,
  roughness: 0.82
});

const railMetal = new THREE.MeshStandardMaterial({
  color: 0x8994ad,
  metalness: 0.85,
  roughness: 0.25
});

const buildingMaterials = [
  0x141b36, 0x201630, 0x10232f, 0x20213c
].map(color => new THREE.MeshStandardMaterial({
  color,
  metalness: 0.4,
  roughness: 0.7
}));

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

function box(parent, x, y, z, w, h, d, material) {
  const mesh = new THREE.Mesh(boxGeometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Ground and three railway lanes.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({ color: 0x090d18, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.12, -45);
ground.receiveShadow = true;
scene.add(ground);

box(scene, 0, -0.02, -45, 7.8, 0.12, 120, asphalt);

// Three lanes with realistic-looking railway tracks.
for (const lane of [-2.4, 0, 2.4]) {
  for (const offset of [-0.55, 0.55]) {
    box(scene, lane + offset, 0.04, -45, 0.09, 0.12, 120, railMetal);
  }

  for (let i = 0; i < 50; i++) {
    box(scene, lane, -0.015, 10 - i * 2.4, 1.8, 0.1, 0.19,
      new THREE.MeshStandardMaterial({ color: 0x41465a }));
  }

  // Neon strips along each track.
  box(scene, lane - 0.83, 0.04, -45, 0.035, 0.035, 120, cyan);
  box(scene, lane + 0.83, 0.04, -45, 0.035, 0.035, 120, pink);
}

// Futuristic city blocks on both sides.
for (let side of [-1, 1]) {
  for (let i = 0; i < 35; i++) {
    const z = -i * 4 - 7;
    const x = side * (6 + Math.random() * 9);
    const h = 5 + Math.random() * 19;
    const w = 2 + Math.random() * 4;

    box(
      scene, x, h / 2 - 0.1, z,
      w, h, 3 + Math.random() * 3,
      buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)]
    );

    const stripMaterial = Math.random() > 0.5 ? cyan : pink;

    box(scene, x, h * 0.5, z + 1.6, w * 0.7, 0.08, 0.05, stripMaterial);

    for (let row = 1; row < h / 2; row++) {
      box(
        scene,
        x + side * w * 0.2,
        row * 1.1,
        z + 1.53,
        0.12, 0.35, 0.04,
        stripMaterial
      );
    }
  }
}

// Street lamps.
for (let i = 0; i < 20; i++) {
  const z = -i * 6;
  for (const side of [-1, 1]) {
    box(scene, side * 4.8, 2, z, 0.09, 4, 0.09, railMetal);
    box(scene, side * 4.8, 4, z, 0.7, 0.06, 0.12, cyan);
  }
}

// Human character with skeletal animation.
let character = null;

function createFallbackRunner() {
  const runner = new THREE.Group();

  const suit = new THREE.MeshStandardMaterial({
    color: 0x17264a,
    metalness: 0.45,
    roughness: 0.35
  });

  const cyan = new THREE.MeshStandardMaterial({
    color: 0x00eaff,
    emissive: 0x00bfff,
    emissiveIntensity: 2
  });

  const pink = new THREE.MeshStandardMaterial({
    color: 0xff20bd,
    emissive: 0xd9008f,
    emissiveIntensity: 1.5
  });

  function part(geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    runner.add(mesh);
    return mesh;
  }

  // Torso
  part(new THREE.BoxGeometry(0.65, 0.85, 0.35), suit, 0, 1.25, 0);
  part(new THREE.BoxGeometry(0.08, 0.65, 0.04), cyan, 0, 1.27, -0.19);

  // Head and neon visor
  part(new THREE.SphereGeometry(0.25, 20, 16), suit, 0, 1.95, 0);
  part(new THREE.BoxGeometry(0.34, 0.09, 0.32), cyan, 0, 1.98, -0.04);

  // Arms
  const leftArm = part(
    new THREE.BoxGeometry(0.18, 0.65, 0.2), suit, -0.45, 1.3, 0
  );
  const rightArm = part(
    new THREE.BoxGeometry(0.18, 0.65, 0.2), suit, 0.45, 1.3, 0
  );

  leftArm.userData.limb = -1;
  rightArm.userData.limb = 1;

  // Legs
  const leftLeg = part(
    new THREE.BoxGeometry(0.23, 0.65, 0.25), suit, -0.19, 0.42, 0
  );
  const rightLeg = part(
    new THREE.BoxGeometry(0.23, 0.65, 0.25), suit, 0.19, 0.42, 0
  );

  leftLeg.userData.limb = -1;
  rightLeg.userData.limb = 1;
  leftLeg.userData.leg = true;
  rightLeg.userData.leg = true;

  // Neon shoes
  part(new THREE.BoxGeometry(0.3, 0.12, 0.42), pink, -0.19, 0.1, -0.06);
  part(new THREE.BoxGeometry(0.3, 0.12, 0.42), pink, 0.19, 0.1, -0.06);

  runner.userData.proceduralRunner = true;
  return runner;
}


let mixer = null;
let runAction = null;
let jumpAction = null;

const loader = new GLTFLoader();

loader.load(
  'https://threejs.org/examples/models/gltf/Soldier.glb',
  gltf => {
    character = gltf.scene;
    character.traverse(obj => {
  if (obj.isMesh && obj.geometry?.type === 'SphereGeometry') {
    obj.visible = false;
  }
});
    character.scale.setScalar(1.05);
    character.rotation.y = 0;
    character.position.set(0, 0, 0);
    character.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    scene.add(character);
    mixer = new THREE.AnimationMixer(character);

    const runClip = THREE.AnimationClip.findByName(gltf.animations, 'Run');
    const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'Idle');

    if (runClip) {
      runAction = mixer.clipAction(runClip);
      runAction.play();
    } else if (idleClip) {
      runAction = mixer.clipAction(idleClip);
      runAction.play();
    }

    document.getElementById('loading').textContent = '3D CHARACTER READY';
  },
  undefined,
  error => {
    console.error('Character could not load:', error);
    document.getElementById('loading').textContent =
      'Character unavailable. Check your internet connection.';
  }
);

// Reusable 3D obstacles and pickups.
const objects = [];
let score = 0;
let distance = 0;
let energy = 0;
let speed = 13;
let spawnClock = 0;
let playing = false;
let lane = 1;
let jumpHeight = 0;
let jumpVelocity = 0;
let slideTime = 0;
let elapsed = 0;

const laneX = [-2.4, 0, 2.4];

function createObstacle(type, laneIndex, z) {
  const group = new THREE.Group();
  group.position.set(laneX[laneIndex], 0, z);
  scene.add(group);

  if (type === 'train') {
    const body = new THREE.MeshStandardMaterial({
      color: 0x252d49,
      metalness: 0.65,
      roughness: 0.3
    });

    box(group, 0, 1.35, 0, 1.8, 2.7, 6, body);
    box(group, 0, 1.5, 3.03, 1.5, 0.55, 0.08, cyan);
    box(group, 0, 0.35, 0, 1.85, 0.15, 5.8, railMetal);
    box(group, 0, 2.72, 0, 1.82, 0.07, 5.9, pink);
  } else if (type === 'barrier') {
    box(group, 0, 0.55, 0, 1.5, 1.1, 0.3, pink);
    box(group, 0, 1.12, 0, 1.65, 0.08, 0.4, cyan);
  } else if (type === 'gate') {
    box(group, -0.72, 1.2, 0, 0.12, 2.4, 0.14, pink);
    box(group, 0.72, 1.2, 0, 0.12, 2.4, 0.14, pink);
    box(group, 0, 2.35, 0, 1.55, 0.12, 0.14, pink);
  } else {
    const material = new THREE.MeshStandardMaterial({
      color: type === 'coin' ? 0xffdf4d : 0x00f5ff,
      emissive: type === 'coin' ? 0xffa500 : 0x00dfff,
      emissiveIntensity: 2,
      metalness: 0.65,
      roughness: 0.2
    });

    const pickup = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.09, 10, 20),
      material
    );
    pickup.position.y = 1.15;
    group.add(pickup);
    group.userData.pickup = pickup;
  }

  objects.push({
    group,
    type,
    lane: laneIndex,
    z,
    collected: false
  });
}

function spawnWave() {
  const laneIndex = Math.floor(Math.random() * 3);
  const roll = Math.random();

  const type = roll < 0.28 ? 'coin'
    : roll < 0.36 ? 'energy'
    : roll < 0.55 ? 'train'
    : roll < 0.78 ? 'barrier'
    : 'gate';

  createObstacle(type, laneIndex, -65);

  // A trail of coins gives the player a route to follow.
  if (type === 'coin' || type === 'energy') {
    for (let i = 1; i <= 4; i++) {
      createObstacle('coin', laneIndex, -65 - i * 2);
    }
  }
}

function startGame() {
  for (const o of objects) scene.remove(o.group);
  objects.length = 0;

  score = 0;
  distance = 0;
  energy = 0;
  speed = 13;
  spawnClock = 0.7;
  lane = 1;
  jumpHeight = 0;
  jumpVelocity = 0;
  slideTime = 0;
  elapsed = 0;
  playing = true;
  music.play().catch(error => {
  console.log('Music playback:', error);
});

  if (character) character.position.set(0, 0, 0);

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-over').classList.add('hidden');
}

function endGame() {
  playing = false;
  music.pause();
music.currentTime = 0;
  document.getElementById('final-score').textContent =
    `SCORE: ${Math.floor(score)} | DISTANCE: ${Math.floor(distance)} m`;
  document.getElementById('game-over').classList.remove('hidden');
}

function move(name) {
  if (!playing) return;

  if (name === 'left') lane = Math.max(0, lane - 1);
  if (name === 'right') lane = Math.min(2, lane + 1);

  if (name === 'jump' && jumpHeight === 0 && slideTime <= 0) {
    jumpVelocity = 9;
  }

  if (name === 'slide' && jumpHeight === 0) {
    slideTime = 0.7;
  }
}

window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault();
  }

  if (!playing && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
    return;
  }

  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') move('left');
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') move('right');
  if (e.key === 'ArrowUp' || e.key === ' ') move('jump');
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') move('slide');
});

document.querySelectorAll('.mobile-controls button').forEach(button => {
  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    move(button.dataset.action);
  });
});

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', startGame);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  
if (mixer) mixer.update(dt);


const activeRunner = character || fallbackRunner;

if (activeRunner) {
  activeRunner.position.x +=
    (laneX[lane] - activeRunner.position.x) *
    Math.min(1, dt * 12);

  if (activeRunner.userData.proceduralRunner) {
    activeRunner.position.y = jumpHeight;

    activeRunner.children.forEach(part => {
      if (part.userData.leg) {
        part.rotation.x =
          Math.sin(elapsed * 12) * 0.65 *
          (part.userData.limb || 1);
      }

      if (part.userData.limb && !part.userData.leg) {
        part.rotation.x =
          -Math.sin(elapsed * 12) * 0.4 *
          part.userData.limb;
      }
    });
  }
}


  if (playing) {
    speed = Math.min(25, speed + dt * 0.12);
    distance += speed * dt;
    score += speed * dt * 2;

    spawnClock -= dt;
    if (spawnClock <= 0) {
      spawnWave();
      spawnClock = Math.max(0.65, 1.2 - speed * 0.018);
    }

    jumpHeight += jumpVelocity * dt;
    jumpVelocity -= 22 * dt;

    if (jumpHeight < 0) {
      jumpHeight = 0;
      jumpVelocity = 0;
    }

    slideTime = Math.max(0, slideTime - dt);

    if (character) {
      character.position.x += (laneX[lane] - character.position.x) *
        Math.min(1, dt * 12);
      character.position.y = jumpHeight;
      character.scale.y = slideTime > 0 ? 0.65 : 1.05;
    }

    for (const o of objects) {
      o.z += speed * dt;
      o.group.position.z = o.z;

      if (o.group.userData.pickup) {
        o.group.userData.pickup.rotation.y += dt * 3;
        o.group.userData.pickup.rotation.x += dt * 1.5;
      }

      if (!o.collected && o.lane === lane &&
          o.z > -1.2 && o.z < 1.2) {
        if (o.type === 'coin' || o.type === 'energy') {
          o.collected = true;
          o.group.visible = false;
          energy += o.type === 'energy' ? 3 : 1;
          score += o.type === 'energy' ? 250 : 100;
        } else {
          const jumped = jumpHeight > 1.15 &&
            (o.type === 'barrier' || o.type === 'train');

          const slid = slideTime > 0.15 && o.type === 'gate';

          if (!jumped && !slid) {
            endGame();
            break;
          }

          o.collected = true;
        }
      }
    }

    for (let i = objects.length - 1; i >= 0; i--) {
      if (objects[i].z > 8 || objects[i].collected) {
        scene.remove(objects[i].group);
        objects.splice(i, 1);
      }
    }

    document.getElementById('score').textContent = Math.floor(score);
    document.getElementById('distance').textContent =
      Math.floor(distance) + ' m';
    document.getElementById('energy').textContent = energy;
  }

  // Follow camera smoothly tracks the runner.
  const targetX = laneX[lane] * 0.35;
  camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 3);
  camera.position.y = 5.2 + Math.sin(elapsed * 1.7) * 0.04;
  camera.lookAt(targetX * 0.45, 1.1, -8);

  renderer.render(scene, camera);
}

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;

  if (!w || !h) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', resize);

animate();
