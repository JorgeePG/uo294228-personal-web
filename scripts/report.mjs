import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir='validacion/revision-2026-11-12';
const validation=JSON.parse(await fs.readFile(dir+'/validation-summary.json','utf8'));
const testDirectory='validacion/revision-2026-11-14-buscador';
const latestTests=JSON.parse(await fs.readFile(testDirectory+'/latest-full.json','utf8'));
if(latestTests.scope!=='full'||latestTests.exitCode!==0)throw new Error('A passing full test run is required for the report');
const tests=JSON.parse(await fs.readFile(testDirectory+'/'+latestTests.report,'utf8'));
const performance=JSON.parse(await fs.readFile(dir+'/performance-summary.json','utf8'));
const report=`REVISIÓN LOCAL — 14/11/2026
Proyecto: uo294228-personal-web. Esta revisión sustituye las conclusiones
de los informes históricos; no modifica ni certifica el despliegue público.

CAMBIOS
Imágenes JPG y WebP normalizadas: fotos 960x640; carteles 640x960 con bandas
para conservar todo el cartel; retrato 400x400. Variantes WebP 480/768/960.
Carruseles con altura estable, teclado, foco, estado anunciado, etiquetas
visibles, contenido fuera de vista inerte y conservación del elemento al redimensionar.
Ayuda, mapa, buscador local con acentos y varios términos, recuperación de
errores, versiones estáticas en español/inglés y fecha de revisión real.
Menú móvil compacto, enlaces de descarga multimedia permanentes, navegación
común en la transcripción. CSS agrupado/minificado y fuentes precargadas.
Buscador GET visible con campo, lupa y botón en todas las cabeceras (también
404 y transcripción). Resultados en el idioma activo y envío por Enter o botón.
Fecha visible 14/11/2026. Grado terminado y máster en curso confirmados por Jorge.
Panel propio Accesibilidad/Accessibility en las 19 rutas: texto 100/125/150/200 %,
espaciado, OpenDyslexic, títulos con Arial, enlaces destacados, movimiento reducido y reset.
Guardado local entre páginas/idiomas, sin peticiones a servicios externos.
Botón flotante fijo y diálogo modal nativo: no ocupa la cabecera. Cierre visible,
Escape, clic exterior, ciclo de Tab/Mayús+Tab y retorno de foco; oculto sin JS.
Contenido del panel con desplazamiento interno; cierre visible al recorrerlo.
OpenDyslexic local, normal/negrita/cursiva/negrita cursiva originales bajo SIL OFL;
licencia, procedencia, revisión y SHA256 en public/fonts/opendyslexic-*.
Se carga al activarla y se aplica también a controles y títulos. Es opcional;
se propone probarla según comodidad personal, sin promesas de eficacia universal.
Resiste almacenamiento bloqueado. Restablecer elimina la clave de preferencias
y mantiene el respeto a prefers-reduced-motion del sistema. Ayuda bilingüe.
Galería: únicamente las fichas abiertas igualan su altura con la abierta más larga.
Las fichas cerradas conservan su altura natural y compacta. Al cerrar, cambiar
el ancho o cargar las fuentes, la altura del grupo abierto se recalcula.
No se desplazan verticalmente al recibir foco o pasar el ratón.
Comprobación de regresión geométrica y capturas en escritorio/móvil incluidas.
Actualización del 12/11: LinkedIn y GitHub del autor, formación, experiencia
en TWave/SERVEO, competencias e idiomas del CV proporcionado. Interés por
War Thunder como coleccionismo descrito por el autor, sin visitas inventadas.
Referencias profesionales designadas por Jorge: José Ramón Blanco y Juan
Menéndez Blanco. Perfiles públicos enlazados y fichas individuales. La foto
de José Ramón procede de la imagen publicada en su perfil de LinkedIn; la
de Juan ha sido facilitada por Jorge. Ambas se conservan a 200x200, sin deformación.
La fotografía conjunta de prensa ya no se muestra. No se inventan imágenes,
recomendaciones, testimonios o consentimiento de las personas mencionadas.

PRUEBAS REPRODUCIBLES
${tests.stats.expected} pruebas Playwright correctas; ${tests.stats.unexpected} fallidas; ${tests.stats.skipped} omitidas.
Suite completa: ${testDirectory}/${latestTests.report}
Comando: ${latestTests.command}. Fin: ${latestTests.finished}. SHA256: ${latestTests.sha256}.
Cada ejecución completa o parcial conserva un JSON distinto en runs/; los punteros
latest-full.json y latest-partial.json no se confunden ni suman sus recuentos.
19 rutas: seis secciones ES/EN, búsqueda y ayuda ES/EN, 404 ES/EN y transcripción.
Anchos 320, 375, 768, 1280 y 1920: sin desbordamiento horizontal global.
Axe-core 4.14.0: cero infracciones detectadas en las rutas comprobadas.
Teclado real: salto a main, galería, Escape, retorno del foco y desplegables.
Carrusel: avance circular, estabilidad de altura, redimensionado y botones.
Búsqueda: tildes, varios términos, ausencia de resultados, entrada HTML,
fallo de red y resultados en inglés. Cambio de idioma conserva la sección.
18 casos adicionales documentan vacío/espacios, ranking y desempate, longitud,
reintento, caché, errores de índice/URL, concurrencia, anuncios, cobertura vigente
y despliegue bajo un prefijo arbitrario. Hay observaciones JSON por caso.
Índice: 15 páginas de contenido (siete pares ES/EN y transcripción inglesa
compartida); cuatro exclusiones explícitas: 404 y resultados en ambos idiomas.
public/search-coverage.json registra inventario, enlaces y hashes de los índices.
Navegación sin JavaScript y con imágenes bloqueadas comprobada en galería.
Preferencias: teclado, persistencia, cambio de idioma, recarga, reset y
almacenamiento bloqueado. Las 19 rutas también se comprueban con todos los
ajustes activados, texto al 200 %, axe y anchos 320/375/768/1280; sin
desbordamiento horizontal global ni controles de preferencias fuera de pantalla.
Se verifica que solo las fichas abiertas comparten altura con estos ajustes.
Panel flotante: seguimiento del scroll, diálogo sin alterar el alto del contenido,
foco contenido, cierre exterior, fuentes cargadas bajo demanda y reset.
Pantallas 568x320 y 320x480 con texto al 200 % y todos los ajustes activos:
panel dentro del viewport, acceso al reset y cierre completamente visible.
Al recibir foco, los enlaces bajo el acceso flotante se desplazan a la vista.
Enlaces internos comprobados por HTTP. Recursos locales referenciados:
${validation.resources.missing.length} ausentes. No se certifican todos los enlaces externos.

VALIDADORES
Nu Html Checker 26.11.9 con advertencias tratadas como fallo, sin filtros:
${validation.results.map(r=>`${r.type}: ${r.files} archivos, salida ${r.exitCode}, ${r.messages} mensajes.`).join('\n')}
CSS incluye fuentes, hojas originales y hoja minificada generada.
Jigsaw W3C remoto: el envío del CSS el 11/11 devolvió HTTP 500. No se presenta como
validación superada; la evidencia vigente de CSS es el comprobador Nu local.

LIGHTHOUSE 13.6.0 — MÓVIL, SIMULACIÓN DE RED/CPU
${performance.pages.map(p=>`${p.name}: rendimiento ${p.scores.performance}; accesibilidad ${p.scores.accessibility}; buenas prácticas ${p.scores['best-practices']}; SEO ${p.scores.seo}; LCP ${(p.lcp/1000).toFixed(2)} s; CLS ${p.cls}.`).join('\n')}
Una ejecución final por sección. Son mediciones locales de laboratorio;
no equivalen a tiempo de descarga en GitHub Pages o en la red universitaria.
No se ocultan recomendaciones de Lighthouse: conservar los HTML/JSON íntegros.
Las pruebas automáticas no son una certificación WCAG ni garantizan una nota.

CONTENIDO Y PROCEDENCIA
profile.pending.json contiene los datos facilitados por Jorge y su CV el
12/11/2026. Los cargos de los contactos se contrastaron con las publicaciones
de TWave y sus perfiles públicos. public/img/referencias/ORIGEN.json registra
la procedencia de ambas fotografías de perfil; no quedan fotos pendientes.
Las referencias designadas por el autor se publican con publishPublicProfile;
esto no equivale a afirmar que hayan dado un testimonio o un aval.
El autor confirmó el 13/11/2026 que finalizó el grado y está cursando el máster.
La revisión palabra por palabra de la transcripción no se ha realizado y queda
fuera del alcance por decisión del autor. Sigue identificada como automática.

EVIDENCIAS
${dir}/: html.json, css.json, validation-summary.json,
playwright.json histórico, performance-summary.json, informes Lighthouse HTML/JSON,
images.json y capturas de escritorio/móvil.
La suite vigente está en ${testDirectory}; las selecciones parciales ya no
sobrescriben el informe completo. Los nombres/fechas internos identifican cada ejecución.
Los informes de octubre y del 11/11 se conservan como históricos. Algunos
JSON de pruebas del directorio del 11/11 se actualizaron durante la primera
pasada del 12/11: sus fechas internas prevalecen; el directorio vigente es este.
`;
await fs.writeFile('VALIDACION.txt',report);
await fs.writeFile('leeme.txt',`WEB PERSONAL — REVISIÓN 14/11/2026

GitHub Pages publica esta web desde feat/mejoras-ux-accesibilidad, carpeta /.
URL: https://jorgeepg.github.io/uo294228-personal-web/
La versión anterior se conserva en el historial Git (base acc7adf).
Las mejoras se mantienen en la rama feat/mejoras-ux-accesibilidad.
La antigua entrega y sus evidencias de octubre no describen esta revisión.

COMANDOS (Node 24+, pnpm y Java 17+; pruebas con Chrome instalado)
pnpm install --frozen-lockfile
pnpm dev                 Servidor local http://127.0.0.1:4173
pnpm images              Normaliza JPG y genera WebP 480/768/960
pnpm build               Genera CSS minificado, versiones EN e índices de búsqueda
pnpm test                Pruebas funcionales, responsive y axe en Chrome
pnpm validate            Validador Nu HTML/CSS y rutas de recursos locales
pnpm performance         Lighthouse de las seis secciones (requiere pnpm dev)
node scripts/screenshots.mjs   Capturas de QA (requiere pnpm dev)
node scripts/reading-settings-qa.mjs  Capturas de preferencias (requiere pnpm dev)
node scripts/report.mjs        Actualiza evidencias resumidas y manifiesto

La web sigue siendo estática y no necesita Node en producción. El buscador
requiere HTTP y JavaScript; sin JavaScript hay enlace al mapa del sitio.
No se añaden dependencias JavaScript al navegador. Las dependencias de pnpm
se usan únicamente para desarrollo, optimización y validación.
Se usa el Java instalado: no hace falta ejecutar el postinstall de vnu-jar.

EDICIÓN
Editar las páginas españolas como fuente. No editar en/ directamente:
pnpm build regenera sus páginas, usando scripts/translations.json y
scripts/translation-details.json. No traduce las obras ni la transcripción
de terceros. Las interfaces y los textos alternativos sí están traducidos.
Editar public/css/styles*.css o refinements.css, después pnpm build.
No editar site.min.css: es generado. Se mantienen las familias tipográficas
Barlow Condensed e IBM Plex Sans, sus licencias y la paleta original.
OpenDyslexic es opcional y local. Sus cuatro WOFF2 originales y licencia SIL OFL
se conservan en public/fonts; opendyslexic-ORIGEN.json fija procedencia y hashes.
El botón Accesibilidad abre un diálogo flotante en las 19 rutas. Preferencias
guardadas solo en el navegador; no se contacta con ningún servicio de widgets.

DATOS DEL PERFIL
profile.pending.json contiene los datos confirmados por el autor y su CV:
socialProfiles: [{label:{es,en},url:'https://...'}]
education/experience: [{title:{es,en},organisation:{es,en},start,end,description:{es,en}}]
references: [{name,role:{es,en},contact:'https://...',publishPublicProfile:true}]
Los arrays vacíos no generan contenido ni enlaces vacíos. Al completar los
datos, ejecutar pnpm build, pnpm test y pnpm validate. publishPublicProfile
indica que el autor solicita enlazar el perfil profesional público, sin
afirmar que esa persona ha aportado un testimonio. No introducir datos privados.
El CV no se ofrece para descarga pública. Los datos seleccionados de
formación y experiencia se presentan en HTML accesible en español e inglés.

PUBLICACIÓN
Pages está configurado como Deploy from a branch, usando la raíz de
feat/mejoras-ux-accesibilidad. Cada push a esa rama actualiza el sitio.
main conserva la versión anterior. No es necesario borrar ninguna rama.
node_modules, test-results y .cache no se versionan ni forman parte del despliegue.
La raíz publicada incluye los archivos públicos del repositorio; no añadir
secretos ni datos privados al control de versiones.
VALIDACION.txt detalla pruebas, resultados y límites actuales.
`);
async function files(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['node_modules','validacion','test-results','.git','.cache'].includes(e.name)||e.name==='MANIFIESTO-SHA256.txt')continue;const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else out.push(p);}return out;}
const hashes=[];for(const file of (await files('.')).sort())hashes.push(createHash('sha256').update(await fs.readFile(file)).digest('hex')+'  '+file.replaceAll('\\','/'));
await fs.writeFile('MANIFIESTO-SHA256.txt',hashes.join('\n')+'\n');
console.log(`Informe actualizado: ${tests.stats.expected} pruebas, ${validation.results.map(r=>r.files+' '+r.type).join(', ')}; ${hashes.length} hashes.`);
