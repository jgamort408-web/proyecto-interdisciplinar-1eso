'use strict';
/**
 * Calendario del proyecto en hoja de cálculo, pensado para abrirse en Google Sheets.
 *
 *   node herramientas/excel.cjs
 *
 * Siete hojas: Léeme, Calendario, Mural, Aportaciones, Criterios, Materias y Panel.
 * Los colores son los mismos que en la web y en los PDF; los iconos, emoji (lo único
 * que se ve igual en Sheets, Excel y el móvil).
 *
 * Las fórmulas se escriben sin resultado guardado: Google Sheets las calcula al abrir.
 */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const V = require('./vocabulario.cjs');

const RAIZ = path.join(__dirname, '..');
const CURRICULO = 'C:/Users/usuario/OneDrive/Documentos/Documentos Interdisciplinares/DRIVE SdA 1ESO Andalucia/07_Fuentes/Curriculo_consulta.json';
const CUR = JSON.parse(fs.readFileSync(CURRICULO, 'utf8'));
const DESTINO = path.join(RAIZ, 'excel', 'Calendario_proyecto_interdisciplinar_1ESO.xlsx');

/** Un emoji por acción, para que el criterio se reconozca de un vistazo también aquí. */
const EMOJI_ACCION = {
  glasses: '👓', speech: '🗣️', 'pencil-line': '✏️', 'messages-square': '💬', feather: '🪶', 'spell-check': '🔤',
  earth: '🌍', megaphone: '📣', 'search-check': '🔎', scale: '⚖️', puzzle: '🧩', 'badge-check': '✅', link: '🔗',
  shapes: '🔷', 'flask-conical': '🧪', workflow: '🧠', code: '💻', 'brain-circuit': '🤖', cpu: '🔌', 'app-window': '🪟',
  'shield-check': '🛡️', image: '🖼️', paintbrush: '🖌️', sparkles: '✨', guitar: '🎸', 'heart-pulse': '💓',
  'person-standing': '🤸', smile: '🙂', handshake: '🤝', leaf: '🌱', mountain: '⛰️', hourglass: '⏳', castle: '🏰',
  fingerprint: '🪪', 'scroll-text': '📜', sun: '☀️',
};

const ESTADOS = ['Pendiente', 'Empezada', 'Enviada', 'Revisada', 'No participa'];
const hex = (c) => c.replace('#', 'FF');

/**
 * Las fechas se escriben a medianoche UTC. Con medianoche local, el libro las guarda
 * como el día anterior (en España estamos en UTC+1 o +2) y el calendario sale corrido.
 */
const fechaUTC = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
};
const MATERIAS = V.MATERIAS.map((m) => ({ ...m, ref: m.ref ?? m.id, cur: CUR.find((s) => s.id === m.id) }));

const libro = new ExcelJS.Workbook();
libro.creator = 'Proyecto interdisciplinar 1.º ESO · IES Al-Ándalus';
libro.created = new Date();

/* ── Utilidades de formato ──────────────────────────────────────────────── */

const TITULO = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
const NORMAL = { name: 'Arial', size: 10 };
const SUAVE = { name: 'Arial', size: 9, color: { argb: 'FF586273' } };

function cabecera(hoja, fila, textos, color = '1B2330') {
  const f = hoja.getRow(fila);
  textos.forEach((t, i) => {
    const celda = f.getCell(i + 1);
    celda.value = t;
    celda.font = TITULO;
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex('#' + color) } };
    celda.alignment = { vertical: 'middle', wrapText: true };
  });
  f.height = 26;
  return f;
}

function borde(celda) {
  celda.border = {
    top: { style: 'hair', color: { argb: 'FFC5CCD6' } },
    left: { style: 'hair', color: { argb: 'FFC5CCD6' } },
    bottom: { style: 'hair', color: { argb: 'FFC5CCD6' } },
    right: { style: 'hair', color: { argb: 'FFC5CCD6' } },
  };
}

const validacion = (hoja, columna, desde, hasta, formula) => {
  for (let f = desde; f <= hasta; f++) {
    hoja.getCell(`${columna}${f}`).dataValidation = { type: 'list', allowBlank: true, formulae: [formula], showErrorMessage: false };
  }
};

