import {defineConfig} from '@playwright/test';
const scope=process.env.UX_REPORT_SCOPE||(process.argv.slice(2).join(' ')==='test'?'full':'partial');
const reportFile=process.env.UX_REPORT_FILE||`validacion/revision-2026-11-14-buscador/runs/playwright-${scope}-${new Date().toISOString().replace(/[:.]/g,'-')}-${process.pid}.json`;
export default defineConfig({testDir:'tests',workers:2,timeout:45000,metadata:{evidenceScope:scope},use:{baseURL:'http://127.0.0.1:4173',channel:'chrome',headless:true},reporter:[['list'],['json',{outputFile:reportFile}]],webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:true}});
