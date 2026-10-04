'use strict';
/**
 * Construye los datos que consume la web desde el currículo original y el vocabulario.
 *
 *   node herramientas/construir.cjs
 *
 * Escribe datos/*.json (uno por materia) y js/iconos.js (solo los iconos que se usan).
 * Si algo no cuadra —un icono que no existe, una materia sin bloque de saberes— falla aquí
 * y no en el navegador del profesorado.
 */
const fs = require('fs');
const path = require('path');
const V = require('./vocabulario.cjs');

const RAIZ = path.join(__dirname, '..');
const CURRICULO = 'C:/Users/usuario/OneDrive/Documentos/Documentos Interdisciplinares/DRIVE SdA 1ESO Andalucia/07_Fuentes/Curriculo_consulta.json';
const LUCIDE = path.join(__dirname, 'lucide.json');

const CUR = JSON.parse(fs.readFileSync(CURRICULO, 'utf8'));
const ICONOS = JSON.parse(fs.readFileSync(LUCIDE, 'utf8'));

const usados = new Set();
function usar(nombre, donde) {
  if (!(nombre in ICONOS)) throw new Error(`Icono inexistente: ${nombre} (${donde})`);
  usados.add(nombre);
  return nombre;
}

function descriptores(texto) {
  const fam = new Map();
  for (const [, code, num] of texto.matchAll(/(CCEC|CPSAA|STEM|CCL|CC|CD|CE|CP)(\d)/g)) {
    if (!fam.has(code)) fam.set(code, new Set());
    fam.get(code).add(num);
  }
  return V.CLAVE.filter((k) => fam.has(k.code)).map((k) => ({
    code: k.code, nombre: k.nombre, icono: k.icono, nums: [...fam.get(k.code)].sort(),
  }));
}

function fuente(s) {
  if (s.source.includes('boja')) return 'Orden de 30 de mayo de 2023 (BOJA n.º 104), Anexo II';
  const id = /BOE-A-\d{4}-\d+/.exec(s.source);
  return `Currículo estatal de Religión (${id ? id[0] : 'BOE'})`;
}

