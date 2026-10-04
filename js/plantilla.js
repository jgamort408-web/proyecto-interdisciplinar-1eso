// Dibuja una plantilla: formulario en pantalla, documento para el PDF y correo preparado.
// Lo que se pregunta vive en plantillas.js; aquí solo está el cómo.
import {
  cargarBase, cargarCurriculo, icono, el, esc, variables, tile, faseTile, ceMark, sq,
  parametros, perfil, guardarPerfil, respuestas, guardarRespuestas, envio, marcarEnviado,
  fecha, fechaLarga, hoy, faseTramo, copiar, descargar,
} from './comun.js';
import { PLANTILLAS, PASOS_GEMINI, AVISOS_IA } from './plantillas.js';

const app = document.getElementById('app');
const params = parametros();
let base, cur, materia, tramo, def, valores, bloqueado, secciones;

/** Toda plantilla pregunta quién la firma: el PDF sin autor no sirve de nada. */
const IDENTIDAD = {
  id: 'identidad', titulo: 'Quién eres', icono: 'users',
  campos: [
    { tipo: 'texto', id: 'docente', etiqueta: 'Nombre y apellidos', ancho: 'medio', perfil: 'docente' },
    { tipo: 'texto', id: 'grupos', etiqueta: 'Grupos de 1.º ESO', ancho: 'medio', perfil: 'grupos' },
  ],
};

/* ── Arranque ───────────────────────────────────────────────────────────── */

(async function inicio() {
  base = await cargarBase();
  const tramos = [...base.plan.tramos, { ...base.plan.extra, desde: base.plan.tramos[0].desde, hasta: base.plan.cierre.fecha, entrega: base.plan.cierre.fecha }];
  tramo = tramos.find((t) => t.id === params.tramo);
  materia = base.materias.find((m) => m.id === params.materia);
  if (!tramo) return error('No encuentro ese tramo.', 'Vuelve al plan y elige uno de los cuatro.');
  def = PLANTILLAS[tramo.id];
  if (!def) return error('Esa plantilla no existe todavía.');
  if (!materia) return elegirMateria();

  cur = await cargarCurriculo(materia.id);
  secciones = def.secciones.some((s) => s.campos.some((c) => c.perfil === 'docente')) ? def.secciones : [IDENTIDAD, ...def.secciones];
  valores = respuestas(tramo.id, materia.id);
  prellenar();
  bloqueado = faseTramo(tramo) === 'futuro' && !params.previa;
  document.title = `${tramo.id} · ${def.titulo} · ${materia.nombre}`;
  dibujar();
})().catch((e) => error('Algo ha fallado al cargar la plantilla.', e.message));

function error(titulo, detalle = '') {
  app.replaceChildren(el('div', { clase: 'tarjeta', html: `<h2>${esc(titulo)}</h2><p class="muted">${esc(detalle)}</p><p style="margin-top:14px"><a class="boton fantasma" href="index.html">Volver al plan</a></p>` }));
}

function elegirMateria() {
  const grupos = ['comun', 'optativa', 'religion'];
  app.replaceChildren(el('div', { clase: 'tarjeta pila', html: `
    <p class="eyebrow">${tramo.id} · ${esc(def.titulo)}</p>
    <h1>¿Cuál es tu materia?</h1>
    <p class="muted">Se guarda en este navegador: solo tendrás que elegirla una vez.</p>
    ${grupos.map((g) => `
      <div style="margin-top:14px">
        <p class="eyebrow">${esc(base.materias.find((m) => m.grupo === g).grupoNombre)}</p>
        <div class="fila" style="margin-top:8px">
          ${base.materias.filter((m) => m.grupo === g).map((m) => `
            <a class="chip-materia" style="${variables(m)}" href="plantilla.html?t=${tramo.id}&m=${m.id}${params.previa ? '&previa=1' : ''}">${tile(m, 'mini')}${esc(m.corto)}</a>`).join('')}
        </div>
      </div>`).join('')}
  ` }));
}

/** Copia valores de tramos anteriores cuando el campo está vacío (campo.desde = 'T1.tarea'). */
function prellenar() {
  const p = perfil();
  for (const sec of secciones) {
    for (const campo of sec.campos) {
      if (campo.perfil && !valores[campo.id] && p[campo.perfil]) valores[campo.id] = p[campo.perfil];
      if (campo.desde && vacio(valores[campo.id])) {
        const [otroTramo, otroCampo] = campo.desde.split('.');
        const v = respuestas(otroTramo, materia.id)[otroCampo];
        if (!vacio(v)) valores[campo.id] = v;
      }
      if (campo.valor !== undefined && vacio(valores[campo.id])) valores[campo.id] = campo.valor;
    }
  }
}

const vacio = (v) => v === undefined || v === null || (Array.isArray(v) ? !v.length : typeof v === 'object' ? !Object.keys(v).length : String(v).trim() === '');

let guardadoPendiente;
function fijar(id, valor) {
  valores[id] = valor;
  clearTimeout(guardadoPendiente);
  guardadoPendiente = setTimeout(() => {
    guardarRespuestas(tramo.id, materia.id, valores);
    const p = {};
    for (const sec of secciones) for (const c of sec.campos) if (c.perfil && valores[c.id]) p[c.perfil] = valores[c.id];
    if (Object.keys(p).length) guardarPerfil({ ...p, materia: materia.id });
    marcaGuardado();
  }, 400);
}

