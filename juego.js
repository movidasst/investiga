'use strict';
const app = document.querySelector('#app');
const pasos = ['Escena', 'Hechos', 'Árbol', 'Medidas', 'Cierre'];
const misiones = ['Inspecciona la escena', 'Clasifica los hallazgos', 'Reconstruye el accidente', 'Decide cómo seguir', 'Defiende tu investigación'];
const indicaciones = [
  ['Reúne la información del caso.',
    'Toca cada punto de investigación y lee su ficha. Algunos abren una escena que puedes ampliar. En los puntos marcados «Reto», responde usando la ficha y la escena. Distingue lo que documenta la fuente de lo que la ilustración recrea.',
    'Puedes continuar cuando hayas revisado las cuatro fichas y resuelto los dos retos de observación.'],
  ['Decide qué puedes afirmar con la información disponible.',
    'Abre «Consultar evidencia» y clasifica cada afirmación. Elige «Hecho respaldado» si la fuente la sostiene, «Hipótesis pendiente» si hace falta comprobarla o «Juicio de valor» si atribuye una intención o califica a alguien sin sustento.',
    'Puedes continuar cuando todas las afirmaciones estén clasificadas correctamente. Si hace falta, revisa la devolución y cambia tu respuesta.'],
  ['Reconstruye cómo se produjo el daño.',
    'Empieza por el hecho final. En cada tarjeta, marca los antecedentes respaldados, elige el tipo de vínculo y pulsa «Comprobar vínculo». Revisa el árbol conforme crece y abre las fuentes de cada vínculo. Si dejas una rama abierta, anota qué falta verificar y cómo lo investigarías.',
    'Puedes continuar cuando hayas comprobado todos los vínculos. Una rama abierta comprobada también cuenta.'],
  ['Decide qué investigarías después y qué incluirías en tu plan preventivo.',
    'Primero elige una diligencia y lee qué aportaría. Después selecciona las medidas que incluirías. Para cada una, elige el hallazgo que aborda y cómo verificarías su aplicación.',
    'Puedes continuar cuando hayas elegido una diligencia, incluido al menos una medida y completado su sustento.'],
  ['Revisa el resultado de tu investigación y prepárate para explicarlo.',
    'Revisa el árbol y el plan. Escribe una frase sobre lo que puedes afirmar, otra sobre lo que falta verificar y otra sobre la medida que priorizas.',
    'Completa las tres frases para imprimir tu ficha y llevarla al debate en clase.']
];

const pistas = [
  'Abre cada punto de investigación y fíjate en el origen de cada dato.',
  'Pregúntate si la fuente describe lo que ocurrió, lo que debía ocurrir o una interpretación.',
  'Si un solo antecedente no basta, busca qué otro hecho tuvo que coincidir. Si la evidencia falta, considera dejar la rama abierta.',
  'Busca una diligencia que reduzca la incertidumbre del caso y una medida cuyo efecto puedas verificar.'
];
const categorias = { hecho: 'Hecho respaldado', pendiente: 'Hipótesis pendiente', juicio: 'Juicio de valor' };
const vinculos = { cadena: 'Cadena', conjuncion: 'Conjunción', pendiente: 'Rama abierta' };
let id;
let desafio = false;
let caso;
let avance;
let mensaje = '';

function clavePartida() {
  return 'expediente-mac-' + id + (desafio ? '-desafio' : '');
}

function evaluacionDiferida() {
  return desafio && avance.paso < 4;
}

function guardar() {
  try { localStorage.setItem(clavePartida(), JSON.stringify(avance)); } catch {}
}

function nuevoAvance() {
  return { paso: 0, evidencia: 0, vistas: [], hechos: {}, relaciones: {}, medidas: [], decision: null, escena: null, observaciones: {}, sustentoMedidas: {}, defensa: {}, cronologia: {}, intentosVinculo: {} };
}

function retosResueltos() {
  return Object.entries(caso.observaciones).filter(([indice, reto]) => avance.observaciones[indice] === reto.correcta).length;
}

function medidaSustentada(i) {
  const sustento = avance.sustentoMedidas[i];
  return caso.medidas[i][3] !== false && sustento?.hallazgo === i && sustento?.verificacion === i;
}

function insigniaObtenida() {
  return avance.decision === 0 && !vinculoPendiente() &&
    avance.medidas.length > 0 && avance.medidas.every(medidaSustentada);
}

function puntaje() {
  const aciertos = caso.hechos.filter(([clave, , correcta]) => avance.hechos[clave] === correcta).length;
  const medidasSustentadas = avance.medidas.filter(medidaSustentada).length;
  const totalMedidas = caso.medidas.filter(m => m[3] !== false).length;
  return [
    ['Evidencias', Math.round(8 * avance.vistas.length / caso.evidencias.length + 8 * retosResueltos() / Object.keys(caso.observaciones).length + caso.cronologia.eventos.filter(([, posicion], i) => avance.cronologia[i] === posicion).length), 20],
    ['Hechos', Math.round(25 * aciertos / caso.hechos.length), 25],
    ['Árbol', Math.round(30 * Object.keys(avance.relaciones).length / caso.relaciones.length), 30],
    ['Decisión', avance.decision === 0 ? 15 : 0, 15],
    ['Prevención', Math.round(10 * medidasSustentadas / Math.max(totalMedidas, avance.medidas.length)), 10]
  ];
}

