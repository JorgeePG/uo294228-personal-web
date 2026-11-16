// Resumen generado desde el último cierre completo y sus validadores.
import fs from 'node:fs/promises';
const testDir='validacion/revision-2026-11-14-buscador';
const full=JSON.parse(await fs.readFile(testDir+'/latest-full.json','utf8'));
const validation=JSON.parse(await fs.readFile('validacion/revision-2026-11-12/validation-summary.json','utf8'));
const perfDir=process.env.UX_PERF_OUTPUT||'validacion/revision-2026-11-16-v2';
const perf=JSON.parse(await fs.readFile(perfDir+'/performance-summary.json','utf8'));
if(full.scope!=='full'||full.exitCode||full.stats.unexpected||!validation.resources.passed||!validation.results.every(r=>r.passed))throw new Error('Se requiere suite completa y validación correctas');
const report=`CIERRE TÉCNICO V2 — 16/11/2026
Fuente: rama feat/mejoras-ux-accesibilidad. No es una V3 posterior a usuarios.

PRUEBAS Y ALCANCE
${full.stats.expected} pruebas completas, ${full.stats.unexpected} fallidas, ${full.stats.skipped} omitidas.
Incluyen 18 escenarios específicos del buscador; no sumar ambos recuentos.
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
La conformidad AAA se estudia separadamente para V3: no se certifica aquí.

RENDIMIENTO DE LABORATORIO
${perf.pages.map(p=>`${p.name}: rendimiento ${p.scores.performance}/100, LCP ${(p.lcp/1000).toFixed(2)} s, CLS ${p.cls}; carga observada ${p.load} ms`).join('\n')}
Fuente ${perfDir}/performance-summary.json. Emulación móvil localhost; no son
mediciones de producción ni tiempos de personas.

CAMBIOS
Mapa jerárquico completo y migas antes del main; ayuda ES/EN; mapa ante cero
resultados y 404; correo/LinkedIn visibles; variantes intermedias WebP también
en rutas ../; referencias y aficiones confirmadas por Jorge el 16/11.
Se conserva el estilo, la geometría de imágenes, las tarjetas abiertas igualadas
y las cerradas compactas. OpenDyslexic y panel flotante siguen siendo opcionales.

DEPENDENCIAS
Las tres sesiones reales, su análisis y una V3 derivada de usuarios siguen pendientes.
La valoración experta de la métrica no garantiza la nota académica.
`;
await fs.writeFile('VALIDACION.txt',report);
console.log(`VALIDACION.txt actualizado: ${full.stats.expected} pruebas completas.`);