function marcaGuardado() {
  const aviso = document.getElementById('guardado');
  if (!aviso) return;
  aviso.innerHTML = `${icono('save', { tam: '14px' })} Guardado en este navegador`;
  aviso.hidden = false;
  clearTimeout(marcaGuardado.t);
  marcaGuardado.t = setTimeout(() => { aviso.hidden = true; }, 2500);
}

/* ── Contexto para los prompts ──────────────────────────────────────────── */

function contextoPrompt() {
  const otros = (t, id) => respuestas(t, materia.id)[id];
  const val = (id) => (!vacio(valores[id]) ? valores[id] : !vacio(otros('T2', id)) ? otros('T2', id) : otros('T1', id));
  const fasesElegidas = () => [].concat(val('fases') || []);
  return {
    v: valores, m: materia, cur, fases: base.fases, plan: base.plan, voc: base.vocabulario,
    val,
    deT1: (id) => otros('T1', id),
    deT2: (id) => otros('T2', id),
    nombreFases: () => fasesElegidas().map((n) => (n === 'otro' ? 'otro reto' : `${n} · ${base.fases[n - 1].nombre}`)).join(', '),
    tarea: () => val('tarea') || '',
    criteriosElegidos: () => (val('criterios') || []).map((cod) => cur.criterios.find((c) => c.codigo === cod)).filter(Boolean),
    instrumentoTexto: () => (base.vocabulario.instrumentos.find((i) => i.id === val('instrumento')) || {}).etiqueta || '',
    indicadores: () => (val('indicadores') || []).map((f) => f.ind).filter(Boolean).join('; '),
    duaTexto: () => base.vocabulario.dua.map((d) => { const t = (val('dua') || {})[d.id]; return t ? `- ${d.etiqueta} (${d.sub}): ${t}` : null; }).filter(Boolean).join('\n'),
    listaMaterias: () => base.materias.map((m) => m.corto).join(', '),
  };
}

/* ── Dibujo ─────────────────────────────────────────────────────────────── */

function dibujar() {
  const estadoTramo = faseTramo(tramo);
  const enviado = envio(tramo.id, materia.id);
  app.replaceChildren();
  app.append(
    cabeceraPlantilla(estadoTramo, enviado),
    el('div', { clase: 'dos-columnas' }, [
      el('div', {}, [...secciones.map(seccion), avisoFinal()]),
      lateral(),
    ]),
  );
  if (bloqueado) for (const c of app.querySelectorAll('input, textarea, select, button.op')) c.disabled = true;
}

function cabeceraPlantilla(estadoTramo, enviado) {
  const nodo = el('div', { clase: 'pila', estilo: `${variables(materia)};margin-bottom:22px` });
  nodo.innerHTML = `
    <p class="fila small muted no-imprimir">
      <a href="index.html" class="fila" style="gap:6px;text-decoration:none">${icono('arrow-left-right', { tam: '14px' })} Plan completo</a>
      <span>·</span><span>${esc(tramo.id)} de 4</span>
      <span>·</span><span>Entrega: <b>${fechaLarga(tramo.entrega)}</b></span>
      ${enviado ? `<span>·</span><span class="estado enviado">${icono('circle-check-big', { tam: '13px' })} Enviado el ${fecha(enviado.fecha.slice(0, 10))}</span>` : ''}
      <span id="guardado" class="estado" hidden></span>
    </p>
    <div class="banda">
      ${tile(materia, 'grande')}
      <div>
        <p class="eyebrow">${esc(tramo.id)} · ${esc(def.titulo)} — ${esc(def.lema)}</p>
        <h1>${esc(materia.nombre)}</h1>
        ${materia.sub ? `<p class="small" style="opacity:.85">${esc(materia.sub)}</p>` : ''}
      </div>
      <p class="codigo">${esc(materia.id)}<span>${esc(materia.grupoNombre)}</span></p>
    </div>
    <p>${esc(def.intro)}</p>`;

  if (bloqueado) {
    nodo.append(el('div', { clase: 'aviso ojo', html: `
      ${icono('lock', { tam: '20px' })}
      <div><b>Esta plantilla se abre el ${fechaLarga(tramo.desde)}.</b>
      <span class="small muted">Se habilita en su semana para que nadie trabaje sobre acuerdos que aún pueden cambiar${tramo.depende ? `. Antes hay que cerrar ${tramo.depende}` : ''}.</span><br>
      <a class="boton pequeno fantasma" style="margin-top:8px" href="plantilla.html?t=${tramo.id}&m=${materia.id}&previa=1">${icono('eye', { tam: '15px' })} Verla igualmente (vista previa)</a></div>` }));
  } else if (estadoTramo === 'vencido' && !enviado) {
    nodo.append(el('div', { clase: 'aviso alto', html: `${icono('triangle-alert', { tam: '20px' })}<div><b>El plazo era el ${fechaLarga(tramo.entrega)}.</b> <span class="small">Puedes enviarla igualmente: es mejor tarde que nunca, pero avisa a coordinación.</span></div>` }));
  }
  if (params.previa && faseTramo(tramo) === 'futuro') {
    nodo.append(el('div', { clase: 'aviso', html: `${icono('eye', { tam: '20px' })}<div><b>Vista previa.</b> <span class="small muted">Puedes escribir y se guarda, pero esta plantilla no toca hasta el ${fechaLarga(tramo.desde)}.</span></div>` }));
  }
  return nodo;
}