/* ── 1 · Léeme ──────────────────────────────────────────────────────────── */
{
  const h = libro.addWorksheet('Léeme', { properties: { tabColor: { argb: 'FF1B2330' } }, views: [{ showGridLines: false }] });
  h.columns = [{ width: 3 }, { width: 30 }, { width: 86 }];
  let f = 2;
  const pon = (a, b, estilo = {}) => {
    h.getCell(`B${f}`).value = a;
    h.getCell(`B${f}`).font = { ...NORMAL, bold: true, ...estilo };
    h.getCell(`C${f}`).value = b;
    h.getCell(`C${f}`).font = NORMAL;
    h.getCell(`C${f}`).alignment = { wrapText: true, vertical: 'top' };
    h.getRow(f).height = Math.max(16, Math.ceil(String(b).length / 95) * 14);
    f++;
  };
  h.getCell('B2').value = 'Proyecto interdisciplinar 1.º ESO · Tiendas de Barrio';
  h.getCell('B2').font = { name: 'Arial', size: 16, bold: true };
  h.mergeCells('B2:C2');
  f = 4;
  pon('Para qué es', 'Para ir metiendo aquí lo que cada materia aporta al proyecto, con sus criterios, sus fechas y su estado. Es el mismo mural A3 del kit en papel, pero editable entre todos.');
  pon('Cómo se usa', 'Archivo → Abrir con Google Sheets. Compártelo con permiso de edición al equipo. Cada docente rellena su fila en la hoja «Aportaciones» y marca su estado.');
  pon('Hojas', 'Calendario (qué toca cada semana) · Mural (materias × fases) · Aportaciones (el detalle, con desplegables) · Criterios (los 300 criterios de 1.º ESO) · Materias · Panel (recuento automático).');
  pon('Desplegables', 'Las celdas con flecha traen lista: materia, tramo, fase, criterio, instrumento y estado. El texto del criterio aparece solo al elegir su código.');
  pon('Colores e iconos', 'Cada materia tiene el color y el emoji que usa la web y los PDF. Cada criterio lleva el emoji de la acción que desarrolla: el mismo emoji en dos materias significa la misma acción, y ahí hay una conexión.');
  pon('Las fórmulas', 'Se calculan al abrir el archivo en Google Sheets o Excel. Si ves celdas vacías en «Panel» antes de abrirlo del todo, es normal.');
  pon('Fuente del currículo', 'Orden de 30 de mayo de 2023 (BOJA n.º 104), Anexo II; BOE para Religión. No se ha reescrito nada a mano.');
  pon('Dudas', `${V.PLAN.coordina} · ${V.PLAN.correo}`);
  f++;
  h.getCell(`B${f}`).value = 'Leyenda de materias';
  h.getCell(`B${f}`).font = { ...NORMAL, bold: true };
  f++;
  for (const m of MATERIAS) {
    const c = h.getCell(`B${f}`);
    c.value = `${m.emoji}  ${m.id}`;
    c.font = { ...NORMAL, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(m.c) } };
    h.getCell(`C${f}`).value = `${m.nombre} · ${V.GRUPOS[m.grupo]} · ${m.cur.criteria.length} criterios`;
    h.getCell(`C${f}`).font = NORMAL;
    f++;
  }
}

