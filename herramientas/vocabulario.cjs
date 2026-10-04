'use strict';
/**
 * Vocabulario del proyecto interdisciplinar de 1.º ESO.
 *
 * Es el único sitio donde se decide a mano qué icono y qué color lleva cada cosa.
 * Lo curricular (competencias, criterios, saberes) no se escribe aquí: se lee del
 * currículo cargado en «DRIVE SdA 1ESO Andalucia/07_Fuentes/Curriculo_consulta.json».
 *
 * Lo usan «construir.cjs» (web) y «excel.cjs» (libro de cálculo), para que la web,
 * el PDF y la hoja hablen el mismo idioma visual.
 */

/** Las seis fases que vive el alumnado en el aula. */
const FASES = [
  { n: 1, nombre: 'Nuestra tienda', icono: 'tag', emoji: '🏷️', sesiones: '2–3', hace: 'Presentar el reto, formar equipos y repartir roles. Elegir tipo de tienda, productos y clientela.', deja: 'Identidad de la tienda y catálogo' },
  { n: 2, nombre: 'Pedidos y cambio', icono: 'receipt-text', emoji: '🧾', sesiones: '4–5', hace: 'Calcular precios, cantidades, importes y cambio con números decimales.', deja: 'Pedido o factura comprobados' },
  { n: 3, nombre: 'Ofertas con sentido', icono: 'percent', emoji: '％', sesiones: '3–4', hace: 'Descuentos, promociones e impuestos. Comparar ofertas y decidir.', deja: 'Oferta explicada con sus condiciones' },
  { n: 4, nombre: 'Primer mercado', icono: 'store', emoji: '🏪', sesiones: '1–2', hace: 'Pedido a proveedores con presupuesto limitado y primer mercado simulado.', deja: 'Registro de ventas' },
  { n: 5, nombre: 'Los datos nos ayudan', icono: 'chart-column', emoji: '📊', sesiones: '3–4', hace: 'Organizar las ventas en tablas y gráficos, e interpretarlas.', deja: 'Una decisión basada en datos' },
  { n: 6, nombre: 'Mejoramos y contamos', icono: 'presentation', emoji: '🎤', sesiones: '2–3', hace: 'Segundo mercado con mejoras. Portfolio y presentación final.', deja: 'Portfolio y presentación de 4–6 min' },
];

const CLAVE = [
  { code: 'CCL', nombre: 'Comunicación lingüística', icono: 'message-square-text' },
  { code: 'CP', nombre: 'Plurilingüe', icono: 'languages' },
  { code: 'STEM', nombre: 'Matemática, ciencia, tecnología e ingeniería', icono: 'atom' },
  { code: 'CD', nombre: 'Digital', icono: 'monitor-smartphone' },
  { code: 'CPSAA', nombre: 'Personal, social y de aprender a aprender', icono: 'sprout' },
  { code: 'CC', nombre: 'Ciudadana', icono: 'vote' },
  { code: 'CE', nombre: 'Emprendedora', icono: 'lightbulb' },
  { code: 'CCEC', nombre: 'Conciencia y expresión culturales', icono: 'drama' },
];

/** Qué hace el alumnado en cada competencia específica. Mismo icono en dos materias = misma acción. */
const ACCION = {
  glasses: 'Comprender e interpretar',
  speech: 'Expresarse y presentar oralmente',
  'pencil-line': 'Producir textos',
  'messages-square': 'Interactuar, mediar y debatir',
  feather: 'Leer literatura',
  'spell-check': 'Reflexionar sobre las lenguas',
  earth: 'Diversidad lingüística y cultural',
  megaphone: 'Compartir con un público',
  'search-check': 'Buscar y contrastar información',
  scale: 'Argumentar y valorar críticamente',
  puzzle: 'Resolver problemas',
  'badge-check': 'Razonar y comprobar',
  link: 'Conectar saberes y contextos',
  shapes: 'Representar información y datos',
  'flask-conical': 'Investigar',
  workflow: 'Pensamiento computacional',
  code: 'Programar',
  'brain-circuit': 'Datos e inteligencia artificial',
  cpu: 'Construir y automatizar',
  'app-window': 'Crear aplicaciones',
  'shield-check': 'Seguridad',
  image: 'Analizar obras y producciones',
  paintbrush: 'Crear producciones',
  sparkles: 'Expresión creativa e improvisación',
  guitar: 'Interpretar',
  'heart-pulse': 'Salud y vida activa',
  'person-standing': 'Cuerpo y movimiento',
  smile: 'Emociones y aceptación del error',
  handshake: 'Cooperar, incluir y convivir',
  leaf: 'Sostenibilidad y medioambiente',
  mountain: 'Paisaje y territorio',
  hourglass: 'Sociedades en el tiempo',
  castle: 'Patrimonio y cultura',
  fingerprint: 'Identidad y dignidad',
  'scroll-text': 'Textos, mitos y creencias',
  sun: 'Interioridad y espiritualidad',
};