function seccion(sec) {
  const nodo = el('section', { clase: 'seccion', estilo: variables(materia) });
  nodo.append(el('h2', { html: `${icono(sec.icono, { tam: '20px' })} ${esc(sec.titulo)}` }));
  for (const campo of sec.campos) nodo.append(dibujarCampo(campo));
  return nodo;
}

function avisoFinal() {
  return el('div', { clase: 'aviso bien no-imprimir', estilo: 'margin-bottom:16px', html: `
    ${icono('printer', { tam: '20px' })}
    <div><b>Cuando termines:</b> pulsa <b>Guardar como PDF</b> y después <b>Enviar a coordinación</b>. El correo se abre con el asunto escrito; solo tienes que adjuntar el PDF que acabas de guardar.</div>` });
}

/* ── Campos ─────────────────────────────────────────────────────────────── */

function envoltorio(campo, contenido) {
  const nodo = el('div', { clase: `campo ${campo.ancho === 'medio' ? 'medio' : ''}` });
  if (campo.etiqueta) {
    nodo.append(el('div', { clase: 'etiqueta', html: `${esc(campo.etiqueta)}${campo.ayuda ? `<span class="ayuda">${campo.ayuda}</span>` : ''}` }));
  }
  nodo.append(contenido);
  return nodo;
}

function dibujarCampo(campo) {
  switch (campo.tipo) {
    case 'nota': return el('div', { clase: 'aviso small', html: `${icono('info', { tam: '16px' })}<div>${campo.texto}</div>` });
    case 'texto': return envoltorio(campo, entrada('text', campo));
    case 'numero': return envoltorio(campo, entrada('number', campo));
    case 'parrafo': return envoltorio(campo, areaTexto(campo));
    case 'opcion': return envoltorio(campo, opciones(campo, campo.opciones, campo.modo));
    case 'evidencias': return envoltorio(campo, opciones(campo, base.vocabulario.evidencias.map((e) => ({ v: e.id, e: e.etiqueta, icono: e.icono })), 'varias'));
    case 'instrumento': return envoltorio(campo, opciones(campo, base.vocabulario.instrumentos.map((i) => ({ v: i.id, e: i.etiqueta })), 'una'));
    case 'fases': return envoltorio(campo, opciones(campo, [
      ...base.fases.map((f) => ({ v: f.n, e: `${f.n} · ${f.nombre}`, icono: f.icono, desc: `${f.sesiones} sesiones · deja: ${f.deja.toLowerCase()}` })),
      { v: 'otro', e: 'Otro reto', icono: 'mountain-snow', desc: 'Tu aportación no encaja en estas fases' },
    ], 'varias'));
    case 'materias': return envoltorio(campo, chipsMaterias(campo));
    case 'semanas': return envoltorio(campo, opciones(campo, semanasAula().map((s) => ({ v: s, e: s })), 'una'));
    case 'idea': return envoltorio(campo, ideas(campo));
    case 'criterios': return envoltorio(campo, selectorCriterios(campo));
    case 'saberes': return envoltorio(campo, selectorSaberes(campo));
    case 'dua': return envoltorio(campo, dua(campo));
    case 'tabla': return envoltorio(campo, tabla(campo));
    case 'checklist': return envoltorio(campo, checklist(campo));
    default: return el('div', { clase: 'small muted', texto: `Campo desconocido: ${campo.tipo}` });
  }
}

function entrada(tipo, campo) {
  const nodo = el('input', { type: tipo, value: valores[campo.id] ?? '', min: campo.min, max: campo.max, placeholder: campo.marcador || '' });
  nodo.addEventListener('input', () => fijar(campo.id, nodo.value));
  return campo.sufijo ? el('div', { clase: 'fila', estilo: 'gap:8px' }, [nodo, el('span', { clase: 'small muted', texto: campo.sufijo })]) : nodo;
}

function areaTexto(campo) {
  const nodo = el('textarea', { rows: campo.filas || 3, texto: valores[campo.id] ?? '' });
  const crecer = () => { nodo.style.height = 'auto'; nodo.style.height = `${nodo.scrollHeight + 2}px`; };
  nodo.addEventListener('input', () => { fijar(campo.id, nodo.value); crecer(); });
  setTimeout(crecer, 0);
  return nodo;
}

function opciones(campo, lista, modo) {
  const cont = el('div', { clase: 'opciones' });
  const actual = () => (modo === 'varias' ? [].concat(valores[campo.id] || []) : valores[campo.id]);
  for (const op of lista) {
    const marcada = modo === 'varias' ? actual().includes(op.v) : actual() === op.v;
    const entradaNodo = el('input', { type: modo === 'varias' ? 'checkbox' : 'radio', name: `${campo.id}`, checked: marcada });
    const etiqueta = el('label', { clase: `opcion ${marcada ? 'marcada' : ''}` }, [
      entradaNodo,
      op.icono ? el('span', { html: icono(op.icono, { tam: '17px' }), estilo: 'display:flex;color:var(--c)' }) : null,
      el('span', { html: `${esc(op.e)}${op.desc ? `<span class="desc">${esc(op.desc)}</span>` : ''}` }),
    ]);
    entradaNodo.addEventListener('change', () => {
      if (modo === 'varias') {
        const s = new Set(actual());
        entradaNodo.checked ? s.add(op.v) : s.delete(op.v);
        fijar(campo.id, [...s]);
      } else {
        fijar(campo.id, op.v);
      }
      for (const l of cont.querySelectorAll('.opcion')) l.classList.toggle('marcada', l.querySelector('input').checked);
    });
    cont.append(etiqueta);
  }
  return cont;
}

