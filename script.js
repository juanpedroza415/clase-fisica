// ==========================================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================================================
let currentMode = 'A';
let currentExercise = 1;
let currentParams = {};
let simulationData = null;

let animId = null;
let isAnimating = false;
let animProgress = 0;

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadExercise(1);
});

// ==========================================================================
// CAMBIO DE MODOS DE ENTRADA
// ==========================================================================
function setMode(mode) {
    currentMode = mode;
    currentExercise = null; // Modo personalizado
    
    // Actualizar botones de pestaña
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.includes(`Modo ${mode}`));
    if (activeBtn) activeBtn.classList.add('active');

    const container = document.getElementById('input-fields');
    container.innerHTML = '';

    if (mode === 'A') {
        container.innerHTML = `
            <div class="input-group">
                <label>Velocidad Inicial $v_0$ (m/s):</label>
                <input type="number" id="inp-v0" value="20" step="any">
            </div>
            <div class="input-group">
                <label>Ángulo $\\theta$ (grados):</label>
                <input type="number" id="inp-angle" value="30" step="any">
            </div>
            <div class="input-group">
                <label>Altura Inicial $h_0$ (m):</label>
                <input type="number" id="inp-h0" value="0" step="any">
            </div>
        `;
    } else if (mode === 'B') {
        container.innerHTML = `
            <div class="input-group">
                <label>Ángulo $\\theta$ (grados):</label>
                <input type="number" id="inp-angle" value="53" step="any">
            </div>
            <div class="input-group">
                <label>Tiempo de Subida $t_{\\text{subida}}$ (s):</label>
                <input type="number" id="inp-tsub" value="2" step="any">
            </div>
            <div class="input-group">
                <label>Altura Inicial $h_0$ (m):</label>
                <input type="number" id="inp-h0" value="0" step="any">
            </div>
        `;
    } else if (mode === 'C') {
        container.innerHTML = `
            <div class="input-group">
                <label>Velocidad Horizontal $v_x$:</label>
                <input type="number" id="inp-vx" value="90" step="any">
            </div>
            <div class="input-group">
                <label>Unidades de $v_x$:</label>
                <select id="inp-unit">
                    <option value="ms">m/s</option>
                    <option value="kmh">km/h</option>
                </select>
            </div>
            <div class="input-group">
                <label>Altura Inicial $h_0$ (m):</label>
                <input type="number" id="inp-h0" value="1000" step="any">
            </div>
        `;
    } else if (mode === 'D') {
        container.innerHTML = `
            <div class="input-group">
                <label>Altura Inicial $h_0$ (m):</label>
                <input type="number" id="inp-h0" value="5" step="any">
            </div>
            <div class="input-group">
                <label>Tiempo Parcial $t_1$ (s):</label>
                <input type="number" id="inp-t1" value="0.25" step="any">
            </div>
            <div class="input-group">
                <label>Distancia Horizontal $x_1$ en $t_1$ (m):</label>
                <input type="number" id="inp-x1" value="3" step="any">
            </div>
        `;
    }

    renderMathInElement(container);
    calculateCustom();
}

// ==========================================================================
// CARGA DE EJERCICIOS PREDETERMINADOS (1 A 5)
// ==========================================================================
function loadExercise(exNum) {
    currentExercise = exNum;
    if (exNum === 1) {
        setMode('A');
        document.getElementById('inp-v0').value = 20;
        document.getElementById('inp-angle').value = 30;
        document.getElementById('inp-h0').value = 0;
    } else if (exNum === 2) {
        setMode('B');
        document.getElementById('inp-angle').value = 53;
        document.getElementById('inp-tsub').value = 2;
        document.getElementById('inp-h0').value = 0;
    } else if (exNum === 3) {
        setMode('C');
        document.getElementById('inp-vx').value = 90;
        document.getElementById('inp-unit').value = 'ms';
        document.getElementById('inp-h0').value = 1000;
    } else if (exNum === 4) {
        setMode('C');
        document.getElementById('inp-vx').value = 36;
        document.getElementById('inp-unit').value = 'kmh';
        document.getElementById('inp-h0').value = 100;
    } else if (exNum === 5) {
        setMode('D');
        document.getElementById('inp-h0').value = 5;
        document.getElementById('inp-t1').value = 0.25;
        document.getElementById('inp-x1').value = 3;
    }
    
    updateCalculation();
}

