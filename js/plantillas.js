// Qué pide cada tramo: secciones, campos, ayudas de Tiendas de Barrio y prompts para Gemini.
// El renderizador (plantilla.js) no sabe nada del proyecto: todo lo que se pregunta está aquí.

export const PASOS_GEMINI = [
  'Abre <b>gemini.google.com</b> con tu cuenta corporativa <span class="mono">@g.educaand.es</span>. Es la que la Junta pone a disposición del profesorado.',
  'Pulsa <b>Copiar el prompt</b> y pégalo en Gemini. No hace falta escribir nada más.',
  'Lee la respuesta con ojo docente: <b>lo que no encaje con tu grupo, cámbialo</b>. La IA no conoce a tu alumnado.',
  'Sigue pidiendo en la misma conversación: «más corto», «con más apoyo visual», «una versión para quien va más avanzado».',
  'Cuando te sirva, usa <b>Compartir y exportar → Exportar a Documentos</b> para llevarlo a Drive y darle formato.',
  'Vuelve aquí y anota lo esencial en la plantilla. El PDF que envías es el acuerdo; el material vive en tu Drive.',
];

export const AVISOS_IA = [
  'No escribas nombres, iniciales ni datos personales del alumnado en el prompt.',
  'Los códigos de criterios ya van escritos en el prompt: si Gemini propone otros, no los uses.',
  'Comprueba los cálculos y los precios que invente: son un borrador, no una fuente.',
];

/* ── Ayudas comunes ─────────────────────────────────────────────────────── */

const AYUDA_RETO = {
  titulo: 'El reto del alumnado',
  cita: '«Explicad cómo habéis gestionado vuestra tienda, qué decisiones tomasteis y por qué, qué datos lo demuestran y qué habéis aprendido.»',
  texto: 'Cada equipo crea y gestiona una tienda: compra a proveedores, vende en dos mercados simulados y lo cuenta en una presentación de 4 a 6 minutos.',
};

const AYUDA_EVIDENCIAS = {
  titulo: 'Evidencias mínimas del proyecto',
  items: ['Un cartel o material publicitario', 'Una tabla de datos de ventas', 'Un gráfico interpretado', 'Un ejemplo matemático explicado', 'Una reflexión sobre lo aprendido'],
};

const AYUDA_FUNCIONA = {
  titulo: 'Una aportación funciona si…',
  items: ['Desarrolla al menos un criterio de tu materia.', 'Deja algo que otra materia o persona usa.', 'Cabe en las sesiones que tienes.'],
};

/* ── Utilidades para los prompts ────────────────────────────────────────── */

const contexto = (c) => `CONTEXTO
Soy docente de ${c.m.nombre} en 1.º de ESO (Andalucía, LOMLOE, Orden de 30 de mayo de 2023).
Mi centro trabaja un proyecto interdisciplinar a partir de la situación de aprendizaje «Tiendas de Barrio»: cada equipo de alumnado crea y gestiona una tienda de barrio, compra a proveedores con un presupuesto limitado, vende en dos mercados simulados y demuestra con datos qué funcionó. El proyecto tiene seis fases:
${c.fases.map((f) => `  ${f.n}. ${f.nombre} (${f.sesiones} sesiones) — ${f.hace} Deja: ${f.deja}.`).join('\n')}
El alumnado trabaja en equipos cooperativos con roles: tendero/a, contable, gestor/a y publicista.`;

const bloqueTarea = (c) => `MI APORTACIÓN
Fases en las que entro: ${c.nombreFases() || 'aún por decidir'}.
Tarea prevista: ${(c.tarea() || 'aún por concretar').trim().replace(/\.$/, '')}.
Tiempo del que dispongo: ${c.val('sesiones') || '?'} sesión(es) de ${c.val('minutos') || 55} minutos.`;

const bloqueCriterios = (c) => {
  const lista = c.criteriosElegidos();
  if (!lista.length) return 'CRITERIOS\n(Todavía no he elegido criterios: elígelos en la plantilla antes de usar este prompt.)';
  return `CRITERIOS DE EVALUACIÓN ELEGIDOS (texto literal del currículo andaluz, no los reformules ni cambies sus códigos)
${lista.map((cr) => `  [${cr.codigo}] (${cr.numero}) ${cr.texto}`).join('\n')}`;
};