function chipsMaterias(campo) {
  const cont = el('div', { clase: 'fila' });
  const actual = () => [].concat(valores[campo.id] || []);
  for (const m of base.materias.filter((x) => x.id !== materia.id)) {
    const marcada = actual().includes(m.id);
    const boton = el('button', { type: 'button', clase: `chip-materia op ${marcada ? 'marcada' : ''}`, estilo: `${variables(m)}${marcada ? ';background:var(--t);border-color:var(--c)' : ''}`, html: `${tile(m, 'mini')}${esc(m.corto)}` });
    boton.addEventListener('click', () => {
      const s = new Set(actual());
      s.has(m.id) ? s.delete(m.id) : s.add(m.id);
      fijar(campo.id, [...s]);
      const activa = s.has(m.id);
      boton.classList.toggle('marcada', activa);
      boton.setAttribute('style', `${variables(m)}${activa ? ';background:var(--t);border-color:var(--c)' : ''}`);
    });
    cont.append(boton);
  }
  return cont;
}

function ideas(campo) {
  const lista = materia.ideas.map((idea, i) => ({
    v: `idea${i}`,
    e: idea.titulo,
    icono: base.fases[idea.fase - 1].icono,
    desc: `Fase ${idea.fase} · ${idea.texto}`,
  }));
  lista.push({ v: 'propia', e: 'Tengo otra idea', icono: 'lightbulb', desc: 'La escribes tú en el campo siguiente' });
  const cont = opciones(campo, lista, 'una');
  cont.addEventListener('change', () => {
    const elegida = valores[campo.id];
    const i = Number(String(elegida).replace('idea', ''));
    if (elegida && elegida !== 'propia' && materia.ideas[i]) {
      const area = cont.parentElement.parentElement.querySelector('textarea');
      if (area && !area.value.trim()) {
        area.value = materia.ideas[i].texto;
        area.dispatchEvent(new Event('input'));
      }
      const evid = valores.evidencia;
      if (!evid) fijar('evidencia', materia.ideas[i].evidencia);
    }
  });
  return cont;
}

function selectorCriterios(campo) {
  const cont = el('div', { clase: 'selector-criterios' });
  const elegidos = () => [].concat(valores[campo.id] || []);
  const buscador = el('input', { type: 'search', placeholder: 'Buscar por palabra o código…' });
  const cabecera = el('div', { clase: 'buscador', html: icono('search', { tam: '16px' }) });
  cabecera.append(buscador);
  const lista = el('div', { clase: 'lista-criterios' });
  const pie = el('div', { clase: 'contador' });

  const pintar = () => {
    const filtro = buscador.value.trim().toLowerCase();
    lista.replaceChildren();
    for (const ce of cur.competencias) {
      const criterios = cur.criterios.filter((c) => c.ce === ce.n && (!filtro || c.texto.toLowerCase().includes(filtro) || c.codigo.toLowerCase().includes(filtro) || ce.accion.toLowerCase().includes(filtro)));
      if (!criterios.length) continue;
      lista.append(el('div', { clase: 'grupo-ce', estilo: variables(materia), html: `
        <span class="dot">${icono(ce.icono, { tam: '13px' })}</span>
        <div><span class="titulo">Competencia específica ${ce.n}</span> <span class="accion">${esc(ce.accion)}</span>
        <div class="small muted" style="margin-top:2px">${esc(ce.texto)}</div>
        <div class="fila" style="gap:4px;margin-top:5px">${ce.clave.map((k) => `<span class="kc">${icono(k.icono, { tam: '12px' })}<b>${k.code}</b> ${k.nums.join('·')}</span>`).join('')}</div></div>` }));
      for (const c of criterios) {
        const marcado = elegidos().includes(c.codigo);
        const caja = el('input', { type: 'checkbox', checked: marcado });
        const fila = el('label', { clase: `criterio ${marcado ? 'elegido' : ''}`, estilo: variables(materia) }, [
          caja,
          el('span', { html: `<span class="num">${esc(c.numero)}</span><span class="cod">${esc(c.codigo)}</span>` }),
          el('span', { html: `<span class="txt">${esc(c.texto)}</span>${c.saberes.length ? `<span class="sab">${c.saberes.map((s) => `${sq(cur, s.split('.')[0], materia)} <span class="mono">${esc(s)}</span>`).join(' ')}</span>` : ''}` }),
        ]);
        caja.addEventListener('change', () => {
          const s = new Set(elegidos());
          if (caja.checked) {
            if (campo.max && s.size >= campo.max) {
              caja.checked = false;
              pie.innerHTML = `${icono('circle-alert', { tam: '14px' })} Máximo ${campo.max}. Desmarca uno para elegir otro: es mejor pocos criterios bien trabajados.`;
              return;
            }
            s.add(c.codigo);
          } else s.delete(c.codigo);
          fijar(campo.id, [...s]);
          fila.classList.toggle('elegido', caja.checked);
          contar();
          document.getElementById('saberes-sugeridos')?.dispatchEvent(new Event('refrescar'));
        });
        lista.append(fila);
      }
    }
  };
  const contar = () => {
    const n = elegidos().length;
    pie.innerHTML = `${icono(n ? 'circle-check-big' : 'circle-dashed', { tam: '14px' })} ${n} de ${campo.max} criterios elegidos${n ? `: <span class="mono">${elegidos().join(' · ')}</span>` : ''}`;
  };
  buscador.addEventListener('input', pintar);
  cont.append(cabecera, lista, pie);
  pintar();
  contar();
  return cont;
}

