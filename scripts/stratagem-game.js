import {
    JUEGOS_CONFIG, comenzarTimer, detenerTimer, obtenerTiempoFinal,
    enviarPuntaje, cargarTablaScores, cargarTablaMejores, recargarScoresTrasEnvio, mostrarCountdownIniciarJuego
} from './game-commons.js';

// ---- SISTEMA DE SONIDOS ----
class SoundManager {
    constructor() {
        this.sounds = {};
        this.bgMusic = null;
        this.loadSounds();
    }

    loadSounds() {
        // Cargar efectos de sonido
        this.sounds.key = new Audio('./sounds/sh_key.mp3');
        this.sounds.complete = new Audio('./sounds/sh_complete.mp3');
        this.sounds.gameover = new Audio('./sounds/sh_gameover.mp3');
        this.sounds.error = new Audio('./sounds/sh_error.mp3');

        // Cargar música de fondo
        this.bgMusic = new Audio('./sounds/sh_bgmusic.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3; // Música de fondo más suave

        // Configurar volúmenes
        this.sounds.key.volume = 0.7;
        this.sounds.complete.volume = 0.8;
        this.sounds.gameover.volume = 0.9;

        // Precargar sonidos
        Object.values(this.sounds).forEach(sound => {
            sound.preload = 'auto';
        });
        this.bgMusic.preload = 'auto';
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            // Reiniciar el sonido para permitir reproducción múltiple rápida
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => {
                console.log(`No se pudo reproducir el sonido ${soundName}:`, e);
            });
        }
    }

    playBGMusic() {
        if (this.bgMusic) {
            this.bgMusic.currentTime = 0;
            this.bgMusic.play().catch(e => {
                console.log('No se pudo reproducir la música de fondo:', e);
            });
        }
    }

    stopBGMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
    }

    pauseBGMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    }

    resumeBGMusic() {
        if (this.bgMusic) {
            this.bgMusic.play().catch(e => {
                console.log('No se pudo reanudar la música de fondo:', e);
            });
        }
    }
}

// Crear instancia del manejador de sonidos
const soundManager = new SoundManager();

// ---- FUNCIONES DE SONIDO ----
function playKeySound() {
    soundManager.playSound('key');
}

function playGameOverSound() {
    soundManager.playSound('gameover');
}

function playBGMusic() {
    soundManager.playBGMusic();
}

function playCompleteSound() {
    soundManager.playSound('complete');
}

function playErrorSound() {
    soundManager.playSound('error');
}

// ---- CONFIG ----
JUEGOS_CONFIG.GAMENAME = 'stratagemhero';

// ---- CONSTANTES DEL JUEGO ----
const INITIAL_TIME = 10000; // 10 segundos
const TIME_WARNING_PERCENT = 25; // Aviso cuando queda 25% del tiempo
const INITIAL_FACTOR = 0.3 // Factor inicial para tiempo ganado
const FACTOR_REDUCTION = 0.06; // Reducción del factor
const FACTOR_REDUCTION_INTERVAL = 7000; // Cada 7 segundos (en ms)
const FACTOR_MIN = 0.15;
// Configurable: 'small', 'medium', 'large', 'xlarge' o un valor en px
const ARROW_SIZE = 'medium'; // Cambia esto para ajustar el tamaño



