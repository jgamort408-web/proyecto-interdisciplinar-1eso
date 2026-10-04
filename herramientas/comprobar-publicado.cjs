'use strict';
/**
 * Comprueba la web ya publicada (no la copia local): carga, errores de consola,
 * datos accesibles y captura de cómo la verá el profesorado.
 *
 *   node herramientas/comprobar-publicado.cjs
 */
const fs = require('fs');
const path = require('path');
const NM = 'C:/Users/usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const { chromium } = require(NM + 'playwright-core');

const BASE = 'https://jgamort408-web.github.io/proyecto-interdisciplinar-1eso/';
const REVISION = path.join(__dirname, 'revision');
const problemas = [];

(async () => {
  fs.mkdirSync(REVISION, { recursive: true });
  const navegador = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' });
    const pagina = await contexto.newPage();
    pagina.on('console', (m) => { if (m.type() === 'error') problemas.push(`consola: ${m.text()}`); });
    pagina.on('pageerror', (e) => problemas.push(`excepción: ${e.message}`));

    await pagina.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
    await pagina.waitForSelector('#contenido', { timeout: 15000 });
    const titulares = await pagina.locator('.tramo h3').allTextContents();
    console.log('Tramos en el panel:', titulares.join(' · '));
    await pagina.screenshot({ path: path.join(REVISION, 'publicado-panel.png'), fullPage: true });

    await pagina.goto(`${BASE}plantilla.html?t=T1&m=MAT`, { waitUntil: 'networkidle', timeout: 45000 });
    await pagina.waitForSelector('.seccion', { timeout: 15000 });
    const secciones = await pagina.locator('.seccion h2').allTextContents();
    console.log('Secciones de T1:', secciones.map((s) => s.trim()).join(' · '));
    await pagina.screenshot({ path: path.join(REVISION, 'publicado-plantilla.png'), fullPage: true });

    // Archivos que la web enlaza y que deben existir en el servidor.
    for (const ruta of ['datos/plan.json', 'datos/curriculo/MAT.json', 'excel/Calendario_proyecto_interdisciplinar_1ESO.xlsx', 'pdf/00_Como_funciona.pdf', 'pdf/fichas/02_MAT_Matematicas.pdf']) {
      const r = await pagina.request.get(BASE + encodeURI(ruta));
      if (!r.ok()) problemas.push(`${ruta} responde ${r.status()}`);
      else console.log(`ok ${r.status()} · ${ruta} · ${(Number(r.headers()['content-length'] || 0) / 1024).toFixed(0)} KB`);
    }
  } finally {
    await navegador.close();
  }
  if (problemas.length) {
    console.log('\nPROBLEMAS');
    for (const p of [...new Set(problemas)]) console.log(' · ' + p);
    process.exitCode = 1;
  } else {
    console.log('\nLa web publicada carga, sin errores de consola, y todos los archivos enlazados responden.');
  }
})();