function selectorSaberes(campo) {
  const cont = el('div', { id: 'saberes-sugeridos', clase: 'selector-criterios' });
  const elegidos = () => [].concat(valores[campo.id] || []);
  const verTodos = el('button', { type: 'button', clase: 'boton pequeno fantasma no-imprimir', html: `${icono('layers', { tam: '15px' })} Ver todos los saberes` });
  let todos = false;
  const lista = el('div', { clase: 'lista-criterios' });

  const pintar = () => {
    const codigosCriterio = new Set();
    for (const cod of [].concat(respuestas(tramo.id, materia.id).criterios || valores.criterios || [])) {
      const c = cur.criterios.find((x) => x.codigo === cod);
      if (c) for (const s of c.saberes) codigosCriterio.add(s);
    }
    lista.replaceChildren();
    const relevantes = cur.saberes.filter((s) => todos || codigosCriterio.has(s.codigo) || elegidos().includes(s.codigo));
    if (!relevantes.length) {
      lista.append(el('div', { clase: 'contador', html: `${icono('info', { tam: '14px' })} Elige antes algún criterio: aquí aparecerán los saberes que el currículo le relaciona.` }));
    }
    let letraActual = null;
    for (const s of relevantes) {
      if (s.letra !== letraActual) {
        letraActual = s.letra;
        const b = cur.bloques.find((x) => x.letra === s.letra);
        lista.append(el('div', { clase: 'grupo-ce', estilo: variables(materia), html: `${sq(cur, s.letra, materia)}<div><span class="titulo">${esc(s.letra)} · ${esc(b ? b.titulo : '')}</span></div>` }));
      }
      const marcado = elegidos().includes(s.codigo);
      const caja = el('input', { type: 'checkbox', checked: marcado });
      const fila = el('label', { clase: `criterio ${marcado ? 'elegido' : ''}`, estilo: variables(materia) }, [
        caja,
        el('span', { html: `<span class="cod mono" style="font-size:.72rem">${esc(s.codigo)}</span>` }),
        el('span', { clase: 'txt', html: `${s.cabecera ? '<b>' : ''}${esc(s.texto)}${s.cabecera ? '</b>' : ''}` }),
      ]);
      caja.addEventListener('change', () => {
        const set = new Set(elegidos());
        caja.checked ? set.add(s.codigo) : set.delete(s.codigo);
        fijar(campo.id, [...set]);
        fila.classList.toggle('elegido', caja.checked);
      });
      lista.append(fila);
    }
  };
  verTodos.addEventListener('click', () => {
    todos = !todos;
    verTodos.innerHTML = `${icono('layers', { tam: '15px' })} ${todos ? 'Ver solo los relacionados' : 'Ver todos los saberes'}`;
    pintar();
  });
  cont.addEventListener('refrescar', pintar);
  cont.append(lista, el('div', { clase: 'contador' }, [verTodos]));
  pintar();
  return cont;
}

function dua(campo) {
  const cont = el('div', { clase: 'pila' });
  const actual = () => valores[campo.id] || {};
  for (const d of base.vocabulario.dua) {
    const entradaNodo = el('input', { type: 'text', value: actual()[d.id] || '', placeholder: d.ejemplo });
    entradaNodo.addEventListener('input', () => fijar(campo.id, { ...actual(), [d.id]: entradaNodo.value }));
    cont.append(el('div', { clase: 'campo', estilo: 'margin:0' }, [
      el('div', { clase: 'fila', estilo: 'gap:8px;margin-bottom:5px', html: `${icono(d.icono, { tam: '17px' })}<b>${esc(d.etiqueta)}</b><span class="small muted">· ${esc(d.sub)}</span>` }),
      entradaNodo,
    ]));
  }
  return cont;
}

function tabla(campo) {
  const filas = () => [].concat(valores[campo.id] || []);
  const cont = el('div', {});
  const t = el('table', { clase: 'tabla-campos' });
  const cabecera = el('tr', {}, campo.columnas.map((c) => el('th', { texto: c.etiqueta, estilo: `width:${c.ancho}` })));
  t.append(el('thead', {}, [cabecera]));
  const cuerpo = el('tbody');
  const pintar = () => {
    cuerpo.replaceChildren();
    const datos = filas();
    const n = Math.max(campo.filas || 3, datos.length + 1);
    for (let i = 0; i < n; i++) {
      cuerpo.append(el('tr', {}, campo.columnas.map((col) => {
        const input = el('input', { type: col.tipo === 'fecha' ? 'text' : 'text', value: (datos[i] || {})[col.id] || '', placeholder: col.tipo === 'fecha' ? 'p. ej. 12 nov' : '' });
        input.addEventListener('input', () => {
          const copia = filas();
          while (copia.length <= i) copia.push({});
          copia[i] = { ...copia[i], [col.id]: input.value };
          fijar(campo.id, copia);
        });
        return el('td', {}, [input]);
      })));
    }
  };
  pintar();
  t.append(cuerpo);
  cont.append(t);
  const mas = el('button', { type: 'button', clase: 'boton pequeno fantasma no-imprimir op', estilo: 'margin-top:8px', html: `${icono('plus', { tam: '15px' })} Añadir fila` });
  mas.addEventListener('click', () => { const copia = filas(); copia.push({}); fijar(campo.id, copia); pintar(); });
  cont.append(mas);
  return cont;
}