const FAMILIAS = [
  ['Comunicar', ['glasses', 'speech', 'pencil-line', 'messages-square', 'feather', 'spell-check', 'earth', 'megaphone']],
  ['Pensar e investigar', ['search-check', 'scale', 'puzzle', 'badge-check', 'link', 'shapes', 'flask-conical']],
  ['Tecnología', ['workflow', 'code', 'brain-circuit', 'cpu', 'app-window', 'shield-check']],
  ['Crear y expresar', ['image', 'paintbrush', 'sparkles', 'guitar']],
  ['Cuerpo y bienestar', ['heart-pulse', 'person-standing', 'smile']],
  ['Sociedad y mundo', ['handshake', 'leaf', 'mountain', 'hourglass', 'castle', 'fingerprint', 'scroll-text', 'sun']],
];

const CE_ICONOS = {
  BYG: ['shapes', 'search-check', 'flask-conical', 'workflow', 'leaf', 'mountain'],
  EFI: ['heart-pulse', 'person-standing', 'handshake', 'person-standing', 'leaf'],
  EPV: ['castle', 'speech', 'image', 'image', 'paintbrush', 'castle', 'paintbrush', 'megaphone'],
  GEH: ['search-check', 'scale', 'hourglass', 'mountain', 'scale', 'earth', 'fingerprint', 'hourglass', 'shield-check'],
  LCL: ['earth', 'glasses', 'speech', 'glasses', 'pencil-line', 'search-check', 'feather', 'feather', 'spell-check', 'handshake'],
  LEX: ['glasses', 'pencil-line', 'messages-square', 'messages-square', 'spell-check', 'earth'],
  MAT: ['puzzle', 'badge-check', 'badge-check', 'workflow', 'link', 'link', 'shapes', 'speech', 'smile', 'handshake'],
  MUS: ['image', 'sparkles', 'guitar', 'paintbrush'],
  CYR: ['workflow', 'code', 'cpu', 'brain-circuit', 'app-window', 'shield-check'],
  CCL: ['mountain', 'hourglass', 'scale', 'scroll-text', 'castle', 'spell-check'],
  OYD: ['scale', 'pencil-line', 'speech', 'sparkles', 'messages-square'],
  RCA: ['fingerprint', 'handshake', 'scale', 'castle', 'sun', 'scroll-text'],
  REV: ['scroll-text', 'sun', 'fingerprint', 'scale', 'hourglass', 'hourglass'],
  RIS: ['earth', 'scroll-text', 'hourglass'],
};

/**
 * Bloques de saberes: título del BOJA/BOE e icono.
 * CYR·E no trae título en las tablas extraídas; se nombra por su contenido (páginas y servidores web).
 */