function updateCalculation() {
    calculateCustom();
}

// ==========================================================================
// MOTOR DE CÁLCULO Y RESOLUCIÓN
// ==========================================================================
function calculateCustom() {
    const g = parseFloat(document.getElementById('gravity-select').value);
    let stepsHTML = '';
    let summaryHTML = '';

    let v0, angleDeg, h0, v0x, v0y, tVuelo, xMax, yMax, vImpacto;

    if (currentMode === 'A') {
        v0 = parseFloat(document.getElementById('inp-v0').value);
        angleDeg = parseFloat(document.getElementById('inp-angle').value);
        h0 = parseFloat(document.getElementById('inp-h0').value);

        const rad = (angleDeg * Math.PI) / 180;
        v0x = v0 * Math.cos(rad);
        v0y = v0 * Math.sin(rad);

        // Tiempo de vuelo (ecuación cuadrática: 0 = h0 + v0y*t - 0.5*g*t^2)
        const a = 0.5 * g;
        const b = -v0y;
        const c = -h0;
        tVuelo = ( -b + Math.sqrt(b*b - 4*a*c) ) / (2*a);

        xMax = v0x * tVuelo;
        const tSubida = v0y / g;
        yMax = h0 + (v0y * tSubida) - (0.5 * g * tSubida * tSubida);

        const vyFinal = v0y - g * tVuelo;
        vImpacto = Math.sqrt(v0x*v0x + vyFinal*vyFinal);

        stepsHTML += `
            <div class="step-box">
                <div class="step-title">1. Componentes de la Velocidad Inicial</div>
                <p>$$v_{0x} = v_0 \\cdot \\cos(\\theta) = ${v0} \\cdot \\cos(${angleDeg}^\\circ) = ${v0x.toFixed(3)} \\text{ m/s}$$</p>
                <p>$$v_{0y} = v_0 \\cdot \\sin(\\theta) = ${v0} \\cdot \\sin(${angleDeg}^\\circ) = ${v0y.toFixed(3)} \\text{ m/s}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">2. Altura Máxima ($Y_{\\text{máx}}$)</div>
                <p>Ocurre en $t_{\\text{subida}} = \\frac{v_{0y}}{g} = \\frac{${v0y.toFixed(3)}}{${g}} = ${tSubida.toFixed(3)} \\text{ s}$</p>
                <p>$$Y_{\\text{máx}} = h_0 + \\frac{v_{0y}^2}{2g} = ${h0} + \\frac{(${v0y.toFixed(3)})^2}{2(${g})} = \\mathbf{${yMax.toFixed(3)} \\text{ m}}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">3. Tiempo de Vuelo Total ($t_{\\text{vuelo}}$)</div>
                <p>Resolviendo la ecuación de posición vertical $y(t) = 0$:</p>
                <p>$$0 = ${h0} + (${v0y.toFixed(3)})t - \\frac{1}{2}(${g})t^2 \\implies \\mathbf{t_{\\text{vuelo}} = ${tVuelo.toFixed(3)} \\text{ s}}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">4. Alcance Máximo Horizontal ($X_{\\text{máx}}$)</div>
                <p>$$X_{\\text{máx}} = v_{0x} \\cdot t_{\\text{vuelo}} = ${v0x.toFixed(3)} \\cdot ${tVuelo.toFixed(3)} = \\mathbf{${xMax.toFixed(3)} \\text{ m}}$$</p>
            </div>
        `;

    } else if (currentMode === 'B') {
        angleDeg = parseFloat(document.getElementById('inp-angle').value);
        const tSubida = parseFloat(document.getElementById('inp-tsub').value);
        h0 = parseFloat(document.getElementById('inp-h0').value);

        const rad = (angleDeg * Math.PI) / 180;
        // v0y = g * tSubida
        v0y = g * tSubida;
        v0 = v0y / Math.sin(rad);
        v0x = v0 * Math.cos(rad);

        tVuelo = h0 === 0 ? 2 * tSubida : (v0y + Math.sqrt(v0y*v0y + 2*g*h0)) / g;
        xMax = v0x * tVuelo;
        yMax = h0 + (v0y * v0y) / (2 * g);

        const vyFinal = v0y - g * tVuelo;
        vImpacto = Math.sqrt(v0x*v0x + vyFinal*vyFinal);

        stepsHTML += `
            <div class="step-box">
                <div class="step-title">1. Despeje de Velocidad Inicial ($v_0$)</div>
                <p>En el punto más alto la velocidad vertical es cero ($v_y = 0$):</p>
                <p>$$v_y = v_{0y} - g \\cdot t_{\\text{subida}} = 0 \\implies v_{0y} = g \\cdot t_{\\text{subida}} = ${g} \\cdot ${tSubida} = \\mathbf{${v0y.toFixed(3)} \\text{ m/s}}$$</p>
                <p>$$v_0 = \\frac{v_{0y}}{\\sin(\\theta)} = \\frac{${v0y.toFixed(3)}}{\\sin(${angleDeg}^\\circ)} = \\mathbf{${v0.toFixed(3)} \\text{ m/s}}$$</p>
                <p>$$v_{0x} = v_0 \\cdot \\cos(\\theta) = ${v0.toFixed(3)} \\cdot \\cos(${angleDeg}^\\circ) = ${v0x.toFixed(3)} \\text{ m/s}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">2. Alcance Horizontal Total ($X$)</div>
                <p>Como $h_0 = ${h0}\\text{m}$, el tiempo total de vuelo es $t_{\\text{vuelo}} = 2 \\cdot t_{\\text{subida}} = ${tVuelo.toFixed(3)}\\text{ s}$</p>
                <p>$$X_{\\text{máx}} = v_{0x} \\cdot t_{\\text{vuelo}} = ${v0x.toFixed(3)} \\cdot ${tVuelo.toFixed(3)} = \\mathbf{${xMax.toFixed(3)} \\text{ m}}$$</p>
            </div>
        `;

    } else if (currentMode === 'C') {
        let vxInp = parseFloat(document.getElementById('inp-vx').value);
        const unit = document.getElementById('inp-unit').value;
        h0 = parseFloat(document.getElementById('inp-h0').value);
        angleDeg = 0;

        v0x = unit === 'kmh' ? vxInp / 3.6 : vxInp;
        v0y = 0;
        v0 = v0x;

        tVuelo = Math.sqrt((2 * h0) / g);
        xMax = v0x * tVuelo;
        yMax = h0;

        const vyFinal = -g * tVuelo;
        vImpacto = Math.sqrt(v0x*v0x + vyFinal*vyFinal);

        stepsHTML += `
            <div class="step-box">
                <div class="step-title">1. Conversión de Unidades y Componentes</div>
                ${unit === 'kmh' ? `<p>$$v_x = 36 \\text{ km/h} = \\frac{36}{3.6} = \\mathbf{${v0x.toFixed(3)} \\text{ m/s}}$$</p>` : `<p>$$v_x = \\mathbf{${v0x.toFixed(3)} \\text{ m/s}}$$</p>`}
                <p>Lanzamiento horizontal: $\\theta = 0^\\circ \\implies v_{0x} = ${v0x.toFixed(3)}\\text{ m/s}, \\quad v_{0y} = 0\\text{ m/s}$</p>
            </div>
            <div class="step-box">
                <div class="step-title">2. Tiempo de Caída ($t_{\\text{piso}}$)</div>
                <p>$$h_0 = \\frac{1}{2} g t^2 \\implies t = \\sqrt{\\frac{2 h_0}{g}} = \\sqrt{\\frac{2(${h0})}{${g}}} = \\mathbf{${tVuelo.toFixed(3)} \\text{ s}}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">3. Alcance Horizontal ($X_{\\text{máx}}$)</div>
                <p>$$X = v_x \\cdot t = ${v0x.toFixed(3)} \\cdot ${tVuelo.toFixed(3)} = \\mathbf{${xMax.toFixed(3)} \\text{ m}}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">4. Velocidad de Impacto con el Piso</div>
                <p>$$v_y = -g \\cdot t = -${g} \\cdot ${tVuelo.toFixed(3)} = ${vyFinal.toFixed(3)} \\text{ m/s}$$</p>
                <p>$$v_{\\text{impacto}} = \\sqrt{v_x^2 + v_y^2} = \\sqrt{(${v0x.toFixed(3)})^2 + (${vyFinal.toFixed(3)})^2} = \\mathbf{${vImpacto.toFixed(3)} \\text{ m/s}}$$</p>
            </div>
        `;

        // Si es el ejercicio 4, agregar literales a, b específicos
        if (currentExercise === 4) {
            const t05 = 0.5;
            const x05 = v0x * t05;
            const y05 = h0 - 0.5 * g * t05 * t05;

            const t1 = 1.0;
            const vy1 = -g * t1;
            const v1 = Math.sqrt(v0x*v0x + vy1*vy1);

            stepsHTML += `
                <div class="step-box" style="border-top: 2px solid var(--accent); margin-top:15px; padding-top:15px;">
                    <div class="step-title">Respuestas a preguntas específicas del Ejercicio 4:</div>
                    <p><strong>a. Posición a $t = 0.5\\text{s}$:</strong> $x(0.5) = ${x05.toFixed(2)}\\text{ m}$, $y(0.5) = ${y05.toFixed(2)}\\text{ m}$ desde el suelo.</p>
                    <p><strong>b. Velocidad a $t = 1\\text{s}$:</strong> $v_y(1) = ${vy1.toFixed(2)}\\text{ m/s} \\implies v(1) = \\mathbf{${v1.toFixed(2)}\\text{ m/s}}$</p>
                </div>
            `;
        }

    } else if (currentMode === 'D') {
        h0 = parseFloat(document.getElementById('inp-h0').value);
        const t1 = parseFloat(document.getElementById('inp-t1').value);
        const x1 = parseFloat(document.getElementById('inp-x1').value);
        angleDeg = 0;

        v0x = x1 / t1;
        v0y = 0;
        v0 = v0x;

        tVuelo = Math.sqrt((2 * h0) / g);
        xMax = v0x * tVuelo;
        yMax = h0;

        const vyFinal = -g * tVuelo;
        vImpacto = Math.sqrt(v0x*v0x + vyFinal*vyFinal);

        // Respuestas específicas Ejercicio 5
        const hDescendido05 = 0.5 * g * 0.5 * 0.5;
        const tMitad = Math.sqrt((2 * (h0 / 2)) / g);

        stepsHTML += `
            <div class="step-box">
                <div class="step-title">a. Velocidad de Lanzamiento ($v_0$)</div>
                <p>En $t = ${t1}\\text{ s}$ avanzó horizontalmente $x = ${x1}\\text{ m}$:</p>
                <p>$$v_0 = v_x = \\frac{x_1}{t_1} = \\frac{${x1}}{${t1}} = \\mathbf{${v0x.toFixed(3)} \\text{ m/s}}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">b. Distancia a la que cae desde la casa ($X_{\\text{total}}$)</div>
                <p>Tiempo total de caída: $t = \\sqrt{\\frac{2 h_0}{g}} = \\sqrt{\\frac{2(${h0})}{${g}}} = ${tVuelo.toFixed(3)}\\text{ s}$</p>
                <p>$$X_{\\text{total}} = v_0 \\cdot t_{\\text{caída}} = ${v0x.toFixed(3)} \\cdot ${tVuelo.toFixed(3)} = \\mathbf{${xMax.toFixed(3)} \\text{ m}}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">c. Distancia descendida luego de $t = 0.5\\text{ s}$</div>
                <p>$$h_{\\text{descendido}} = \\frac{1}{2} g t^2 = \\frac{1}{2} (${g}) (0.5)^2 = \\mathbf{${hDescendido05.toFixed(3)} \\text{ m}}$$</p>
            </div>
            <div class="step-box">
                <div class="step-title">d. Tiempo al descender la mitad de su altura ($h = ${h0/2}\\text{ m}$)</div>
                <p>$$t = \\sqrt{\\frac{2 (h_0 / 2)}{g}} = \\sqrt{\\frac{2 (${h0/2})}{${g}}} = \\mathbf{${tMitad.toFixed(3)} \\text{ s}}$$</p>
            </div>
        `;
    }

    // Datos globales para la animación Canvas
    currentParams = { v0, angleDeg, h0, v0x, v0y, g, tVuelo, xMax, yMax };

    // Renderizar resumen
    summaryHTML = `
        <div class="metric-card">
            <div class="metric-title">Alcance Máximo ($X$)</div>
            <div class="metric-value">${xMax.toFixed(2)} m</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Altura Máxima ($Y$)</div>
            <div class="metric-value">${yMax.toFixed(2)} m</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Tiempo de Vuelo</div>
            <div class="metric-value">${tVuelo.toFixed(2)} s</div>
        </div>
        <div class="metric-card highlight">
            <div class="metric-title">Velocidad Impacto</div>
            <div class="metric-value">${vImpacto.toFixed(2)} m/s</div>
        </div>
    `;

    document.getElementById('results-summary').innerHTML = summaryHTML;
    document.getElementById('step-by-step').innerHTML = stepsHTML;

    // Renderizar las matemáticas con KaTeX
    renderMathInElement(document.getElementById('step-by-step'));

    // Iniciar Animación Canvas
    resetAnimation();
}