function checklist(campo) {
  const marcados = () => [].concat(valores[campo.id] || []);
  const cont = el('div', { clase: 'pila' });
  campo.items.forEach((item, i) => {
    const caja = el('input', { type: 'checkbox', checked: marcados().includes(i) });
    caja.addEventListener('change', () => {
      const s = new Set(marcados());
      caja.checked ? s.add(i) : s.delete(i);
      fijar(campo.id, [...s]);
    });
    cont.append(el('label', { clase: 'opcion' }, [caja, el('span', { texto: item })]));
  });
  return cont;
}

function semanasAula() {
  const salida = [];
  const [a, m, d] = base.plan.aula.desde.split('-').map(Number);
  let cursor = new Date(a, m - 1, d);
  const fin = new Date(...base.plan.aula.hasta.split('-').map((x, i) => (i === 1 ? Number(x) - 1 : Number(x))));
  while (cursor <= fin) {
    const lunes = new Date(cursor);
    const viernes = new Date(cursor);
    viernes.setDate(viernes.getDate() + 4);
    const fmt = (x) => `${x.getDate()} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][x.getMonth()]}`;
    salida.push(`${fmt(lunes)} – ${fmt(viernes)}`);
    cursor.setDate(cursor.getDate() + 7);
  }
  salida.push('Me da igual');
  return salida;
}

/* ── Columna lateral: ayudas, Gemini y acciones ─────────────────────────── */

function lateral() {
  const cont = el('aside', { clase: 'lateral no-imprimir' });

  const acciones = el('div', { clase: 'tarjeta pila' });
  acciones.innerHTML = `<p class="eyebrow">Al terminar</p>`;
  const pdf = el('button', { clase: 'boton color', estilo: variables(materia), html: `${icono('printer', { tam: '17px' })} Guardar como PDF` });
  pdf.addEventListener('click', imprimir);
  const correo = el('button', { clase: 'boton fantasma', html: `${icono('mail', { tam: '17px' })} Enviar a coordinación` });
  correo.addEventListener('click', enviar);
  const resumen = el('button', { clase: 'boton fantasma', html: `${icono('copy', { tam: '17px' })} Copiar resumen` });
  resumen.addEventListener('click', () => copiar(textoResumen(), resumen));
  const respaldo = el('button', { clase: 'boton fantasma', html: `${icono('download', { tam: '17px' })} Descargar respaldo` });
  respaldo.addEventListener('click', () => descargar(`${tramo.id}-${materia.id}.json`, JSON.stringify({ tramo: tramo.id, materia: materia.id, valores }, null, 2)));
  acciones.append(pdf, correo, resumen, respaldo, el('p', { clase: 'small muted', html: `Se envía a <span class="mono">${base.plan.correo}</span>. El correo se abre relleno: <b>adjunta el PDF</b> antes de mandarlo.` }));
  cont.append(acciones);

  for (const g of def.gemini || []) cont.append(tarjetaGemini(g));

  for (const ayuda of def.ayudas || []) {
    const tarjeta = el('div', { clase: 'tarjeta ayuda-tienda' });
    if (ayuda.tipo === 'fases') {
      tarjeta.innerHTML = `<h3>${icono('store', { tam: '17px' })} ${esc(ayuda.titulo)}</h3>` + base.fases.map((f) => `
        <div class="fila" style="gap:8px;align-items:flex-start">${faseTile(f, '14px')}<div><b>${f.n} · ${esc(f.nombre)}</b><br><span class="small muted">${esc(f.deja)}</span></div></div>`).join('');
    } else {
      tarjeta.innerHTML = `<h3>${esc(ayuda.titulo)}</h3>
        ${ayuda.cita ? `<p style="font-family:'Zilla Slab';font-weight:600">${esc(ayuda.cita)}</p>` : ''}
        ${ayuda.texto ? `<p class="small">${esc(ayuda.texto)}</p>` : ''}
        ${ayuda.items ? `<ul class="small" style="padding-left:18px;display:grid;gap:4px">${ayuda.items.map((i) => `<li>${i}</li>`).join('')}</ul>` : ''}`;
    }
    cont.append(tarjeta);
  }

  cont.append(el('div', { clase: 'tarjeta pila small', html: `
    <p class="eyebrow">Material del proyecto</p>
    <p><a href="pdf/01_Tiendas_de_Barrio_de_un_vistazo.pdf" target="_blank" rel="noopener">${icono('file-text', { tam: '15px' })} Tiendas de Barrio de un vistazo</a></p>
    <p><a href="pdf/fichas/02_${materia.id}_${(materia.nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}.pdf" target="_blank" rel="noopener">${icono('file-text', { tam: '15px' })} Tu ficha en papel (${esc(materia.id)})</a></p>
    <p><a href="pdf/00_Como_funciona.pdf" target="_blank" rel="noopener">${icono('file-text', { tam: '15px' })} Cómo funciona y clave visual</a></p>` }));

  return cont;
}