const BLOQUES = {
  BYG: { A: ['Proyecto científico', 'flask-conical'], B: ['Geología', 'gem'], C: ['La célula', 'dna'], D: ['Seres vivos', 'rabbit'], E: ['Ecología y sostenibilidad', 'leaf'] },
  EFI: { A: ['Vida activa y saludable', 'heart-pulse'], B: ['Organización y gestión de la actividad física', 'calendar-check'], C: ['Resolución de problemas en situaciones motrices', 'puzzle'], D: ['Autorregulación emocional e interacción social en situaciones motrices', 'smile'], E: ['Manifestaciones de la cultura motriz', 'person-standing'], F: ['Interacción eficiente y sostenible con el entorno', 'tent-tree'] },
  EPV: { A: ['Patrimonio artístico y cultural. Patrimonio en Andalucía', 'castle'], B: ['Elementos formales de la imagen y del lenguaje visual. La expresión gráfica', 'shapes'], C: ['Expresión artística y gráfico-plástica: técnicas y procedimientos', 'paintbrush'], D: ['Imagen y comunicación visual y audiovisual', 'clapperboard'], E: ['Geometría, repercusión en el arte y la arquitectura', 'drafting-compass'] },
  GEH: { A: ['Retos del mundo actual', 'earth'], B: ['Sociedades y territorios', 'hourglass'], C: ['Compromiso cívico', 'handshake'] },
  LCL: { A: ['Las lenguas y sus hablantes', 'earth'], B: ['Comunicación', 'speech'], C: ['Educación literaria', 'feather'], D: ['Reflexión sobre la lengua', 'spell-check'] },
  LEX: { A: ['Comunicación', 'messages-square'], B: ['Plurilingüismo', 'spell-check'], C: ['Interculturalidad', 'earth'] },
  MAT: { A: ['Sentido numérico', 'hash'], B: ['Sentido de la medida', 'ruler'], C: ['Sentido espacial', 'cuboid'], D: ['Sentido algebraico', 'variable'], E: ['Sentido estocástico', 'dices'], F: ['Sentido socioafectivo', 'smile'] },
  MUS: { A: ['Escucha y percepción', 'ear'], B: ['Interpretación, improvisación y creación escénica', 'guitar'], C: ['Contextos y culturas', 'earth'] },
  CYR: { A: ['Introducción a la programación', 'code'], B: ['Internet de las cosas', 'wifi'], C: ['Robótica', 'cpu'], D: ['Desarrollo móvil', 'smartphone'], E: ['Desarrollo web', 'app-window'], F: ['Fundamentos de la computación física', 'circuit-board'], G: ['Datos masivos', 'database'], H: ['Inteligencia artificial', 'brain-circuit'], I: ['Ciberseguridad', 'shield-check'] },
  CCL: { A: ['Geografía e historia', 'map-pinned'], B: ['Sociedad y vida cotidiana', 'users-round'], C: ['Mitología y religión', 'scroll-text'], D: ['Arte', 'image'], E: ['Lengua, léxico y literatura', 'whole-word'] },
  OYD: { A: ['El discurso persuasivo y argumentativo', 'scale'], B: ['Elaboración del discurso persuasivo y argumentativo', 'pencil-line'], C: ['La presentación del discurso persuasivo y argumentativo', 'mic-vocal'], D: ['Oratoria, valores y educación emocional', 'smile'], E: ['El debate', 'messages-square'] },
  RCA: { A: ['Dignidad humana y proyecto personal en la visión cristiana de la vida', 'fingerprint'], B: ['Cosmovisión, identidad cristiana y expresión cultural', 'castle'], C: ['Corresponsables en el cuidado de las personas y del planeta', 'leaf'] },
  REV: { A: ['La Biblia y su estudio', 'scroll-text'], B: ['La vida y el ministerio de Jesús', 'sun'], C: ['La vida cristiana', 'heart'], D: ['La ética cristiana', 'scale'], E: ['La historia de la salvación de Adán a Jesucristo', 'route'], F: ['La historia del cristianismo', 'hourglass'] },
  RIS: { A: ['El Mensaje de adorar al Dios Único revelado a los diversos Profetas coránicos', 'scroll-text'], B: ['El Mensaje coránico de adorar al Dios Único comunicado por el Profeta', 'book-open-text'], C: ['La transversalidad del Islam en nuestra sociedad democrática y sus retos', 'handshake'] },
};

const GRUPOS = { comun: 'Materias comunes', optativa: 'Optativas', religion: 'Religión' };

