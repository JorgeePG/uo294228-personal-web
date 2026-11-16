import {test,expect} from '@playwright/test';

test('zero results offers a keyboard route to the site map in both languages',async({page})=>{
 const observed=[];
 for(const locale of ['', 'en/']){
  await page.goto('/'+locale+'buscar/?q=terminoinexistentexyz');
  const status=page.locator('[data-results-status]'),recovery=page.locator('[data-search-recovery] a');
  await expect(status).toContainText(locale?'No results':'Sin resultados');
  await expect(recovery).toBeVisible();
  const message=await status.textContent();
  await page.locator('#consulta').fill(locale?'aircraft':'aviones');
  await page.locator('#consulta').press('Enter');
  await expect(page.locator('[data-results] a').first()).toBeVisible();
  await expect(recovery).not.toBeVisible();
  await page.locator('#consulta').fill('terminoinexistentexyz');await page.locator('#consulta').press('Enter');
  await expect(recovery).toBeVisible();await recovery.focus();await page.keyboard.press('Enter');
  await expect(page.locator('main h1')).toHaveText(locale?'Help and site map':'Ayuda y mapa del sitio');
  observed.push({locale:locale||'es',message,recoveryURL:page.url()});
 }
 await test.info().attach('observed.json',{body:Buffer.from(JSON.stringify(observed,null,2)),contentType:'application/json'});
});

test('404 offers working home and help recovery links',async({page})=>{
 for(const locale of ['', 'en/']){
  await page.goto('/'+locale+'404.html');
  const main=page.locator('main');
  await expect(main.getByRole('heading',{level:1})).toHaveText(locale?'This page does not exist.':'Esta página no existe.');
  await main.getByRole('link',{name:locale?'View the site map':'Consultar el mapa del sitio'}).click();
  await expect(page.locator('[data-search-guidance]')).toBeVisible();
  await page.goto('/'+locale+'404.html');await page.locator('main').getByRole('link',{name:locale?'Return home':'Volver al inicio'}).click();
  await expect(page.locator('body')).toHaveAttribute('id','inicio');
 }
});

test('help and contact remain readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();const observed=[];
 for(const locale of ['', 'en/']){
  await page.goto('http://127.0.0.1:4173/'+locale+'ayuda/');
  const main=page.locator('main');
  await expect(main.getByRole('heading',{name:locale?'How to search':'Cómo buscar',exact:true})).toBeVisible();
  await expect(main).toContainText(locale?'Retry search':'Reintentar búsqueda');
  await expect(main.getByRole('link',{name:'uo294228@uniovi.es',exact:true})).toHaveAttribute('href','mailto:uo294228@uniovi.es');
  await page.goto('http://127.0.0.1:4173/'+locale+'sobre-mi/');
  const email=page.locator('main a[href="mailto:jorgepq20018@gmail.com"]');
  await expect(email).toBeVisible();
  const linkedin=page.locator('footer a').filter({hasText:/^LinkedIn$/});
  await expect(linkedin).toBeVisible();
  const address=new URL(await linkedin.getAttribute('href'));
  expect(address.protocol).toBe('https:');expect(address.hostname).toBe('www.linkedin.com');
  expect(decodeURIComponent(address.pathname)).toBe('/in/jorge-puente-garcía');
  observed.push({locale:locale||'es',professionalEmail:await email.textContent(),linkedin:address.href,scope:'Enlaces y contenido visibles comprobados; no se ha enviado correo ni autenticado en LinkedIn'});
 }
 await test.info().attach('observed-contact.json',{body:Buffer.from(JSON.stringify(observed,null,2)),contentType:'application/json'});
 await context.close();
});
