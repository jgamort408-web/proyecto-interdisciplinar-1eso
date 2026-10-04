# Proyecto interdisciplinar 1.º ESO · Tiendas de Barrio

Web de trabajo del equipo educativo de 1.º de ESO del IES Al-Ándalus. Cuatro tramos semanales,
una plantilla corta por tramo y materia, y un panel para ver el plan completo.

**Dirección pública:** https://jgamort408-web.github.io/proyecto-interdisciplinar-1eso/

## Qué hay aquí

| Carpeta | Qué contiene |
|---|---|
| `index.html` | Panel del plan: calendario, lista, mural y progreso, con filtros |
| `plantilla.html` | Renderiza una plantilla: `plantilla.html?t=T2&m=MAT` |
| `js/plantillas.js` | **Qué se pregunta en cada tramo** y los prompts para Gemini |
| `js/plantilla.js` | Cómo se dibuja el formulario, el documento del PDF y el correo |
| `js/panel.js` | El panel y sus cuatro vistas |
| `herramientas/vocabulario.cjs` | Colores, iconos, fases, materias, ideas y fechas del plan |
| `herramientas/construir.cjs` | Genera `datos/*.json` y `js/iconos.js` desde el currículo oficial |
| `herramientas/excel.cjs` | Genera el calendario en hoja de cálculo |
| `herramientas/revisar.cjs` | Abre la web con Chrome, busca errores y comprueba el PDF |
| `datos/` | Currículo por materia (BOJA y BOE), plan, fases y vocabulario. **Generado** |
| `pdf/` | El kit en papel: cómo funciona, Tiendas de Barrio, fichas por materia y mural A3 |

## Cómo se cambia algo

1. **Fechas, materias, ideas o fases:** `herramientas/vocabulario.cjs`.
2. **Preguntas de una plantilla o prompts:** `js/plantillas.js`.
3. Después de tocar el vocabulario: `node herramientas/construir.cjs`.
4. Antes de publicar: `node herramientas/revisar.cjs` (necesita Chrome instalado).
5. `git commit` y `git push`: GitHub Pages publica solo.

## Decisiones que conviene conocer

- **No hay servidor ni base de datos.** Lo que escribe cada docente se guarda en su navegador
  (`localStorage`) y viaja en el PDF que envía por correo. El panel muestra el progreso de ese
  navegador, no el del equipo: el recuento real lo lleva la coordinación con los PDF recibidos.
- **La pantalla es un formulario; el PDF es un documento.** Se construyen por separado
  (`construirDocumento()`), para que el PDF salga limpio y no dependa de cómo se vea el
  formulario.
- **Nada curricular se escribe a mano.** Competencias, criterios y saberes salen de
  `Curriculo_consulta.json` (Orden de 30 de mayo de 2023 del BOJA; BOE para Religión).
  Lo que sí es una decisión didáctica revisable: el icono de cada competencia y de cada bloque.
- **Los iconos de competencias representan acciones.** El mismo icono en dos materias significa
  la misma acción: ahí hay una conexión interdisciplinar.

Iconos: [Lucide](https://lucide.dev) (ISC). Tipografías: Atkinson Hyperlegible Next y Mono, Zilla Slab (OFL).