// ---- STRATAGEMS DATA ----
const STRATAGEMS = [
    { name: "Reinforcements", sequence: "UDRLU", image: "images/stratagems/Reinforce_Icon.svg" },
    { name: "Resupply", sequence: "DDUR", image: "images/stratagems/Resupply_Icon.svg" },
    { name: "Hellbomb", sequence: "DULDURDU", image: "images/stratagems/Hellbomb_Icon.svg" },
    { name: "Orbital Laser", sequence: "RDURU", image: "images/stratagems/Orbital_Laser_Icon.svg" },
    { name: "Orbital EMS Strike", sequence: "RRLD", image: "images/stratagems/Orbital_EMS_Strike_Icon.svg" },
    { name: "Orbital 120MM", sequence: "RRULRU", image: "images/stratagems/Orbital_120MM_HE_Barrage_Icon.svg" },
    { name: "Orbital 380MM", sequence: "RDUULDD", image: "images/stratagems/Orbital_380MM_HE_Barrage_Icon.svg" },
    { name: "Precision Strike", sequence: "RRU", image: "images/stratagems/Orbital_Precision_Strike_Icon.svg" },
    { name: "Eagle Smoke", sequence: "URUD", image: "images/stratagems/Eagle_Smoke_Strike_Icon.svg" },
    { name: "Eagle Airstrike", sequence: "URDR", image: "images/stratagems/Eagle_Airstrike_Icon.svg" },
    { name: "Eagle Cluster Bomb", sequence: "URDDR", image: "images/stratagems/Eagle_Cluster_Bomb_Icon.svg" },
    { name: "Eagle Napalm", sequence: "URDU", image: "images/stratagems/Eagle_Napalm_Airstrike_Icon.svg" },
    { name: "Eagle Strafing Run", sequence: "URR", image: "images/stratagems/Eagle_Strafing_Run_Icon.svg" },
    { name: "Anti-Tank Mines", sequence: "DLUU", image: "images/stratagems/Anti-Tank_Mines_Icon.svg" },
    { name: "Gas Mines", sequence: "DLLR", image: "images/stratagems/Gas_Mines_Icon.svg" },
    { name: "Tesla Tower", sequence: "DURULR", image: "images/stratagems/Tesla_Tower_Icon.svg" },
    { name: "Shield Generator Pack", sequence: "DULRLR", image: "images/stratagems/Shield_Generator_Pack_Icon.svg" },
    { name: "Jump Pack", sequence: "DUUDDU", image: "images/stratagems/Jump_Pack_Icon.svg" },
    { name: "Wencho", sequence: "UDDDDDDU", image: "images/stratagems/Wencho.png" },
    { name: "Supply Pack", sequence: "DLDUUD", image: "images/stratagems/Supply_Pack_Icon.svg" }
];

// ---- ELEMENTOS DOM ----
const startBtn = document.querySelector('.compact-start-btn');
const timerElem = document.querySelector('.timer');
const finalTimeElem = document.querySelector('.final-time');
const newBestElem = document.querySelector('.new-best');
const inputName = document.getElementById('player-name');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
// const scoreElem = document.querySelector('.score');
// const stratagemsLeftElem = document.querySelector('.stratagems-left');
const stratagemNameElem = document.querySelector('.stratagem-name');
const stratagemSequenceElem = document.querySelector('.stratagem-sequence');
const stratagemImageElem = document.querySelector('.stratagem-image'); // NUEVO
const timeBarElem = document.querySelector('.time-bar');
const virtualKeyboard = document.getElementById('virtual-keyboard');
const arrowButtons = document.querySelectorAll('.arrow-btn');

// ---- ESTADO DEL JUEGO ----
let gameState = {
    active: false,
    timeLeft: INITIAL_TIME,
    currentStratagem: null,
    userInput: "",
    stratagemsCompleted: 0,
    gameStartTime: 0,
    timeFactor: INITIAL_FACTOR,
    lastFactorUpdate: 0
};

// ---- FUNCIONES AUXILIARES ----

function setArrowSize(size) {
    let sizeValue;
    if (typeof size === 'string') {
        switch(size) {
            case 'small': sizeValue = '25px'; break;
            case 'medium': sizeValue = '32px'; break;
            case 'large': sizeValue = '45px'; break;
            case 'xlarge': sizeValue = '55px'; break;
            default: sizeValue = '35px';
        }
    } else {
        sizeValue = size + 'px';
    }

    document.documentElement.style.setProperty('--arrow-size', sizeValue);
}

function getRandomStratagem() {
    return STRATAGEMS[Math.floor(Math.random() * STRATAGEMS.length)];
}

function updateTimeFactor() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - gameState.gameStartTime;

    // Calcular cuántas reducciones de factor deberían haber ocurrido
    const factorReductions = Math.floor(elapsedTime / FACTOR_REDUCTION_INTERVAL);
    gameState.timeFactor = Math.max(FACTOR_MIN, INITIAL_FACTOR - (factorReductions * FACTOR_REDUCTION));
}

