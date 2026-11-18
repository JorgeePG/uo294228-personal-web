// Resumen generado desde el último cierre completo y sus validadores.
import fs from 'node:fs/promises';
const testDir=process.env.UX_EVIDENCE_DIR||'validacion/revision-2026-11-18-v3-etiquetas';
const full=JSON.parse(await fs.readFile(testDir+'/latest-full.json','utf8'));
const validation=JSON.parse(await fs.readFile((process.env.UX_VALIDATION_OUTPUT||testDir+'/nu')+'/validation-summary.json','utf8'));
const searchCount=(await fs.readFile('tests/search.spec.mjs','utf8')).match(/^scenario\(/gm).length;
if(full.scope!=='full'||full.exitCode||full.stats.unexpected||!validation.resources.passed||!validation.results.every(r=>r.passed))throw new Error('Se requiere suite completa y validación correctas');
const report=`VERIFICACIÓN TÉCNICA V3 — BUSCADOR, IDIOMAS Y ETIQUETAS 18/11/2026
Fuente: rama feat/mejoras-ux-accesibilidad; trabajo local posterior a las sesiones
de V2. La V2 evaluada y los JSON originales permanecen intactos.

PRUEBAS Y ALCANCE
${full.stats.expected} pruebas completas, ${full.stats.unexpected} fallidas, ${full.stats.skipped} omitidas.
Incluyen ${searchCount} escenarios específicos del buscador; no sumar ambos recuentos.
Informe completo: ${testDir}/${full.report}
SHA256 ${full.sha256}
HTML/CSS: ${validation.results.map(r=>`${r.files} ${r.type}, ${r.messages} mensajes`).join('; ')}.
Recursos locales ausentes: ${validation.resources.missing.length}.
Los archivos íntegros, parciales e intentos de desarrollo tienen nombres propios.

COMPROBACIONES
19 rutas ES/EN y transcripción; anchos 320,375,768,1280,1920; preferencias hasta
200%; teclado, diálogo, carruseles, retorno del foco, buscador y recuperación.
Navegación de las 19 rutas sin gráficos, estilos ni JavaScript; no se presenta
como una sesión con lector de pantalla. Axe sin infracciones detectadas en las
comprobaciones ejecutadas. Nu no es un comprobador de accesibilidad.
Estas comprobaciones no certifican conformidad AAA.

RENDIMIENTO
No se ha repetido Lighthouse en este cambio. Las mediciones del 16/11 son
históricas de V2 y no se presentan como resultados nuevos de V3.

CAMBIOS DERIVADOS DE LAS OBSERVACIONES COMUNICADAS POR JORGE
Campo de cabecera más ancho y con etiqueta visible. Formulario de resultados
compacto y centrado, sin explicación repetida. Encabezados de tarjetas/secciones
incluidos en el índice: pesos por término título 8, encabezados 4, texto 1.
T-72 devuelve primero Vehículos y museos en ES/EN. Resúmenes junto a coincidencias.
Selector Idioma/Language con Español y English visibles, idioma actual marcado,
opciones de 44 px y navegación nativa sin JavaScript. Con JavaScript conserva
consulta, parámetros y fragmento al pasar a la página equivalente. El recurso
único de transcripción identifica que su enlace lleva a multimedia en inglés.
Los cinco ajustes de lectura tienen asociación explícita for/id (H44), tras
localizar en el informe detallado de TAW sus 40 incidencias en la misma línea.
Los perfiles LinkedIn tienen nombres accesibles individualizados y las
alternativas de descarga distinguen vídeo/audio. Objetivos de resultados y
referencias ampliados a 44 px. La nueva comprobación de TAW sigue pendiente;
no se afirma que el contador haya bajado hasta disponer de su resultado real.
No hay una regla especial para T-72. Se conservan las fuentes, paleta y geometría
de imágenes, tarjetas abiertas/cerradas y opciones de accesibilidad.

DEPENDENCIAS
Jorge confirma tres sesiones de V2. La tercera exportación está etiquetada por
error como PILOTO/PC: su aclaración U03/móvil se guarda aparte sin modificarla.
Faltan consolidar fichas y análisis; revisar avisos de calidad de mirada;
completar evaluación/manual AAA y las herramientas exigidas sobre V3.
No se ha realizado una nueva tanda humana sobre V3. La publicación se registra
aparte mediante commit y comparación de hashes de los archivos públicos.
La valoración experta de la métrica no garantiza la nota académica.
`;
await fs.writeFile('VALIDACION.txt',report);
console.log(`VALIDACION.txt actualizado: ${full.stats.expected} pruebas completas.`);
