import {
    JUEGOS_CONFIG, comenzarTimer, detenerTimer, obtenerTiempoFinal,
    enviarPuntaje, cargarTablaScores, cargarTablaMejores, recargarScoresTrasEnvio,
    playErrorSound, mostrarCountdownIniciarJuego
} from './game-commons.js';

// ---- CONFIG ----
JUEGOS_CONFIG.GAMENAME = 'fallingboxes';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.querySelector('.start-btn');
const timerElem = document.querySelector('.timer');
const finalTimeElem = document.querySelector('.final-time');
const newBestElem = document.querySelector('.new-best');
const inputName = document.getElementById('player-name');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');

// ---- CONSTANTES DEL JUEGO ----
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const PLAYER_RADIUS = 15;
const PLAYER_Y = CANVAS_HEIGHT - 40;
const PLAYER_SPEED = 6;
const BOX_SIZE = 20;
const INITIAL_BOX_SPEED = 2;
const SPEED_INCREMENT = 0.03;
const INITIAL_SPAWN_RATE = 90; // frames entre cajas
const MIN_SPAWN_RATE = 25;
const SPAWN_RATE_DECREASE = 2.8;

// ---- ESTADO DEL JUEGO ----
let gameRunning = false;
let player = { x: CANVAS_WIDTH / 2, y: PLAYER_Y };
let boxes = [];
let keys = {};
let frameCount = 0;
let nextBoxSpawn = INITIAL_SPAWN_RATE;
let currentSpawnRate = INITIAL_SPAWN_RATE;
let currentBoxSpeed = INITIAL_BOX_SPEED;
let animationId = null;

// ---- CONTROLES ----
let handleKeyDown, handleKeyUp;

