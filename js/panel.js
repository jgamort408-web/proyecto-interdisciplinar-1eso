// El plan completo: calendario, lista, mural y progreso. Filtra por materia, tramo, estado y texto.
import {
  cargarBase, icono, el, esc, variables, tile, faseTile, fecha, fechaLarga, hoy, dias, faseTramo,
  perfil, guardarPerfil, estadoDe, envio, exportarTodo, importarTodo, descargar,
} from './comun.js';
import { PLANTILLAS } from './plantillas.js';

const app = document.getElementById('app');
let base, filtros = { materia: '', tramo: '', estado: '', texto: '' }, vista = 'calendario';

const ESTADOS = { pendiente: 'Pendiente', borrador: 'Empezada', enviado: 'Enviada' };

(async function inicio() {
  base = await cargarBase();
  const p = perfil();
  filtros.materia = p.materia || '';
  dibujar();
})().catch((e) => {
  app.replaceChildren(el('div', { clase: 'tarjeta', html: `<h2>No he podido cargar el plan</h2><p class="muted">${esc(e.message)}</p>` }));
});

const tramos = () => base.plan.tramos;
const tramoActual = () => tramos().find((t) => faseTramo(t) === 'abierto') || tramos().find((t) => faseTramo(t) === 'futuro') || tramos().at(-1);
const materiasFiltradas = () => base.materias.filter((m) => !filtros.materia || m.id === filtros.materia);

function dibujar() {
  app.replaceChildren(portada(), controles(), contenido());
}

/* ── Portada ────────────────────────────────────────────────────────────── */

function portada() {
  const t = tramoActual();
  const estado = faseTramo(t);
  const restan = dias(hoy(), t.entrega);
  const m = base.materias.find((x) => x.id === filtros.materia);
  const nodo = el('section', { clase: 'pila', estilo: 'margin-bottom:22px' });
  nodo.innerHTML = `
    <p class="eyebrow">${esc(base.plan.centro)} · ${esc(base.plan.nivel)} · curso ${esc(base.plan.curso)}</p>
    <h1>Construimos <span style="white-space:nowrap">Tiendas de Barrio</span> entre todas las materias</h1>
    <p class="lede" style="max-width:70ch">Cuatro semanas, cuatro plantillas cortas. Rellenas la tuya, la guardas en PDF y me la envías. El aula es en ${esc(base.plan.aula.texto.toLowerCase())}.</p>`;

  const aviso = el('div', { clase: `aviso ${estado === 'abierto' ? 'bien' : ''}`, estilo: 'margin-top:6px' });
  aviso.innerHTML = `${icono(estado === 'abierto' ? 'circle-alert' : 'calendar-days', { tam: '22px' })}
    <div>
      <b>${estado === 'abierto' ? `Esta semana toca ${t.id} · ${t.nombre}` : `El siguiente tramo, ${t.id} · ${t.nombre}, se abre el ${fechaLarga(t.desde)}`}.</b>
      ${estado === 'abierto' ? `Quedan <b>${restan <= 0 ? 'horas' : `${restan} día${restan === 1 ? '' : 's'}`}</b>: se entrega el ${fechaLarga(t.entrega)}. ${esc(t.objetivo)}` : esc(t.objetivo)}
      ${m ? `<div style="margin-top:8px"><a class="boton pequeno color" style="${variables(m)}" href="plantilla.html?t=${t.id}&m=${m.id}">${icono('square-pen', { tam: '15px' })} Abrir mi plantilla de ${esc(m.corto)}</a></div>` : ''}
    </div>`;
  nodo.append(aviso);
  return nodo;
}

/* ── Controles ──────────────────────────────────────────────────────────── */