// ==========================================================================
// DIBUJO Y ANIMACIÓN EN CANVAS 2D
// ==========================================================================
function resetAnimation() {
    if (animId) cancelAnimationFrame(animId);
    animProgress = 0;
    isAnimating = true;
    animate();
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    if (isAnimating) animate();
}

function animate() {
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    const { v0x, v0y, h0, g, tVuelo, xMax, yMax } = currentParams;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configuración de escalas y márgenes
    const padding = 50;
    const maxX = Math.max(xMax * 1.15, 10);
    const maxY = Math.max(yMax * 1.25, 10);

    const scaleX = (canvas.width - 2 * padding) / maxX;
    const scaleY = (canvas.height - 2 * padding) / maxY;

    function toScreenX(x) { return padding + x * scaleX; }
    function toScreenY(y) { return canvas.height - padding - y * scaleY; }

    // Dibujar suelo y peña/acantilado si h0 > 0
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, toScreenY(0));
    ctx.lineTo(canvas.width, toScreenY(0));
    ctx.stroke();

    if (h0 > 0) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, toScreenY(h0), toScreenX(0), toScreenY(0) - toScreenY(h0));
        ctx.strokeRect(0, toScreenY(h0), toScreenX(0), toScreenY(0) - toScreenY(h0));
    }

    // Dibujar Trayectoria Punteada Completa
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.setLineDash([5, 5]);
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tVuelo;
        const x = v0x * t;
        const y = h0 + v0y * t - 0.5 * g * t * t;
        if (i === 0) ctx.moveTo(toScreenX(x), toScreenY(y));
        else ctx.lineTo(toScreenX(x), toScreenY(y));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Tiempo actual animado
    const currentTime = animProgress * tVuelo;
    const currX = v0x * currentTime;
    const currY = Math.max(0, h0 + v0y * currentTime - 0.5 * g * currentTime * currentTime);

    // Trazo de la trayectoria recorrida hasta el momento
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    const currentSteps = Math.floor(steps * animProgress);
    for (let i = 0; i <= currentSteps; i++) {
        const t = (i / steps) * tVuelo;
        const x = v0x * t;
        const y = h0 + v0y * t - 0.5 * g * t * t;
        if (i === 0) ctx.moveTo(toScreenX(x), toScreenY(y));
        else ctx.lineTo(toScreenX(x), toScreenY(y));
    }
    ctx.stroke();

    // Dibujar Proyectil (Bola)
    ctx.beginPath();
    ctx.arc(toScreenX(currX), toScreenY(currY), 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vectores de velocidad instantánea
    const currVy = v0y - g * currentTime;
    
    // Vector Vx (Verde)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.moveTo(toScreenX(currX), toScreenY(currY));
    ctx.lineTo(toScreenX(currX + v0x * 0.15), toScreenY(currY));
    ctx.stroke();

    // Vector Vy (Rojo)
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.moveTo(toScreenX(currX), toScreenY(currY));
    ctx.lineTo(toScreenX(currX), toScreenY(currY + currVy * 0.15));
    ctx.stroke();

    // Actualizar progreso
    if (isAnimating) {
        animProgress += 0.008;
        if (animProgress > 1) animProgress = 1;
        animId = requestAnimationFrame(animate);
    }
}