function updateUI() {
    updateTimeFactor();

    if (gameState.currentStratagem) {
        stratagemNameElem.textContent = gameState.currentStratagem.name;
        updateStratagemImage(); // NUEVO
        updateSequenceDisplay();
    }

    updateTimeBar();
}

function updateStratagemImage() {
    const stratagem = gameState.currentStratagem;
    if (!stratagem) {
        stratagemImageElem.innerHTML = '';
        return;
    }

    stratagemImageElem.innerHTML = '';

    if (stratagem.image) {
        const img = document.createElement('img');
        img.src = stratagem.image;
        img.alt = stratagem.name;

        // Manejar error de carga
        img.onerror = function() {
            stratagemImageElem.innerHTML = '⚡'; // Fallback emoji
        };

        stratagemImageElem.appendChild(img);
    }
}

function updateSequenceDisplay() {
    const stratagem = gameState.currentStratagem;
    if (!stratagem) return;

    stratagemSequenceElem.innerHTML = '';

    for (let i = 0; i < stratagem.sequence.length; i++) {
        const arrow = document.createElement('div');
        arrow.className = 'sequence-arrow';

        // Crear imagen en lugar de texto
        const img = document.createElement('img');
        img.src = getArrowImagePath(stratagem.sequence[i]);
        img.alt = getArrowSymbol(stratagem.sequence[i]);

        // Manejar error de carga de imagen
        img.onerror = function() {
            // Si la imagen no carga, mostrar el símbolo de texto como fallback
            arrow.innerHTML = getArrowSymbol(stratagem.sequence[i]);
            arrow.style.fontSize = '1.4rem';
            arrow.style.fontWeight = 'bold';
            arrow.style.background = '#e9ecef';
            arrow.style.border = '2px solid #adb5bd';
        };

        arrow.appendChild(img);

        if (i < gameState.userInput.length) {
            if (gameState.userInput[i] === stratagem.sequence[i]) {
                arrow.classList.add('correct');
            } else {
                arrow.classList.add('error');
            }
        }

        stratagemSequenceElem.appendChild(arrow);
    }
}

function getArrowImagePath(direction) {
    const imagePaths = {
        'U': 'images/stratagemhero/U.png',
        'D': 'images/stratagemhero/D.png',
        'L': 'images/stratagemhero/L.png',
        'R': 'images/stratagemhero/R.png'
    };
    return imagePaths[direction] || '';
}

function getArrowSymbol(direction) {
    const symbols = { 'U': '↑', 'D': '↓', 'L': '←', 'R': '→' };
    return symbols[direction] || direction;
}

function updateTimeBar() {
    const percentage = (gameState.timeLeft / INITIAL_TIME) * 100;
    timeBarElem.style.width = Math.max(0, percentage) + '%';
}

function processInput(direction) {
    if (!gameState.active || !gameState.currentStratagem) return;

    const stratagem = gameState.currentStratagem;
    gameState.userInput += direction;

    // Verificar si la entrada es correcta hasta ahora
    const isCorrect = stratagem.sequence.startsWith(gameState.userInput);

    if (!isCorrect) {
        // Entrada incorrecta
        playErrorSound();
        gameState.userInput = "";
        updateSequenceDisplay();

        // Mostrar error en toda la secuencia
        setTimeout(() => {
            updateSequenceDisplay();
        }, 300);

        return;
    }

    playKeySound();
    updateSequenceDisplay();

    // Verificar si completó el stratagem
    if (gameState.userInput === stratagem.sequence) {
        playCompleteSound();

        // Calcular tiempo ganado: factor × longitud del stratagem
        updateTimeFactor();
        const timeGained = Math.floor(gameState.timeFactor * stratagem.sequence.length * 1000);
        gameState.timeLeft += timeGained;

        // Limitar el tiempo máximo
        if (gameState.timeLeft > INITIAL_TIME * 2) {
            gameState.timeLeft = INITIAL_TIME * 2;
        }

        gameState.stratagemsCompleted++;
        nextStratagem();
    }
}

function nextStratagem() {
    gameState.currentStratagem = getRandomStratagem();
    gameState.userInput = "";
    updateUI();
}