/** Materias. Los colores de las ocho comunes son los de la aplicación InterESO. El emoji es para la hoja de cálculo. */
const MATERIAS = [
  { id: 'MAT', nombre: 'Matemáticas', corto: 'Matemáticas', icono: 'calculator', emoji: '🔢', c: '#0369a1', t: '#e0f2fe', grupo: 'comun',
    base: { 1: 'Equipos, roles y portfolio', 3: 'Porcentajes y ofertas', 4: 'Pedido con presupuesto', 6: 'Balance y presentación' },
    ideas: [
      { fase: 2, titulo: 'Un pedido sin errores', texto: 'Calcular un pedido con 5 €, su total y el cambio. Estimar antes y comprobar después con calculadora.', ce: [1, 2], evidencia: 'Pedido revisado y registro de comprobación' },
      { fase: 5, titulo: 'Lo que dicen las ventas', texto: 'Pasar las ventas del primer mercado a una tabla y un gráfico, y decidir qué cambiar para el segundo.', ce: [7, 8], evidencia: 'Tabla, gráfico y decisión justificada' },
    ] },
  { id: 'LCL', nombre: 'Lengua Castellana y Literatura', corto: 'Lengua Castellana', icono: 'book-open', emoji: '📖', c: '#be123c', t: '#ffe4e6', grupo: 'comun',
    ideas: [
      { fase: 2, titulo: 'Cómo se lee una factura', texto: 'Escribir una guía breve para que el proveedor entienda el pedido: destinatario, propósito, orden y datos.', ce: [5], evidencia: 'Plan individual y guía revisada' },
      { fase: 6, titulo: 'Contamos lo que hicimos', texto: 'Preparar y ensayar el guion de la presentación final, apoyando cada afirmación en una evidencia.', ce: [3], evidencia: 'Guion y observación de la exposición' },
    ] },
  { id: 'LEX', nombre: 'Inglés', sub: 'Primera Lengua Extranjera', corto: 'Inglés', icono: 'globe', emoji: '🌐', c: '#6d28d9', t: '#ede9fe', grupo: 'comun',
    ideas: [
      { fase: 1, titulo: 'Mini catalogue', texto: 'Cinco productos de la tienda con su precio y una frase de venta en inglés.', ce: [2], evidencia: 'Catálogo revisado' },
      { fase: 4, titulo: 'At the shop', texto: 'Diálogo de compra de seis turnos con los precios reales del catálogo, representado en el mercado.', ce: [3], evidencia: 'Guion y observación de la interacción' },
    ] },
  { id: 'GEH', nombre: 'Geografía e Historia', corto: 'Geografía e Historia', icono: 'map', emoji: '🗺️', c: '#047857', t: '#d1fae5', grupo: 'comun',
    ideas: [
      { fase: 1, titulo: 'Dónde abrimos la tienda', texto: 'Situar la tienda en un plano del barrio y justificar la ubicación con dos razones sobre clientela y servicios.', ce: [4, 1], evidencia: 'Plano con leyenda y justificación' },
      { fase: 6, titulo: 'Barrio o gran superficie', texto: 'Comparar el comercio de barrio con las grandes superficies usando datos y testimonios, y sacar una conclusión.', ce: [2], evidencia: 'Tabla comparativa y conclusión' },
    ] },
  { id: 'BYG', nombre: 'Biología y Geología', corto: 'Biología y Geología', icono: 'microscope', emoji: '🔬', c: '#4d7c0f', t: '#ecfccb', grupo: 'comun',
    ideas: [
      { fase: 1, titulo: 'Envases con cabeza', texto: 'Comparar dos envases por su material y los residuos que generan, y elegir el de la tienda con argumentos.', ce: [5], evidencia: 'Ficha comparativa' },
      { fase: 5, titulo: '¿Cuánto residuo evitamos?', texto: 'Estimar con las ventas reales cuántos envases se ahorran con la opción elegida.', ce: [5, 1], evidencia: 'Cálculo e infografía breve' },
    ] },
  { id: 'EFI', nombre: 'Educación Física', corto: 'Educación Física', icono: 'dumbbell', emoji: '🏃', c: '#c2410c', t: '#ffedd5', grupo: 'comun',
    ideas: [
      { fase: 1, titulo: 'Tienda de material deportivo', texto: 'Diseñar y probar en clase un servicio de préstamo de material con uso motriz real.', ce: [1], evidencia: 'Ficha del servicio y registro de la prueba' },
      { fase: 4, titulo: 'Un mercado seguro', texto: 'Organizar el espacio, la circulación y las normas de seguridad del mercado simulado.', ce: [5], evidencia: 'Plano del espacio y normas' },
    ] },
  { id: 'EPV', nombre: 'Educación Plástica, Visual y Audiovisual', corto: 'Plástica y Audiovisual', icono: 'palette', emoji: '🎨', c: '#b45309', t: '#fef3c7', grupo: 'comun',
    ideas: [
      { fase: 1, titulo: 'Un logotipo que se reconoce', texto: 'Diseñar un logotipo legible en grande y en pequeño, y comprobar que funciona en blanco y negro.', ce: [7], evidencia: 'Bocetos y versión final' },
      { fase: 3, titulo: 'Un cartel en cinco segundos', texto: 'Cartel con jerarquía visual (producto, precio, condición) y prueba de lectura con otra pareja.', ce: [5, 8], evidencia: 'Boceto, prueba y cartel mejorado' },
    ] },
  { id: 'MUS', nombre: 'Música', corto: 'Música', icono: 'music', emoji: '🎵', c: '#a21caf', t: '#fae8ff', grupo: 'comun',
    ideas: [
      { fase: 3, titulo: 'Cuña de 15 segundos', texto: 'Crear e interpretar una cuña publicitaria con el mensaje de la oferta.', ce: [4], evidencia: 'Grabación y guion musical' },
      { fase: 4, titulo: 'El ambiente del mercado', texto: 'Seleccionar la música de la tienda justificando estilo, público y duración.', ce: [1], evidencia: 'Lista razonada' },
    ] },
  { id: 'CYR', nombre: 'Computación y Robótica', corto: 'Computación y Robótica', icono: 'bot', emoji: '🤖', c: '#4f46e5', t: '#e0e7ff', grupo: 'optativa',
    ideas: [
      { fase: 2, titulo: 'Caja registradora en bloques', texto: 'Programar una caja que calcule el total y el cambio, y probarla con pedidos de resultado conocido.', ce: [2], evidencia: 'Programa y tabla de pruebas' },
      { fase: 5, titulo: 'Del registro al patrón', texto: 'Organizar los datos de ventas para descubrir qué se vende más y cuándo.', ce: [4], evidencia: 'Datos organizados y conclusión' },
    ] },
  { id: 'CCL', nombre: 'Cultura Clásica', corto: 'Cultura Clásica', icono: 'landmark', emoji: '🏛️', c: '#991b1b', t: '#fee2e2', grupo: 'optativa',
    ideas: [
      { fase: 1, titulo: 'Del ágora y el foro al barrio', texto: 'Cómo se compraba en Atenas y en Roma, y qué se parece a nuestro mercado.', ce: [1], evidencia: 'Comparación ilustrada' },
      { fase: 3, titulo: 'Mercurio y la moneda', texto: 'Palabras del comercio con origen clásico (mercado, mercancía, moneda, economía) para rotular la tienda.', ce: [6, 4], evidencia: 'Rótulos con su etimología' },
    ] },
  { id: 'OYD', nombre: 'Oratoria y Debate', corto: 'Oratoria y Debate', icono: 'mic', emoji: '🎙️', c: '#0e7490', t: '#cffafe', grupo: 'optativa',
    ideas: [
      { fase: 3, titulo: 'Vender sin engañar', texto: 'Discurso de venta de un minuto que persuade con datos verdaderos.', ce: [1, 3], evidencia: 'Guion y grabación' },
      { fase: 6, titulo: 'Debate de cierre', texto: '¿Qué tienda funcionó mejor y por qué? Debate con turnos, reglas y datos del mercado.', ce: [5], evidencia: 'Registro de intervenciones' },
    ] },
  { id: 'SLE', ref: 'LEX', nombre: 'Francés', sub: 'Segunda Lengua Extranjera', corto: 'Francés', icono: 'flag', emoji: '🇫🇷', c: '#7e22ce', t: '#f3e8ff', grupo: 'optativa',
    ideas: [
      { fase: 1, titulo: 'La vitrine', texto: 'Tres productos con su precio y una frase descriptiva en francés.', ce: [2], evidencia: 'Vitrina revisada' },
      { fase: 4, titulo: 'Au marché', texto: 'Pedir un producto y confirmar cantidad y precio con fórmulas de cortesía.', ce: [3], evidencia: 'Diálogo y observación' },
    ] },
  { id: 'MLCT', ref: 'LCL', nombre: 'Área Lingüística de Carácter Transversal', corto: 'Área Lingüística', icono: 'pen-line', emoji: '✍️', c: '#881337', t: '#fff1f2', grupo: 'optativa',
    ideas: [
      { fase: 1, titulo: 'Leemos el catálogo', texto: 'Vocabulario del comercio y lectura de etiquetas, precios y condiciones.', ce: [4], evidencia: 'Ficha de lectura' },
      { fase: 3, titulo: 'Una oferta que diga la verdad', texto: 'Anuncio de 40 a 60 palabras para un destinatario concreto, con precio y condición.', ce: [5], evidencia: 'Borrador y anuncio revisado' },
    ] },
  { id: 'RCA', nombre: 'Religión Católica', corto: 'Religión Católica', icono: 'church', emoji: '⛪', c: '#475569', t: '#f1f5f9', grupo: 'religion',
    ideas: [
      { fase: 3, titulo: '¿Es justa esta oferta?', texto: 'Analizar reclamos que empujan a comprar más de lo necesario y proponer cómo informar sin presionar.', ce: [3], evidencia: 'Análisis y propuesta' },
      { fase: 6, titulo: 'Una tienda que cuida', texto: 'Compromisos de la tienda con su clientela y con su barrio.', ce: [2], evidencia: 'Decálogo del equipo' },
    ] },
  { id: 'REV', nombre: 'Religión Evangélica', corto: 'Religión Evangélica', icono: 'book-heart', emoji: '📕', c: '#334155', t: '#e2e8f0', grupo: 'religion',
    ideas: [
      { fase: 3, titulo: 'Comercio honrado', texto: 'Valores en la compraventa: precio justo, verdad y buen trato.', ce: [4], evidencia: 'Análisis de casos' },
      { fase: 6, titulo: 'Una tienda que cuida', texto: 'Compromisos de la tienda con su clientela y con su barrio.', ce: [4], evidencia: 'Decálogo del equipo' },
    ] },
  { id: 'RIS', nombre: 'Religión Islámica', corto: 'Religión Islámica', icono: 'moon-star', emoji: '🌙', c: '#57534e', t: '#f5f5f4', grupo: 'religion',
    ideas: [
      { fase: 1, titulo: 'Los zocos de Al-Ándalus', texto: 'El mercado como lugar de encuentro: comparar el zoco con el comercio del barrio actual.', ce: [3], evidencia: 'Comparación ilustrada' },
      { fase: 6, titulo: 'Un barrio de muchas culturas', texto: 'Tiendas del barrio que reflejan distintas culturas y lo que aportan a la convivencia.', ce: [1], evidencia: 'Mapa o mural' },
    ] },
];

