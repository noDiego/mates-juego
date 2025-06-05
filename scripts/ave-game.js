import {
    JUEGOS_CONFIG, comenzarTimer, detenerTimer, obtenerTiempoFinal,
    enviarPuntaje, cargarTablaScores, cargarTablaMejores, recargarScoresTrasEnvio,
    playCorrectSound, playErrorSound, mostrarCountdownIniciarJuego
} from './game-commons.js';

// ---- CONFIG ----
JUEGOS_CONFIG.GAMENAME = 'avegame';

// ---- CONSTANTES DEL JUEGO ----
const GRID_COLS = 6;
const GRID_ROWS = 4;
const TOTAL_CIRCLES = GRID_COLS * GRID_ROWS;
const INITIAL_BIRD_DURATION = 800; // 0.8 segundos en ms
const DURATION_DECREASE = 40; // 0.04 segundos en ms
const TARGET_POINTS = 20;
const BIRD_EMOJI = '🦅';

// ---- ELEMENTOS DOM ----
const startBtn = document.querySelector('.compact-start-btn');
const timerElem = document.querySelector('.timer');
const finalTimeElem = document.querySelector('.final-time');
const newBestElem = document.querySelector('.new-best');
const inputName = document.getElementById('player-name');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const aveBoardElem = document.querySelector('.ave-board');
const scoreElem = document.querySelector('.score');
// const birdTimerElem = document.querySelector('.bird-timer');

// ---- ESTADO DEL JUEGO ----
let gameRunning = false;
let score = 0;
let currentBirdIndex = -1;
let birdTimeout = null;
let birdDuration = INITIAL_BIRD_DURATION;
let circles = [];
let birdStartTime = 0;
let birdTimerInterval = null;
let fails = 0;
let consecutiveFail = 0;

// ---- FUNCIONES AUXILIARES ----
function getRandomCircleIndex(excludeIndex = -1) {
    let availableIndexes = [];
    for (let i = 0; i < TOTAL_CIRCLES; i++) {
        if (i !== excludeIndex) {
            availableIndexes.push(i);
        }
    }
    return availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
}

function updateUI() {
    scoreElem.textContent = `Aves: ${score}/${TARGET_POINTS}`;
    // birdTimerElem.textContent = `Ave: ${birdDuration}`;
}

function createBoard() {
    aveBoardElem.innerHTML = '';
    circles = [];

    for (let i = 0; i < TOTAL_CIRCLES; i++) {
        const circle = document.createElement('div');
        circle.className = 'ave-circle';
        circle.dataset.index = i;
        circle.addEventListener('click', () => onCircleClick(i));
        aveBoardElem.appendChild(circle);
        circles.push(circle);
    }
}

function showBird() {
    if (!gameRunning) return;

    // Limpiar ave anterior
    hideBird();

    // Elegir nueva posición (nunca la misma)
    currentBirdIndex = getRandomCircleIndex(currentBirdIndex);

    // Mostrar ave
    const circle = circles[currentBirdIndex];
    circle.textContent = BIRD_EMOJI;
    circle.classList.add('has-bird');

    // Iniciar timer visual del ave
    birdStartTime = Date.now();
    startBirdTimer();

    // Programar desaparición
    birdTimeout = setTimeout(() => {
        if (gameRunning && currentBirdIndex !== -1) {
            hideBird();
            showBird(); // Mostrar siguiente ave
        }
    }, birdDuration);
}

function hideBird() {
    if (currentBirdIndex !== -1) {
        const circle = circles[currentBirdIndex];
        circle.textContent = '';
        circle.classList.remove('has-bird');
        currentBirdIndex = -1;
    }

    if (birdTimeout) {
        clearTimeout(birdTimeout);
        birdTimeout = null;
    }

    stopBirdTimer();
}