function marcador() {
  const puntos = puntaje().reduce((suma, [, valor]) => suma + valor, 0);
  return `<section class="marcador" aria-label="Puntuación de la investigación">
    <div><strong>${puntos} / 100 XP</strong><progress max="100" value="${puntos}" aria-label="Experiencia del expediente">${puntos}%</progress></div>
    <ul>${puntaje().map(([nombre, valor, maximo]) => `<li>${nombre} <strong>${valor}/${maximo}</strong></li>`).join('')}</ul>
  </section>`;
}

function abrir(clave, modoDesafio = false) {
  id = clave;
  desafio = modoDesafio;
  caso = casos[clave];
  avance = nuevoAvance();
  try { const previo = JSON.parse(localStorage.getItem(clavePartida()));
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
    <p><strong>Cómo empezar.</strong> Elige un caso. Si es tu primera partida, empieza por «La banda en movimiento». Cada misión te indica qué hacer y cuándo avanzar. Tu progreso se guarda en este navegador.</p>
    <a class="boton" href="#expedientes">Explorar expedientes ↓</a></div>
    <img src="assets/portada-investigacion.webp" alt="Mesa de investigación con un expediente, una lupa y un casco"></section>
    <section id="expedientes"><p class="eyebrow">SELECCIÓN DE CASOS</p><h2>Tu próxima investigación</h2>
    <p>En práctica guiada recibes orientación al responder. En modo desafío puedes pedir pistas y ves la corrección al llegar al cierre. Cada modo guarda su propio avance.</p>
    <div class="casos">${Object.entries(casos).map(([clave, datos]) => `
      <article class="tarjeta caso"><img src="${datos.imagen}" alt="${datos.alt}">
      <div><p class="eyebrow">EXPEDIENTE ${datos.numero} · ${datos.nivel}</p><h3>${datos.titulo}</h3><p>${datos.intro}</p>
      <button data-abrir="${clave}">Práctica guiada <span aria-hidden="true">→</span></button> <button class="secundario" data-abrir="${clave}" data-desafio>Modo desafío</button></div></article>`).join('')}</div></section>`);
}

function nombre(codigo) {
  if (codigo === 'final') return caso.final;
  return caso.hechos.find(([clave]) => clave === codigo)[1];
}

function retoObservacion() {
  const indice = avance.evidencia;
  const reto = caso.observaciones[indice];
  if (!reto) return '';
  const respuesta = avance.observaciones[indice];
  return `<article class="nota observacion">
    <p class="eyebrow">RETO DE OBSERVACIÓN</p>
    <h3 id="pregunta-observacion">${reto.pregunta}</h3>
    <div class="opciones" role="group" aria-labelledby="pregunta-observacion">${reto.opciones.map(([opcion], i) =>
      `<button type="button" class="secundario" data-observacion="${i}" aria-pressed="${i === respuesta}">${opcion}</button>`).join('')}</div>
    <p class="devolucion" role="status">${respuesta === undefined || evaluacionDiferida() ? '' :
      (respuesta === reto.correcta ? 'Reto resuelto. ' : 'Revisa la fuente y vuelve a intentarlo. ') + reto.opciones[respuesta][1]}</p>
  </article>`;
}

function cronologiaCorrecta() {
  return caso.cronologia.eventos.every(([, posicion], i) => avance.cronologia[i] === posicion);
}

function lineaTiempo(editable = false) {
  const { posiciones, eventos } = caso.cronologia;
  return `<details class="tarjeta bloque" ${editable || avance.paso === 4 ? 'open' : ''}>
    <summary>Línea de tiempo</summary>
    ${editable ? '<p>Ubica cada hecho según las fichas. Marca «Momento sin confirmar» cuando las fuentes dejen el momento pendiente.</p>' : ''}
    ${editable ? eventos.map(([evento, posicion], i) => `<label>${evento}
      <select data-cronologia="${i}"><option value="">Selecciona un momento</option>
      ${posiciones.map((texto, j) => `<option value="${j}" ${avance.cronologia[i] === j ? 'selected' : ''}>${texto}</option>`).join('')}
      </select>${!evaluacionDiferida() && avance.cronologia[i] !== undefined ? `<small>${avance.cronologia[i] === posicion ? 'Ubicación respaldada.' : 'Vuelve a revisar la fuente.'}</small>` : ''}</label>`).join('')
    : `<ul>${eventos.map(([evento, posicion], i) => ({ evento, posicion, elegida: avance.cronologia[i] }))
      .sort((a, b) => (a.elegida ?? posiciones.length) - (b.elegida ?? posiciones.length))
      .map(({evento, posicion, elegida}) => `<li><strong>${posiciones[elegida] || 'Por ubicar'}</strong> · ${evento}
      ${desafio && avance.paso === 4 && elegida !== posicion ? `<small> · Según las fuentes: ${posiciones[posicion]}</small>` : ''}</li>`).join('')}</ul>`}
  </details>`;
}

const capasCroquis = {
  choque: ['Choque observado', 'El conductor B observó por el retrovisor el choque entre los dos camiones. El círculo indica una zona ilustrativa del choque, con base en el testimonio.', '<circle cx="447" cy="166" r="29" fill="#fff3ca" stroke="#854b14" stroke-width="4"/><text x="447" y="174" text-anchor="middle">1</text>'],
  hallazgo: ['Hallazgo posterior', 'El conductor B encontró al trabajador en el suelo después del choque. El marcador representa el hallazgo de manera esquemática.', '<circle cx="392" cy="263" r="25" fill="#d5f5e8" stroke="#00646a" stroke-width="4"/><text x="392" y="271" text-anchor="middle">2</text>'],
  trayectoria: ['Trayectoria por reconstruir', 'La línea discontinua señala el tramo a investigar. El relato describe que el camión A giró y siguió hacia el talud. Quedan pendientes el recorrido exacto y la ubicación del contacto con el trabajador.', '<path d="M372 198q62-24 72 12t-47 102" fill="none" stroke="#23465e" stroke-width="5" stroke-dasharray="10 8"/><circle cx="397" cy="312" r="16" fill="#fff" stroke="#23465e" stroke-width="3"/><text x="397" y="320" text-anchor="middle">?</text>']
};

function croquisSilo() {
  const capa = capasCroquis[avance.croquis];
  return `<figure class="croquis-silo">
    <svg viewBox="0 0 640 416" role="img" aria-label="Croquis esquemático. ${capa[0]}">
      <image href="assets/silo-croquis.svg" width="640" height="416"/>
      <g fill="#16384a" font-family="system-ui,sans-serif" font-size="24" font-weight="800">${capa[2]}</g>
    </svg>
    <figcaption><p class="eyebrow">CROQUIS DIDÁCTICO · SIN ESCALA</p>
      <div class="puntos" role="group" aria-label="Capas del croquis">${Object.entries(capasCroquis).map(([clave, [titulo]]) =>
        `<button type="button" class="secundario" data-croquis="${clave}" aria-pressed="${avance.croquis === clave}">${titulo}</button>`).join('')}</div>
      <p>${capa[1]} El punto exacto del atropello queda por determinar.</p>
    </figcaption>
  </figure>`;
}

function escena() {
  const evidencia = caso.evidencias[avance.evidencia];
  const escenas = [{ titulo: 'Vista general', alt: caso.alt, imagen: caso.imagen, lectura: 'Abre los puntos de investigación para descubrir las escenas del expediente.' },
    ...caso.escenas.map(e => ({ ...e, imagen: 'assets/' + e.archivo + '.webp' }))];
  const seleccionada = avance.escena ?? 0;
  const vista = escenas[seleccionada];
  const mostrandoCroquis = id === 'silo' && Object.hasOwn(capasCroquis, avance.croquis);
  return `<p>${caso.intro}</p><div class="escena"><div class="galeria">
    ${id === 'silo' ? `<div class="puntos vistas-silo" role="group" aria-label="Comparar perspectivas">
      <button type="button" class="secundario" data-croquis="choque" data-perspectiva="croquis" aria-pressed="${mostrandoCroquis}">Croquis desde arriba</button>
      <button type="button" class="secundario" data-evidencia="1" data-perspectiva="retrovisor" aria-pressed="${!mostrandoCroquis && seleccionada === 2}">Vista del retrovisor</button>
    </div>` : ''}
    ${mostrandoCroquis ? croquisSilo() : `<figure><button type="button" class="ampliar-escena" data-ampliar aria-label="Ampliar ${vista.titulo}"><img src="${vista.imagen}" alt="${vista.alt}"><span>⤢ Ampliar</span></button>
    <figcaption><p class="eyebrow">RECREACIÓN DIDÁCTICA</p><strong>${vista.titulo}</strong><p>${vista.lectura}</p></figcaption></figure>`}
    <div class="puntos" role="group" aria-label="Escenas del expediente">${escenas.map((e, i) => {
      const disponible = i === 0 || avance.vistas.includes(e.evidencia);
      return `<button type="button" class="secundario" data-escena="${i}" aria-pressed="${!mostrandoCroquis && i === seleccionada}" ${disponible ? '' : 'disabled'}>${i === 0 ? 'Vista general' : 'Escena ' + i}${disponible ? '' : ' · Por abrir'}</button>`;
    }).join('')}</div>
    <dialog class="visor"><button type="button" data-cerrar-visor>Cerrar ×</button><img src="${vista.imagen}" alt="${vista.alt}"><p>${vista.titulo}</p></dialog></div>
    <div class="panel-evidencia"><p class="eyebrow">PUNTOS DE INVESTIGACIÓN</p><p>Consulta las evidencias para desbloquear las escenas.</p>
    <div class="puntos">${caso.evidencias.map((e, i) => `<button class="secundario" data-evidencia="${i}" aria-pressed="${i === avance.evidencia}">${i+1}. ${e.titulo}${avance.vistas.includes(i) ? ' ✓' : ''}${caso.observaciones[i] ? ' · Reto' : ''}</button>`).join('')}</div>
    <article class="nota" aria-live="polite"><p class="eyebrow">${evidencia.tipo}</p><h3>${evidencia.titulo}</h3><p>${evidencia.texto}</p></article>
    ${retoObservacion()}
    <small>${avance.vistas.length} de ${caso.evidencias.length} fichas revisadas · ${evaluacionDiferida() ? Object.keys(avance.observaciones).length : retosResueltos()} de ${Object.keys(caso.observaciones).length} retos ${evaluacionDiferida() ? 'respondidos' : 'resueltos'}</small></div></div>
    <p class="origen">${caso.origen} Las ilustraciones recrean el entorno con fines didácticos.</p>${lineaTiempo(true)}`;
}

function hechos() {
  return `<div class="lista">${caso.hechos.map(([clave, frase, correcta, ayuda, indice]) => {
      const elegida = avance.hechos[clave];
      return `<article class="tarjeta bloque"><p class="eyebrow">${clave}</p><h3>${frase}</h3>
        <details><summary>Consultar evidencia</summary><p>${caso.evidencias[indice].texto}</p></details>
        <div class="opciones" role="group" aria-label="Clasificar ${clave}">${Object.entries(categorias).map(([valor, etiqueta]) =>
          `<button class="secundario" data-hecho="${clave}" data-valor="${valor}" aria-pressed="${valor === elegida}">${etiqueta}</button>`).join('')}</div>
        <p class="devolucion" aria-live="polite">${elegida && !evaluacionDiferida() ? (elegida === correcta ? 'Bien sustentado. ' + ayuda : 'Revisa el alcance de la evidencia. ' + ayuda) : ''}</p></article>`;
    }).join('')}</div>`;
}

function escapar(texto = '') {
  return texto.replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}

function nodoArbol(destino) {
  const guardada = avance.relaciones[destino];
  const relacion = caso.relaciones.find(r => r.destino === destino);
  return `<div class="subarbol">
    <div class="nodo ${destino === 'final' ? 'final' : ''}">
      ${destino === 'final' ? '<small>HECHO FINAL</small>' : ''}<strong>${nombre(destino)}</strong>
    </div>
    ${guardada ? `<div class="vinculo-arbol">
      <details><summary>↑ ${vinculos[guardada.tipo]} · Consultar fuentes</summary>
        <p>${relacion.ayuda}</p>
        <ul>${relacion.fuentes.map(i => {
          const e = caso.evidencias[i];
          return `<li><strong>${e.tipo} · ${e.titulo}</strong><br>${e.texto}</li>`;
        }).join('')}</ul>
      </details>
    </div>${guardada.tipo === 'pendiente'
      ? `<div class="nodo abierto"><strong>Por verificar</strong>
          ${guardada.pendiente ? `<p>${escapar(guardada.pendiente)}</p><strong>Cómo investigarlo</strong><p>${escapar(guardada.diligencia)}</p>` : '<p>Agrega una nota de investigación al comprobar esta rama.</p>'}</div>`
      : `<div class="hijos-arbol">${guardada.origen.map(nodoArbol).join('')}</div>`}` : ''}
  </div>`;
}

function arbolVisual() {
  const registrados = Object.entries(avance.relaciones);
  const antecedentes = new Set(registrados.flatMap(([, r]) => r.origen));
  const separados = registrados.filter(([destino]) => destino !== 'final' && !antecedentes.has(destino));
  return `<section class="arbol" aria-label="Árbol construido">
    <h3>Árbol de la investigación</h3>
    <p>Parte del hecho final y baja hacia los antecedentes. Las flechas apuntan hacia la consecuencia.</p>
    ${nodoArbol('final')}
    ${separados.length ? `<div class="ramas-separadas"><h4>Vínculos comprobados sin conexión al hecho final</h4>
      ${separados.map(([destino]) => nodoArbol(destino)).join('')}</div>` : ''}
  </section>`;
}

function arbol() {
  return `${lineaTiempo()}${evaluacionDiferida() ? '' : arbolVisual()}
    ${[...caso.relaciones].reverse().map(r => {
      const previa = evaluacionDiferida() ? avance.intentosVinculo[r.destino] : avance.relaciones[r.destino];
      return `<form class="tarjeta bloque" data-relacion="${r.destino}"><h3 tabindex="-1">${nombre(r.destino)}</h3>
        <p id="devolucion-${r.destino}" class="devolucion" aria-live="polite">${previa ? (evaluacionDiferida() ? 'Respuesta registrada.' : 'Vínculo registrado. ' + r.ayuda) : ''}</p>
        <fieldset><legend>¿Qué tuvo que ocurrir para que se produjera este hecho?</legend>
          ${caso.hechos.filter(([clave]) => clave !== r.destino && (evaluacionDiferida() || avance.hechos[clave] === 'hecho')).map(([clave, frase]) =>
            `<label><input type="checkbox" name="origen" aria-describedby="devolucion-${r.destino}" value="${clave}" ${previa?.origen.includes(clave) ? 'checked' : ''}> ${frase}</label>`).join('')}</fieldset>
        <label>Tipo de relación <select name="tipo" aria-describedby="devolucion-${r.destino}"><option value="">Selecciona una relación</option>
        ${Object.entries(vinculos).map(([v,t]) => `<option value="${v}" ${previa?.tipo === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <small>Si eliges rama abierta, deja los antecedentes sin marcar y completa la nota de investigación.</small>
        <fieldset data-nota-rama ${previa?.tipo === 'pendiente' ? '' : 'hidden'}>
          <legend>Nota de investigación</legend>
          <label>¿Qué falta verificar?<textarea aria-describedby="devolucion-${r.destino}" name="pendiente" maxlength="400" rows="2">${escapar(previa?.pendiente)}</textarea></label>
          <label>¿Cómo lo investigarías?<textarea aria-describedby="devolucion-${r.destino}" name="diligencia" maxlength="400" rows="2">${escapar(previa?.diligencia)}</textarea></label>
        </fieldset>
        <button type="submit">${evaluacionDiferida() ? 'Registrar vínculo' : 'Comprobar vínculo'}</button></form>`;
    }).join('')}`;
}

function decision() {
  const orden = id === 'banda' ? [1, 0, 2] : [2, 1, 0];
  return `<article class="tarjeta bloque reto"><p class="eyebrow">DECISIÓN DE CAMPO</p>
    <h3>${caso.mision.titulo}</h3><p>${caso.mision.dilema}</p>
    <div class="opciones">${orden.map(i => `<button class="secundario" data-decision="${i}" aria-pressed="${avance.decision === i}">${caso.mision.opciones[i][0]}</button>`).join('')}</div>
    <p class="devolucion" aria-live="polite">${avance.decision === null || evaluacionDiferida() ? '' : caso.mision.opciones[avance.decision][1]}</p>
  </article>`;
}

function sustentoMedida(i) {
  const sustento = avance.sustentoMedidas[i] || {};
  const selector = (campo, etiqueta, columna) => `<label>${etiqueta}
    <select data-sustento="${i}" data-campo="${campo}">
      <option value="">Selecciona una opción</option>
      ${caso.medidas.map((medida, j) => medida[3] === false ? '' :
        `<option value="${j}" ${sustento[campo] === j ? 'selected' : ''}>${medida[columna]}</option>`).join('')}
    </select></label>`;
  return `${selector('hallazgo', '¿Qué hallazgo aborda?', 1)}
    ${selector('verificacion', '¿Cómo comprobarías su aplicación?', 2)}
    <p class="devolucion" role="status">${evaluacionDiferida() ? '' : medidaSustentada(i) ? 'Medida sustentada.' :
      [sustento.hallazgo, sustento.verificacion].every(Number.isInteger)
        ? 'Revisa si el hallazgo y la verificación elegidos corresponden a esta medida.' : ''}</p>`;
}

function medidas() {
  return `${decision()}<h3>Tu plan preventivo</h3>
    <p>Los XP de prevención se asignan a las medidas vinculadas con un hallazgo y una verificación pertinente. La insignia requiere el árbol comprobado, la diligencia mejor sustentada y todas las medidas incluidas con su sustento.</p>
    <div class="lista">${caso.medidas.map(([titulo, , verificacion, pertinente], i) => `<article class="tarjeta bloque">
    <h3>${titulo}</h3><button class="secundario" data-medida="${i}" aria-pressed="${avance.medidas.includes(i)}">${avance.medidas.includes(i) ? 'Incluida ✓' : 'Incluir en el plan'}</button>
    ${avance.medidas.includes(i) ? (pertinente === false ? `<p class="devolucion">${evaluacionDiferida() ? 'Medida incluida.' : verificacion + ' Retírala si tu plan busca abordar únicamente hallazgos específicos.'}</p>` : sustentoMedida(i)) : ''}</article>`).join('')}</div>`;
}

const preguntasDefensa = [
  ['afirmacion', '¿Qué puedo afirmar?', 'Menciona un hecho o vínculo y la evidencia que lo respalda.'],
  ['pendiente', '¿Qué queda por verificar?', 'Indica qué dato falta y, si puedes, cómo lo buscarías.'],
  ['prioridad', '¿Qué medida priorizo?', 'Elige una medida de tu plan y explica qué hallazgo aborda.']
];

function defensaFinal() {
  return `<section class="tarjeta bloque defensa" aria-labelledby="titulo-defensa">
    <h2 id="titulo-defensa">Defensa final</h2>
    <p class="defensa-edicion">Escribe una frase por pregunta. El borrador se guarda en este navegador.</p>
    ${preguntasDefensa.map(([clave, titulo, ayuda]) => `<div>
      <label class="defensa-edicion" for="defensa-${clave}"><strong>${titulo}</strong></label>
      <small class="defensa-edicion" id="ayuda-${clave}">${ayuda}</small>
      <textarea class="defensa-edicion" id="defensa-${clave}" aria-describedby="ayuda-${clave}" data-defensa="${clave}" rows="2" maxlength="400">${escapar(avance.defensa[clave])}</textarea>
      <div class="defensa-impresa"><strong>${titulo}</strong>
        <p data-defensa-impresa="${clave}">${escapar(avance.defensa[clave]?.trim() || 'Pendiente de completar.')}</p></div>
    </div>`).join('')}
    <p class="devolucion defensa-edicion" data-aviso-defensa role="status"></p>
  </section>`;
}

function cierre() {
  const pregunta = id === 'silo'
    ? '¿Qué dato pedirías para aclarar la posición del conductor en el momento del contacto?'
    : '¿Qué evidencia adicional permitiría confirmar si el aislamiento se ejecutó y se verificó?';
  return `<p class="nota"><strong>Análisis del caso.</strong> ${caso.cierre}</p>
    ${insigniaObtenida() ? `<p class="insignia">★ Insignia obtenida · ${caso.mision.insignia}</p>` : '<p class="nota">Para obtener la insignia, comprueba el árbol, selecciona la diligencia mejor sustentada y revisa el hallazgo y la verificación de cada medida incluida.</p>'}
    ${avance.decision !== null ? `<p><strong>Decisión de campo.</strong> ${caso.mision.opciones[avance.decision][0]}. ${caso.mision.opciones[avance.decision][1]}</p>` : ''}
    <h2>Tu árbol de causas</h2>${arbolVisual()}
    <h2>Plan preventivo</h2><ul>${avance.medidas.map(i => `<li><strong>${caso.medidas[i][0]}</strong>. ${medidaSustentada(i) ? `Hallazgo: ${caso.medidas[i][1]}. Verificación: ${caso.medidas[i][2]}` : 'Sustento pendiente de revisar.'}</li>`).join('')}</ul>
    ${lineaTiempo()}${desafio ? devolucionDesafio() : ''}${defensaFinal()}
    <p class="nota"><strong>Para debatir en clase.</strong> ${pregunta}</p>
    ${caso.fuente ? `<p><a href="${caso.fuente}" target="_blank" rel="noopener">Ver la figura 7 y la investigación original de ORP 2019 ↗</a></p>` : ''}
    <div class="opciones"><button data-imprimir>Imprimir ficha</button><button class="secundario" data-portada>Elegir otro caso</button></div><details class="reinicio"><summary>Volver a jugar este expediente</summary><p>Se borrará el avance guardado de este caso.</p><button class="secundario" data-reiniciar>Reiniciar expediente</button></details>`;
}

function devolucionDesafio() {
  const list = (items) => `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
  return `<section class="tarjeta bloque"><h2>Devolución del desafío</h2>
    <h3>Observación</h3>${list(Object.entries(caso.observaciones).map(([i, r]) =>
      `${r.pregunta} <strong>${avance.observaciones[i] === r.correcta ? 'Acertaste.' : 'Revisa.'}</strong> ${r.opciones[r.correcta][0]} ${r.opciones[r.correcta][1]}`))}
    <h3>Clasificación</h3>${list(caso.hechos.map(([clave, frase, correcta, ayuda]) =>
      `${frase} <strong>${categorias[correcta]}${avance.hechos[clave] === correcta ? ' ✓' : ''}.</strong> ${ayuda}`))}
    <h3>Árbol</h3>${list(caso.relaciones.map(r => {
      const intento = avance.intentosVinculo[r.destino];
      const error = intento && revisarVinculo(r, intento.origen, intento.tipo, intento.pendiente, intento.diligencia);
      return `${nombre(r.destino)}. <strong>${avance.relaciones[r.destino] ? 'Vínculo comprobado.' : 'Vínculo por revisar.'}</strong> ${error ? error[0] + ' ' : ''}${r.ayuda}`;
    }))}</section>`;
}

function instrucciones() {
  const [tarea, como, criterio] = indicaciones[avance.paso];
  const avanceRequerido = avance.paso === 0
    ? (desafio ? 'Abre las cuatro fichas, responde los dos retos y completa la línea de tiempo.' : 'Revisa las cuatro fichas, resuelve los dos retos y ubica correctamente los hechos en la línea de tiempo.')
    : evaluacionDiferida() && avance.paso === 1 ? 'Responde todas las afirmaciones para continuar.'
    : evaluacionDiferida() && avance.paso === 2 ? 'Registra un intento por vínculo. La corrección aparecerá al cierre.'
    : criterio;
  return `<aside class="instrucciones" aria-label="Indicaciones de la misión">
    <p><strong>Tu tarea.</strong> ${tarea}</p>
    <p><strong>Cómo hacerlo.</strong> ${evaluacionDiferida() && avance.paso === 2 ? 'Marca los antecedentes, elige el tipo de vínculo y pulsa «Registrar vínculo». Si dejas una rama abierta, anota qué falta verificar y cómo lo investigarías.' : como}</p>
    <p><strong>${avance.paso === 4 ? 'Para cerrar.' : 'Para avanzar.'}</strong> ${avanceRequerido}</p>
  </aside>`;
}

function guiaVinculos() {
  return `<details class="pista" ${id === 'banda' && !desafio ? 'open' : ''}>
    <summary>Cadena, conjunción y rama abierta${id === 'banda' ? ' · Ejemplo guiado' : ''}</summary>
    <dl class="guia-vinculos">
      <dt>Cadena</dt><dd>Hay un antecedente directo respaldado para el hecho que estás explicando.</dd>
      <dt>Conjunción</dt><dd>Varios antecedentes tuvieron que darse juntos para explicar ese hecho.</dd>
      <dt>Rama abierta</dt><dd>La evidencia disponible deja el vínculo pendiente. En este juego, elige «Rama abierta» y deja los antecedentes sin marcar.</dd>
    </dl>
    ${id === 'banda' ? `<p><strong>Ejemplo de práctica ajeno al caso.</strong> Imagina un aula con un proyector que solo funciona cuando está conectado y se pulsa el interruptor. El proyector encendido hizo visible la diapositiva en la pantalla en ese momento (<strong>cadena</strong>). Para que se encendiera, tuvieron que coincidir la conexión eléctrica y el uso del interruptor (<strong>conjunción</strong>). Si la diapositiva aparece y el registro disponible no permite saber qué activó el proyector, ese antecedente queda por verificar (<strong>rama abierta</strong>).</p>` : ''}
  </details>`;
}

function pintar() {
  const vistas = [escena, hechos, arbol, medidas, cierre];
  mostrar(`<section class="expediente"><button class="volver" data-portada>← Todos los expedientes</button>
    <p class="eyebrow">EXPEDIENTE ${caso.numero} · ${caso.nivel}</p><h1 tabindex="-1">${caso.titulo}</h1>
    <ol class="progreso" aria-label="Etapas">${pasos.map((nombrePaso, i) => `<li ${i === avance.paso ? 'aria-current="step"' : ''} class="${i < avance.paso ? 'completo' : ''}"><span>${i + 1}</span>${nombrePaso}</li>`).join('')}</ol>
    ${evaluacionDiferida() ? '<p class="nota">Modo desafío · La puntuación y la devolución aparecen al cierre.</p>' : marcador()}<p class="eyebrow">MISIÓN ${avance.paso + 1} DE 5</p>
    <h2>${misiones[avance.paso]}</h2>${instrucciones()}
    ${avance.paso === 2 ? guiaVinculos() : ''}
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

function vinculoPendiente() {
  return caso.relaciones.slice().reverse().find(r => evaluacionDiferida() ? !avance.intentosVinculo[r.destino] :
    !avance.relaciones[r.destino] || (r.tipo === 'pendiente' && !avance.relaciones[r.destino].diligencia));
}

function bloqueo() {
  switch (avance.paso) {
    case 0:
      if (avance.vistas.length < caso.evidencias.length) return 'Abre los puntos de investigación que faltan.';
      if ((evaluacionDiferida() ? Object.keys(avance.observaciones).length : retosResueltos()) < Object.keys(caso.observaciones).length) return 'Completa los retos de observación pendientes.';
      if (Object.keys(avance.cronologia).length < caso.cronologia.eventos.length) return 'Completa la línea de tiempo.';
      return !evaluacionDiferida() && !cronologiaCorrecta() ? 'Revisa las posiciones de la línea de tiempo.' : '';
    case 1: return caso.hechos.some(([clave, , correcta]) => (evaluacionDiferida() ? !avance.hechos[clave] : avance.hechos[clave] !== correcta)) ? 'Clasifica todas las afirmaciones y revisa las devoluciones.' : '';
    case 2: return vinculoPendiente() ? 'Queda un vínculo por comprobar.' : '';
    case 3:
      if (avance.decision === null) return 'Elige una diligencia de investigación.';
      if (avance.medidas.length === 0) return 'Elige al menos una medida para tu plan.';
      return avance.medidas.some(i => caso.medidas[i][3] !== false &&
        ![avance.sustentoMedidas[i]?.hallazgo, avance.sustentoMedidas[i]?.verificacion].every(Number.isInteger))
        ? 'Completa el hallazgo y la verificación de las medidas incluidas.' : '';
    default: return '';
  }
}

app.addEventListener('click', evento => {
  const boton = evento.target.closest('button');
  if (!boton) return;
  const datos = boton.dataset;
  if (datos.abrir) return abrir(datos.abrir, 'desafio' in datos);
  if ('portada' in datos) { portada(); enfocarTitulo(); return; }
  if ('reiniciar' in datos) {
    avance = nuevoAvance();
    avance.vistas.push(0);
    return ir(0);
  }
  if ('ampliar' in datos) return app.querySelector('.visor').showModal();
  if ('cerrarVisor' in datos) return app.querySelector('.visor').close();
  if ('imprimir' in datos) {
    const pendiente = preguntasDefensa.find(([clave]) => !avance.defensa[clave]?.trim());
    const aviso = app.querySelector('[data-aviso-defensa]');
    aviso.textContent = pendiente ? 'Completa las tres frases de tu defensa antes de imprimir.' : '';
    if (pendiente) return app.querySelector(`[data-defensa="${pendiente[0]}"]`).focus();
    return window.print();
  }
  if ('atras' in datos) return ir(avance.paso - 1);
  if ('siguiente' in datos) {
    mensaje = bloqueo();
    if (!mensaje) return ir(avance.paso + 1);
    app.querySelector('.aviso').textContent = mensaje;
    if (avance.paso === 2) {
      const tarjeta = app.querySelector(`[data-relacion="${vinculoPendiente().destino}"]`);
      tarjeta.querySelector('.devolucion').textContent ||= desafio ? 'Registra tu respuesta en esta tarjeta.' : 'Revisa esta tarjeta y pulsa «Comprobar vínculo».';
      tarjeta.querySelector('h3').focus();
    }
    return;
  }
  if ('croquis' in datos) {
    avance.croquis = datos.croquis;
  } else if ('evidencia' in datos) {
    avance.croquis = null;
    const indice = Number(datos.evidencia);
    avance.evidencia = indice;
    avance.escena = caso.escenas.findIndex(e => e.evidencia === indice) + 1;
    if (!avance.vistas.includes(indice)) avance.vistas.push(indice);
  } else if ('observacion' in datos) {
    avance.observaciones[avance.evidencia] = Number(datos.observacion);
  } else if ('escena' in datos) {
    avance.croquis = null;
    avance.escena = Number(datos.escena);
    if (avance.escena > 0) avance.evidencia = caso.escenas[avance.escena - 1].evidencia;
  } else if (datos.hecho) {
    if (!desafio && avance.hechos[datos.hecho] !== datos.valor) avance.relaciones = {};
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

app.addEventListener('input', evento => {
  const clave = evento.target.dataset.defensa;
  if (!clave) return;
  avance.defensa[clave] = evento.target.value;
  guardar();
  app.querySelector(`[data-defensa-impresa="${clave}"]`).textContent =
    evento.target.value.trim() || 'Pendiente de completar.';
  app.querySelector('[data-aviso-defensa]').textContent = '';
});

app.addEventListener('change', evento => {
  const selector = evento.target;
  if (selector.matches('select[data-cronologia]')) {
    const indice = selector.dataset.cronologia;
    if (selector.value === '') delete avance.cronologia[indice];
    else avance.cronologia[indice] = Number(selector.value);
    guardar();
    pintar();
    app.querySelector(`[data-cronologia="${indice}"]`).focus();
    return;
  }
  if (selector.matches('select[data-sustento]')) {
    const { sustento, campo } = selector.dataset;
    const valores = avance.sustentoMedidas[sustento] ||= {};
    if (selector.value === '') delete valores[campo];
    else valores[campo] = Number(selector.value);
    mensaje = '';
    guardar();
    pintar();
    app.querySelector(`[data-sustento="${sustento}"][data-campo="${campo}"]`).focus();
    return;
  }
  if (!selector.matches('form[data-relacion] select[name="tipo"]')) return;
  selector.form.querySelector('[data-nota-rama]').hidden = selector.value !== 'pendiente';
});

function revisarVinculo(relacion, origen, tipo, pendiente, diligencia) {
  const faltan = relacion.origen.filter(h => !origen.includes(h)).length;
  const sobran = origen.filter(h => !relacion.origen.includes(h)).length;
  if (relacion.tipo === 'pendiente' && sobran) {
    return ['La información del caso no permite sostener los antecedentes marcados para este vínculo. Revisa si conviene dejarlo pendiente.', '[name="origen"]:checked'];
  }
  if (faltan && sobran) {
    return ['Hay antecedentes que faltan y otros que sobran. Revisa cuáles explican directamente el hecho de esta tarjeta.', '[name="origen"]:checked'];
  }
  if (faltan) {
    return [origen.length ? 'Falta al menos un antecedente. Pregúntate qué otra condición tuvo que darse.' : 'Todavía no marcaste antecedentes. Revisa qué tuvo que ocurrir para que se produjera este hecho.', '[name="origen"]:not(:checked)'];
  }
  if (sobran) {
    return ['Marcaste un antecedente de más. Conserva los que explican este hecho y revisa cuáles solo aportan contexto.', '[name="origen"]:checked'];
  }
  if (!tipo) return ['Elige el tipo de vínculo para comprobar la tarjeta.', '[name="tipo"]'];
  if (tipo !== relacion.tipo) {
    const pista = {
      conjuncion: 'Identificaste los antecedentes. Ahora piensa si tuvieron que coincidir para que ocurriera el hecho.',
      cadena: 'Identificaste un solo antecedente directo. Revisa qué tipo de vínculo representa esa relación.',
      pendiente: 'Dejaste los antecedentes sin marcar. Elige el tipo de vínculo que mantiene explícita esa incertidumbre.'
    };
    return [pista[relacion.tipo], '[name="tipo"]'];
  }
  if (tipo === 'pendiente' && !pendiente) return ['Escribe qué dato concreto falta verificar para explicar el vínculo.', '[name="pendiente"]'];
  if (tipo === 'pendiente' && !diligencia) return ['Indica cómo buscarías ese dato, por ejemplo qué fuente consultarías o qué contrastarías.', '[name="diligencia"]'];
  return null;
}

app.addEventListener('submit', evento => {
  evento.preventDefault();
  const formulario = evento.target;
  const destino = formulario.dataset.relacion;
  const relacion = caso.relaciones.find(r => r.destino === destino);
  const datos = new FormData(formulario);
  const origen = datos.getAll('origen');
  const tipo = datos.get('tipo');
  const pendiente = datos.get('pendiente')?.trim();
  const diligencia = datos.get('diligencia')?.trim();
  const error = revisarVinculo(relacion, origen, tipo, pendiente, diligencia);
  if (evaluacionDiferida()) {
    const campo = !tipo ? 'tipo' : tipo === 'pendiente' && !pendiente ? 'pendiente' : tipo === 'pendiente' && !diligencia ? 'diligencia' : '';
    if (campo) {
      formulario.querySelector('.devolucion').textContent = 'Completa los campos de este vínculo antes de registrarlo.';
      formulario.querySelector(`[name="${campo}"]`).focus();
      return;
    }
    avance.intentosVinculo[destino] = { tipo, origen, pendiente, diligencia };
  }
  if (error) delete avance.relaciones[destino];
  else avance.relaciones[destino] = tipo === 'pendiente' ? { tipo, origen, pendiente, diligencia } : { tipo, origen };
  guardar();
  if (evaluacionDiferida()) {
    formulario.querySelector('.devolucion').textContent = 'Respuesta registrada. Recibirás la devolución al cierre.';
    app.querySelector('.aviso').textContent = '';
    return;
  }
  formulario.querySelector('.devolucion').textContent = error ? error[0] : 'Vínculo registrado. ' + relacion.ayuda;
  app.querySelector('.aviso').textContent = '';
  app.querySelector('.arbol').outerHTML = arbolVisual();
  app.querySelector('.marcador').outerHTML = marcador();
  if (error) (formulario.querySelector(error[1]) || formulario.querySelector('h3')).focus();
});

portada();
