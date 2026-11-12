import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',workers:2,timeout:45000,use:{baseURL:'http://127.0.0.1:4173',channel:'chrome',headless:true},reporter:[['list'],['json',{outputFile:'validacion/revision-2026-11-12/playwright.json'}]],webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:true}});