/* ── 2 · Calendario ─────────────────────────────────────────────────────── */
{
  const h = libro.addWorksheet('Calendario', { properties: { tabColor: { argb: 'FF047857' } }, views: [{ state: 'frozen', ySplit: 2 }] });
  h.columns = [
    { width: 12 }, { width: 26 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 58 }, { width: 16 }, { width: 34 },
  ];
  h.getCell('A1').value = 'Calendario de planificación · entrega los viernes · el aula es en noviembre y diciembre';
  h.getCell('A1').font = { name: 'Arial', size: 13, bold: true };
  h.mergeCells('A1:H1');
  cabecera(h, 2, ['Tramo', 'Qué se pide', 'Desde', 'Hasta', 'Entrega', 'Objetivo', 'Estado', 'Notas del equipo']);

  let f = 3;
  const fechaCelda = (celda, iso) => {
    celda.value = fechaUTC(iso);
    celda.numFmt = 'ddd d mmm';
    celda.alignment = { horizontal: 'center' };
  };
  for (const t of V.PLAN.tramos) {
    const fila = h.getRow(f);
    fila.getCell(1).value = `${t.id} ${V.FASES[0] ? '' : ''}`.trim() || t.id;
    fila.getCell(1).font = { ...NORMAL, bold: true };
    fila.getCell(2).value = `${t.nombre} — ${t.entregable}`;
    fechaCelda(fila.getCell(3), t.desde);
    fechaCelda(fila.getCell(4), t.hasta);
    fechaCelda(fila.getCell(5), t.entrega);
    fila.getCell(5).font = { ...NORMAL, bold: true };
    fila.getCell(6).value = `${t.objetivo} (${t.minutos} min por docente)`;
    fila.getCell(7).value = 'Pendiente';
    fila.getCell(6).alignment = { wrapText: true, vertical: 'top' };
    fila.height = 30;
    for (let c = 1; c <= 8; c++) { borde(fila.getCell(c)); if (!fila.getCell(c).font) fila.getCell(c).font = NORMAL; }
    f++;
  }
  const cierre = h.getRow(f);
  cierre.getCell(1).value = 'Cierre';
  cierre.getCell(1).font = { ...NORMAL, bold: true };
  cierre.getCell(2).value = V.PLAN.cierre.nombre;
  fechaCelda(cierre.getCell(3), V.PLAN.cierre.fecha);
  fechaCelda(cierre.getCell(5), V.PLAN.cierre.fecha);
  cierre.getCell(6).value = V.PLAN.cierre.objetivo;
  cierre.getCell(7).value = 'Pendiente';
  f += 2;

  h.getCell(`A${f}`).value = 'En el aula · las seis fases con el alumnado';
  h.getCell(`A${f}`).font = { name: 'Arial', size: 12, bold: true };
  f++;
  cabecera(h, f, ['Fase', 'Nombre', 'Sesiones', '', '', 'Qué pasa y qué deja', 'Estado', 'Quién entra'], '586273');
  f++;
  for (const fase of V.FASES) {
    const fila = h.getRow(f);
    fila.getCell(1).value = `${fase.emoji} ${fase.n}`;
    fila.getCell(2).value = fase.nombre;
    fila.getCell(3).value = fase.sesiones;
    fila.getCell(3).alignment = { horizontal: 'center' };
    fila.getCell(6).value = `${fase.hace} Deja: ${fase.deja}.`;
    fila.getCell(6).alignment = { wrapText: true, vertical: 'top' };
    fila.getCell(7).value = 'Pendiente';
    fila.height = 30;
    for (let c = 1; c <= 8; c++) { borde(fila.getCell(c)); if (!fila.getCell(c).font) fila.getCell(c).font = NORMAL; }
    f++;
  }
  validacion(h, 'G', 3, f, `"${ESTADOS.join(',')}"`);
  h.autoFilter = 'A2:H2';
}

