import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Nunca sobrescribir una suite con una selección: cada invocación conserva JSON
// íntegro, comando, alcance y hash. Los latest-*.json son solo punteros explícitos.
const args=process.argv.slice(2).filter(arg=>arg!=='--');
const scope=args.length?'partial':'full';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const directory=process.env.UX_EVIDENCE_DIR||'validacion/revision-2026-11-14-buscador';
await fs.mkdir(directory+'/runs',{recursive:true});
const reportFile=`${directory}/runs/playwright-${scope}-${stamp}-${process.pid}.json`;
const result=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test',...args],{
 stdio:'inherit',env:{...process.env,UX_REPORT_FILE:reportFile,UX_REPORT_SCOPE:scope}
});
try {
 const raw=await fs.readFile(reportFile,'utf8'), report=JSON.parse(raw);
 const evidence={schema:1,scope,command:['pnpm','test',...args].join(' '),finished:new Date().toISOString(),exitCode:result.status,report:path.posix.relative(directory,reportFile),sha256:createHash('sha256').update(raw).digest('hex'),stats:report.stats};
 await fs.writeFile(reportFile.replace(/\.json$/,'.metadata.json'),JSON.stringify(evidence,null,2)+'\n');
 await fs.writeFile(`${directory}/latest-${scope}.json`,JSON.stringify(evidence,null,2)+'\n');
 console.log(`Evidence (${scope}): ${reportFile}`);
} catch(error) {
 console.error('No usable test report: '+error.message);
 process.exitCode=1;
}
process.exitCode ||= result.status ?? 1;
