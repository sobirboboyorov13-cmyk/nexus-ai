/**
 * .env faylini ENG BIRINCHI yuklaydi.
 *
 * MUHIM: bu modul server.ts dagi barcha boshqa importlardan oldin turishi shart.
 * JavaScript importlarni birinchi bajaradi, shuning uchun dotenv.config() ni
 * server.ts ichiga yozish kech bo'lib qoladi — boshqa modullar process.env ni
 * bo'sh holda o'qib oladi (bot tokeni aynan shu sababdan ishlamagan edi).
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const joylar = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
];

let yuklandi = false;
for (const p of joylar) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    yuklandi = true;
    break;
  }
}
if (!yuklandi) dotenv.config();

export const ENV_READY = true;