/* ── 3 · Mural ──────────────────────────────────────────────────────────── */
{
  const h = libro.addWorksheet('Mural', { properties: { tabColor: { argb: 'FF0369A1' } }, views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }] });
  h.columns = [{ width: 24 }, { width: 6 }, ...V.FASES.map(() => ({ width: 30 })), { width: 26 }];
  h.getCell('A1').value = 'Mural del equipo · qué aporta cada materia en cada fase';
  h.getCell('A1').font = { name: 'Arial', size: 13, bold: true };
  h.mergeCells('A1:I1');
  h.getCell('A2').value = 'El texto gris es la idea propuesta: bórralo y escribe la aportación real cuando la materia la confirme.';
  h.getCell('A2').font = SUAVE;
  h.mergeCells('A2:I2');
  cabecera(h, 3, ['Materia', '', ...V.FASES.map((f) => `${f.emoji} ${f.n} · ${f.nombre}`), '🏔️ Otro reto']);

  let f = 4;
  for (const m of MATERIAS) {
    const fila = h.getRow(f);
    const nombre = fila.getCell(1);
    nombre.value = m.corto;
    nombre.font = { ...NORMAL, bold: true, color: { argb: 'FFFFFFFF' } };
    nombre.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(m.c) } };
    nombre.alignment = { vertical: 'middle' };
    const emoji = fila.getCell(2);
    emoji.value = m.emoji;
    emoji.alignment = { horizontal: 'center', vertical: 'middle' };
    for (const fase of V.FASES) {
      const celda = fila.getCell(2 + fase.n);
      const idea = m.ideas.find((i) => i.fase === fase.n);
      if (idea) {
        celda.value = `${idea.titulo} · CE ${idea.ce.join(' y ')}`;
        celda.font = { ...NORMAL, color: { argb: 'FF586273' }, italic: true };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(m.t) } };
      } else if (m.base && m.base[fase.n]) {
        celda.value = m.base[fase.n];
        celda.font = SUAVE;
      }
      celda.alignment = { wrapText: true, vertical: 'top' };
      borde(celda);
    }
    borde(fila.getCell(9));
    fila.height = 34;
    f++;
  }
  h.getRow(f).getCell(1).value = 'Orientación · PT';
  h.getRow(f).getCell(1).font = { ...NORMAL, bold: true };
  h.getRow(f).getCell(3).value = 'Transversal: anticipar barreras, graduar catálogos y apoyar dentro del aula.';
  h.getRow(f).getCell(3).font = SUAVE;
  h.mergeCells(`C${f}:I${f}`);
}