function controles() {
  const cont = el('section', { clase: 'fila no-imprimir', estilo: 'justify-content:space-between;margin-bottom:16px;align-items:flex-end;gap:14px' });

  const barra = el('div', { clase: 'barra-vistas' });
  for (const [id, etiqueta, ic] of [['calendario', 'Calendario', 'calendar-days'], ['lista', 'Lista', 'list'], ['mural', 'Mural', 'layout-grid'], ['progreso', 'Progreso', 'chart-column']]) {
    const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(vista === id), html: `${icono(ic, { tam: '16px' })} ${etiqueta}` });
    b.addEventListener('click', () => { vista = id; dibujar(); });
    barra.append(b);
  }

  const caja = el('div', { clase: 'filtros' });
  const selMateria = el('select', { 'aria-label': 'Filtrar por materia' }, [el('option', { value: '', texto: 'Todas las materias' })]);
  for (const m of base.materias) selMateria.append(el('option', { value: m.id, texto: `${m.emoji} ${m.corto}`, selected: filtros.materia === m.id }));
  selMateria.addEventListener('change', () => { filtros.materia = selMateria.value; guardarPerfil({ materia: selMateria.value }); dibujar(); });

  const selTramo = el('select', { 'aria-label': 'Filtrar por tramo' }, [el('option', { value: '', texto: 'Todos los tramos' })]);
  for (const t of tramos()) selTramo.append(el('option', { value: t.id, texto: `${t.id} · ${t.nombre}`, selected: filtros.tramo === t.id }));
  selTramo.addEventListener('change', () => { filtros.tramo = selTramo.value; dibujar(); });

  const selEstado = el('select', { 'aria-label': 'Filtrar por estado' }, [el('option', { value: '', texto: 'Cualquier estado' })]);
  for (const [k, v] of Object.entries(ESTADOS)) selEstado.append(el('option', { value: k, texto: v, selected: filtros.estado === k }));
  selEstado.addEventListener('change', () => { filtros.estado = selEstado.value; dibujar(); });

  const buscar = el('input', { type: 'search', placeholder: 'Buscar tarea o materia…', value: filtros.texto, 'aria-label': 'Buscar' });
  buscar.addEventListener('input', () => { filtros.texto = buscar.value; if (vista === 'lista') pintarLista(); else dibujar(); });

  caja.append(selMateria, selTramo, selEstado, buscar);
  cont.append(barra, caja);
  return cont;
}

/* ── Vistas ─────────────────────────────────────────────────────────────── */

function contenido() {
  const cont = el('div', { id: 'contenido' });
  if (vista === 'calendario') cont.append(vistaCalendario());
  if (vista === 'lista') cont.append(vistaLista());
  if (vista === 'mural') cont.append(vistaMural());
  if (vista === 'progreso') cont.append(vistaProgreso());
  cont.append(pie());
  return cont;
}

function tarjetaTramo(t) {
  const estado = faseTramo(t);
  const m = base.materias.find((x) => x.id === filtros.materia);
  const mio = m ? estadoDe(t.id, m.id) : null;
  const def = PLANTILLAS[t.id];
  const nodo = el('article', { clase: `tramo ${estado === 'abierto' ? 'abierto hoy' : estado === 'futuro' ? 'cerrado' : ''}` });
  nodo.innerHTML = `
    <div class="cabeza"><span class="n">${t.numero}</span>${icono(t.icono, { tam: '22px' })}</div>
    <h3>${esc(t.nombre)}</h3>
    <p class="fechas">${icono('calendar-days', { tam: '14px' })} ${fecha(t.desde)} – ${fecha(t.hasta)}</p>
    <p class="small">${esc(t.objetivo)}</p>
    <p class="small muted">${icono('clock', { tam: '13px' })} ${t.minutos} min · entrega ${fechaLarga(t.entrega)}</p>
    <p class="fila" style="gap:6px">
      <span class="estado ${mio || 'pendiente'}">${icono(mio === 'enviado' ? 'circle-check-big' : mio === 'borrador' ? 'square-pen' : 'circle-dashed', { tam: '13px' })} ${mio ? ESTADOS[mio] : 'Elige materia'}</span>
      ${estado === 'futuro' ? `<span class="estado cerrado">${icono('lock', { tam: '13px' })} Se abre el ${fecha(t.desde)}</span>` : ''}
    </p>`;
  const acciones = el('p', { clase: 'fila', estilo: 'margin-top:6px' });
  const destino = `plantilla.html?t=${t.id}${m ? `&m=${m.id}` : ''}${estado === 'futuro' ? '&previa=1' : ''}`;
  acciones.append(el('a', { clase: `boton pequeno ${estado === 'abierto' ? '' : 'fantasma'}`, href: destino, html: `${icono(estado === 'futuro' ? 'eye' : 'square-pen', { tam: '15px' })} ${estado === 'futuro' ? 'Ver en previa' : 'Abrir plantilla'}` }));
  nodo.append(acciones);
  if (def) nodo.append(el('p', { clase: 'small muted', texto: def.lema }));
  return nodo;
}