function gameLoop() {
    if (!gameState.active) return;

    gameState.timeLeft -= 10; // Decrementar cada 10ms

    if (gameState.timeLeft <= 0) {
        endGame();
        return;
    }

    updateUI();
    setTimeout(gameLoop, 10);
}

function startGame() {
    gameState = {
        active: true,
        timeLeft: INITIAL_TIME,
        currentStratagem: getRandomStratagem(),
        userInput: "",
        stratagemsCompleted: 0,
        gameStartTime: Date.now(),
        timeFactor: INITIAL_FACTOR,
        lastFactorUpdate: 0
    };

    limpiar();
    comenzarTimer(timerElem);
    startBtn.innerText = "Stop!";

    // Iniciar música de fondo
    playBGMusic();

    updateUI();
    gameLoop();
}

function endGame() {
    gameState.active = false;
    let finalTime = obtenerTiempoFinal(timerElem);

    detenerTimer(timerElem);

    // Detener música de fondo y reproducir sonido de game over
    soundManager.stopBGMusic();
    playGameOverSound();

    finalTimeElem.innerText = `¡Duraste ${finalTime.toFixed(2)}s! | Acivaste: ${gameState.stratagemsCompleted} stratagemas`;
    finalTimeElem.style.display = "";

    const playerName = inputName.value.trim();
    enviarPuntaje(playerName, finalTime, JUEGOS_CONFIG.GAMENAME);
    recargarScoresTrasEnvio(JUEGOS_CONFIG.GAMENAME, true); // true para puntajes altos

    startBtn.innerText = "Go!";
}

function limpiar() {
    finalTimeElem.style.display = "none";
    newBestElem.style.display = "none";
    stratagemNameElem.textContent = "Preparando...";
    stratagemImageElem.innerHTML = ''; // NUEVO
    stratagemSequenceElem.innerHTML = "";
    timeBarElem.style.width = "100%";
    timeBarElem.classList.remove('warning');
}

// Función para detectar si es dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768);
}

// Mostrar/ocultar teclado virtual según el dispositivo
function toggleVirtualKeyboard() {
    if (isMobileDevice()) {
        virtualKeyboard.style.display = 'block';
    } else {
        virtualKeyboard.style.display = 'none';
    }
}

// ---- EVENTOS ----
startBtn.addEventListener('click', () => {
    if (!inputName.value.trim()) {
        alert("Pon tu nombre antes de jugar.");
        inputName.focus();
        return;
    }

    if (gameState.active) {
        // Detener juego
        gameState.active = false;
        detenerTimer(timerElem);
        soundManager.stopBGMusic(); // Detener música al parar manualmente
        startBtn.innerText = "Go!";
        limpiar();
        return;
    }

    mostrarCountdownIniciarJuego(countdownOverlay, countdownNumber, startGame);
});

// Controles de flechas (botones)
arrowButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        if (direction) {
            processInput(direction);

            // Efecto visual mejorado
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        }
    });

    // Prevenir comportamientos no deseados en móvil
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        if (direction) {
            processInput(direction);
        }
    });
});


// Controles de teclado
document.addEventListener('keydown', (e) => {
    if (!gameState.active) return;

    let direction = null;
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            direction = 'U';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            direction = 'D';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            direction = 'L';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            direction = 'R';
            break;
    }

    if (direction) {
        e.preventDefault();
        processInput(direction);
    }
});

// Manejar visibilidad de la página para pausar/reanudar música
document.addEventListener('visibilitychange', () => {
    if (gameState.active) {
        if (document.hidden) {
            soundManager.pauseBGMusic();
        } else {
            soundManager.resumeBGMusic();
        }
    }
});
window.addEventListener('resize', toggleVirtualKeyboard);

// ---- INICIALIZACIÓN ----
cargarTablaScores(JUEGOS_CONFIG.GAMENAME);
cargarTablaMejores(JUEGOS_CONFIG.GAMENAME, true); // true para mejores puntajes (más alto es mejor)
limpiar();
updateUI();
setArrowSize(ARROW_SIZE);
toggleVirtualKeyboard();