/* ── 4 · Aportaciones ───────────────────────────────────────────────────── */
let filasAportaciones = 0;
{
  const h = libro.addWorksheet('Aportaciones', { properties: { tabColor: { argb: 'FFB45309' } }, views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] });
  const columnas = [
    ['Materia', 22], ['', 5], ['Tramo', 10], ['Fase del aula', 18], ['Tarea del alumnado', 46],
    ['Criterio 1', 13], ['Texto del criterio 1', 52], ['Criterio 2', 13], ['Texto del criterio 2', 52],
    ['Saberes', 22], ['Evidencia individual', 32], ['Instrumento', 18], ['Ses.', 7], ['Min.', 7],
    ['Recibo de', 18], ['Entrego a', 18], ['Fecha de entrega', 16], ['Estado', 14], ['Enlace al material', 30],
  ];
  h.columns = columnas.map(([, w]) => ({ width: w }));
  h.getCell('A1').value = 'Aportaciones · una fila por aportación. Las celdas con flecha tienen desplegable.';
  h.getCell('A1').font = { name: 'Arial', size: 13, bold: true };
  h.mergeCells('A1:S1');
  cabecera(h, 2, columnas.map(([t]) => t), 'B45309');

  const ultima = 160;
  const ejemplo = MATERIAS[0];
  const critEjemplo = ejemplo.cur.criteria[2];
  const fila = h.getRow(3);
  fila.getCell(1).value = ejemplo.corto;
  fila.getCell(3).value = 'T2';
  fila.getCell(4).value = '2 · Pedidos y cambio';
  fila.getCell(5).value = 'EJEMPLO (bórralo): calcular el pedido de la tienda con 5 €, comprobar el cambio y explicar la revisión a otra pareja.';
  fila.getCell(6).value = critEjemplo.code;
  fila.getCell(8).value = ejemplo.cur.criteria[4].code;
  fila.getCell(10).value = 'A.2.2 · A.3.4';
  fila.getCell(11).value = 'Pedido revisado y registro de comprobación';
  fila.getCell(12).value = 'Lista de cotejo';
  fila.getCell(13).value = 4;
  fila.getCell(14).value = 55;
  fila.getCell(15).value = 'Plástica y Audiovisual';
  fila.getCell(16).value = 'Lengua Castellana';
  fila.getCell(17).value = fechaUTC('2026-11-13');
  fila.getCell(17).numFmt = 'ddd d mmm';
  fila.getCell(18).value = 'Enviada';
  for (let c = 1; c <= 19; c++) { fila.getCell(c).font = { ...NORMAL, italic: true, color: { argb: 'FF586273' } }; borde(fila.getCell(c)); }
  fila.getCell(5).alignment = { wrapText: true, vertical: 'top' };
  fila.height = 30;

  for (let f = 3; f <= ultima; f++) {
    h.getCell(`B${f}`).value = { formula: `IFERROR(INDEX(Materias!$C$3:$C$18,MATCH($A${f},Materias!$B$3:$B$18,0)),"")` };
    h.getCell(`G${f}`).value = { formula: `IFERROR(INDEX(Criterios!$H$3:$H$${2 + CUR.reduce((n, s) => n + s.criteria.length, 0)},MATCH($F${f},Criterios!$C$3:$C$${2 + CUR.reduce((n, s) => n + s.criteria.length, 0)},0)),"")` };
    h.getCell(`I${f}`).value = { formula: `IFERROR(INDEX(Criterios!$H$3:$H$${2 + CUR.reduce((n, s) => n + s.criteria.length, 0)},MATCH($H${f},Criterios!$C$3:$C$${2 + CUR.reduce((n, s) => n + s.criteria.length, 0)},0)),"")` };
    for (const col of ['G', 'I', 'E', 'K']) h.getCell(`${col}${f}`).alignment = { wrapText: true, vertical: 'top' };
    for (let c = 1; c <= 19; c++) { if (f > 3) { borde(h.getCell(f, c)); h.getCell(f, c).font = NORMAL; } }
    h.getCell(`Q${f}`).numFmt = 'ddd d mmm';
  }
  validacion(h, 'A', 3, ultima, 'Materias!$B$3:$B$18');
  validacion(h, 'C', 3, ultima, `"${V.PLAN.tramos.map((t) => t.id).join(',')}"`);
  validacion(h, 'D', 3, ultima, `"${V.FASES.map((f) => `${f.n} · ${f.nombre}`).join(',')},Otro reto"`);
  validacion(h, 'F', 3, ultima, 'Criterios!$C$3:$C$302');
  validacion(h, 'H', 3, ultima, 'Criterios!$C$3:$C$302');
  validacion(h, 'L', 3, ultima, `"${V.INSTRUMENTOS.map((i) => i.etiqueta).join(',')}"`);
  validacion(h, 'O', 3, ultima, 'Materias!$B$3:$B$18');
  validacion(h, 'P', 3, ultima, 'Materias!$B$3:$B$18');
  validacion(h, 'R', 3, ultima, `"${ESTADOS.join(',')}"`);
  h.autoFilter = 'A2:S2';
  filasAportaciones = ultima;
}

/* ── 5 · Criterios ──────────────────────────────────────────────────────── */
let totalCriterios = 0;
{
  const h = libro.addWorksheet('Criterios', { properties: { tabColor: { argb: 'FF4D7C0F' } }, views: [{ state: 'frozen', ySplit: 2 }] });
  h.columns = [{ width: 24 }, { width: 5 }, { width: 14 }, { width: 7 }, { width: 6 }, { width: 30 }, { width: 5 }, { width: 96 }, { width: 24 }];
  h.getCell('A1').value = 'Los 300 criterios de 1.º ESO · fuente: Orden de 30 de mayo de 2023 (BOJA n.º 104) y BOE para Religión';
  h.getCell('A1').font = { name: 'Arial', size: 13, bold: true };
  h.mergeCells('A1:I1');
  cabecera(h, 2, ['Materia', '', 'Código', 'Nº', 'CE', 'Acción que desarrolla', '', 'Texto completo del criterio', 'Saberes relacionados'], '4D7C0F');

  let f = 3;
  for (const m of MATERIAS) {
    for (const c of m.cur.criteria) {
      const icono = V.CE_ICONOS[m.ref][Number(c.ce) - 1];
      const fila = h.getRow(f);
      fila.getCell(1).value = m.corto;
      fila.getCell(1).font = { ...NORMAL, bold: true, color: { argb: hex(m.c) } };
      fila.getCell(2).value = m.emoji;
      fila.getCell(2).alignment = { horizontal: 'center' };
      fila.getCell(3).value = c.code;
      fila.getCell(3).font = { name: 'Consolas', size: 9 };
      fila.getCell(4).value = c.number;
      fila.getCell(5).value = Number(c.ce);
      fila.getCell(6).value = V.ACCION[icono];
      fila.getCell(7).value = EMOJI_ACCION[icono] || '';
      fila.getCell(7).alignment = { horizontal: 'center' };
      fila.getCell(8).value = c.text;
      fila.getCell(8).alignment = { wrapText: true, vertical: 'top' };
      fila.getCell(9).value = c.saberCodes.map((s) => s.split('.').slice(2).join('.')).join(' · ');
      fila.getCell(9).alignment = { wrapText: true, vertical: 'top' };
      for (let col = 1; col <= 9; col++) { borde(fila.getCell(col)); if (!fila.getCell(col).font) fila.getCell(col).font = NORMAL; }
      fila.height = 28;
      f++;
    }
  }
  totalCriterios = f - 3;
  h.autoFilter = 'A2:I2';
}