function vistaCalendario() {
  const cont = el('div', { clase: 'pila' });
  const rejilla = el('div', { clase: 'tramos' });
  for (const t of tramos()) if (!filtros.tramo || filtros.tramo === t.id) rejilla.append(tarjetaTramo(t));
  cont.append(rejilla);

  const linea = el('section', { clase: 'tarjeta', estilo: 'margin-top:20px' });
  linea.innerHTML = '<h2 style="margin-bottom:14px">Todo el recorrido</h2>';
  const tiempo = el('div', { clase: 'linea-tiempo' });
  const hitos = [
    ...tramos().map((t) => ({ cuando: `${fecha(t.desde)} – ${fecha(t.hasta)}`, clave: t.entrega, titulo: `${t.id} · ${t.nombre}`, texto: `${t.objetivo} <b>Entrega: ${fechaLarga(t.entrega)}.</b>`, icono: t.icono, porque: t.porque })),
    { cuando: fecha(base.plan.cierre.fecha), clave: base.plan.cierre.fecha, titulo: base.plan.cierre.nombre, texto: base.plan.cierre.objetivo, icono: base.plan.cierre.icono },
    { cuando: `${fecha(base.plan.aula.desde)} – ${fecha(base.plan.aula.hasta)}`, clave: base.plan.aula.hasta, titulo: 'Tiendas de Barrio en el aula', texto: 'Seis fases con el alumnado: de montar la tienda al mercado y la presentación final.', icono: 'store' },
  ];
  for (const h of hitos) {
    const pasado = hoy() > h.clave;
    const actual = !pasado && hoy() >= (h.desde || '0000-00-00');
    tiempo.append(el('div', { clase: `hito ${pasado ? 'hecho' : ''} ${actual ? 'actual' : ''}` }, [
      el('div', { clase: 'cuando', texto: h.cuando }),
      el('div', { clase: 'eje', html: '<span class="punto"></span><span class="raya"></span>' }),
      el('div', { clase: 'caja', html: `<h3>${icono(h.icono, { tam: '17px' })} ${esc(h.titulo)}</h3><p class="small">${h.texto}</p>${h.porque ? `<p class="small muted" style="margin-top:4px">${icono('info', { tam: '13px' })} ${esc(h.porque)}</p>` : ''}` }),
    ]));
  }
  linea.append(tiempo);
  cont.append(linea);
  return cont;
}

function filasPlan() {
  const filas = [];
  for (const m of materiasFiltradas()) {
    for (const t of tramos()) {
      if (filtros.tramo && filtros.tramo !== t.id) continue;
      const estado = estadoDe(t.id, m.id);
      if (filtros.estado && filtros.estado !== estado) continue;
      const def = PLANTILLAS[t.id];
      const texto = `${m.nombre} ${t.nombre} ${def ? def.titulo : ''} ${t.entregable}`.toLowerCase();
      if (filtros.texto && !texto.includes(filtros.texto.toLowerCase())) continue;
      filas.push({ m, t, estado, def });
    }
  }
  return filas;
}

function vistaLista() {
  const cont = el('div', { clase: 'envoltorio-tabla' });
  cont.id = 'envoltura-lista';
  cont.append(tablaLista());
  return cont;
}

function pintarLista() {
  const cont = document.getElementById('envoltura-lista');
  if (cont) cont.replaceChildren(tablaLista());
}