function tarjetaGemini(g) {
  const tarjeta = el('div', { clase: 'gemini' });
  tarjeta.innerHTML = `
    <h3>${icono('sparkles', { tam: '18px' })} ${esc(g.titulo)}</h3>
    <p class="small">${esc(g.para)}</p>`;
  const caja = el('div', { clase: 'prompt', hidden: true });
  const area = el('textarea', { readonly: true, spellcheck: 'false' });
  caja.append(area);
  const construir = el('button', { clase: 'boton pequeno', html: `${icono('wand-sparkles', { tam: '15px' })} Construir el prompt con mis respuestas` });
  const copiarBtn = el('button', { clase: 'boton pequeno fantasma', hidden: true, html: `${icono('copy', { tam: '15px' })} Copiar el prompt` });
  const abrir = el('a', { clase: 'boton pequeno fantasma', href: 'https://gemini.google.com/app', target: '_blank', rel: 'noopener', hidden: true, html: `${icono('external-link', { tam: '15px' })} Abrir Gemini` });
  construir.addEventListener('click', () => {
    area.value = g.construir(contextoPrompt());
    caja.hidden = false;
    copiarBtn.hidden = false;
    abrir.hidden = false;
    area.style.height = 'auto';
    area.style.height = `${Math.min(area.scrollHeight + 4, 460)}px`;
  });
  copiarBtn.addEventListener('click', () => copiar(area.value, copiarBtn));
  tarjeta.append(construir, caja, el('div', { clase: 'fila' }, [copiarBtn, abrir]));
  tarjeta.append(el('details', { clase: 'small' }, [
    el('summary', { estilo: 'cursor:pointer;font-weight:700', texto: 'Cómo usarlo con Gemini, paso a paso' }),
    el('div', { clase: 'pasos', estilo: 'margin-top:8px', html: PASOS_GEMINI.map((p) => `<div class="paso"><div>${p}</div></div>`).join('') }),
    el('div', { clase: 'aviso ojo small', estilo: 'margin-top:10px', html: `${icono('triangle-alert', { tam: '16px' })}<ul style="padding-left:16px">${AVISOS_IA.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` }),
  ]));
  return tarjeta;
}

/* ── Documento para el PDF ──────────────────────────────────────────────── */

function valorLegible(campo) {
  const v = valores[campo.id];
  if (vacio(v)) return '';
  switch (campo.tipo) {
    case 'fases': return [].concat(v).map((n) => (n === 'otro' ? 'Otro reto' : `${n} · ${base.fases[n - 1].nombre}`)).join(' · ');
    case 'materias': return [].concat(v).map((id) => (base.materias.find((m) => m.id === id) || {}).corto).filter(Boolean).join(' · ');
    case 'evidencias': return [].concat(v).map((id) => (base.vocabulario.evidencias.find((e) => e.id === id) || {}).etiqueta).filter(Boolean).join(' · ');
    case 'instrumento': return (base.vocabulario.instrumentos.find((i) => i.id === v) || {}).etiqueta || '';
    case 'opcion': {
      const buscar = (x) => (campo.opciones.find((o) => String(o.v) === String(x)) || {}).e || x;
      return campo.modo === 'varias' ? [].concat(v).map(buscar).join(' · ') : buscar(v);
    }
    case 'idea': {
      if (v === 'propia') return 'Idea propia';
      const i = Number(String(v).replace('idea', ''));
      return materia.ideas[i] ? `${materia.ideas[i].titulo} (propuesta, fase ${materia.ideas[i].fase})` : '';
    }
    case 'dua': return base.vocabulario.dua.map((d) => (v[d.id] ? `${d.etiqueta}: ${v[d.id]}` : null)).filter(Boolean).join('\n');
    case 'checklist': return campo.items.filter((_, i) => [].concat(v).includes(i)).map((t) => `✔ ${t}`).join('\n');
    default: return String(v);
  }
}

function construirDocumento() {
  const doc = document.getElementById('documento');
  const p = perfil();
  const partes = [`
    <div class="doc-banda" style="${variables(materia)}">
      <div>
        <p class="eyebrow">${esc(tramo.id)} · ${esc(def.titulo)} — proyecto interdisciplinar ${esc(base.plan.nivel)}</p>
        <h1>${esc(materia.nombre)}</h1>
      </div>
      <p class="codigo">${esc(materia.id)}</p>
    </div>
    <div class="doc-meta">
      <span><b>Docente:</b> ${esc(valores.docente || p.docente || '')}</span>
      <span><b>Grupos:</b> ${esc(valores.grupos || p.grupos || '')}</span>
      <span><b>Proyecto:</b> ${esc(base.plan.proyecto)} · ${esc(base.plan.centro)}</span>
      <span><b>Entrega:</b> ${fechaLarga(tramo.entrega)}</span>
      <span><b>Rellenado:</b> ${fecha(hoy(), { año: true })}</span>
    </div>`];

  for (const sec of secciones) {
    const campos = sec.campos.filter((c) => c.tipo !== 'nota');
    if (!campos.length) continue;
    const filas = campos.map((campo) => {
      if (campo.tipo === 'criterios') return bloqueCriteriosDoc(campo);
      if (campo.tipo === 'saberes') return bloqueSaberesDoc(campo);
      if (campo.tipo === 'tabla') return bloqueTablaDoc(campo);
      const valor = valorLegible(campo);
      return `<div class="doc-campo"><span class="k">${esc(campo.etiqueta || campo.id)}</span><span class="v">${esc(valor)}</span></div>`;
    }).join('');
    partes.push(`<section class="doc-seccion" style="${variables(materia)}"><h2>${esc(sec.titulo)}</h2>${filas}</section>`);
  }

  partes.push(`
    <div class="doc-nota" style="${variables(materia)}">
      <b>Qué pasa ahora.</b> Esta ficha se envía a ${esc(base.plan.coordina)} (${esc(base.plan.correo)}). Se vuelca en el plan común y se devuelve un mapa con lo que aporta cada materia.
      ${tramo.porque ? `<br><b>Por qué este tramo.</b> ${esc(tramo.porque)}` : ''}
    </div>
    <div class="doc-pie">
      <span>Proyecto interdisciplinar ${esc(base.plan.nivel)} · ${esc(base.plan.proyecto)} · ${esc(base.plan.curso)}</span>
      <span>${esc(tramo.id)} · ${esc(def.titulo)} · ${esc(materia.nombre)}</span>
    </div>`);

  doc.innerHTML = partes.join('');
}