/** Tramos de planificación. Una semana, una entrega. Las fechas son de 2026. */
const PLAN = {
  curso: '2026-2027',
  proyecto: 'Tiendas de Barrio',
  nivel: '1.º ESO',
  centro: 'IES Al-Ándalus',
  correo: 'juan.gamez@iesalandalus.org',
  coordina: 'Juan María Gámez Ortiz',
  aula: { desde: '2026-11-02', hasta: '2026-12-18', texto: 'Noviembre y diciembre' },
  tramos: [
    {
      id: 'T1', numero: 1, nombre: 'Me apunto', icono: 'hand',
      desde: '2026-09-29', hasta: '2026-10-02', entrega: '2026-10-02',
      objetivo: 'Saber quién entra, en qué fase del aula y con qué idea.',
      entregable: 'Ficha de compromiso de tu materia',
      minutos: 15,
      depende: null,
      porque: 'Sin esto no se puede repartir nada: la fase 2 del aula necesita saber quién produce el catálogo y quién lo usa.',
    },
    {
      id: 'T2', numero: 2, nombre: 'Mi currículo', icono: 'list-checks',
      desde: '2026-10-05', hasta: '2026-10-09', entrega: '2026-10-09',
      objetivo: 'Anclar tu tarea a criterios de evaluación reales, con su evidencia y su instrumento.',
      entregable: 'Ficha curricular de tu materia',
      minutos: 25,
      depende: 'T1',
      porque: 'Una aportación sin criterio es una actividad suelta: no se evalúa y no cuenta para tu programación.',
    },
    {
      id: 'T3', numero: 3, nombre: 'Encajamos', icono: 'arrow-left-right',
      desde: '2026-10-13', hasta: '2026-10-16', entrega: '2026-10-16',
      objetivo: 'Acordar qué recibe y qué entrega cada materia, y en qué fecha.',
      entregable: 'Ficha de acuerdos y fechas',
      minutos: 20,
      depende: 'T2',
      porque: 'Aquí es donde un proyecto interdisciplinar se cae: alguien espera un material que nadie se comprometió a entregar.',
    },
    {
      id: 'T4', numero: 4, nombre: 'Mi sesión', icono: 'square-pen',
      desde: '2026-10-19', hasta: '2026-10-23', entrega: '2026-10-23',
      objetivo: 'Dejar la sesión minutada y el material del alumnado listo para noviembre.',
      entregable: 'Guion de sesión y material',
      minutos: 40,
      depende: 'T3',
      porque: 'Si el material se prepara en noviembre, se prepara mal o no se prepara.',
    },
  ],
  cierre: {
    fecha: '2026-10-26',
    nombre: 'Cierre y calendario de aula',
    icono: 'users',
    objetivo: 'Reunión de una hora: proyecto completo, calendario de sesiones y acuerdos firmados.',
  },
  extra: {
    id: 'EXTRA', nombre: 'Propón otro reto', icono: 'mountain-snow',
    objetivo: 'Abierta todo el curso: si ves un reto mejor para el año que viene, déjalo escrito.',
    entregable: 'Propuesta de reto nuevo',
    minutos: 15,
  },
};

