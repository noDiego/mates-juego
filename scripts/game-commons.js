// Configuración principal (puede sobreescribir en cada juego)
export const JUEGOS_CONFIG = {
    URL: 'https://nodiego.duckdns.org/score/api',
    GAMENAME: '',
    LIMIT: 5,
    LIMIT_TOP: 5
};

// ------ Timer reutilizable -------
export function comenzarTimer(timerElem) {
    detenerTimer(timerElem);
    timerElem.innerText = '⏱ 0.00s';
    timerElem._startTime = performance.now();
    timerElem._timerInterval = setInterval(() => {
        const t = (performance.now() - timerElem._startTime) / 1000;
        timerElem.innerText = `⏱ ${t.toFixed(2)}s`;
    }, 33);
}
export function detenerTimer(timerElem) {
    if (timerElem._timerInterval) clearInterval(timerElem._timerInterval);
    timerElem._timerInterval = null;
    timerElem._startTime = null;
}
export function obtenerTiempoFinal(timerElem) {
    if (!timerElem._startTime) return 0;
    return (performance.now() - timerElem._startTime) / 1000;
}

// ----- Sonidos reutilizables -----
export function playCorrectSound() {
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
        setTimeout(()=>{ g.gain.linearRampToValueAtTime(0, ctx.currentTime+0.08); o.stop(); ctx.close(); },150);
    } catch(e){}
}
export function playErrorSound() {
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
        setTimeout(()=>{ g.gain.linearRampToValueAtTime(0, ctx.currentTime+0.09); o.stop(); ctx.close(); },140);
    } catch(e){}
}
export function playClickSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = 540;
        g.gain.value = 0.12;
        o.connect(g).connect(ctx.destination);
        o.start();
        setTimeout(()=>{
            g.gain.linearRampToValueAtTime(0, ctx.currentTime+0.05); o.stop(); ctx.close();
        },89);
    } catch(e){}
}

// ----- Countdown (opcional) ------
export function mostrarCountdownIniciarJuego(overlay, numSpan, callbackDespues) {
    overlay.classList.add('show');
    numSpan.innerText = "";
    let count = 3;
    function mostrarNumero(n) {
        if (n > 0) {
            numSpan.innerText = n;
            numSpan.style.color = n === 1 ? "#43aa8b" : "#fff";
            numSpan.style.animation = 'none'; void numSpan.offsetWidth; numSpan.style.animation = '';
            playCountdownBeep(n);
            setTimeout(()=>mostrarNumero(n-1), 850);
        } else {
            numSpan.innerText = "¡YA!";
            numSpan.style.color = "#ffd60a";
            numSpan.style.animation = "";
            playGoSound();
            setTimeout(() => {
                overlay.classList.remove('show');
                numSpan.innerText = '';
                callbackDespues && callbackDespues();
            }, 730);
        }
    }
    mostrarNumero(count);
}
export function playCountdownBeep(n, isLastBeep = false) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        if (isLastBeep || n === 1) {
            o.type = "square";
            o.frequency.value = 800;
            g.gain.value = 0.3;
            g.gain.setValueAtTime(0, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            o.start(); o.stop(ctx.currentTime + 0.4);
        } else {
            o.type = "sine";
            o.frequency.value = 400;
            g.gain.value = 0.2;
            g.gain.setValueAtTime(0, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            o.start(); o.stop(ctx.currentTime + 0.15);
        }
        o.connect(g); g.connect(ctx.destination);
        setTimeout(() => { ctx.close(); }, isLastBeep ? 500 : 200);
    } catch(e) {}
}
export function playGoSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = 1240;
        g.gain.value = 0.17;
        o.connect(g).connect(ctx.destination);
        o.start();
        setTimeout(()=>{ o.frequency.value=1960; }, 90);
        setTimeout(()=>{ g.gain.linearRampToValueAtTime(0, ctx.currentTime+0.15); o.stop(); ctx.close(); }, 290);
    } catch(e){}
}

// ------ Utilidad fetch con reintentos ------
export async function fetchConEspera(url, opciones = {}, reintentos = 8, esperaMs = 1800) {
    let ultimoError;
    for (let i = 0; i < reintentos; i++) {
        try {
            const res = await fetch(url, opciones);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (e) {
            ultimoError = e;
            if (i === 0) mostrarCargandoTabla(true);
            await new Promise(r => setTimeout(r, esperaMs));
        }
    }
    mostrarCargandoTabla(false);
    throw ultimoError;
}
// Para mostrar msj cargando (usa selectores para las tablas):
export function mostrarCargandoTabla(mostrando) {
    const tbody = document.querySelector('.scores-table tbody');
    const tbodyTop = document.querySelector('#tabla-mejores tbody');
    if (mostrando) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="3">⏳ Esperando servidor...</td></tr>`;
        if (tbodyTop) tbodyTop.innerHTML = `<tr><td colspan="3">⏳ Esperando servidor...</td></tr>`;
    }
}

// ------ Puntajes: envío y tablas --------
export function enviarPuntaje(nombre, puntaje, gameName = JUEGOS_CONFIG.GAMENAME) {
    fetch(JUEGOS_CONFIG.URL+'/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre, score: puntaje, game: gameName })
    })
        .then(res => res.json())
        .then(data => {})
        .catch(err => { console.warn("No se pudo enviar el puntaje:", err); });
}

export async function cargarTablaScores(gameName=JUEGOS_CONFIG.GAMENAME) {
    try {
        const scores = await fetchConEspera(`${JUEGOS_CONFIG.URL}/scores?limit=${JUEGOS_CONFIG.LIMIT}&game=${gameName}`);
        const tbody = document.querySelector('.scores-table tbody');
        tbody.innerHTML = "";
        for(const s of scores) {
            const tr = document.createElement('tr');
            const fecha = new Date(s.date);
            const fechaStr = fecha.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            tr.innerHTML = `
       <td>${s.name ? s.name.replace(/</g, "&lt;") : '-'}</td>
       <td>${Number(s.score).toFixed(2)}</td>
       <td style="font-size:0.92em;">${fechaStr}</td>
      `;
            tbody.appendChild(tr);
        }
    } catch(e) {
        const tbody = document.querySelector('.scores-table tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="color:red">Sin conexión al servidor</td></tr>`;
        console.warn("No se pudo obtener /scores:", e);
    } finally { mostrarCargandoTabla(false); }
}

export async function cargarTablaMejores(gameName=JUEGOS_CONFIG.GAMENAME) {
    try {
        const scores = await fetchConEspera(`${JUEGOS_CONFIG.URL}/scores/top-high?limit=${JUEGOS_CONFIG.LIMIT_TOP}&game=${gameName}`);
        const tbody = document.querySelector('#tabla-mejores tbody');
        tbody.innerHTML = "";
        for(const s of scores) {
            const fecha = new Date(s.date);
            const fechaStr = fecha.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
        if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="color:red">Sin conexión al servidor</td></tr>`;
        console.warn("No se pudo obtener /scores/top:", e);
    } finally { mostrarCargandoTabla(false); }
}

export function recargarScoresTrasEnvio(gameName=JUEGOS_CONFIG.GAMENAME) {
    setTimeout(() => {
        cargarTablaScores(gameName);
        cargarTablaMejores(gameName);
    }, 1000);
}

// -------------- OTRAS UTILIDADES --------------
// Shuffle genérico (para memoria)
export function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}