/* ── 6 · Materias ───────────────────────────────────────────────────────── */
{
  const h = libro.addWorksheet('Materias', { properties: { tabColor: { argb: 'FF6D28D9' } }, views: [{ state: 'frozen', ySplit: 2 }] });
  h.columns = [{ width: 10 }, { width: 30 }, { width: 6 }, { width: 20 }, { width: 11 }, { width: 13 }, { width: 10 }, { width: 11 }, { width: 44 }];
  h.getCell('A1').value = 'Materias del proyecto · esta hoja alimenta los desplegables: no cambies el orden de las columnas';
  h.getCell('A1').font = { name: 'Arial', size: 13, bold: true };
  h.mergeCells('A1:I1');
  cabecera(h, 2, ['Código', 'Materia', 'Icono', 'Grupo', 'Criterios', 'Competencias', 'Saberes', 'Color', 'Ideas de partida'], '6D28D9');
  let f = 3;
  for (const m of MATERIAS) {
    const fila = h.getRow(f);
    fila.getCell(1).value = m.id;
    fila.getCell(1).font = { ...NORMAL, bold: true, color: { argb: 'FFFFFFFF' } };
    fila.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(m.c) } };
    fila.getCell(2).value = m.corto;
    fila.getCell(3).value = m.emoji;
    fila.getCell(3).alignment = { horizontal: 'center' };
    fila.getCell(4).value = V.GRUPOS[m.grupo];
    fila.getCell(5).value = m.cur.criteria.length;
    fila.getCell(6).value = m.cur.competences.length;
    fila.getCell(7).value = m.cur.knowledge.length;
    fila.getCell(8).value = m.c;
    fila.getCell(9).value = m.ideas.map((i) => `F${i.fase}: ${i.titulo}`).join(' · ');
    fila.getCell(9).alignment = { wrapText: true, vertical: 'top' };
    for (let c = 1; c <= 9; c++) { borde(fila.getCell(c)); if (!fila.getCell(c).font) fila.getCell(c).font = NORMAL; }
    f++;
  }
}

