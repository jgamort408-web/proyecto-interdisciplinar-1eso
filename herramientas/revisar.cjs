'use strict';
/**
 * Revisa la web como la verá el profesorado: sirve el sitio, lo abre con Chrome,
 * recoge errores de consola, hace capturas y comprueba el PDF que sale de una plantilla.
 *
 *   node herramientas/revisar.cjs
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const NM = 'C:/Users/usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const { chromium } = require(NM + 'playwright-core');
const { PDFDocument } = require(NM + 'pdf-lib');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const RAIZ = path.join(__dirname, '..');
const REVISION = path.join(__dirname, 'revision');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.svg': 'image/svg+xml', '.png': 'image/png' };

const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const destino = path.join(RAIZ, url === '/' ? 'index.html' : url);
  if (!destino.startsWith(RAIZ) || !fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
    res.statusCode = 404;
    return res.end('no');
  }
  res.setHeader('content-type', TIPOS[path.extname(destino)] || 'application/octet-stream');
  fs.createReadStream(destino).pipe(res);
});

const problemas = [];

servidor.listen(0, '127.0.0.1', async () => {
  const puerto = servidor.address().port;
  const url = (r) => `http://127.0.0.1:${puerto}/${r}`;
  fs.mkdirSync(REVISION, { recursive: true });
  const navegador = await chromium.launch({ executablePath: CHROME });
  try {
    const contexto = await navegador.newContext({ viewport: { width: 1280, height: 920 }, locale: 'es-ES' });
    const pagina = await contexto.newPage();
    pagina.on('console', (m) => { if (m.type() === 'error') problemas.push(`consola: ${m.text()}`); });
    pagina.on('pageerror', (e) => problemas.push(`excepción: ${e.message}`));
    pagina.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) problemas.push(`sin cargar: ${r.url()}`); });

    // ── Panel ────────────────────────────────────────────────────────────
    await pagina.goto(url('index.html'), { waitUntil: 'networkidle' });
    await pagina.waitForSelector('#contenido', { timeout: 8000 });
    await pagina.screenshot({ path: path.join(REVISION, 'panel-calendario.png'), fullPage: true });
    for (const vista of ['Lista', 'Mural', 'Progreso']) {
      await pagina.getByRole('tab', { name: vista }).click();
      await pagina.waitForTimeout(250);
      await pagina.screenshot({ path: path.join(REVISION, `panel-${vista.toLowerCase()}.png`), fullPage: true });
    }

    // ── Plantilla T2 de Matemáticas, rellenada como lo haría un docente ──
    // Con «previa=1» porque el tramo puede no estar abierto todavía: si no, los campos
    // salen deshabilitados (y eso es justo lo que debe pasar).
    await pagina.goto(url('plantilla.html?t=T2&m=MAT&previa=1'), { waitUntil: 'networkidle' });
    await pagina.waitForSelector('.seccion', { timeout: 8000 });
    await pagina.evaluate(() => {
      const poner = (selector, valor) => {
        const n = document.querySelector(selector);
        if (!n) return false;
        n.value = valor;
        n.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      };
      poner('input[type="text"]', 'Prueba de revisión');
      const area = document.querySelector('textarea');
      if (area) { area.value = 'El alumnado calcula el pedido de su tienda con 5 €, comprueba el cambio y explica su revisión a otra pareja.'; area.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    // Clics de verdad: un click() sintético sobre una casilla dentro de un <label> se anula a sí
    // mismo (la etiqueta reenvía el clic), y la prueba daría un falso verde.
    await pagina.locator('.criterio').nth(0).click();
    await pagina.locator('.criterio').nth(1).click();
    await pagina.locator('.opciones .opcion').first().click();
    await pagina.waitForTimeout(400);
    const elegidos = await pagina.evaluate(() => document.querySelectorAll('.criterio.elegido').length);
    if (elegidos !== 2) problemas.push(`Se esperaban 2 criterios marcados y hay ${elegidos}.`);
    await pagina.screenshot({ path: path.join(REVISION, 'plantilla-T2-pantalla.png'), fullPage: true });

    const prompt = await pagina.getByRole('button', { name: /Construir el prompt/ }).first();
    await prompt.click();
    await pagina.waitForTimeout(300);
    const textoPrompt = await pagina.evaluate(() => document.querySelector('.prompt textarea')?.value || '');
    fs.writeFileSync(path.join(REVISION, 'prompt-T2.txt'), textoPrompt);
    if (!/\[MAT\.1\.\d+\.\d+\]/.test(textoPrompt)) problemas.push('El prompt no lleva dentro el código literal de los criterios elegidos.');
    if (!textoPrompt.includes('tienda')) problemas.push('El prompt no incluye el contexto de Tiendas de Barrio.');
    if (textoPrompt.includes('undefined') || textoPrompt.includes('[object')) problemas.push('El prompt contiene undefined o [object Object].');

    // ── El PDF que se llevará el docente ─────────────────────────────────
    await pagina.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await pagina.waitForTimeout(200);
    const vacio = await pagina.evaluate(() => document.getElementById('documento').innerHTML.length < 200);
    if (vacio) problemas.push('El documento de impresión ha salido vacío.');
    const pdf = await pagina.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    fs.writeFileSync(path.join(REVISION, 'plantilla-T2-MAT.pdf'), pdf);
    const paginas = (await PDFDocument.load(pdf)).getPageCount();

    await pagina.emulateMedia({ media: 'print' });
    await pagina.screenshot({ path: path.join(REVISION, 'plantilla-T2-impresion.png'), fullPage: true });
    await pagina.emulateMedia({ media: 'screen' });

    // ── Móvil ────────────────────────────────────────────────────────────
    const movil = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-ES' });
    const pm = await movil.newPage();
    await pm.goto(url('index.html'), { waitUntil: 'networkidle' });
    await pm.waitForSelector('#contenido');
    await pm.screenshot({ path: path.join(REVISION, 'movil-panel.png'), fullPage: true });
    await pm.goto(url('plantilla.html?t=T1&m=LCL'), { waitUntil: 'networkidle' });
    await pm.waitForSelector('.seccion');
    await pm.screenshot({ path: path.join(REVISION, 'movil-plantilla.png'), fullPage: true });
    const ancho = await pm.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ancho > 2) problemas.push(`En móvil hay ${ancho}px de desbordamiento horizontal.`);

    console.log(`PDF de la plantilla: ${paginas} página(s), ${(pdf.length / 1024).toFixed(0)} KB`);
    console.log(`Capturas en ${REVISION}`);
  } finally {
    await navegador.close();
    servidor.close();
  }

  if (problemas.length) {
    console.log('\nPROBLEMAS');
    for (const p of [...new Set(problemas)]) console.log(' · ' + p);
    process.exitCode = 1;
  } else {
    console.log('\nSin errores de consola, sin desbordes en móvil y con PDF generado.');
  }
});
