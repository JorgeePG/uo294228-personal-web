// Dos idiomas: enlaces nativos siempre visibles, sin menú que haya que descubrir.
// La versión activa se marca como actual y no vuelve a cargar la misma página.
export function languageSwitcher(current,href,{sharedTranscript=false}={}) {
 const english=current==='en';
 const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');
 const names={es:'Español',en:'English'};
 const options=['es','en'].map(lang=>lang===current
  ?`<span data-current-language lang="${lang}" aria-current="true">${names[lang]}</span>`
  :`<a data-language-link href="${escape(href)}" lang="${lang}" hreflang="${lang}"${sharedTranscript?' aria-describedby="language-transcript-note"':''}>${names[lang]}</a>`).join('');
 // La transcripción es un recurso único en inglés. No fingir una traducción:
 // su navegación española ofrece ir a la sección multimedia inglesa.
 const note=sharedTranscript?'<span class="visually-hidden" id="language-transcript-note">Abre la sección multimedia en inglés. Esta transcripción solo está disponible en inglés.</span>':'';
 return `<!-- language-switch --><div data-language role="group" aria-label="${english?'Language':'Idioma'}" lang="${current}"><span data-language-label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18"></path></svg>${english?'Language':'Idioma'}</span><div data-language-options>${options}</div>${note}</div><!-- /language-switch -->`;
}
