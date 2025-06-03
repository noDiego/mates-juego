// ----- CONFIGURACIÓN -----
const NUM_PROBLEMS = 12; // Cambia esto para más/menos ejercicios
const SUM_FIRST_DIGIT_MIN = 1;
const SUM_FIRST_DIGIT_MAX = 89; // 1 o 2 dígitos
const SUM_SECOND_DIGIT_MIN = 1;
const SUM_SECOND_DIGIT_MAX = 9;
const REST_FIRST_DIGIT_MIN = 1;
const REST_FIRST_DIGIT_MAX = 19;
const REST_SECOND_DIGIT_MIN = 1;
const REST_SECOND_DIGIT_MAX = 9;
const MULT_FIRST_MIN = 2;
const MULT_FIRST_MAX = 9;
const MULT_SECOND_MIN = 2;
const MULT_SECOND_MAX = 9;
const URL = 'https://nodiego-noproxy.onrender.com/mathgame';

// ----- ELEMENTOS -----
const timerElem = document.querySelector('.timer');
const startBtn = document.querySelector('.start-btn');
const bestTimeElem = document.querySelector('.best-time');
const problemsElem = document.querySelector('.problems');
const finalTimeElem = document.querySelector('.final-time');
const newBestElem = document.querySelector('.new-best');

// ----- VARIABLES -----
let startTime = null;
let timerInterval = null;
let currentProblem = 0;
let problems = [];
let isRunning = false;
let bestTime = null;

// ----- SONIDOS -----
// Sonido correcto: "pling" y error: "buzz" - ambos generados sencillos
function playCorrectSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = 880;
        g.gain.value = 0.13;
        o.connect(g).connect(ctx.destination);
        o.start();
        setTimeout(()=>{o.frequency.value=1330;}, 70);
        setTimeout(()=>{
            g.gain.linearRampToValueAtTime(0, ctx.currentTime+0.08);
            o.stop();
            ctx.close();
        },150);
    } catch(e){}
}
function playErrorSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = 290;
        g.gain.value = 0.17;
        o.connect(g).connect(ctx.destination);
        o.start();
        setTimeout(()=>{o.frequency.value=210;}, 60);
        setTimeout(()=>{
            g.gain.linearRampToValueAtTime(0, ctx.currentTime+0.09);
            o.stop();
            ctx.close();
        },140);
    } catch(e){}
}