const reglas = (c) => `REGLAS
- Alumnado de 12 años: frases cortas, vocabulario claro, nada de tecnicismos innecesarios.
- Todo lo que propongas tiene que caber en ${c.val('sesiones') || 1} sesión(es) de ${c.val('minutos') || 55} minutos. Si no cabe, dilo y prioriza.
- Usa el contexto de la tienda de barrio y cifras realistas en euros (entre 0,50 € y 12 €).
- No inventes códigos de criterios ni de saberes.
- Responde en español de España.`;

/* ── Plantillas ─────────────────────────────────────────────────────────── */

export const PLANTILLAS = {
  T1: {
    titulo: 'Me apunto',
    lema: 'Dime si entras, dónde y con qué idea.',
    intro: 'Quince minutos. Con esto la coordinación puede repartir el trabajo y ver qué fases quedan cojas. Todavía no hace falta que tengas nada preparado.',
    ayudas: [AYUDA_RETO, { titulo: 'Las seis fases', tipo: 'fases' }, AYUDA_FUNCIONA],
    secciones: [
      {
        id: 'quien', titulo: 'Quién eres', icono: 'users',
        campos: [
          { tipo: 'texto', id: 'docente', etiqueta: 'Nombre y apellidos', ancho: 'medio', perfil: 'docente' },
          { tipo: 'texto', id: 'grupos', etiqueta: 'Grupos de 1.º ESO que tienes', ayuda: 'Por ejemplo: 1.º A y 1.º C', ancho: 'medio', perfil: 'grupos' },
        ],
      },
      {
        id: 'entras', titulo: '¿Entras en el proyecto?', icono: 'hand',
        campos: [
          {
            tipo: 'opcion', id: 'participa', modo: 'una', etiqueta: 'Elige una',
            opciones: [
              { v: 'tarea', e: 'Sí, con una tarea en el aula', desc: 'Dedicas sesiones y evalúas con tus criterios' },
              { v: 'apoyo', e: 'Sí, apoyando sin sesiones propias', desc: 'Revisas materiales, aportas ideas o cedes un rato puntual' },
              { v: 'no', e: 'Este curso no puedo', desc: 'Prefieres quedarte fuera de esta edición' },
            ],
          },
          { tipo: 'parrafo', id: 'motivo', etiqueta: 'Si no puedes o lo ves difícil, cuéntanoslo', ayuda: 'Ayuda a ajustar el reparto. Dos líneas bastan.', filas: 2 },
        ],
      },
      {
        id: 'donde', titulo: '¿Dónde entras?', icono: 'store',
        campos: [
          { tipo: 'fases', id: 'fases', etiqueta: 'Fase o fases del aula', ayuda: 'Puedes marcar más de una. Si no lo tienes claro, marca la que más se parezca a lo que sueles hacer en noviembre.' },
        ],
      },
      {
        id: 'idea', titulo: 'Tu idea', icono: 'lightbulb',
        campos: [
          { tipo: 'idea', id: 'idea', etiqueta: 'Elige una propuesta o escribe la tuya' },
          { tipo: 'parrafo', id: 'tarea', etiqueta: 'Qué hará exactamente el alumnado', ayuda: 'Dos o tres frases. Empieza por un verbo: «calcular», «escribir», «diseñar»…', filas: 3 },
          { tipo: 'evidencias', id: 'evidencias', etiqueta: '¿Qué producirá?' },
          { tipo: 'texto', id: 'evidencia', etiqueta: 'En una línea: qué queda de cada alumno o alumna', ayuda: 'Individual, aunque la tarea sea en equipo. Es lo que podrás evaluar.' },
        ],
      },
      {
        id: 'cuanto', titulo: '¿Cuánto ocupa y cuándo?', icono: 'clock',
        campos: [
          { tipo: 'numero', id: 'sesiones', etiqueta: 'Sesiones', sufijo: 'sesiones', min: 0, max: 12, ancho: 'tercio' },
          { tipo: 'numero', id: 'minutos', etiqueta: 'Minutos por sesión', sufijo: 'min', min: 30, max: 120, ancho: 'tercio', valor: 55 },
          { tipo: 'semanas', id: 'semana', etiqueta: 'Semana que te viene mejor', ancho: 'tercio' },
        ],
      },
      {
        id: 'conquien', titulo: 'Con quién te coordinas', icono: 'arrow-left-right',
        campos: [
          { tipo: 'materias', id: 'recibeDe', etiqueta: 'Necesito algo de estas materias' },
          { tipo: 'texto', id: 'recibeQue', etiqueta: '¿Qué necesitas de ellas?', ayuda: 'Por ejemplo: el catálogo con precios, el cartel aprobado, los datos de ventas.' },
          { tipo: 'materias', id: 'entregaA', etiqueta: 'Puedo entregar algo a estas materias' },
          { tipo: 'texto', id: 'entregaQue', etiqueta: '¿Qué les entregarías?' },
        ],
      },
    ],
    gemini: [
      {
        titulo: 'Tres ideas para tu materia',
        para: 'Si no te convence ninguna de las dos propuestas, o quieres una variante más cercana a lo que ya tienes programado.',
        construir: (c) => `${contexto(c)}

${bloqueTarea(c)}

PETICIÓN
Dame TRES propuestas distintas de tarea para mi materia dentro de esas fases. Cada una debe:
 (a) desarrollar un aprendizaje propio de ${c.m.nombre}, no ser un adorno del proyecto;
 (b) dejar un producto que otra materia o el propio proyecto pueda usar después;
 (c) caber en ${c.v.sesiones || 1} sesión(es) de ${c.v.minutos || 55} minutos.
Para cada propuesta escribe: título breve, qué hace el alumnado paso a paso, qué evidencia individual queda, qué materia podría usar ese producto y qué necesitarías recibir de otra materia.
Al final, dime cuál de las tres es más fácil de aplicar sin preparar material nuevo.

${reglas(c)}`,
      },
    ],
  },

  T2: {
    titulo: 'Mi currículo',
    lema: 'Ancla tu tarea a criterios de evaluación reales.',
    intro: 'Veinticinco minutos. Aquí es donde la aportación deja de ser una actividad simpática y pasa a contar en tu programación. Elige pocos criterios: uno o dos bien trabajados valen más que cinco de adorno.',
    ayudas: [
      { titulo: 'Cómo elegir criterios', items: ['Elige el que de verdad vas a observar en la tarea.', 'Si dudas entre dos, quédate con el que tenga una evidencia más clara.', 'El selector trae el texto literal del BOJA y los saberes que el propio currículo relaciona.'] },
      AYUDA_EVIDENCIAS,
    ],
    secciones: [
      {
        id: 'recordatorio', titulo: 'Tu tarea', icono: 'file-check',
        campos: [
          { tipo: 'nota', texto: 'Si rellenaste el tramo 1 en este mismo navegador, tu tarea aparece ya escrita. Puedes retocarla.' },
          { tipo: 'parrafo', id: 'tarea', etiqueta: 'Qué hará el alumnado', filas: 3, desde: 'T1.tarea' },
          { tipo: 'fases', id: 'fases', etiqueta: 'Fase o fases del aula', desde: 'T1.fases' },
        ],
      },
      {
        id: 'criterios', titulo: 'Criterios de evaluación', icono: 'list-checks',
        campos: [
          { tipo: 'criterios', id: 'criterios', etiqueta: 'Marca los que tu tarea desarrolla', ayuda: 'Máximo tres. Están agrupados por competencia específica; el icono dice qué acción desarrolla cada una.', max: 3 },
        ],
      },
      {
        id: 'saberes', titulo: 'Saberes básicos', icono: 'layers',
        campos: [
          { tipo: 'saberes', id: 'saberes', etiqueta: 'Saberes que se movilizan', ayuda: 'Aparecen primero los que el currículo relaciona con los criterios que has elegido.' },
        ],
      },
      {
        id: 'evaluacion', titulo: 'Evidencia e instrumento', icono: 'clipboard-check',
        campos: [
          { tipo: 'texto', id: 'evidencia', etiqueta: 'Evidencia individual', ayuda: 'Qué queda de cada alumno o alumna: una ficha, una grabación, un plano…', desde: 'T1.evidencia' },
          { tipo: 'instrumento', id: 'instrumento', etiqueta: 'Instrumento con el que la valoras' },
          { tipo: 'texto', id: 'cuando', etiqueta: '¿Cuándo la recoges?', ayuda: 'Al final de la sesión, en la siguiente, al cerrar el proyecto…' },
          { tipo: 'tabla', id: 'indicadores', etiqueta: 'Indicadores observables', ayuda: 'Lo que miras para decir que el criterio se cumple. Con tres o cuatro vas servido.', filas: 4, columnas: [{ id: 'ind', etiqueta: 'El alumnado…', ancho: '1fr' }] },
        ],
      },
      {
        id: 'dua', titulo: 'Apoyos para que participe todo el mundo', icono: 'accessibility',
        campos: [
          { tipo: 'dua', id: 'dua', etiqueta: 'Un apoyo concreto por principio' },
        ],
      },
      {
        id: 'programacion', titulo: 'Tu programación', icono: 'book-open-check',
        campos: [
          {
            tipo: 'opcion', id: 'programacion', modo: 'una', etiqueta: '¿Cómo encaja con lo que ya tenías?',
            opciones: [
              { v: 'estaba', e: 'Ya estaba prevista', desc: 'Adapto una actividad que iba a hacer igualmente' },
              { v: 'adapto', e: 'La adapto', desc: 'Cambio el contexto de una actividad prevista' },
              { v: 'nueva', e: 'La añado', desc: 'Entra como situación de aprendizaje nueva' },
            ],
          },
        ],
      },
    ],
    gemini: [
      {
        titulo: 'Del criterio a la tarea observable',
        para: 'Para comprobar que tu tarea hace visible el criterio, y sacar los indicadores de la lista de cotejo.',
        construir: (c) => `${contexto(c)}

${bloqueTarea(c)}

${bloqueCriterios(c)}

PETICIÓN
1. Para cada criterio, dime qué tiene que hacer exactamente el alumnado en mi tarea para que ese criterio se pueda observar. Si mi tarea no lo hace visible, dímelo claramente y propón el ajuste más pequeño que lo arregle.
2. Propón una evidencia individual (no de equipo) que quede como prueba del aprendizaje.
3. Escribe CINCO indicadores observables, en lenguaje sencillo y empezando por un verbo, para una lista de cotejo.
4. Señala qué parte del criterio NO quedaría cubierta con esta tarea, para que yo lo sepa.

${reglas(c)}`,
      },
    ],
  },

  T3: {
    titulo: 'Encajamos',
    lema: 'Quién te entrega qué, y a quién entregas tú.',
    intro: 'Veinte minutos. Este es el tramo donde se caen los proyectos interdisciplinares: alguien espera un material que nadie se comprometió a entregar. Escribe fechas, no intenciones.',
    ayudas: [
      { titulo: 'Cómo encadenar', items: ['La fase 2 produce el catálogo y la factura: casi todo lo demás se apoya ahí.', 'La fase 4 (primer mercado) genera los datos que usa la fase 5.', 'La fase 6 recoge lo que se hizo: necesita que las evidencias existan antes.'] },
      { titulo: 'Las seis fases', tipo: 'fases' },
    ],
    secciones: [
      {
        id: 'recibo', titulo: 'Qué recibo', icono: 'arrow-down-to-line',
        campos: [
          { tipo: 'tabla', id: 'recibo', etiqueta: 'Lo que necesito de otras materias', ayuda: 'Si no necesitas nada, deja la tabla vacía y dilo en el plan B.', filas: 3, columnas: [{ id: 'de', etiqueta: 'De qué materia', ancho: '150px' }, { id: 'que', etiqueta: 'Qué', ancho: '1fr' }, { id: 'antes', etiqueta: 'Antes del', ancho: '120px', tipo: 'fecha' }] },
        ],
      },
      {
        id: 'entrego', titulo: 'Qué entrego', icono: 'send',
        campos: [
          { tipo: 'tabla', id: 'entrego', etiqueta: 'Lo que dejo preparado para otras materias', filas: 3, columnas: [{ id: 'a', etiqueta: 'A qué materia', ancho: '150px' }, { id: 'que', etiqueta: 'Qué', ancho: '1fr' }, { id: 'antes', etiqueta: 'Antes del', ancho: '120px', tipo: 'fecha' }] },
        ],
      },
      {
        id: 'sesiones', titulo: 'Mis sesiones en el aula', icono: 'calendar-check',
        campos: [
          { tipo: 'tabla', id: 'sesionesAula', etiqueta: 'Fechas concretas', ayuda: 'Las que ya sabes. Si aún dependen del grupo, escribe la semana.', filas: 4, columnas: [{ id: 'n', etiqueta: 'Sesión', ancho: '70px' }, { id: 'fecha', etiqueta: 'Fecha o semana', ancho: '150px' }, { id: 'grupo', etiqueta: 'Grupo', ancho: '90px' }, { id: 'espacio', etiqueta: 'Espacio y material', ancho: '1fr' }] },
        ],
      },
      {
        id: 'planb', titulo: 'Si algo falla', icono: 'life-buoy',
        campos: [
          { tipo: 'parrafo', id: 'planb', etiqueta: 'Plan B', ayuda: 'Qué haces si no te llega a tiempo lo que esperas. La regla: tu sesión no puede quedarse bloqueada.', filas: 3 },
          { tipo: 'parrafo', id: 'riesgos', etiqueta: 'Condiciones o riesgos que debemos saber', ayuda: 'Salidas, exámenes, actividades del centro, falta de aula de informática…', filas: 2 },
          {
            tipo: 'checklist', id: 'comprobacion', etiqueta: 'Antes de enviar',
            items: ['He puesto fecha a todo lo que recibo y entrego.', 'He avisado a las materias implicadas (o lo haré al enviar esto).', 'Mi sesión funciona aunque el plan B se active.'],
          },
        ],
      },
    ],
    gemini: [
      {
        titulo: 'Revisa el encaje temporal',
        para: 'Para detectar dependencias imposibles antes de la reunión de cierre.',
        construir: (c) => `${contexto(c)}

${bloqueTarea(c)}

MIS ACUERDOS
Recibo:
${(c.v.recibo || []).filter((f) => f.que).map((f) => `  - de ${f.de || '¿?'}: ${f.que} (antes del ${f.antes || 'sin fecha'})`).join('\n') || '  - (nada)'}
Entrego:
${(c.v.entrego || []).filter((f) => f.que).map((f) => `  - a ${f.a || '¿?'}: ${f.que} (antes del ${f.antes || 'sin fecha'})`).join('\n') || '  - (nada)'}
Mis sesiones en el aula:
${(c.v.sesionesAula || []).filter((f) => f.fecha).map((f) => `  - sesión ${f.n || ''}: ${f.fecha} (${f.grupo || 'grupo por confirmar'})`).join('\n') || '  - (sin fechas todavía)'}

PETICIÓN
1. Revisa si el orden temporal funciona: ¿recibo a tiempo lo que necesito?, ¿entrego a tiempo lo que otros esperan?
2. Dime qué pasa si cada entrega se retrasa una semana y cuál es la más crítica.
3. Propón un plan B concreto para mi sesión que no dependa de que llegue el material de otra materia.
4. Escribe un mensaje breve (5 líneas) que yo pueda enviar a las materias implicadas confirmando qué les pido y para cuándo.

${reglas(c)}`,
      },
    ],
  },

  T4: {
    titulo: 'Mi sesión',
    lema: 'La sesión minutada y el material del alumnado.',
    intro: 'Cuarenta minutos, y la mayoría los hace Gemini. Si el material se prepara en noviembre, se prepara con prisa: esta semana lo dejamos hecho.',
    ayudas: [
      AYUDA_RETO,
      { titulo: 'Material que ya existe', items: ['Catálogo y hoja de pedido del kit de Tiendas de Barrio.', 'Lista de cotejo de trabajo diario de la experiencia original.', 'Guion y rúbrica de la presentación final (10 apartados).'] },
      AYUDA_EVIDENCIAS,
    ],
    secciones: [
      {
        id: 'guion', titulo: 'Guion de la sesión', icono: 'square-pen',
        campos: [
          { tipo: 'tabla', id: 'guion', etiqueta: 'Minuto a minuto', ayuda: 'Cinco momentos suelen bastar: entrada, modelado, trabajo, puesta en común y cierre.', filas: 5, columnas: [{ id: 'momento', etiqueta: 'Momento', ancho: '150px' }, { id: 'min', etiqueta: 'Min', ancho: '60px' }, { id: 'que', etiqueta: 'Qué hace el alumnado', ancho: '1fr' }, { id: 'agrupa', etiqueta: 'Agrupamiento', ancho: '130px' }] },
        ],
      },
      {
        id: 'material', titulo: 'Material que necesitas', icono: 'package-check',
        campos: [
          {
            tipo: 'opcion', id: 'material', modo: 'varias', etiqueta: 'Marca lo que hay que preparar',
            opciones: [
              { v: 'ficha', e: 'Ficha del alumnado', icono: 'file-text' },
              { v: 'catalogo', e: 'Catálogo o precios', icono: 'tag' },
              { v: 'registro', e: 'Plantilla de registro', icono: 'table-2' },
              { v: 'cotejo', e: 'Lista de cotejo o rúbrica', icono: 'clipboard-check' },
              { v: 'presentacion', e: 'Presentación o proyectable', icono: 'presentation' },
              { v: 'audiovisual', e: 'Audio o vídeo', icono: 'video' },
              { v: 'manipulativo', e: 'Material manipulable', icono: 'box' },
              { v: 'otro', e: 'Otro', icono: 'plus' },
            ],
          },
        ],
      },
      {
        id: 'revision', titulo: 'Revisión de lo que genere la IA', icono: 'circle-check-big',
        campos: [
          {
            tipo: 'checklist', id: 'revision', etiqueta: 'Antes de darlo por bueno',
            items: [
              'Cabe de verdad en el tiempo de la sesión.',
              'Produce la evidencia individual que dije en el tramo 2.',
              'Usa datos y precios coherentes con el catálogo del proyecto.',
              'Tiene un apoyo para quien lo necesite y una ampliación para quien va sobrado.',
              'No contiene datos personales ni imágenes con derechos.',
            ],
          },
          { tipo: 'texto', id: 'enlace', etiqueta: 'Enlace de Drive al material', ayuda: 'Compártelo con el centro para que la coordinación pueda verlo.' },
          { tipo: 'parrafo', id: 'pendiente', etiqueta: 'Qué queda pendiente', ayuda: 'Fotocopias, reservar el carro de portátiles, pedir un espacio…', filas: 2 },
        ],
      },
    ],
    gemini: [
      {
        titulo: 'Genera el material de tu sesión',
        para: 'Este prompt lleva dentro tu tarea, tus criterios literales, tu evidencia, tus apoyos y tu tiempo. Es el que de verdad ahorra la tarde.',
        construir: (c) => `${contexto(c)}

${bloqueTarea(c)}

${bloqueCriterios(c)}

EVALUACIÓN
Evidencia individual: ${c.val('evidencia') || 'por concretar'}.
Instrumento: ${c.instrumentoTexto() || 'lista de cotejo'}.
Indicadores que quiero observar: ${c.indicadores() || 'por concretar'}.

APOYOS (Diseño Universal para el Aprendizaje)
${c.duaTexto() || '- Sin apoyos indicados todavía.'}

PETICIÓN
Genera, listo para usar:
1. GUION DEL DOCENTE minutado para ${c.val('minutos') || 55} minutos, con lo que dice y hace el profesorado en cada momento.
2. FICHA DEL ALUMNADO lista para imprimir en A4, sin imágenes, con el contexto de la tienda, los datos necesarios y espacio para responder.
3. LISTA DE COTEJO con los indicadores anteriores, en lenguaje que el alumnado entienda.
4. DOS VARIANTES de la ficha: una con más apoyo (modelo resuelto, pasos guiados) y otra de ampliación.
5. Una pregunta de cierre metacognitiva para los últimos 5 minutos.

FORMATO
Texto estructurado con títulos claros, listo para pegar en un documento. Sin tablas complicadas.

${reglas(c)}`,
      },
      {
        titulo: 'Afina lo que te devuelva',
        para: 'Pégale esto después, en la misma conversación, cuando ya tengas el material.',
        construir: () => `Revisa lo que acabas de generar con estos tres filtros y devuélvemelo corregido:
1. TIEMPO: cronometra mentalmente cada paso. Si no cabe, quita contenido en vez de acelerarlo, y dime qué has quitado.
2. LENGUAJE: alumnado de 12 años. Sustituye toda frase de más de 20 palabras y todo tecnicismo que no sea imprescindible.
3. EVIDENCIA: asegúrate de que, al terminar, cada alumno o alumna deja algo individual que yo pueda recoger y evaluar. Si no es así, arréglalo.
Después, dime en tres líneas qué parte del material crees que fallará en un aula real y por qué.`,
      },
    ],
  },

  EXTRA: {
    titulo: 'Propón otro reto',
    lema: 'Tiendas de Barrio es el punto de partida, no el único camino.',
    intro: 'Abierta todo el curso. Si desde tu materia ves un reto que necesita a otras, déjalo escrito aquí: servirá para la próxima edición o para el segundo proyecto del curso.',
    ayudas: [
      { titulo: 'Un buen reto interdisciplinar…', items: ['Parte de algo real y cercano al alumnado.', 'Tiene un destinatario fuera del aula.', 'Acaba en un producto que se puede ver, usar o presentar.', 'Necesita de verdad a varias materias.', 'Deja una evidencia individual en cada materia.'] },
      { titulo: 'Una semilla que ya existe', items: ['«La Tierra del Indalo»: fracciones con los mosaicos de la Alcazaba, proporciones en el invernadero, costes y ecuaciones.', 'Su propia evaluación pide más trabajo colaborativo: está pidiendo a gritos otras materias.'] },
    ],
    secciones: [
      {
        id: 'reto', titulo: 'El reto', icono: 'mountain-snow',
        campos: [
          { tipo: 'texto', id: 'titulo', etiqueta: 'Título del reto' },
          { tipo: 'parrafo', id: 'pregunta', etiqueta: 'La pregunta o el encargo para el alumnado', filas: 2 },
          { tipo: 'parrafo', id: 'situacion', etiqueta: 'La situación real de la que parte', filas: 2 },
          { tipo: 'texto', id: 'producto', etiqueta: 'Producto final', ancho: 'medio' },
          { tipo: 'texto', id: 'destinatario', etiqueta: 'Destinatario real', ancho: 'medio' },
        ],
      },
      {
        id: 'quien', titulo: 'Quién haría falta', icono: 'users',
        campos: [
          { tipo: 'materias', id: 'materias', etiqueta: 'Materias que necesita' },
          { tipo: 'parrafo', id: 'aportaciones', etiqueta: 'Qué aportaría cada una', ayuda: 'Una línea por materia.', filas: 4 },
          { tipo: 'texto', id: 'cuando', etiqueta: '¿Cuándo lo verías?', ayuda: 'Trimestre y duración aproximada.' },
        ],
      },
    ],
    gemini: [
      {
        titulo: 'Convierte tu idea en un reto interdisciplinar',
        para: 'Para pasar de «se me ha ocurrido algo» a una propuesta que el equipo pueda valorar.',
        construir: (c) => `Soy docente de ${c.m.nombre} en 1.º de ESO (Andalucía, LOMLOE). Quiero proponer a mi equipo educativo un proyecto interdisciplinar a partir de esta idea:
"${c.v.titulo || '(escribe el título en la plantilla)'} — ${c.v.pregunta || ''} ${c.v.situacion || ''}"

PETICIÓN
1. Reformula la idea como un reto para el alumnado: una pregunta o encargo en una frase, con un destinatario real fuera del aula.
2. Propón un producto final que se pueda ver, usar o presentar.
3. Di qué materias de 1.º ESO (de estas: ${c.listaMaterias()}) aportarían algo de verdad, y qué aportaría cada una en una línea. No fuerces materias que solo comparten el tema.
4. Propón un recorrido en cuatro momentos: arranque, investigación, producción y puesta en común.
5. Señala los dos riesgos principales para que salga bien.
Sé concreto y realista para un centro público con 55 minutos por sesión. No inventes códigos curriculares.`,
      },
    ],
  },
};