function startBirdTimer() {
    stopBirdTimer();
    birdTimerInterval = setInterval(() => {
        if (!gameRunning || currentBirdIndex === -1) {
            stopBirdTimer();
            return;
        }

        const elapsed = Date.now() - birdStartTime;
        const remaining = Math.max(0, birdDuration - elapsed);
        // birdTimerElem.textContent = `Ave: ${(remaining / 1000).toFixed(2)}s`;

        if (remaining <= 0) {
            stopBirdTimer();
        }
    }, 50);
}

function stopBirdTimer() {
    if (birdTimerInterval) {
        clearInterval(birdTimerInterval);
        birdTimerInterval = null;
    }
}

function onCircleClick(clickedIndex) {
    if (!gameRunning) return;

    const circle = circles[clickedIndex];

    if (clickedIndex === currentBirdIndex) {
        // ¡Acierto!
        playCorrectSound();
        circle.classList.add('clicked-correct');

        // Incrementar puntuación
        score++;
        consecutiveFail = 0;

        // Reducir duración para próxima ave
        birdDuration = Math.max(100, INITIAL_BIRD_DURATION - ((score-fails) * DURATION_DECREASE));

        updateUI();

        // Limpiar ave actual
        hideBird();

        // Verificar si ganamos
        if (score >= TARGET_POINTS) {
            endGame();
        } else {
            // Mostrar siguiente ave después de un breve delay
            setTimeout(() => {
                if (gameRunning) {
                    circle.classList.remove('clicked-correct');
                    showBird();
                }
            }, 300);
        }

    } else {

        consecutiveFail++;

        if(consecutiveFail < 3) fails++;
        birdDuration = Math.max(100, INITIAL_BIRD_DURATION - ((score-fails) * DURATION_DECREASE));

        // ¡Error!
        playErrorSound();
        circle.classList.add('clicked-wrong');

        // Limpiar animación después de un tiempo
        setTimeout(() => {
            circle.classList.remove('clicked-wrong');
        }, 300);

        // Mover ave actual a nueva posición
        // if (currentBirdIndex !== -1) {
        //     hideBird();
        //     setTimeout(() => {
        //         if (gameRunning) {
        //             showBird();
        //         }
        //     }, 200);
        // }
    }
}

function startGame() {
    gameRunning = true;
    score = 0;
    fails = 0;
    birdDuration = INITIAL_BIRD_DURATION;
    currentBirdIndex = -1;

    limpiar();
    createBoard();
    updateUI();
    comenzarTimer(timerElem);
    startBtn.innerText = "Stop!";

    // Mostrar primera ave después de un breve delay
    setTimeout(() => {
        if (gameRunning) {
            showBird();
        }
    }, 500);
}

function endGame() {
    gameRunning = false;
    let t = obtenerTiempoFinal(timerElem);

    detenerTimer(timerElem);
    hideBird();

    finalTimeElem.innerText = `¡Completaste 20 puntos en ${t.toFixed(2)}s!`;
    finalTimeElem.style.display = "";

    const playerName = inputName.value.trim();
    enviarPuntaje(playerName, t, JUEGOS_CONFIG.GAMENAME);
    recargarScoresTrasEnvio(JUEGOS_CONFIG.GAMENAME);

    startBtn.innerText = "Go!";
}

function limpiar() {
    finalTimeElem.style.display = "none";
    newBestElem.style.display = "none";
    aveBoardElem.innerHTML = "";
    hideBird();
}

// ---- EVENTOS ----
startBtn.addEventListener('click', () => {
    if (!inputName.value.trim()) {
        alert("Pon tu nombre antes de jugar.");
        inputName.focus();
        return;
    }

    if (gameRunning) {
        // Reiniciar juego
        gameRunning = false;
        detenerTimer(timerElem);
        startBtn.innerText = "Go!";
        limpiar();
        return;
    }
    mostrarCountdownIniciarJuego(countdownOverlay, countdownNumber, startGame);
});

// ---- INICIALIZACIÓN ----
cargarTablaScores(JUEGOS_CONFIG.GAMENAME);
cargarTablaMejores(JUEGOS_CONFIG.GAMENAME);
limpiar();
updateUI();