import fs from 'node:fs/promises';
import path from 'node:path';
const extensions=new Set(['.html','.css','.js','.mjs','.json','.txt','.yaml','.yml']);
async function visit(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(['.git','node_modules','validacion','test-results','.cache'].includes(entry.name))continue;const file=path.join(dir,entry.name);if(entry.isDirectory())await visit(file);else if(extensions.has(path.extname(file))){const original=await fs.readFile(file,'utf8');const normalized=original.replace(/^\uFEFF/,'').replaceAll('\r\n','\n');if(original!==normalized)await fs.writeFile(file,normalized);}}}
await visit('.');
