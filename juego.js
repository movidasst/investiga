'use strict';
const app = document.querySelector('#app');
const pasos = ['Escena', 'Hechos', 'Árbol', 'Medidas', 'Cierre'];
const misiones = ['Inspecciona la escena', 'Clasifica los hallazgos', 'Reconstruye el accidente', 'Decide cómo seguir', 'Defiende tu investigación'];
const pistas = [
  'Abre cada punto de investigación y fíjate en el origen de cada dato.',
  'Pregúntate si la fuente describe lo que ocurrió, lo que debía ocurrir o una interpretación.',
  'Si un solo antecedente no basta, busca qué otro hecho tuvo que coincidir. Si la evidencia falta, considera dejar la rama abierta.',
  'Busca una diligencia que reduzca la incertidumbre del caso y una medida cuyo efecto puedas verificar.'
];
const categorias = { hecho: 'Hecho respaldado', pendiente: 'Hipótesis pendiente', juicio: 'Juicio de valor' };
const vinculos = { cadena: 'Cadena', conjuncion: 'Conjunción', pendiente: 'Rama abierta' };
let id;
let caso;
let avance;
let mensaje = '';

function guardar() {
  try { localStorage.setItem('expediente-mac-' + id, JSON.stringify(avance)); } catch {}
}

function nuevoAvance() {
  return { paso: 0, evidencia: 0, vistas: [], hechos: {}, relaciones: {}, medidas: [], decision: null };
}

function puntaje() {
  const aciertos = caso.hechos.filter(([clave, , correcta]) => avance.hechos[clave] === correcta).length;
  const medidasValidas = avance.medidas.filter(i => id !== 'banda' || i !== 2).length;
  const totalMedidas = id === 'banda' ? 2 : caso.medidas.length;
  return [
    ['Evidencias', Math.round(20 * avance.vistas.length / caso.evidencias.length), 20],
    ['Hechos', Math.round(25 * aciertos / caso.hechos.length), 25],
    ['Árbol', Math.round(30 * Object.keys(avance.relaciones).length / caso.relaciones.length), 30],
    ['Decisión', avance.decision === 0 ? 15 : 0, 15],
    ['Prevención', Math.round(10 * medidasValidas / totalMedidas), 10]
  ];
}

function marcador() {
  const puntos = puntaje().reduce((suma, [, valor]) => suma + valor, 0);
  return `<section class="marcador" aria-label="Puntuación de la investigación">
    <div><strong>${puntos} / 100 XP</strong><progress max="100" value="${puntos}" aria-label="Experiencia del expediente">${puntos}%</progress></div>
    <ul>${puntaje().map(([nombre, valor, maximo]) => `<li>${nombre} <strong>${valor}/${maximo}</strong></li>`).join('')}</ul>
  </section>`;
}

function abrir(clave) {
  id = clave;
  caso = casos[clave];
  avance = nuevoAvance();
  try { const previo = JSON.parse(localStorage.getItem('expediente-mac-' + id));
    if (previo) avance = { ...avance, ...previo }; } catch {}
  if (!avance.vistas.includes(avance.evidencia)) avance.vistas.push(avance.evidencia);
  ir(avance.paso);
}

function mostrar(html) { app.innerHTML = html; }
function enfocarTitulo() {
  app.querySelector('h1').focus();
  window.scrollTo(0, 0);
}

function portada() {
  mensaje = '';
  mostrar(`<section class="hero"><div><p class="eyebrow">LABORATORIO DE INVESTIGACIÓN</p>
    <h1 tabindex="-1">Expediente <em>MAC</em></h1>
    <p class="subtitulo">Juego serio de investigación de accidentes de trabajo</p><p>Explora la escena, contrasta las evidencias y reconstruye el accidente con el Método del Árbol de Causas.</p>
    <a class="boton" href="#expedientes">Explorar expedientes ↓</a></div>
    <img src="${casos.banda.imagen}" alt="${casos.banda.alt}"></section>
    <section id="expedientes"><p class="eyebrow">SELECCIÓN DE CASOS</p><h2>Tu próxima investigación</h2>
    <div class="casos">${Object.entries(casos).map(([clave, datos]) => `
      <article class="tarjeta caso"><img src="${datos.imagen}" alt="${datos.alt}">
      <div><p class="eyebrow">EXPEDIENTE ${datos.numero} · ${datos.nivel}</p><h3>${datos.titulo}</h3><p>${datos.intro}</p>
      <button data-abrir="${clave}">Abrir expediente <span aria-hidden="true">→</span></button></div></article>`).join('')}</div></section>`);
}

