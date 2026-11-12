import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const images=['t90m','strela-10','su57','t72-museo','cultura/fury','cultura/top-gun-maverick','cultura/masters-of-the-air','cultura/war-thunder','cultura/world-of-tanks','cultura/il2-sturmovik','Jorge'];
const report=[];
for(const name of images){
 const file=`public/img/${name}.jpg`,input=await fs.readFile(file),poster=/fury|top-gun|masters-of/.test(name),portrait=name==='Jorge';
 const width=poster?640:portrait?400:960,height=poster?960:portrait?400:640;
 const original=path.resolve('.cache/original-images',file);await fs.mkdir(path.dirname(original),{recursive:true});
 try{await fs.writeFile(original,input,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
 const meta=await sharp(input).metadata();
 const buffer=meta.width===width&&meta.height===height?input:await sharp(input).rotate().resize(width,height,{fit:poster?'contain':'cover',background:'#111111'}).jpeg({quality:85}).toBuffer();
 await fs.writeFile(file,buffer);
 for(const w of [480,768,960])await sharp(buffer).resize(w,Math.round(w*height/width)).webp({quality:74}).toFile(`public/img/${name}-${w}.webp`);
 report.push({file,width,height,bytes:buffer.length});
}
const pages=['index.html',...['sobre-mi','intereses','multimedia','series-y-peliculas','videojuegos'].map(p=>p+'/index.html')];
for(const file of pages){let html=await fs.readFile(file,'utf8');for(const image of report){const basename=path.posix.basename(image.file);html=html.replace(/<img\b[^>]*>/g,tag=>tag.includes('/'+basename)?tag.replace(/width="\d+"/,`width="${image.width}"`).replace(/height="\d+"/,`height="${image.height}"`):tag);}await fs.writeFile(file,html);}
await fs.mkdir('validacion/revision-2026-11-12',{recursive:true});
await fs.writeFile('validacion/revision-2026-11-12/images.json',JSON.stringify(report,null,2));