function bloqueCriteriosDoc(campo) {
  const elegidos = [].concat(valores[campo.id] || []);
  if (!elegidos.length) return `<div class="doc-campo"><span class="k">${esc(campo.etiqueta)}</span><span class="v"></span></div>`;
  const filas = elegidos.map((cod) => {
    const c = cur.criterios.find((x) => x.codigo === cod);
    if (!c) return '';
    const ce = cur.competencias[c.ce - 1];
    return `<div class="doc-criterio">
      <div><span class="num">${esc(c.numero)}</span><span class="cod">${esc(c.codigo)}</span></div>
      <div><div class="ce-linea">${icono(ce.icono, { tam: '11px' })} Competencia específica ${c.ce} · ${esc(ce.accion)}</div>
      <div class="txt">${esc(c.texto)}</div>
      ${c.saberes.length ? `<div class="ce-linea" style="margin-top:1mm">Saberes: <span class="mono">${esc(c.saberes.join(' · '))}</span></div>` : ''}</div>
    </div>`;
  }).join('');
  return `<div style="margin-bottom:2mm"><div class="doc-campo" style="border:0;padding-bottom:0"><span class="k">Criterios elegidos</span><span class="v mono">${esc(elegidos.join(' · '))}</span></div>${filas}</div>`;
}

function bloqueSaberesDoc(campo) {
  const elegidos = [].concat(valores[campo.id] || []);
  if (!elegidos.length) return `<div class="doc-campo"><span class="k">${esc(campo.etiqueta)}</span><span class="v"></span></div>`;
  const filas = elegidos.map((cod) => {
    const s = cur.saberes.find((x) => x.codigo === cod);
    return s ? `<div class="doc-campo"><span class="k mono">${esc(s.codigo)}</span><span class="v">${esc(s.texto)}</span></div>` : '';
  }).join('');
  return `<div>${filas}</div>`;
}

function bloqueTablaDoc(campo) {
  const filas = [].concat(valores[campo.id] || []).filter((f) => Object.values(f || {}).some((v) => String(v || '').trim()));
  if (!filas.length) return `<div class="doc-campo"><span class="k">${esc(campo.etiqueta)}</span><span class="v"></span></div>`;
  return `<div style="margin:2mm 0">
    <div class="doc-campo" style="border:0;padding-bottom:1mm"><span class="k">${esc(campo.etiqueta)}</span><span class="v"></span></div>
    <table class="doc-tabla"><thead><tr>${campo.columnas.map((c) => `<th>${esc(c.etiqueta)}</th>`).join('')}</tr></thead>
    <tbody>${filas.map((f) => `<tr>${campo.columnas.map((c) => `<td>${esc(f[c.id] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function imprimir() {
  construirDocumento();
  setTimeout(() => window.print(), 60);
}

window.addEventListener('beforeprint', () => { if (materia) construirDocumento(); });

/* ── Envío ──────────────────────────────────────────────────────────────── */

function textoResumen() {
  const p = perfil();
  const lineas = [
    `${tramo.id} · ${def.titulo} — ${materia.nombre}`,
    `Docente: ${valores.docente || p.docente || ''} · Grupos: ${valores.grupos || p.grupos || ''}`,
    `Proyecto: ${base.plan.proyecto} (${base.plan.nivel}) · Entrega: ${fechaLarga(tramo.entrega)}`,
    '',
  ];
  for (const sec of secciones) {
    const campos = sec.campos.filter((c) => c.tipo !== 'nota');
    const trozos = campos.map((campo) => {
      if (campo.tipo === 'tabla') {
        const filas = [].concat(valores[campo.id] || []).filter((f) => Object.values(f || {}).some((v) => String(v || '').trim()));
        return filas.length ? `${campo.etiqueta}:\n${filas.map((f) => `  - ${campo.columnas.map((c) => f[c.id] || '').filter(Boolean).join(' · ')}`).join('\n')}` : '';
      }
      const v = valorLegible(campo);
      return v ? `${campo.etiqueta || campo.id}: ${v}` : '';
    }).filter(Boolean);
    if (trozos.length) lineas.push(`## ${sec.titulo}`, ...trozos, '');
  }
  return lineas.join('\n');
}

function enviar() {
  const p = perfil();
  const quien = valores.docente || p.docente || materia.corto;
  const asunto = `[Proyecto interdisciplinar 1.º ESO] ${tramo.id} ${def.titulo} · ${materia.nombre} · ${quien}`;
  let cuerpo = `Hola Juan María:\n\nAdjunto el PDF de la plantilla ${tramo.id} (${def.titulo}) de ${materia.nombre}.\n\n--- Resumen ---\n${textoResumen()}`;
  if (cuerpo.length > 1600) cuerpo = `${cuerpo.slice(0, 1550)}\n[…] (el detalle va en el PDF adjunto)`;
  const enlace = `mailto:${base.plan.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  marcarEnviado(tramo.id, materia.id);
  window.location.href = enlace;
  setTimeout(dibujar, 800);
}