/** Tipos de evidencia del alumnado, comunes a varias plantillas. */
const EVIDENCIAS = [
  { id: 'texto', etiqueta: 'Texto escrito', icono: 'file-text' },
  { id: 'cartel', etiqueta: 'Cartel o imagen', icono: 'frame' },
  { id: 'audio', etiqueta: 'Audio', icono: 'audio-lines' },
  { id: 'video', etiqueta: 'Vídeo', icono: 'video' },
  { id: 'tabla', etiqueta: 'Tabla o gráfico', icono: 'table-2' },
  { id: 'objeto', etiqueta: 'Objeto o maqueta', icono: 'box' },
  { id: 'oral', etiqueta: 'Exposición oral', icono: 'mic-vocal' },
  { id: 'digital', etiqueta: 'Producto digital', icono: 'laptop' },
];

const INSTRUMENTOS = [
  { id: 'rubrica', etiqueta: 'Rúbrica' },
  { id: 'cotejo', etiqueta: 'Lista de cotejo' },
  { id: 'escala', etiqueta: 'Escala de observación' },
  { id: 'registro', etiqueta: 'Registro anecdótico' },
  { id: 'portfolio', etiqueta: 'Portfolio' },
  { id: 'prueba', etiqueta: 'Prueba o tarea' },
];

