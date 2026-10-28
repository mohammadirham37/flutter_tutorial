#!/usr/bin/env node
// Menyusun seluruh materi di folder content/ menjadi assets/js/modules-data.js.
//
// Struktur sumber:
//   content/<NN>-<slug>/module.json   -> metadata modul, praktikum, kuis, daftar section
//   content/<NN>-<slug>/<file>.html   -> isi tiap section (HTML biasa, kode di <pre><code>)
//
// Urutan modul mengikuti awalan angka nama folder, dan nomor modul yang tampil
// di web diambil dari awalan itu. Jalankan setelah mengubah isi folder content/:
//   node tools/build-modules.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const outFile = path.join(root, 'assets/js/modules-data.js');

const errors = [];
const seenIds = new Set();

const folders = fs.readdirSync(contentDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
  .map((d) => d.name)
  .sort();

const modules = folders.map((folder) => {
  const dir = path.join(contentDir, folder);
  const where = `content/${folder}`;
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'module.json'), 'utf8'));

  if (seenIds.has(meta.id)) errors.push(`${where}: id modul "${meta.id}" dipakai lebih dari sekali`);
  seenIds.add(meta.id);

  const sectionIds = new Set();
  const sections = (meta.sections || []).map((sec) => {
    if (sectionIds.has(sec.id)) errors.push(`${where}: id section "${sec.id}" duplikat`);
    sectionIds.add(sec.id);
    const file = path.join(dir, sec.file);
    if (!fs.existsSync(file)) {
      errors.push(`${where}: file section "${sec.file}" tidak ditemukan`);
      return { id: sec.id, title: sec.title, content: '' };
    }
    const content = fs.readFileSync(file, 'utf8');
    const opened = (content.match(/<pre\b/g) || []).length;
    const closed = (content.match(/<\/pre>/g) || []).length;
    if (opened !== closed) errors.push(`${where}/${sec.file}: jumlah <pre> (${opened}) dan </pre> (${closed}) tidak sama`);
    return { id: sec.id, title: sec.title, content: '\n' + content };
  });

  (meta.quiz || []).forEach((q, i) => {
    if (!(q.correctIndex >= 0 && q.correctIndex < q.options.length)) {
      errors.push(`${where}: kuis nomor ${i + 1} memiliki correctIndex di luar jumlah opsi`);
    }
  });

  return { id: meta.id, number: folder.slice(0, 2), folder, pdf: `assets/pdf/${folder}.pdf`, ...meta, sections };
});

if (errors.length) {
  console.error('Build dibatalkan:\n- ' + errors.join('\n- '));
  process.exit(1);
}

const banner = `// FILE INI DIHASILKAN OTOMATIS oleh tools/build-modules.mjs. Jangan diedit langsung.
// Ubah materi di folder content/, lalu jalankan: node tools/build-modules.mjs
`;
fs.writeFileSync(outFile, `${banner}\nwindow.FLUTTER_MODULES = ${JSON.stringify(modules, null, 2)};\n`);
console.log(`OK: ${modules.length} modul ditulis ke ${path.relative(root, outFile)}`);
