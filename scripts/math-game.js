import {
    JUEGOS_CONFIG, comenzarTimer, detenerTimer, obtenerTiempoFinal,
    enviarPuntaje, cargarTablaScores, cargarTablaMejores, recargarScoresTrasEnvio,
    playCorrectSound, playErrorSound,
    mostrarCountdownIniciarJuego
} from './game-commons.js';

// ----- CONFIGURACIÓN DE PROBLEMAS -----
JUEGOS_CONFIG.GAMENAME = 'mathgame';

const NUM_PROBLEMS = 12;
// Rangos para sumas/restas/mult
const SUM_FIRST_DIGIT_MIN = 2;    const SUM_FIRST_DIGIT_MAX = 89;
const SUM_SECOND_DIGIT_MIN = 2;   const SUM_SECOND_DIGIT_MAX = 9;
const REST_FIRST_DIGIT_MIN = 2;   const REST_FIRST_DIGIT_MAX = 29;
const REST_SECOND_DIGIT_MIN = 2;  const REST_SECOND_DIGIT_MAX = 9;
const MULT_FIRST_MIN = 2;         const MULT_FIRST_MAX = 9;
const MULT_SECOND_MIN = 3;        const MULT_SECOND_MAX = 9;

// ----- ELEMENTOS DOM -----
const timerElem = document.querySelector('.timer');
const startBtn = document.querySelector('.compact-start-btn');
const problemsElem = document.querySelector('.problems');
const finalTimeElem = document.querySelector('.final-time');
const newBestElem = document.querySelector('.new-best');
const inputName = document.getElementById('player-name');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');

// ----- VARIABLES -----
let currentProblem = 0;
let problems = [];
let isRunning = false;

// ------- PROBLEMAS --------
function randInt(a, b) {
    return Math.floor(Math.random()*(b-a+1))+a;
}
function generarProblemas(n) {
    const lista = [];
    const tipos = ["suma", "resta", "multi"];
    let tipoIndex = 0;
    for(let i=0; i<n; ++i) {
        let obj = {};
        let tipo = tipos[tipoIndex];
        if(tipo === "suma") {
            obj.tipo = "suma";
            obj.a = randInt(SUM_FIRST_DIGIT_MIN, SUM_FIRST_DIGIT_MAX);
            obj.b = randInt(SUM_SECOND_DIGIT_MIN, SUM_SECOND_DIGIT_MAX);
            obj.resp = obj.a + obj.b;
            obj.texto = `${obj.a} + ${obj.b} =`;
        } else if(tipo === "resta") {
            obj.tipo = "resta";
            obj.a = randInt(REST_FIRST_DIGIT_MIN, REST_FIRST_DIGIT_MAX);
            obj.b = randInt(REST_SECOND_DIGIT_MIN, REST_SECOND_DIGIT_MAX);
            if(obj.a < obj.b) [obj.a, obj.b] = [obj.b, obj.a];
            obj.resp = obj.a - obj.b;
            obj.texto = `${obj.a} – ${obj.b} =`;
        } else {
            obj.tipo = "multi";
            obj.a = randInt(MULT_FIRST_MIN, MULT_FIRST_MAX);
            obj.b = randInt(MULT_SECOND_MIN, MULT_SECOND_MAX);
            obj.resp = obj.a * obj.b;
            obj.texto = `${obj.a} × ${obj.b} =`;
        }
        lista.push(obj);
        tipoIndex = (tipoIndex+1)%tipos.length;
    }
    return lista;
}

// -------- TIMER / JUEGO -----------
function limpiar() {
    problemsElem.innerHTML = "";
    finalTimeElem.style.display = "none";
    newBestElem.style.display = "none";
}
function mostrarProblema(n) {
    // Genera la fila de input SOLO para el actual
    for(let i=problemsElem.children.length; i<=n; ++i) {
        const p = problems[i];
        const row = document.createElement('div');
        row.className = "problem-row";
        const span = document.createElement('span');
        span.className = "symbol";
        span.innerText = p.texto;
        row.appendChild(span);
        const inp = document.createElement('input');
        inp.type = "number";
        inp.autocomplete = "off";
        inp.setAttribute("pattern", "\\d+");
        inp.setAttribute("inputmode", "numeric");
        inp.size = 4;
        if(i !== n) inp.disabled = true;
        row.appendChild(inp);
        problemsElem.appendChild(row);
        if(i===n) {
            inp.addEventListener('keydown', e=>{ if(e.key==="Enter") inp.blur(); });
            inp.addEventListener('input', ()=>{ inp.classList.remove("correct", "incorrect"); });
            inp.addEventListener('blur', ()=>{ revisarRespuesta(inp, p, n); });
            setTimeout(()=>{inp.focus(); inp.select();}, 80);
        }
    }
}
function revisarRespuesta(input, problema, problemaIndex) {
    const val = input.value.trim();
    if(val==="" || isNaN(val)) return;
    if(Number(val) === problema.resp) {
        input.classList.remove("incorrect");
        input.classList.add("correct");
        input.disabled = true;
        playCorrectSound();
        currentProblem++;
        if(currentProblem < problems.length) {
            mostrarProblema(currentProblem);
        } else {
            finalizarJuego();
        }
    } else {
        input.classList.remove("correct");
        input.classList.add("incorrect");
        playErrorSound();
        setTimeout(()=>{input.focus();input.select();}, 90);
    }
}
// --------- INICIO / FINAL ----------
function iniciarJuego() {
    isRunning = true;
    currentProblem = 0;
    problems = generarProblemas(NUM_PROBLEMS);
    limpiar();
    mostrarProblema(0);
    comenzarTimer(timerElem);
    startBtn.innerText = "Reiniciar";
}
function finalizarJuego() {
    isRunning = false;
    let t = obtenerTiempoFinal(timerElem);
    detenerTimer(timerElem);
    finalTimeElem.innerText = `¡Finalizaste en ${t.toFixed(2)}s!`;
    finalTimeElem.style.display = "";
    const playerName = inputName.value.trim();
    enviarPuntaje(playerName, t, JUEGOS_CONFIG.GAMENAME);
    recargarScoresTrasEnvio(JUEGOS_CONFIG.GAMENAME);
}

// ---- EVENTOS -----
startBtn.addEventListener('click', ()=>{
    if (!inputName.value.trim()) {
        alert("Pon tu nombre antes de jugar.");
        inputName.focus();
        return;
    }
    mostrarCountdownIniciarJuego(countdownOverlay, countdownNumber, iniciarJuego);
});

// ---- Cargar tablas Inicial ----
cargarTablaScores(JUEGOS_CONFIG.GAMENAME);
cargarTablaMejores(JUEGOS_CONFIG.GAMENAME);
limpiar();