function tablaLista() {
  const filas = filasPlan();
  const t = el('table', { clase: 'datos' });
  t.innerHTML = `<thead><tr><th style="width:90px">Tramo</th><th style="width:190px">Materia</th><th>Qué se pide</th><th style="width:130px">Entrega</th><th style="width:120px">Estado</th><th style="width:110px"></th></tr></thead>`;
  const cuerpo = el('tbody');
  for (const f of filas) {
    const env = envio(f.t.id, f.m.id);
    cuerpo.append(el('tr', { html: `
      <td><b>${f.t.id}</b><br><span class="small muted">${esc(f.t.nombre)}</span></td>
      <td><span class="fila" style="gap:8px;flex-wrap:nowrap">${tile(f.m, 'mini')}<span>${esc(f.m.corto)}</span></span></td>
      <td>${esc(f.t.entregable)}<br><span class="small muted">${esc(f.def ? f.def.lema : '')}</span></td>
      <td>${fecha(f.t.entrega)}<br><span class="small muted">${faseTramo(f.t) === 'futuro' ? `abre ${fecha(f.t.desde)}` : faseTramo(f.t) === 'vencido' ? 'plazo pasado' : 'abierta'}</span></td>
      <td><span class="estado ${f.estado}">${ESTADOS[f.estado]}</span>${env ? `<br><span class="small muted">${fecha(env.fecha.slice(0, 10))}</span>` : ''}</td>
      <td><a class="boton pequeno fantasma" href="plantilla.html?t=${f.t.id}&m=${f.m.id}${faseTramo(f.t) === 'futuro' ? '&previa=1' : ''}">Abrir</a></td>` }));
  }
  if (!filas.length) cuerpo.append(el('tr', { html: '<td colspan="6" class="muted" style="padding:20px">Ninguna tarea cumple ese filtro.</td>' }));
  t.append(cuerpo);
  return t;
}

function vistaMural() {
  const cont = el('div', { clase: 'envoltorio-tabla' });
  const t = el('table', { clase: 'mural' });
  t.innerHTML = `<thead><tr><th style="width:190px">Materia</th>${base.fases.map((f) => `<th><span class="fila" style="gap:6px;flex-wrap:nowrap">${faseTile(f, '14px')}<span><b>${f.n}</b> · ${esc(f.nombre)}<br><span class="small muted">${f.sesiones} ses.</span></span></span></th>`).join('')}</tr></thead>`;
  const cuerpo = el('tbody');
  for (const m of materiasFiltradas()) {
    const declaradas = [].concat((JSON.parse(localStorage.getItem(`pi:resp:T1:${m.id}`) || '{}')).fases || []);
    const celdas = base.fases.map((f) => {
      const idea = m.ideas.find((i) => i.fase === f.n);
      const mia = declaradas.includes(f.n);
      if (idea) return `<td class="hit" style="${variables(m)}"><b>${esc(idea.titulo)}</b>${mia ? ` ${icono('circle-check-big', { tam: '13px' })}` : ''}<br><span class="small muted">${esc(idea.evidencia)}</span></td>`;
      if (m.base && m.base[f.n]) return `<td class="base" style="${variables(m)}">${esc(m.base[f.n])}</td>`;
      return `<td${mia ? ` class="hit" style="${variables(m)}"` : ''}>${mia ? `<span class="small">${icono('circle-check-big', { tam: '13px' })} apuntada</span>` : ''}</td>`;
    }).join('');
    cuerpo.append(el('tr', { html: `<td class="nombre"><span class="fila" style="gap:8px;flex-wrap:nowrap">${tile(m, 'mini')}${esc(m.corto)}</span></td>${celdas}` }));
  }
  t.append(cuerpo);
  cont.append(t);
  const nota = el('p', { clase: 'small muted', estilo: 'padding:10px 12px', html: `${icono('info', { tam: '14px' })} Las casillas con texto son las ideas propuestas. La marca de verificación aparece en las fases que has declarado tú en el tramo 1 (se lee de este navegador).` });
  cont.append(nota);
  return cont;
}

