import {
    JUEGOS_CONFIG, comenzarTimer, detenerTimer, obtenerTiempoFinal, enviarPuntaje,
    cargarTablaScores, cargarTablaMejores, recargarScoresTrasEnvio,
    playCorrectSound, playErrorSound, playClickSound, mostrarCountdownIniciarJuego
} from './game-commons.js';

// Configuración
JUEGOS_CONFIG.GAMENAME = 'memorygame';
const NUM_PAIRS = 6;
const FLIP_DELAY = 1000;
const CARD_SYMBOLS = ['🍎', '🍌', '🍇', '🍓', '🍍', '🥝', '🍒', '🥥', '🍉', '🍑','🦅', '🦆', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟'];

// DOM Elements
const gameBoard = document.getElementById('game-board');
const restartButton = document.getElementById('restart-button');
const timerElem = document.querySelector('.timer');
const finalTimeElem = document.querySelector('.final-time');
const newBestElem = document.querySelector('.new-best');
const inputName = document.getElementById('player-name');

const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let isStarted = false;

// Utilidad: Shuffle
function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Crear cartas mezcladas
function createCards() {
    let selectedSymbols = shuffleArray([...CARD_SYMBOLS]).slice(0, NUM_PAIRS);
    let pairSymbols = [...selectedSymbols, ...selectedSymbols];
    cards = shuffleArray(pairSymbols);
}

// Renderizar el tablero
function renderBoard() {
    gameBoard.innerHTML = '';
    const cols = Math.min(NUM_PAIRS, 4);
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
    cards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        card.innerText = '';
        card.addEventListener('click', onCardClick);
        gameBoard.appendChild(card);
    });
}

// Sonidos: reproducir en flips/clics/match/no-match
function flipCard(card) {
    card.classList.add('flipped');
    card.innerText = card.dataset.symbol;
    playClickSound();
}

function unflipCard(card) {
    card.classList.remove('flipped');
    card.innerText = '';
}

function onCardClick(e) {
    if (!isStarted) return; // Ignora si no ha iniciado
    const clicked = e.currentTarget;
    // Si ya está volteada, emparejada o ya hay 2 volteadas, no hacer nada
    if (flippedCards.length >= 2 || flippedCards.includes(clicked) || clicked.classList.contains('matched'))
        return;
    flipCard(clicked);
    flippedCards.push(clicked);
    if (flippedCards.length === 2) {
        checkMatch();
    }
}

// Lógica de chequeo de par
function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.symbol === card2.dataset.symbol) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs += 1;
        flippedCards = [];
        playCorrectSound();
        if (matchedPairs === NUM_PAIRS) {
            showEndGame();
            detenerTimer(timerElem);
        }
    } else {
        playErrorSound();
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            flippedCards = [];
        }, FLIP_DELAY);
    }
}

// -------- JUEGO: Inicio y reset ----------
function limpiar() {
    gameBoard.innerHTML = '';
    finalTimeElem.style.display = "none";
    newBestElem.style.display = "none";
}

function showEndGame() {
    isStarted = false;
    let t = obtenerTiempoFinal(timerElem);
    finalTimeElem.innerText = `¡Finalizaste en ${t.toFixed(2)}s!`;
    finalTimeElem.style.display = "";
    const playerName = inputName.value.trim();
    enviarPuntaje(playerName, t, JUEGOS_CONFIG.GAMENAME);
    recargarScoresTrasEnvio(JUEGOS_CONFIG.GAMENAME);
}

function iniciarJuego() {
    if (!inputName.value.trim()) {
        alert("Pon tu nombre antes de jugar.");
        inputName.focus();
        return;
    }
    isStarted = true;
    matchedPairs = 0;
    flippedCards = [];
    limpiar();
    createCards();
    renderBoard();
    comenzarTimer(timerElem);
    restartButton.innerText = "Reiniciar";
    finalTimeElem.style.display = "none";
    newBestElem.style.display = "none";
}

// Reiniciar con botón
restartButton.addEventListener('click', ()=>{
    if (!inputName.value.trim()) {
        alert("Pon tu nombre antes de jugar.");
        inputName.focus();
        return;
    }
    mostrarCountdownIniciarJuego(countdownOverlay, countdownNumber, iniciarJuego);
});

// --- Cargar tablas inicial ---
cargarTablaScores(JUEGOS_CONFIG.GAMENAME);
cargarTablaMejores(JUEGOS_CONFIG.GAMENAME);
limpiar();