// ----- UTILIDAD -----
function leerMejorTiempo() {
    const t = localStorage.getItem("mathGame_bestTime");
    if(t) return parseFloat(t);
    return null;
}
function guardarMejorTiempo(newTime) {
    localStorage.setItem("mathGame_bestTime", newTime+"");
}
function mostrarMejorTiempo() {
    bestTime = leerMejorTiempo();
    if(bestTime !== null) {
        bestTimeElem.innerText = "Tu mejor tiempo: " + bestTime.toFixed(2) + "s";
    } else {
        bestTimeElem.innerText = "Tu mejor tiempo: --";
    }
}
function randInt(a, b) {
    return Math.floor(Math.random()*(b-a+1))+a;
}
async function fetchConEspera(url, opciones = {}, reintentos = 8, esperaMs = 1800) {
    let ultimoError;
    for (let i = 0; i < reintentos; i++) {
        try {
            const res = await fetch(url, opciones);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (e) {
            ultimoError = e;
            if (i === 0) {
                // Primer intento falló: podría ser que el server está dormido.
                mostrarCargandoTabla(true);
            }
            await new Promise(r => setTimeout(r, esperaMs));
        }
    }
    mostrarCargandoTabla(false);
    throw ultimoError;
}
function mostrarCargandoTabla(mostrando) {
    const tbody = document.querySelector('.scores-table tbody');
    const tbodyTop = document.querySelector('#tabla-mejores tbody');
    if (mostrando) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="3">⏳ Esperando servidor...</td></tr>`;
        if (tbodyTop) tbodyTop.innerHTML = `<tr><td colspan="3">⏳ Esperando servidor...</td></tr>`;
    } else {
        // Se limpia al cargar realmente los datos
    }
}

// ----- GENERADOR DE PROBLEMAS -----
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
        } else { // multi
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

// ----- TIMER -----
function comenzarTimer() {
    detenerTimer();
    timerElem.innerText = "⏱ 0.00s";
    startTime = performance.now();
    timerInterval = setInterval(()=>{
        if(!startTime) return;
        const t = (performance.now()-startTime)/1000;
        timerElem.innerText = `⏱ ${t.toFixed(2)}s`;
    }, 33);
}
function detenerTimer() {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

// ----- JUEGO -----
function limpiar() {
    problemsElem.innerHTML = "";
    finalTimeElem.style.display = "none";
    newBestElem.style.display = "none";
}
function iniciarJuego() {
    isRunning = true;
    currentProblem = 0;
    problems = generarProblemas(NUM_PROBLEMS);
    limpiar();
    mostrarProblema(0);
    comenzarTimer();
    startBtn.innerText = "Reiniciar";
}

// ----- CREAR PROBLEMAS HTML -----
function mostrarProblema(n) {
    // Para el primero o cada vez que resuelva correctamente el anterior
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

        // Si no es el actual, desactivar (cuando sea correcto)
        if(i !== n) inp.disabled = true;

        row.appendChild(inp);
        problemsElem.appendChild(row);

        // Si es el actual, le ponemos eventos:
        if(i===n) {
            inp.addEventListener('keydown', e=>{
                // Para responder más rápido con Enter:
                if(e.key==="Enter") inp.blur();
            });
            inp.addEventListener('input', ()=>{
                // Limpia clases al editar
                inp.classList.remove("correct", "incorrect");
            });
            inp.addEventListener('blur', ()=>{
                revisarRespuesta(inp, p, n);
            });
            setTimeout(()=>{inp.focus(); inp.select();}, 80); // pone el foco
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
        // Mostrar el siguiente problema o finalizar:
        currentProblem++;
        if(currentProblem<problems.length) {
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

function finalizarJuego() {
    detenerTimer();
    isRunning = false;
    // Calcular tiempo final
    let t = (performance.now()-startTime)/1000;
    finalTimeElem.innerText = `¡Finalizaste en ${t.toFixed(2)}s!`;
    finalTimeElem.style.display = "";

    const playerName = document.getElementById('player-name').value.trim();
    enviarPuntaje(playerName, t);

    // Mejor tiempo
    let oldBest = leerMejorTiempo();
    if(!oldBest || t<oldBest) {
        guardarMejorTiempo(t);
        newBestElem.style.display = "";
        mostrarMejorTiempo();
    }
    recargarScoresTrasEnvio();
}

function enviarPuntaje(nombre, puntaje) {
    fetch(URL+'/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre, score: puntaje })
    })
        .then(res => res.json())
        .then(data => {
            console.log('Puntaje enviado');
        })
        .catch(err => {
            console.warn("No se pudo enviar el puntaje al servidor:", err);
        });
}

// ---- Tabla de Últimos Intentos ----
async function cargarTablaScores() {
    try {
        const scores = await fetchConEspera(URL + '/scores?limit=6');
        const tbody = document.querySelector('.scores-table tbody');
        tbody.innerHTML = "";
        for(const s of scores) {

            const tr = document.createElement('tr');
            const fecha = new Date(s.date); // Formatea fecha
            const fechaStr = fecha.toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            tr.innerHTML = `
          <td>${s.name ? s.name.replace(/</g, "&lt;") : '-'}</td>
          <td>${Number(s.score).toFixed(2)}</td>
          <td style="font-size:0.92em;">${fechaStr}</td>
        `;
            tbody.appendChild(tr);

        }
    } catch(e) {
        const tbody = document.querySelector('.scores-table tbody');
        tbody.innerHTML = `<tr><td colspan="3" style="color:red">Sin conexión al servidor</td></tr>`;
        console.warn("No se pudo obtener /scores:", e);
    } finally {
        mostrarCargandoTabla(false);
    }
}

async function cargarTablaMejores() {
    try {
        const scores = await fetchConEspera(URL + '/scores/top?limit=10');
        const tbody = document.querySelector('#tabla-mejores tbody');
        tbody.innerHTML = "";
        for(const s of scores) {

            const fecha = new Date(s.date);
            const fechaStr = fecha.toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const tr = document.createElement('tr');
            tr.innerHTML = `
          <td>${s.name ? s.name.replace(/</g, "&lt;") : '-'}</td>
          <td>${Number(s.score).toFixed(2)}</td>
          <td style="font-size:0.92em;">${fechaStr}</td>
        `;
            tbody.appendChild(tr);

        }
    } catch(e) {
        const tbody = document.querySelector('#tabla-mejores tbody');
        tbody.innerHTML = `<tr><td colspan="3" style="color:red">Sin conexión al servidor</td></tr>`;
        console.warn("No se pudo obtener /scores/top:", e);
    } finally {
        mostrarCargandoTabla(false);
    }
}

function recargarScoresTrasEnvio() {
    setTimeout(() => {
        cargarTablaScores();
        cargarTablaMejores();
    }, 1000);
}


// ----- EVENTOS -----
startBtn.addEventListener('click', ()=>{
    const nameInput = document.getElementById("player-name");
    const playerName = nameInput.value.trim();
    if (!playerName) {
        alert("Pon tu nombre antes de jugar.");
        nameInput.focus();
        return;
    }
    if(isRunning) {
        if(!confirm("¿Reiniciar el juego? Se perderá el progreso actual.")) return;
    }
    iniciarJuego();
});

// Al cargar, inicializa:
mostrarMejorTiempo();
cargarTablaScores();
cargarTablaMejores()
limpiar();