function vistaProgreso() {
  const cont = el('div', { clase: 'tarjeta pila' });
  cont.append(el('h2', { texto: 'Cómo va' }));
  cont.append(el('p', { clase: 'small muted', html: `${icono('info', { tam: '14px' })} Esto refleja lo guardado <b>en este navegador</b>. La coordinación lleva el recuento real con los PDF que recibe.` }));

  const porTramo = el('div', { clase: 'progreso', estilo: 'margin-top:12px' });
  for (const t of tramos()) {
    const total = base.materias.length;
    const hechas = base.materias.filter((m) => estadoDe(t.id, m.id) === 'enviado').length;
    const pct = Math.round((hechas / total) * 100);
    porTramo.append(el('div', { clase: 'barra', html: `
      <span><b>${t.id}</b> · ${esc(t.nombre)}</span>
      <span class="pista"><span class="relleno" style="width:${pct}%;--c:${pct === 100 ? '#047857' : '#1b2330'};background:${pct === 100 ? '#047857' : '#1b2330'}"></span></span>
      <span class="small muted">${hechas}/${total}</span>` }));
  }
  cont.append(el('h3', { texto: 'Por tramo', estilo: 'margin-top:8px' }), porTramo);

  const porMateria = el('div', { clase: 'progreso', estilo: 'margin-top:12px' });
  for (const m of materiasFiltradas()) {
    const hechas = tramos().filter((t) => estadoDe(t.id, m.id) === 'enviado').length;
    const pct = Math.round((hechas / tramos().length) * 100);
    porMateria.append(el('div', { clase: 'barra', estilo: variables(m), html: `
      <span class="fila" style="gap:8px;flex-wrap:nowrap">${tile(m, 'mini')}<span class="small">${esc(m.corto)}</span></span>
      <span class="pista"><span class="relleno" style="width:${pct}%"></span></span>
      <span class="small muted">${hechas}/${tramos().length}</span>` }));
  }
  cont.append(el('h3', { texto: 'Por materia', estilo: 'margin-top:14px' }), porMateria);
  return cont;
}

function pie() {
  const cont = el('section', { clase: 'tarjeta pila no-imprimir', estilo: 'margin-top:22px' });
  cont.innerHTML = `<p class="eyebrow">Material y respaldo</p>
    <div class="fila">
      <a class="boton fantasma pequeno" href="pdf/00_Como_funciona.pdf" target="_blank" rel="noopener">${icono('file-text', { tam: '15px' })} Cómo funciona (PDF)</a>
      <a class="boton fantasma pequeno" href="pdf/01_Tiendas_de_Barrio_de_un_vistazo.pdf" target="_blank" rel="noopener">${icono('store', { tam: '15px' })} Tiendas de Barrio (PDF)</a>
      <a class="boton fantasma pequeno" href="pdf/04_Mural_del_equipo_A3.pdf" target="_blank" rel="noopener">${icono('layout-grid', { tam: '15px' })} Mural A3 (PDF)</a>
      <a class="boton fantasma pequeno" href="excel/Calendario_proyecto_interdisciplinar_1ESO.xlsx">${icono('table-2', { tam: '15px' })} Calendario en hoja de cálculo</a>
    </div>`;
  const fila = el('div', { clase: 'fila' });
  const exportar = el('button', { clase: 'boton fantasma pequeno', html: `${icono('download', { tam: '15px' })} Guardar copia de mis respuestas` });
  exportar.addEventListener('click', () => descargar('mis-respuestas-proyecto.json', JSON.stringify(exportarTodo(), null, 2)));
  const importar = el('label', { clase: 'boton fantasma pequeno', html: `${icono('upload', { tam: '15px' })} Recuperar copia` });
  const archivo = el('input', { type: 'file', accept: '.json', estilo: 'display:none' });
  archivo.addEventListener('change', async () => {
    const f = archivo.files[0];
    if (!f) return;
    try {
      const n = importarTodo(JSON.parse(await f.text()));
      alert(`Recuperadas ${n} entradas. Se recarga el plan.`);
      location.reload();
    } catch (e) {
      alert(`No he podido leer ese archivo: ${e.message}`);
    }
  });
  importar.append(archivo);
  fila.append(exportar, importar);
  cont.append(fila);
  cont.append(el('p', { clase: 'small muted', html: `Lo que escribes se guarda <b>solo en este navegador</b>. Si cambias de ordenador, usa «Guardar copia» y «Recuperar copia». Dudas: <a href="mailto:${base.plan.correo}">${esc(base.plan.correo)}</a>.` }));
  return cont;
}