function nombre(codigo) {
  if (codigo === 'final') return caso.final;
  return caso.hechos.find(([clave]) => clave === codigo)[1];
}

function escena() {
  const evidencia = caso.evidencias[avance.evidencia];
  return `<p>${caso.intro}</p><div class="escena"><img src="${caso.imagen}" alt="${caso.alt}">
    <div class="panel-evidencia"><p class="eyebrow">PUNTOS DE INVESTIGACIÓN</p>
    <div class="puntos">${caso.evidencias.map((e, i) => `<button class="secundario" data-evidencia="${i}" aria-pressed="${i === avance.evidencia}">${i+1}. ${e.titulo}${avance.vistas.includes(i) ? ' ✓' : ''}</button>`).join('')}</div>
    <article class="nota" aria-live="polite"><p class="eyebrow">${evidencia.tipo}</p><h3>${evidencia.titulo}</h3><p>${evidencia.texto}</p></article>
    <small>${avance.vistas.length} de ${caso.evidencias.length} evidencias examinadas</small></div></div>
    <p class="origen">${caso.origen} Las ilustraciones recrean el entorno con fines didácticos.</p>`;
}

function hechos() {
  return `<p>Clasifica cada afirmación. Puedes abrir su evidencia y cambiar tu respuesta.</p>
    <div class="lista">${caso.hechos.map(([clave, frase, correcta, ayuda, indice]) => {
      const elegida = avance.hechos[clave];
      return `<article class="tarjeta bloque"><p class="eyebrow">${clave}</p><h3>${frase}</h3>
        <details><summary>Consultar evidencia</summary><p>${caso.evidencias[indice].texto}</p></details>
        <div class="opciones" role="group" aria-label="Clasificar ${clave}">${Object.entries(categorias).map(([valor, etiqueta]) =>
          `<button class="secundario" data-hecho="${clave}" data-valor="${valor}" aria-pressed="${valor === elegida}">${etiqueta}</button>`).join('')}</div>
        <p class="devolucion" aria-live="polite">${elegida ? (elegida === correcta ? 'Bien sustentado. ' + ayuda : 'Revisa el alcance de la evidencia. ' + ayuda) : ''}</p></article>`;
    }).join('')}</div>`;
}

function arbolVisual() {
  const ramas = caso.relaciones.filter(r => avance.relaciones[r.destino]);
  return `<div class="arbol" aria-label="Árbol construido">${ramas.map(r => {
    const guardada = avance.relaciones[r.destino];
    if (guardada.tipo === 'pendiente') {
      return `<div class="rama"><span class="nodo abierto">Antecedentes por verificar</span><span class="flecha">⇢ <small>Rama abierta</small></span><span class="nodo final">${nombre(r.destino)}</span></div>`;
    }
    return `<div class="rama"><div class="antecedentes">${guardada.origen.map(h => {
      const dato = caso.hechos.find(f => f[0] === h);
      return `<details class="nodo"><summary>${nombre(h)}</summary><p>${caso.evidencias[dato[4]].texto}</p></details>`;
    }).join('')}</div><span class="flecha">→ <small>${vinculos[guardada.tipo]}</small></span><span class="nodo ${r.destino === 'final' ? 'final' : ''}">${nombre(r.destino)}</span></div>`;
  }).join('') || '<p>Las conexiones aceptadas aparecerán aquí.</p>'}</div>`;
}