const DUA = [
  { id: 'compromiso', etiqueta: 'Compromiso', sub: 'el porqué', icono: 'heart', ejemplo: 'Elegir el producto o el formato, trabajar en pareja, empezar por un caso cercano.' },
  { id: 'representacion', etiqueta: 'Representación', sub: 'el qué', icono: 'eye', ejemplo: 'Modelo resuelto, apoyo visual, vocabulario previo, audio del enunciado.' },
  { id: 'accion', etiqueta: 'Acción y expresión', sub: 'el cómo', icono: 'hand', ejemplo: 'Responder por escrito, en voz alta, grabado o con plantilla guiada.' },
];

const AGRUPAMIENTOS = ['Gran grupo', 'Equipos cooperativos', 'Parejas', 'Individual', 'Grupos flexibles'];

/** Iconos de interfaz que no vienen del vocabulario curricular. */
const ICONOS_INTERFAZ = [
  'calendar-days', 'list', 'layout-grid', 'chart-column', 'filter', 'search', 'x', 'check', 'chevron-down', 'chevron-right', 'chevron-left',
  'printer', 'mail', 'copy', 'copy-check', 'lock', 'lock-open', 'circle-alert', 'info', 'arrow-right', 'arrow-left-right', 'arrow-down-to-line',
  'send', 'clock', 'users', 'package-check', 'file-check', 'square-pen', 'list-checks', 'hand', 'mountain-snow', 'sparkles', 'bot-message-square',
  'download', 'upload', 'trash-2', 'save', 'external-link', 'house', 'graduation-cap', 'triangle-alert', 'circle-check-big', 'circle-dashed',
  'accessibility', 'clipboard-check', 'calendar-check', 'life-buoy', 'store', 'tag', 'receipt-text', 'percent', 'presentation', 'book-open-check',
  'notebook-pen', 'clipboard-list', 'hand-coins', 'megaphone', 'frame', 'table-2', 'sigma', 'message-square-quote', 'file-text', 'audio-lines',
  'video', 'box', 'mic-vocal', 'laptop', 'heart', 'eye', 'pen-line', 'plus', 'minus', 'rotate-ccw', 'wand-sparkles', 'key-round', 'target',
];

module.exports = { FASES, CLAVE, ACCION, FAMILIAS, CE_ICONOS, BLOQUES, GRUPOS, MATERIAS, PLAN, EVIDENCIAS, INSTRUMENTOS, DUA, AGRUPAMIENTOS, ICONOS_INTERFAZ };
