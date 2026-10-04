// Piezas compartidas por el panel y las plantillas: datos, fechas, estado local y ayudas de DOM.
import { ICONOS, icono } from './iconos.js';

export { ICONOS, icono };

/* ── Datos ──────────────────────────────────────────────────────────────── */

const cache = new Map();

async function json(ruta) {
  if (!cache.has(ruta)) {
    cache.set(ruta, fetch(new URL(ruta, document.baseURI)).then((r) => {
      if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
      return r.json();
    }));
  }
  return cache.get(ruta);
}

export async function cargarBase() {
  const [plan, materias, fases, vocabulario] = await Promise.all([
    json('datos/plan.json'), json('datos/materias.json'), json('datos/fases.json'), json('datos/vocabulario.json'),
  ]);
  return { plan, materias, fases, vocabulario };
}

export const cargarCurriculo = (id) => json(`datos/curriculo/${id}.json`);

/* ── Fechas ─────────────────────────────────────────────────────────────── */

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Hoy en formato AAAA-MM-DD, en hora local (no UTC: importa para el cambio de día). */
export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const aDate = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
};

export function fecha(iso, { dia = true, mes = true, año = false } = {}) {
  const d = aDate(iso);
  const partes = [];
  if (dia) partes.push(DIAS[d.getDay()].slice(0, 3));
  partes.push(String(d.getDate()));
  if (mes) partes.push(MESES[d.getMonth()]);
  if (año) partes.push(String(d.getFullYear()));
  return partes.join(' ');
}

export const fechaLarga = (iso) => {
  const d = aDate(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

export const dias = (desde, hasta) => Math.round((aDate(hasta) - aDate(desde)) / 86400000);

/** Estado del tramo respecto a hoy: 'futuro' (aún no se abre), 'abierto', 'vencido'. */
export function faseTramo(tramo, referencia = hoy()) {
  if (referencia < tramo.desde) return 'futuro';
  if (referencia > tramo.entrega) return 'vencido';
  return 'abierto';
}

/* ── Estado local (este navegador) ──────────────────────────────────────── */

const leer = (clave, porDefecto) => {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : porDefecto;
  } catch {
    return porDefecto;
  }
};
const guardar = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
};

export const perfil = () => leer('pi:perfil', { docente: '', grupos: '', materia: '' });
export const guardarPerfil = (p) => guardar('pi:perfil', { ...perfil(), ...p });

export const respuestas = (tramo, materia) => leer(`pi:resp:${tramo}:${materia}`, {});
export const guardarRespuestas = (tramo, materia, datos) => guardar(`pi:resp:${tramo}:${materia}`, datos);
export const envio = (tramo, materia) => leer(`pi:env:${tramo}:${materia}`, null);
export const marcarEnviado = (tramo, materia) => guardar(`pi:env:${tramo}:${materia}`, { fecha: new Date().toISOString() });
export const borrarEnvio = (tramo, materia) => localStorage.removeItem(`pi:env:${tramo}:${materia}`);

/** pendiente · borrador (hay algo escrito) · enviado. */
export function estadoDe(tramo, materia) {
  if (envio(tramo, materia)) return 'enviado';
  const r = respuestas(tramo, materia);
  const algo = Object.values(r).some((v) => (Array.isArray(v) ? v.length : typeof v === 'object' && v ? Object.keys(v).length : String(v ?? '').trim()));
  return algo ? 'borrador' : 'pendiente';
}

export function exportarTodo() {
  const datos = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('pi:')) datos[k] = localStorage.getItem(k);
  }
  return { version: 1, guardado: new Date().toISOString(), datos };
}

export function importarTodo(paquete) {
  if (!paquete || typeof paquete.datos !== 'object') throw new Error('El archivo no tiene el formato esperado.');
  let n = 0;
  for (const [k, v] of Object.entries(paquete.datos)) {
    if (k.startsWith('pi:')) { localStorage.setItem(k, v); n++; }
  }
  return n;
}

/* ── DOM ────────────────────────────────────────────────────────────────── */

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function el(etiqueta, props = {}, hijos = []) {
  const nodo = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'html') nodo.innerHTML = v;
    else if (k === 'texto') nodo.textContent = v;
    else if (k === 'clase') nodo.className = v;
    else if (k === 'estilo') nodo.setAttribute('style', v);
    else if (k.startsWith('on')) nodo.addEventListener(k.slice(2), v);
    else if (k === 'datos') for (const [dk, dv] of Object.entries(v)) nodo.dataset[dk] = dv;
    else nodo.setAttribute(k, v === true ? '' : v);
  }
  for (const hijo of [].concat(hijos)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}

export const variables = (m) => `--c:${m.c};--t:${m.t}`;

export const tile = (m, clase = '') => `<span class="tile ${clase}" style="${variables(m)}">${icono(m.icono, { tam: clase === 'grande' ? '26px' : clase === 'mini' ? '13px' : '17px' })}</span>`;

export const faseTile = (f, tam = '16px') => `<span class="ph">${icono(f.icono, { tam })}</span>`;

export const ceMark = (m, curriculo, n) => {
  const ce = curriculo.competencias[n - 1];
  if (!ce) return '';
  return `<span class="ce" style="${variables(m)}" title="Competencia específica ${n}: ${esc(ce.accion)}"><span class="dot">${icono(ce.icono, { tam: '13px' })}</span>${n}</span>`;
};

export const sq = (curriculo, letra, m) => {
  const b = curriculo.bloques.find((x) => x.letra === letra);
  if (!b) return '';
  return `<span class="sq" style="${variables(m)}" title="${esc(b.titulo)}">${icono(b.icono, { tam: '12px' })}</span>`;
};

export function parametros() {
  const p = new URLSearchParams(location.search);
  return { tramo: p.get('t') || '', materia: p.get('m') || '', previa: p.get('previa') === '1' };
}

/** Copia texto al portapapeles y avisa en el botón. Funciona también sin permiso de portapapeles. */
export async function copiar(texto, boton) {
  const original = boton.innerHTML;
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = el('textarea', { estilo: 'position:fixed;opacity:0' });
    ta.value = texto;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  boton.innerHTML = `${icono('copy-check', { tam: '16px' })} Copiado`;
  setTimeout(() => { boton.innerHTML = original; }, 1800);
}

/** Descarga un archivo generado en el navegador (JSON de respaldo). */
export function descargar(nombre, contenido, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = el('a', { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