function arbol() {
  return `<p>Partimos del daño para buscar sus antecedentes. En el tablero las flechas se leen de antecedente a consecuencia.</p>
    <p class="nota"><strong>Hecho final.</strong> ${caso.final}</p>
    ${[...caso.relaciones].reverse().map(r => {
      const previa = avance.relaciones[r.destino];
      return `<form class="tarjeta bloque" data-relacion="${r.destino}"><h3>${nombre(r.destino)}</h3>
        <fieldset><legend>¿Qué tuvo que ocurrir para que se produjera este hecho?</legend>
          ${caso.hechos.filter(([clave]) => clave !== r.destino && avance.hechos[clave] === 'hecho').map(([clave, frase]) =>
            `<label><input type="checkbox" name="origen" value="${clave}" ${previa?.origen.includes(clave) ? 'checked' : ''}> ${frase}</label>`).join('')}</fieldset>
        <label>Tipo de relación <select name="tipo" required><option value="">Selecciona una relación</option>
        ${Object.entries(vinculos).map(([v,t]) => `<option value="${v}" ${previa?.tipo === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <small>Si eliges rama abierta, deja los antecedentes sin marcar.</small>
        <button type="submit">Comprobar vínculo</button>
        <p class="devolucion" aria-live="polite">${previa ? 'Vínculo registrado. ' + r.ayuda : ''}</p></form>`;
    }).join('')}${arbolVisual()}`;
}

function decision() {
  const orden = id === 'banda' ? [1, 0, 2] : [2, 1, 0];
  return `<article class="tarjeta bloque reto"><p class="eyebrow">DECISIÓN DE CAMPO</p>
    <h3>${caso.mision.titulo}</h3><p>${caso.mision.dilema}</p>
    <div class="opciones">${orden.map(i => `<button class="secundario" data-decision="${i}" aria-pressed="${avance.decision === i}">${caso.mision.opciones[i][0]}</button>`).join('')}</div>
    <p class="devolucion" aria-live="polite">${avance.decision === null ? '' : caso.mision.opciones[avance.decision][1]}</p>
  </article>`;
}

function medidas() {
  return `${decision()}<h3>Tu plan preventivo</h3><p>Selecciona las acciones que incluirías en tu plan. Cada ficha indica la rama donde actuaría y cómo podrías verificarla.</p>
    <div class="lista">${caso.medidas.map(([titulo, rama, verificacion], i) => `<article class="tarjeta bloque">
    <p class="eyebrow">${rama}</p><h3>${titulo}</h3><button class="secundario" data-medida="${i}" aria-pressed="${avance.medidas.includes(i)}">${avance.medidas.includes(i) ? 'Incluida ✓' : 'Incluir en el plan'}</button>
    <p>${verificacion}</p></article>`).join('')}</div>`;
}

function cierre() {
  const pregunta = id === 'silo'
    ? '¿Qué dato pedirías para aclarar la posición del conductor en el momento del contacto?'
    : '¿Qué evidencia adicional permitiría confirmar si el aislamiento se ejecutó y se verificó?';
  return `<p class="nota"><strong>Expediente completado.</strong> ${caso.cierre}</p>
    ${avance.decision === 0 ? `<p class="insignia">★ Insignia obtenida · ${caso.mision.insignia}</p>` : '<p class="nota">Puedes volver a la decisión de campo y contrastar otra diligencia.</p>'}
    ${avance.decision !== null ? `<p><strong>Decisión de campo.</strong> ${caso.mision.opciones[avance.decision][0]}. ${caso.mision.opciones[avance.decision][1]}</p>` : ''}
    <h2>Tu árbol de causas</h2>${arbolVisual()}
    <h2>Plan preventivo</h2><ul>${avance.medidas.map(i => `<li><strong>${caso.medidas[i][0]}</strong>. ${caso.medidas[i][2]}</li>`).join('')}</ul>
    <p class="nota"><strong>Para debatir en clase.</strong> ${pregunta}</p>
    ${caso.fuente ? `<p><a href="${caso.fuente}" target="_blank" rel="noopener">Ver la figura 7 y la investigación original de ORP 2019 ↗</a></p>` : ''}
    <div class="opciones"><button data-imprimir>Imprimir ficha</button><button class="secundario" data-portada>Elegir otro caso</button></div><details class="reinicio"><summary>Volver a jugar este expediente</summary><p>Se borrará el avance guardado de este caso.</p><button class="secundario" data-reiniciar>Reiniciar expediente</button></details>`;
}

function pintar() {
  const vistas = [escena, hechos, arbol, medidas, cierre];
  mostrar(`<section class="expediente"><button class="volver" data-portada>← Todos los expedientes</button>
    <p class="eyebrow">EXPEDIENTE ${caso.numero} · ${caso.nivel}</p><h1 tabindex="-1">${caso.titulo}</h1>
    <ol class="progreso" aria-label="Etapas">${pasos.map((nombrePaso, i) => `<li ${i === avance.paso ? 'aria-current="step"' : ''} class="${i < avance.paso ? 'completo' : ''}"><span>${i + 1}</span>${nombrePaso}</li>`).join('')}</ol>
    ${marcador()}<p class="eyebrow">MISIÓN ${avance.paso + 1} DE 5</p>
    <h2>${misiones[avance.paso]}</h2>
    ${avance.paso < 4 ? `<details class="pista"><summary>Ver pista</summary><p>${pistas[avance.paso]}</p></details>` : ''}
    ${vistas[avance.paso]()}
    <p class="aviso" role="status">${mensaje}</p>
    <nav class="navegacion" aria-label="Navegar el expediente">${avance.paso > 0 ? '<button class="secundario" data-atras>← Anterior</button>' : ''}
    ${avance.paso < 4 ? '<button data-siguiente>Continuar →</button>' : ''}</nav></section>`);
}

function ir(paso) {
  mensaje = '';
  avance.paso = paso;
  guardar();
  pintar();
  enfocarTitulo();
}

function bloqueo() {
  switch (avance.paso) {
    case 0: return avance.vistas.length < caso.evidencias.length ? 'Examina todos los puntos de investigación para continuar.' : '';
    case 1: return caso.hechos.some(([clave, , correcta]) => avance.hechos[clave] !== correcta) ? 'Clasifica todas las afirmaciones y revisa las devoluciones.' : '';
    case 2: return caso.relaciones.some(r => !avance.relaciones[r.destino]) ? 'Comprueba todas las relaciones del árbol.' : '';
    case 3:
      if (avance.decision === null) return 'Elige una diligencia de investigación.';
      return avance.medidas.length === 0 ? 'Elige al menos una medida para tu plan.' : '';
    default: return '';
  }
}

app.addEventListener('click', evento => {
  const boton = evento.target.closest('button');
  if (!boton) return;
  const datos = boton.dataset;
  if (datos.abrir) return abrir(datos.abrir);
  if ('portada' in datos) { portada(); enfocarTitulo(); return; }
  if ('reiniciar' in datos) {
    avance = nuevoAvance();
    avance.vistas.push(0);
    return ir(0);
  }
  if ('imprimir' in datos) return window.print();
  if ('atras' in datos) return ir(avance.paso - 1);
  if ('siguiente' in datos) {
    mensaje = bloqueo();
    if (mensaje) app.querySelector('.aviso').textContent = mensaje;
    else ir(avance.paso + 1);
    return;
  }
  if ('evidencia' in datos) {
    const indice = Number(datos.evidencia);
    avance.evidencia = indice;
    if (!avance.vistas.includes(indice)) avance.vistas.push(indice);
  } else if (datos.hecho) {
    if (avance.hechos[datos.hecho] !== datos.valor) avance.relaciones = {};
    avance.hechos[datos.hecho] = datos.valor;
  } else if ('decision' in datos) {
    avance.decision = Number(datos.decision);
  } else if ('medida' in datos) {
    const indice = Number(datos.medida);
    avance.medidas = avance.medidas.includes(indice) ? avance.medidas.filter(i => i !== indice) : [...avance.medidas, indice];
  } else return;
  const selector = Object.entries(datos).map(([clave, valor]) => `[data-${clave}="${valor}"]`).join('');
  mensaje = '';
  guardar();
  pintar();
  app.querySelector(selector)?.focus();
});

app.addEventListener('submit', evento => {
  evento.preventDefault();
  const formulario = evento.target;
  const destino = formulario.dataset.relacion;
  const relacion = caso.relaciones.find(r => r.destino === destino);
  const datos = new FormData(formulario);
  const origen = datos.getAll('origen');
  const tipo = datos.get('tipo');
  const valido = tipo === relacion.tipo && origen.length === relacion.origen.length && origen.every(h => relacion.origen.includes(h));
  if (valido) avance.relaciones[destino] = { tipo, origen };
  else delete avance.relaciones[destino];
  guardar();
  formulario.querySelector('.devolucion').textContent = (valido ? 'Vínculo registrado. ' : 'Revisa tu conexión. ') + relacion.ayuda;
  app.querySelector('.aviso').textContent = '';
  app.querySelector('.arbol').outerHTML = arbolVisual();
  app.querySelector('.marcador').outerHTML = marcador();
});

portada();