function enableGameControls() {
    handleKeyDown = (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
            e.key === 'a' || e.key === 'd') {
            e.preventDefault();
        }
    };
    handleKeyUp = (e) => {
        keys[e.key.toLowerCase()] = false;
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function disableGameControls() {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}


// ---- UTILIDADES ----
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ---- LÓGICA DEL JUEGO ----
function createBox() {
    // La caja aparece en la parte superior
    const startX = random(50, CANVAS_WIDTH - 50);

    // Punto objetivo cerca del área del jugador
    const targetX = random(PLAYER_RADIUS, CANVAS_WIDTH - PLAYER_RADIUS);
    const targetY = PLAYER_Y;

    // Calcular velocidad diagonal hacia el objetivo
    const dx = targetX - startX;
    const dy = targetY - 0;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalizar y aplicar velocidad con variación aleatoria
    const speedVariation = random(0.8, 1.2);
    const speed = currentBoxSpeed * speedVariation;

    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;

    // Añadir algo de variación al ángulo
    const angleVariation = random(-0.3, 0.3);
    const cos = Math.cos(angleVariation);
    const sin = Math.sin(angleVariation);

    return {
        x: startX,
        y: 0,
        vx: vx * cos - vy * sin,
        vy: vx * sin + vy * cos,
        size: BOX_SIZE,
        rotation: 0,
        rotationSpeed: random(-0.1, 0.1)
    };
}

function updatePlayer() {
    // Movimiento del jugador
    if (keys['arrowleft'] || keys['a']) {
        player.x -= PLAYER_SPEED;
    }
    if (keys['arrowright'] || keys['d']) {
        player.x += PLAYER_SPEED;
    }

    // Mantener jugador dentro de los límites
    player.x = Math.max(PLAYER_RADIUS, Math.min(CANVAS_WIDTH - PLAYER_RADIUS, player.x));
}

function updateBoxes() {
    // Actualizar posición de las cajas
    for (let i = boxes.length - 1; i >= 0; i--) {
        const box = boxes[i];
        box.x += box.vx;
        box.y += box.vy;
        box.rotation += box.rotationSpeed;

        // Eliminar cajas que salen de la pantalla
        if (box.y > CANVAS_HEIGHT + 50 ||
            box.x < -50 || box.x > CANVAS_WIDTH + 50) {
            boxes.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (const box of boxes) {
        const dist = distance(player.x, player.y, box.x, box.y);
        if (dist < PLAYER_RADIUS + box.size / 1.5) {
            return true; // Colisión detectada
        }
    }
    return false;
}

function spawnBox() {
    if (frameCount >= nextBoxSpawn) {
        boxes.push(createBox());

        // Calcular próximo spawn (más frecuente con el tiempo)
        currentSpawnRate = Math.max(MIN_SPAWN_RATE,
            currentSpawnRate - SPAWN_RATE_DECREASE);
        nextBoxSpawn = frameCount + currentSpawnRate;

        // Incrementar velocidad gradualmente
        currentBoxSpeed += SPEED_INCREMENT;
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(2, 2, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Jugador
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, PLAYER_RADIUS);
    gradient.addColorStop(0, '#5ef');
    gradient.addColorStop(1, '#1ad');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0077b6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function drawBoxes() {
    boxes.forEach(box => {
        ctx.save();
        ctx.translate(box.x, box.y);
        ctx.rotate(box.rotation);

        // Sombra de la caja
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-box.size/2 + 2, -box.size/2 + 2, box.size, box.size);

        // Caja principal
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-box.size/2, -box.size/2, box.size, box.size);

        // Borde de la caja
        ctx.strokeStyle = '#5D2D0A';
        ctx.lineWidth = 2;
        ctx.strokeRect(-box.size/2, -box.size/2, box.size, box.size);

        // Detalles de la caja
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-box.size/2 + 3, -box.size/2 + 3);
        ctx.lineTo(box.size/2 - 3, box.size/2 - 3);
        ctx.moveTo(box.size/2 - 3, -box.size/2 + 3);
        ctx.lineTo(-box.size/2 + 3, box.size/2 - 3);
        ctx.stroke();

        ctx.restore();
    });
}

function drawBackground() {
    // El fondo ya está en CSS, pero podemos añadir efectos
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 10; i++) {
        const x = (frameCount * 0.5 + i * 50) % (CANVAS_WIDTH + 50) - 25;
        const y = (frameCount * 0.3 + i * 30) % (CANVAS_HEIGHT + 30) - 15;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawBackground();
    drawBoxes();
    drawPlayer();

    // Información del juego
    ctx.fillStyle = '#0077b6';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    // ctx.fillText(`Cajas: ${boxes.length}`, 10, 25);
    // ctx.fillText(`Velocidad: ${currentBoxSpeed.toFixed(1)}`, 10, 45);
}

function gameLoop() {
    if (!gameRunning) return;

    frameCount++;

    updatePlayer();
    updateBoxes();
    spawnBox();

    if (checkCollisions()) {
        endGame();
        return;
    }

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    frameCount = 0;
    boxes = [];
    player.x = CANVAS_WIDTH / 2;
    currentSpawnRate = INITIAL_SPAWN_RATE;
    currentBoxSpeed = INITIAL_BOX_SPEED;
    nextBoxSpawn = INITIAL_SPAWN_RATE;

    limpiar();
    comenzarTimer(timerElem);
    startBtn.innerText = "Reiniciar";

    enableGameControls();

    gameLoop();
}

function endGame() {
    gameRunning = false;
    let t = obtenerTiempoFinal(timerElem);

    detenerTimer(timerElem);

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    playErrorSound();

    finalTimeElem.innerText = `¡Sobreviviste ${t.toFixed(2)} segundos!`;
    finalTimeElem.style.display = "";

    const playerName = inputName.value.trim();
    enviarPuntaje(playerName, t, JUEGOS_CONFIG.GAMENAME);
    recargarScoresTrasEnvio(JUEGOS_CONFIG.GAMENAME);

    disableGameControls();
}

function limpiar() {
    finalTimeElem.style.display = "none";
    newBestElem.style.display = "none";
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// ---- EVENTOS ----
startBtn.addEventListener('click', () => {
    if (!inputName.value.trim()) {
        alert("Pon tu nombre antes de jugar.");
        inputName.focus();
        return;
    }

    if (gameRunning) {
        gameRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        detenerTimer(timerElem);
        startBtn.innerText = "Comenzar";
        limpiar();
        return;
    }

    mostrarCountdownIniciarJuego(countdownOverlay, countdownNumber, startGame);
});

// ---- INICIALIZACIÓN ----
cargarTablaScores(JUEGOS_CONFIG.GAMENAME);
cargarTablaMejores(JUEGOS_CONFIG.GAMENAME);
limpiar();

// Dibujar estado inicial
drawPlayer();