/* ── 7 · Panel ──────────────────────────────────────────────────────────── */
{
  const h = libro.addWorksheet('Panel', { properties: { tabColor: { argb: 'FF991B1B' } }, views: [{ showGridLines: false }] });
  h.columns = [{ width: 4 }, { width: 28 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 44 }];
  h.getCell('B2').value = 'Panel · se calcula solo desde la hoja «Aportaciones»';
  h.getCell('B2').font = { name: 'Arial', size: 14, bold: true };

  const R = filasAportaciones;
  cabecera(h, 4, ['', 'Por tramo', 'Apuntadas', 'Enviadas', 'Revisadas', '', '', 'Qué mirar'], '991B1B');
  let f = 5;
  for (const t of V.PLAN.tramos) {
    h.getCell(`B${f}`).value = `${t.id} · ${t.nombre}`;
    h.getCell(`C${f}`).value = { formula: `COUNTIF(Aportaciones!$C$4:$C$${R},"${t.id}")` };
    h.getCell(`D${f}`).value = { formula: `COUNTIFS(Aportaciones!$C$4:$C$${R},"${t.id}",Aportaciones!$R$4:$R$${R},"Enviada")` };
    h.getCell(`E${f}`).value = { formula: `COUNTIFS(Aportaciones!$C$4:$C$${R},"${t.id}",Aportaciones!$R$4:$R$${R},"Revisada")` };
    h.getCell(`H${f}`).value = t.porque;
    h.getCell(`H${f}`).alignment = { wrapText: true, vertical: 'top' };
    h.getRow(f).height = 26;
    for (let c = 2; c <= 8; c++) { borde(h.getCell(f, c)); if (!h.getCell(f, c).font) h.getCell(f, c).font = NORMAL; }
    f++;
  }
  f += 2;
  cabecera(h, f, ['', 'Por materia', 'Filas', 'Enviadas', 'Sesiones', 'Minutos', '', 'Ideas de partida'], '991B1B');
  f++;
  for (const m of MATERIAS) {
    h.getCell(`B${f}`).value = m.corto;
    h.getCell(`B${f}`).font = { ...NORMAL, bold: true, color: { argb: hex(m.c) } };
    h.getCell(`C${f}`).value = { formula: `COUNTIF(Aportaciones!$A$4:$A$${R},"${m.corto}")` };
    h.getCell(`D${f}`).value = { formula: `COUNTIFS(Aportaciones!$A$4:$A$${R},"${m.corto}",Aportaciones!$R$4:$R$${R},"Enviada")` };
    h.getCell(`E${f}`).value = { formula: `SUMIF(Aportaciones!$A$4:$A$${R},"${m.corto}",Aportaciones!$M$4:$M$${R})` };
    h.getCell(`F${f}`).value = { formula: `SUMPRODUCT((Aportaciones!$A$4:$A$${R}="${m.corto}")*Aportaciones!$M$4:$M$${R}*Aportaciones!$N$4:$N$${R})` };
    h.getCell(`H${f}`).value = m.ideas.map((i) => i.titulo).join(' · ');
    h.getCell(`H${f}`).alignment = { wrapText: true };
    for (let c = 2; c <= 8; c++) { borde(h.getCell(f, c)); if (!h.getCell(f, c).font) h.getCell(f, c).font = NORMAL; }
    f++;
  }
  f += 2;
  cabecera(h, f, ['', 'Por fase del aula', 'Aportaciones', '', '', '', '', 'Qué deja la fase'], '991B1B');
  f++;
  for (const fase of V.FASES) {
    h.getCell(`B${f}`).value = `${fase.emoji} ${fase.n} · ${fase.nombre}`;
    h.getCell(`C${f}`).value = { formula: `COUNTIF(Aportaciones!$D$4:$D$${R},"${fase.n} · ${fase.nombre}")` };
    h.getCell(`H${f}`).value = fase.deja;
    for (let c = 2; c <= 8; c++) { borde(h.getCell(f, c)); if (!h.getCell(f, c).font) h.getCell(f, c).font = NORMAL; }
    f++;
  }
  f += 1;
  h.getCell(`B${f}`).value = 'Los recuentos ignoran la fila de ejemplo (fila 3). Bórrala cuando empiecen a entrar datos reales.';
  h.getCell(`B${f}`).font = SUAVE;
}

fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
libro.xlsx.writeFile(DESTINO).then(async () => {
  // Releer el archivo escrito: si algo se corrompió, se ve aquí y no en el ordenador de nadie.
  const comprobacion = new ExcelJS.Workbook();
  await comprobacion.xlsx.readFile(DESTINO);
  const hojas = comprobacion.worksheets.map((h) => `${h.name} (${h.rowCount} filas)`);
  console.log(`${DESTINO}\n${(fs.statSync(DESTINO).size / 1024).toFixed(0)} KB · ${totalCriterios} criterios\nHojas: ${hojas.join(' · ')}`);
});