const dir = (...p) => {
  const d = path.join(RAIZ, ...p);
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const escribir = (rel, datos) => {
  const destino = path.join(RAIZ, rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, typeof datos === 'string' ? datos : JSON.stringify(datos));
  return `${rel} · ${(fs.statSync(destino).size / 1024).toFixed(0)} KB`;
};

dir('datos', 'curriculo');
const salida = [];

// ── Materias ────────────────────────────────────────────────────────────────
const materias = V.MATERIAS.map((m) => {
  const ref = m.ref ?? m.id;
  const s = CUR.find((x) => x.id === m.id);
  if (!s) throw new Error(`Sin currículo para ${m.id}`);
  const iconos = V.CE_ICONOS[ref];
  if (!iconos || iconos.length !== s.competences.length) {
    throw new Error(`${m.id}: ${s.competences.length} competencias y ${iconos ? iconos.length : 0} iconos`);
  }
  usar(m.icono, m.id);
  iconos.forEach((ic, i) => {
    usar(ic, `${m.id} CE${i + 1}`);
    if (!V.ACCION[ic]) throw new Error(`${ic} sin acción (${m.id} CE${i + 1})`);
  });
  for (const letra of new Set(s.knowledge.map((k) => k.code.split('.')[2]))) {
    const b = V.BLOQUES[ref] && V.BLOQUES[ref][letra];
    if (!b) throw new Error(`${m.id}: falta el bloque ${letra}`);
    usar(b[1], `${m.id} bloque ${letra}`);
  }
  for (const idea of m.ideas) {
    for (const n of idea.ce) if (n > iconos.length) throw new Error(`${m.id}: la idea «${idea.titulo}» cita CE${n}`);
  }
  return {
    id: m.id, ref, nombre: m.nombre, sub: m.sub || null, corto: m.corto, icono: m.icono, emoji: m.emoji,
    c: m.c, t: m.t, grupo: m.grupo, grupoNombre: V.GRUPOS[m.grupo], ideas: m.ideas, base: m.base || null,
    criterios: s.criteria.length, competencias: s.competences.length, saberes: s.knowledge.length,
    alcance: s.scope,
  };
});
salida.push(escribir('datos/materias.json', materias));

// ── Currículo por materia ───────────────────────────────────────────────────
for (const m of materias) {
  const s = CUR.find((x) => x.id === m.id);
  const bloques = [...new Set(s.knowledge.map((k) => k.code.split('.')[2]))].map((letra) => ({
    letra, titulo: V.BLOQUES[m.ref][letra][0], icono: V.BLOQUES[m.ref][letra][1],
  }));
  const competencias = s.competences.map((ce, i) => ({
    n: i + 1,
    texto: ce.text,
    icono: V.CE_ICONOS[m.ref][i],
    accion: V.ACCION[V.CE_ICONOS[m.ref][i]],
    clave: descriptores(ce.descriptors),
  }));
  const criterios = s.criteria.map((c) => ({
    codigo: c.code,
    numero: c.number,
    ce: Number(c.ce),
    texto: c.text,
    saberes: c.saberCodes.map((code) => code.split('.').slice(2).join('.')),
  }));
  const saberes = s.knowledge.map((k) => ({
    codigo: k.code.split('.').slice(2).join('.'),
    letra: k.code.split('.')[2],
    texto: k.text,
    cabecera: s.knowledge.some((o) => o.code.startsWith(k.code + '.')),
  }));
  salida.push(escribir(`datos/curriculo/${m.id}.json`, {
    id: m.id, nombre: m.nombre, alcance: s.scope, relacion: s.relation, fuente: fuente(s), url: s.source,
    bloques, competencias, criterios, saberes,
  }));
}

// ── Plan, fases y vocabulario ───────────────────────────────────────────────
for (const f of V.FASES) usar(f.icono, `fase ${f.n}`);
for (const t of V.PLAN.tramos) usar(t.icono, t.id);
usar(V.PLAN.cierre.icono, 'cierre');
usar(V.PLAN.extra.icono, 'extra');
for (const k of V.CLAVE) usar(k.icono, k.code);
for (const e of V.EVIDENCIAS) usar(e.icono, e.id);
for (const d of V.DUA) usar(d.icono, d.id);
for (const ic of Object.keys(V.ACCION)) usar(ic, 'acción');
for (const ic of V.ICONOS_INTERFAZ) usar(ic, 'interfaz');

salida.push(escribir('datos/plan.json', V.PLAN));
salida.push(escribir('datos/fases.json', V.FASES));
salida.push(escribir('datos/vocabulario.json', {
  acciones: V.ACCION,
  familias: V.FAMILIAS,
  clave: V.CLAVE,
  evidencias: V.EVIDENCIAS,
  instrumentos: V.INSTRUMENTOS,
  dua: V.DUA,
  agrupamientos: V.AGRUPAMIENTOS,
  grupos: V.GRUPOS,
}));

// ── Iconos (solo los usados) ────────────────────────────────────────────────
const subconjunto = {};
for (const nombre of [...usados].sort()) subconjunto[nombre] = ICONOS[nombre];
salida.push(escribir('js/iconos.js', `// Iconos Lucide (licencia ISC) usados en el proyecto. Generado por herramientas/construir.cjs.
export const ICONOS = ${JSON.stringify(subconjunto)};

export function icono(nombre, opciones = {}) {
  const trazos = ICONOS[nombre];
  if (!trazos) return '';
  const { tam = '1em', grosor = 2, clase = '' } = opciones;
  return \`<svg class="i \${clase}" viewBox="0 0 24 24" style="width:\${tam};height:\${tam}" fill="none" stroke="currentColor" stroke-width="\${grosor}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\${trazos}</svg>\`;
}
`));

console.log(salida.join('\n'));
console.log(`\n${materias.length} materias · ${usados.size} iconos · ${CUR.reduce((n, s) => n + s.criteria.length, 0)} criterios en el currículo`);
