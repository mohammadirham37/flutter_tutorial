#!/usr/bin/env node
// Menyusun seluruh materi menjadi BUKU PDF siap baca dan siap cetak (B5, 176 x 250 mm).
//
// Sumber:
//   assets/js/modules-data.js   -> isi bab (hasil tools/build-modules.mjs)
//   book/book.json              -> judul, penulis, pembagian Bagian
//   book/rangkuman.json         -> rangkuman tiap bab
//   book/front/*.html           -> kata pengantar & pendahuluan
//   book/back/*.json            -> glosarium & daftar pustaka
//   assets/css/print-book.css   -> desain buku
//
// Hasil:
//   assets/pdf/buku-flutter-dart.pdf       -> buku lengkap dengan sampul depan & belakang (untuk dibaca digital)
//   assets/pdf/buku-flutter-dart-isi.pdf   -> isi buku saja tanpa sampul (untuk naik cetak)
//   assets/pdf/buku-flutter-dart-sampul.pdf-> sampul depan & belakang
//
// Jalankan:
//   node tools/build-modules.mjs && node tools/build-book.mjs
// Butuh Google Chrome dan Python 3 + PyMuPDF (pip install pymupdf).
// Opsi: --keep-html  menyimpan HTML perantara di folder sementara (untuk debug desain).
//       --only=<folder,...>  membuat buku contoh berisi bab tertentu saja (hasil ke folder sementara).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/pdf');
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flutter-book-'));
const keepHtml = process.argv.includes('--keep-html');
// --only=03-widget-dasar,08-getx  -> buku contoh berisi bab tertentu saja (untuk mencoba desain dengan cepat)
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);
const sample = process.argv.some((a) => a.startsWith('--only='));
const outBase = sample ? workDir : outDir;
const OUT = {
  full: path.join(outBase, 'buku-flutter-dart.pdf'),
  interior: path.join(outBase, 'buku-flutter-dart-isi.pdf'),
  cover: path.join(outBase, 'buku-flutter-dart-sampul.pdf'),
};

const chrome = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean).find((p) => fs.existsSync(p));
if (!chrome) { console.error('Google Chrome tidak ditemukan. Set variabel CHROME.'); process.exit(1); }
try { execFileSync('python3', ['-c', 'import fitz'], { stdio: 'ignore' }); } catch {
  console.error('Python 3 + PyMuPDF dibutuhkan: pip install pymupdf'); process.exit(1);
}

// ---------------------------------------------------------------- data
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/modules-data.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/cheatsheet-data.js'), 'utf8'), ctx);
const modules = ctx.window.FLUTTER_MODULES;
const cheat = ctx.window.FLUTTER_CHEATSHEET;
const book = readJson('book/book.json');
const rangkuman = readJson('book/rangkuman.json');
// Rangkuman tambahan per bab boleh ditulis terpisah: book/rangkuman-<folder>.json (array string HTML)
for (const f of fs.readdirSync(path.join(root, 'book'))) {
  const m = /^rangkuman-(.+)\.json$/.exec(f);
  if (m) rangkuman[m[1]] = readJson(`book/${f}`);
}
const glossary = readJson('book/back/glosarium.json');
const references = readJson('book/back/daftar-pustaka.json');
const byFolder = Object.fromEntries(modules.map((m) => [m.folder, m]));

const PART_COLORS = ['#1565c0', '#00897b', '#5b45c9', '#d9620b', '#c2185b', '#455a64', '#2e7d32'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

if (only.length) {
  book.parts = book.parts.map((p) => ({ ...p, chapters: p.chapters.filter((f) => only.includes(f)) })).filter((p) => p.chapters.length);
}

// Nomor bab berurutan mengikuti pembagian Bagian di book.json.
const chapters = [];
book.parts.forEach((part, pi) => {
  part.color = PART_COLORS[pi % PART_COLORS.length];
  part.roman = ROMAN[pi];
  part.id = `part-${pi + 1}`;
  part.chapters.forEach((folder) => {
    const mod = byFolder[folder];
    if (!mod) throw new Error(`book.json: modul ${folder} tidak ditemukan`);
    chapters.push({ no: chapters.length + 1, mod, part, id: `bab-${chapters.length + 1}` });
  });
});
const silabus = byFolder['00-silabus'];
const chapterOfModule = Object.fromEntries(chapters.map((c) => [c.mod.number, c])); // "11B" -> bab

// ---------------------------------------------------------------- teks: web -> buku
const ALLOWED = 'a|b|blockquote|br|code|div|em|h[1-6]|hr|i|img|kbd|li|mark|ol|p|pre|small|span|strong|sub|sup|table|tbody|td|th|thead|tr|u|ul|dl|dt|dd|section|svg|path|circle|rect|g|line|polyline|text';
const STRAY_LT = new RegExp(`<(?!\\/?(?:${ALLOWED})(?=[\\s>\\/])|!--)`, 'gi');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function babLabel(modNo, upper = false) {
  const key = modNo.toUpperCase();
  if (key === '00') return upper ? 'PENDAHULUAN' : 'Pendahuluan';
  const ch = chapterOfModule[key];
  if (!ch) return null;
  return `${upper ? 'BAB' : 'Bab'} ${ch.no}`;
}
function babNo(modNo) {
  const ch = chapterOfModule[modNo.toUpperCase()];
  return ch ? String(ch.no) : modNo;
}

// Mengganti rujukan "Modul 13", "Modul 13-14", "M11B", dsb. menjadi nomor bab buku.
function renumber(text) {
  return text
    .replace(/\b(Modul|MODUL|modul)\s+(\d{2}[bB]?)(?![\d])(?![.,]\d)(\s*(-|–|—|s\.d\.|sampai|dan|&amp;)\s*(?:Modul\s+)?(\d{2}[bB]?)\b)?/g,
      (m, word, a, rest, sep, b) => {
        const upper = word === 'MODUL';
        const la = babLabel(a, upper);
        if (!la) return m;
        if (!rest) return la;
        const joiner = sep === '-' || sep === '–' || sep === '—' ? '–' : ` ${sep} `;
        return `${la}${joiner}${babNo(b)}`;
      })
    .replace(/\bM(\d{2}[bB]?)\b(\s*[-–]\s*M(\d{2}[bB]?)\b)?/g, (m, a, rest, b) => {
      const la = babLabel(a);
      if (!la) return m;
      return rest ? `${la}–${babNo(b)}` : la;
    });
}

// Emoji/piktogram dekoratif tidak dipakai di buku cetak.
const DECOR = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{200D}]\s?/gu;
const KEEP = new Set(['✓', '✗', '✕']);
function wordFixes(text) {
  return text.replace(DECOR, (m) => (KEEP.has(m.trim()) ? m : ''))
    .replace(/\bweb tutorial\b/gi, 'buku')
    .replace(/\bdi web ini\b/gi, 'di buku ini')
    .replace(/\bantarmodul\b/g, 'antarbab')
    .replace(/\bModul\b/g, 'Bab').replace(/\bmodul\b/g, 'bab').replace(/\bMODUL\b/g, 'BAB')
    .replace(/\bSection\b/g, 'Subbab').replace(/\bsection\b/g, 'subbab')
    .replace(/\btab Kuis\b/g, 'bagian Uji Pemahaman').replace(/\btab Praktikum\b/g, 'bagian Latihan Praktikum');
}

// Ubah hanya teks (bukan tag); di dalam <pre> hanya rujukan nomor modul yang disesuaikan.
function toBookText(html) {
  const parts = String(html ?? '').split(/(<pre[\s\S]*?<\/pre>)/g);
  return parts.map((chunk) => {
    if (chunk.startsWith('<pre')) return renumber(chunk);
    return chunk.split(/(<[^>]+>)/g).map((t) => (t.startsWith('<') ? t : wordFixes(renumber(t)))).join('');
  }).join('');
}

const EMOJI = /^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]+/u;
function polish(html) {
  return toBookText(html)
    .replace(STRAY_LT, '&lt;')
    .replace(/(<div class="callout[^"]*">\s*<h4>)([^<]*)/g, (m, open, title) => open + title.replace(EMOJI, ''))
    .replace(/<code>([^<]*)<\/code>/g, (m, t) => `<code>${t.replace(/([a-z0-9_)])\.(?=[A-Za-z_])/g, '$1.<wbr>')}</code>`)
    .replace(/\s+loading="lazy"/g, '')
    .replace(/ target="_blank"/g, '').replace(/ rel="noopener"/g, '');
}
const inline = (s) => polish(s);

// Nomor gambar per bab: "Gambar 5.3"
function numberFigures(html, prefix, counter) {
  return html.replace(/<div class="screenshot-caption">/g, () => {
    counter.n += 1;
    return `<div class="screenshot-caption"><span class="fig-no">Gambar ${prefix}.${counter.n}</span>`;
  });
}

const stripNo = (t) => String(t).replace(/^\d+\.\s*/, '');
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ---------------------------------------------------------------- render: sampul
const authorNames = book.authors.map((a) => a.name);

// Tangkapan layar asli dari aplikasi yang dibangun di buku, disusun sebagai deretan ponsel di sampul.
const COVER_SHOTS = [
  '13-proyek-auth/login-awal.jpg',
  '06-list-scroll/grid-buku.jpg',
  '04-layouting/studi-kasus-dashboard-1.jpg',
  '01-pengenalan-flutter/halo-kampus-presensi.jpg',
  '10-local-storage/catatan-list.jpg',
];

function frontCover() {
  const [line1, line2] = book.title.includes(' dengan ')
    ? [book.title.slice(0, book.title.indexOf(' dengan ')), book.title.slice(book.title.indexOf(' dengan ') + 1)]
    : [book.title, ''];
  const phones = COVER_SHOTS.map((f, i) => `<div class="phone p${i + 1}"><img src="assets/img/screenshots/${f}" alt=""></div>`).join('');
  return `<section class="bleed-page cover">
  <div class="cover-top"><span>Buku Ajar Pemrograman Mobile</span><span>${esc(book.edition)} · ${book.year}</span></div>
  <div class="cover-title">
    <h1>${esc(line1)}${line2 ? `<em>${esc(line2)}</em>` : ''}</h1>
    <p class="cover-sub">${esc(book.subtitle)}</p>
    <div class="cover-authors">${authorNames.map(esc).join('<br>')}</div>
  </div>
  <div class="phones">${phones}</div>
</section>`;
}

function backCover() {
  const points = [
    'Menguasai Dart 3: null safety, OOP, records, dan pemrograman asinkron',
    'Membangun antarmuka Material 3 yang responsif dan bebas overflow',
    'Mengelola state dengan GetX berpola Model-View-Controller',
    'Mengambil data dari REST API dengan penanganan error yang rapi',
    'Menyimpan data lokal dengan SharedPreferences, SQLite, dan Hive',
    'Membangun backend dengan Supabase: Auth, RLS, dan Realtime',
    'Membangun dua proyek utuh: Data Mahasiswa dan Catatan Kuliah',
    'Mengakses kamera, GPS, sensor, biometrik, dan Bluetooth',
    'Menulis unit test dan widget test, lalu merilis APK/AAB',
  ];
  return `<section class="bleed-page back-cover"><div class="inner">
    <h2>Dari baris kode pertama hingga aplikasi yang siap dirilis.</h2>
    <p>Buku ini membimbing Anda membangun aplikasi mobile dengan Flutter dan Dart secara bertahap dan berurutan. Setiap konsep disertai contoh kode lengkap yang bisa langsung dijalankan, tangkapan layar hasilnya, serta penjelasan tentang kesalahan yang paling sering terjadi.</p>
    <p>${chapters.length} bab dalam ${book.parts.length} bagian mencakup fondasi bahasa Dart, antarmuka, navigasi, arsitektur MVC dengan GetX, data lokal dan cloud, integrasi hardware, hingga pengujian dan rilis. Setiap bab dilengkapi tujuan pembelajaran, rangkuman, latihan praktikum berrubrik, dan uji pemahaman, sehingga buku ini cocok sebagai buku ajar satu semester maupun panduan belajar mandiri.</p>
    <h3>Yang akan Anda kuasai</h3>
    <ul>${points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <div class="foot">
      <div class="names">${authorNames.map(esc).join('<br>')}</div>
      <div class="ed">${esc(book.edition)} · ${book.year}<br>${esc(book.audience)}</div>
    </div>
  </div></section>`;
}

// ---------------------------------------------------------------- render: halaman depan
function halfTitle() {
  return `<section class="half-title"><h1>${esc(book.title)}</h1><div class="rule"></div></section>`;
}

function titlePage() {
  return `<section class="title-page">
    <div class="top">
      <h1>${esc(book.title)}</h1>
      <p class="sub">${esc(book.subtitle)}</p>
      <div class="rule"></div>
      <div class="authors">${authorNames.map(esc).join('<br>')}</div>
    </div>
    <div class="bottom"><strong>${esc(book.edition)}</strong>${esc(book.city)} · ${book.year}</div>
  </section>`;
}

function copyrightPage() {
  return `<section class="copyright-page">
    <h3>${esc(book.title)}</h3>
    <table class="meta">
      <tr><td>Penulis</td><td>${authorNames.map(esc).join('<br>')}</td></tr>
      <tr><td>Edisi</td><td>${esc(book.edition)}, ${esc(book.month)} ${book.year}</td></tr>
      <tr><td>Ukuran</td><td>17,6 × 25 cm (B5)</td></tr>
      <tr><td>Isi</td><td>${chapters.length} bab dalam ${book.parts.length} bagian, 3 lampiran</td></tr>
    </table>
    <p>Hak cipta © ${book.year} ${authorNames.map(esc).join(' dan ')}.<br>Hak cipta dilindungi undang-undang. Dilarang memperbanyak sebagian atau seluruh isi buku ini dalam bentuk apa pun tanpa izin tertulis dari penulis, sesuai Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta.</p>
    <p>Flutter dan Dart adalah merek dagang Google LLC. Android adalah merek dagang Google LLC. iOS adalah merek dagang Apple Inc. Supabase, GetX, Hive, dan nama produk lain yang disebut dalam buku ini adalah milik pemiliknya masing-masing dan digunakan hanya untuk keperluan identifikasi. Buku ini tidak berafiliasi dengan, disponsori, atau didukung oleh pemilik merek tersebut.</p>
    <p>Penulis telah berupaya memastikan ketepatan informasi dan contoh kode di dalam buku ini. Namun, perangkat lunak terus berkembang, sehingga sebagian perintah atau versi package dapat berbeda pada saat Anda membacanya. Selalu periksa dokumentasi resmi bila menemui perbedaan.</p>
    <p>Huruf: Plus Jakarta Sans (Tokotype, SIL Open Font License), Source Serif 4, dan JetBrains Mono.</p>
  </section>`;
}

function fmHead(kicker, title, id) {
  return `<div class="fm-head" id="${id}"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><div class="bar"></div></div>`;
}

function kataPengantar() {
  const body = fs.readFileSync(path.join(root, 'book/front/kata-pengantar.html'), 'utf8');
  return `<section class="fm">${fmHead('', 'Kata Pengantar', 'kata-pengantar')}
    <div class="content-body">${body}</div>
    <div class="signature"><p>${esc(book.city)}, ${esc(book.month)} ${book.year}</p><p>Penulis,</p>
      <div class="names">${authorNames.map(esc).join('<br>')}</div></div>
  </section>`;
}

// Peta belajar (dipakai di Pendahuluan)
function roadmap() {
  return `<table class="roadmap"><thead><tr><th>Bagian</th><th>Bab</th></tr></thead><tbody>${book.parts.map((p) => `
    <tr><td class="part">Bagian ${p.roman}<span>${esc(p.title)}</span></td>
      <td>${chapters.filter((c) => c.part === p).map((c) => `${c.no}. ${esc(shortTitle(c))}`).join('<br>')}</td></tr>`).join('')}</tbody></table>`;
}

function shortTitle(c) {
  const map = {
    '01-pengenalan-flutter': 'Pengenalan Flutter', '02-bahasa-dart': 'Bahasa Dart',
    '03-widget-dasar': 'Widget Dasar', '04-layouting': 'Layout', '05-form-input': 'Form & Input',
    '06-list-scroll': 'List & Scroll', '07-navigasi': 'Navigasi', '08-getx': 'GetX & MVC',
    '09-rest-api': 'REST API', '10-local-storage': 'SharedPreferences & SQLite', '11-hive': 'Hive',
    '11b-hive-crud-mvc': 'Proyek CRUD Hive', '12-supabase': 'Supabase', '13-proyek-auth': 'Proyek: Autentikasi',
    '14-proyek-crud': 'Proyek: CRUD & Offline', '15-testing': 'Debugging & Testing', '16-build-rilis': 'Build & Rilis',
    '17-permission': 'Permission', '18-kamera': 'Kamera & Galeri', '19-lokasi-gps': 'GPS & Peta', '20-sensor': 'Sensor & Kompas',
    '21-biometrik': 'Biometrik', '22-konektivitas': 'Bluetooth & WiFi',
  };
  return map[c.mod.folder] || c.mod.badge;
}

function pendahuluan() {
  const hw = silabus.sections.find((s) => s.id === 'persiapan-hardware');
  const body = fs.readFileSync(path.join(root, 'book/front/pendahuluan.html'), 'utf8')
    .replace('{{PETA_BELAJAR}}', roadmap())
    .replace('{{PERSIAPAN_PERANGKAT}}', hw ? polish(hw.content) : '');
  return `<section class="fm chapter" id="pendahuluan" style="--c:var(--accent)">${fmHead('', 'Pendahuluan', 'pendahuluan-h')}
    <div class="content-body">${body}</div></section>`;
}

// ---------------------------------------------------------------- render: daftar isi
// Entri daftar isi. pageOf(id) mengembalikan label halaman (pass 1: placeholder).
const tocEntries = []; // {id, level, title} untuk outline PDF
function tocLink(id, label, cls, pageOf, no = '') {
  return `<div class="${cls}"><a href="#${id}">${no ? `<span class="no">${no}</span>` : ''}<span class="t">${label}</span><span class="fill"></span><span class="pg">${pageOf(id)}</span></a></div>`;
}

function tableOfContents(pageOf) {
  const rows = [];
  rows.push(tocLink('kata-pengantar', 'Kata Pengantar', 't-front', pageOf));
  rows.push(tocLink('pendahuluan', 'Pendahuluan', 't-front', pageOf));
  for (const part of book.parts) {
    rows.push(`<div class="t-part" style="background:${part.color}"><a href="#${part.id}"><span class="t">Bagian ${part.roman} · ${esc(part.title)}</span><span class="fill"></span><span class="pg">${pageOf(part.id)}</span></a></div>`);
    for (const c of chapters.filter((x) => x.part === part)) {
      rows.push(`<div style="--c:${part.color}">${tocLink(c.id, esc(stripNo(c.mod.title)), 't-chap', pageOf, `Bab ${c.no}`)}`);
      c.mod.sections.forEach((s, i) => rows.push(tocLink(`${c.id}-${i + 1}`, inline(stripNo(s.title)), 't-sec', pageOf, `${c.no}.${i + 1}`)));
      rows.push(tocLink(`${c.id}-akhir`, 'Rangkuman, Latihan Praktikum &amp; Uji Pemahaman', 't-sec extra', pageOf, ''));
      rows.push('</div>');
    }
  }
  rows.push('<div style="height:5mm"></div>');
  rows.push(tocLink('lampiran-a', 'Lampiran A · Kunci Jawaban Uji Pemahaman', 't-front', pageOf));
  rows.push(tocLink('lampiran-b', 'Lampiran B · Ringkasan Perintah &amp; Sintaks', 't-front', pageOf));
  rows.push(tocLink('lampiran-c', 'Lampiran C · Panduan Pengajar: RPS &amp; Penilaian', 't-front', pageOf));
  rows.push(tocLink('glosarium', 'Glosarium', 't-front', pageOf));
  rows.push(tocLink('daftar-pustaka', 'Daftar Pustaka', 't-front', pageOf));
  rows.push(tocLink('tentang-penulis', 'Tentang Penulis', 't-front', pageOf));
  return `<section class="fm" id="daftar-isi">${fmHead('', 'Daftar Isi', 'daftar-isi-h')}<nav class="toc">${rows.join('\n')}</nav></section>`;
}

// ---------------------------------------------------------------- render: bagian & bab
function partPage(part) {
  const list = chapters.filter((c) => c.part === part);
  return `<section class="bleed-page part-page" id="${part.id}" style="--c:${part.color}">
    <div class="inner">
      <div class="kicker">Bagian</div>
      <div class="num">${part.roman}</div>
      <h1>${esc(part.title)}</h1>
      <p>${esc(part.description)}</p>
      <ol>${list.map((c) => `<li><span>Bab ${c.no}</span>${esc(stripNo(c.mod.title))}</li>`).join('')}</ol>
    </div></section>`;
}

function prerequisites(list) {
  return (list || []).map((p) => {
    const m = /^Modul\s+(\d{2}[bB]?)\b/.exec(p);
    if (!m) return esc(p);
    if (m[1] === '00') return 'Pendahuluan';
    const ch = chapterOfModule[m[1].toUpperCase()];
    return ch ? `Bab ${ch.no}: ${esc(shortTitle(ch))}` : esc(p);
  }).join('<br>');
}

function duration(d) {
  const m = /(\d+)\s*Menit/i.exec(d || '');
  return m ? `± ${m[1]} menit tatap muka${/mandiri/i.test(d) ? ' + belajar mandiri' : ''}` : esc(d);
}

function chapterHtml(c) {
  const { mod, no, part } = c;
  const fig = { n: 0 };
  const sections = mod.sections.map((s, i) => `
    <section class="section${i === 0 ? ' first-section' : ''}" id="${c.id}-${i + 1}">
      <h2 class="sec-title"><span class="no">${no}.${i + 1}</span><span>${inline(stripNo(s.title))}</span></h2>
      <div class="content-body">${numberFigures(polish(s.content), no, fig)}</div>
    </section>`).join('');

  const lab = mod.labAssignment;
  const quiz = mod.quiz || [];
  const sum = rangkuman[mod.folder] || [];
  const labTitle = lab ? lab.title.replace(/^Praktikum\s+\w+\s*:\s*/i, '') : '';

  return `<article class="chapter" style="--c:${part.color}">
  <section class="bleed-page chapter-opener" id="${c.id}">
    <div class="head"><div class="kicker">Bagian ${part.roman} · ${esc(part.title)}</div>
      <div class="big">Bab ${no}</div><h1>${esc(stripNo(mod.title))}</h1></div>
    <div class="body">
      <p class="summary">${inline(mod.summary)}</p>
      <table class="meta">
        <tr><th>Prasyarat</th><td>${prerequisites(mod.prerequisites)}</td></tr>
        <tr><th>Estimasi waktu</th><td>${duration(mod.duration)}</td></tr>
      </table>
      <h2 class="obj">Tujuan Pembelajaran</h2>
      <p style="font-size:8.8pt;margin:0 0 2mm;text-align:left">Setelah mempelajari bab ini, Anda diharapkan mampu:</p>
      <ol class="outcomes">${(mod.learningOutcomes || []).map((o) => `<li>${inline(o)}</li>`).join('')}</ol>
    </div>
  </section>
  ${sections}
  <section class="end-block" id="${c.id}-akhir">
    ${sum.length ? `<h2 class="end-title">Rangkuman Bab ${no}</h2>
    <div class="summary-box"><ul>${sum.map((s) => `<li>${inline(s)}</li>`).join('')}</ul></div>` : ''}
    ${lab ? `<h2 class="end-title">Latihan Praktikum Bab ${no}</h2>
    <div class="lab-card">
      <h3>${inline(labTitle)}</h3>
      <div class="objective"><strong>Sasaran:</strong> ${inline(lab.objective)}</div>
      <h4>Langkah Pengerjaan</h4>
      <ol class="steps">${lab.instructions.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>
      <h4>Hasil yang Diharapkan</h4><p>${inline(lab.expectedOutput)}</p>
      <h4>Rubrik Penilaian</h4><p>${inline(lab.rubric)}</p>
    </div>` : ''}
    ${quiz.length ? `<h2 class="end-title">Uji Pemahaman Bab ${no}</h2>
    <p style="text-align:left">Pilihlah satu jawaban yang paling tepat.</p>
    ${quiz.map((q, i) => `<div class="quiz-item">
      <p class="quiz-q"><span class="n">${i + 1}.</span><span>${inline(q.question)}</span></p>
      <ol class="quiz-options">${q.options.map((o, j) => `<li><b>${LETTERS[j]}.</b><span>${inline(esc(o).replace(/&lt;(\/?code)&gt;/g, '<$1>'))}</span></li>`).join('')}</ol>
    </div>`).join('')}
    <p class="quiz-note">Kunci jawaban dan pembahasan: Lampiran A.</p>` : ''}
  </section>
</article>`;
}

// ---------------------------------------------------------------- render: lampiran & bagian belakang
function appendixHead(letter, title, id) {
  return `<div class="fm-head" id="${id}"><div class="kicker">Lampiran ${letter}</div><h1>${esc(title)}</h1><div class="bar"></div></div>`;
}

function appendixA() {
  return `<section class="fm appendix">${appendixHead('A', 'Kunci Jawaban Uji Pemahaman', 'lampiran-a')}
  <p class="lead">Cobalah menjawab seluruh soal terlebih dahulu sebelum membuka halaman ini. Pembahasan setiap jawaban menjelaskan <em>mengapa</em> pilihan tersebut benar, sehingga tetap bermanfaat dibaca meskipun jawaban Anda sudah tepat.</p>
  ${chapters.map((c) => `<div class="answer-chap" style="--c:${c.part.color}">
    <h3>Bab ${c.no} · ${esc(stripNo(c.mod.title))}</h3>
    ${(c.mod.quiz || []).map((q, i) => `<div class="answer"><span class="key">${i + 1}. ${LETTERS[q.correctIndex]}</span><p>${inline(q.explanation)}</p></div>`).join('')}
  </div>`).join('')}
  </section>`;
}

function appendixB() {
  const cli = cheat.cli.map((c) => `<tr><td><code>${esc(c.command)}</code></td><td>${inline(c.description)}</td></tr>`).join('');
  const vs = cheat.vscode.map((c) => `<tr><td><kbd>${esc(c.shortcutMac)}</kbd></td><td><kbd>${esc(c.shortcutWin)}</kbd></td><td>${inline(c.action)}</td></tr>`).join('');
  const dart = cheat.dartSyntax.map((d) => `<div class="cheat-card"><h4>${esc(d.title)}</h4><p>${inline(d.desc)}</p><pre><code class="language-dart">${esc(d.code)}</code></pre></div>`).join('');
  const widgets = cheat.widgetCategory.map((w) => `<div class="widget-cat"><b>${esc(w.category)}</b><div class="chips">${(w.widgets || []).map((x) => `<code>${esc(typeof x === 'string' ? x : x.name)}</code>`).join(' ')}</div></div>`).join('');
  return `<section class="fm appendix chapter" style="--c:var(--accent)">${appendixHead('B', 'Ringkasan Perintah & Sintaks', 'lampiran-b')}
  <p class="lead">Halaman-halaman ini dirancang sebagai rujukan cepat di samping komputer saat Anda menulis kode.</p>
  <h2 class="sec-title"><span class="no">B.1</span><span>Perintah Flutter CLI</span></h2>
  <div class="table-responsive"><table class="table-custom"><thead><tr><th style="width:44%">Perintah</th><th>Fungsi</th></tr></thead><tbody>${cli}</tbody></table></div>
  <h2 class="sec-title" style="margin-top:7mm"><span class="no">B.2</span><span>Pintasan VS Code</span></h2>
  <div class="table-responsive"><table class="table-custom"><thead><tr><th>macOS</th><th>Windows/Linux</th><th>Aksi</th></tr></thead><tbody>${vs}</tbody></table></div>
  <h2 class="sec-title" style="margin-top:7mm"><span class="no">B.3</span><span>Sintaks Dart yang Sering Dipakai</span></h2>
  <div class="cheat-grid">${dart}</div>
  <h2 class="sec-title" style="margin-top:7mm"><span class="no">B.4</span><span>Peta Widget Berdasarkan Kategori</span></h2>
  ${widgets}
  </section>`;
}

function appendixC() {
  const pick = ['rps-overview', 'silabus-jadwal-pertemuan', 'penilaian-kontrak'];
  const secs = pick.map((id) => silabus.sections.find((s) => s.id === id)).filter(Boolean);
  return `<section class="fm appendix chapter" style="--c:var(--accent)">${appendixHead('C', 'Panduan Pengajar: RPS & Penilaian', 'lampiran-c')}
  <p class="lead">Lampiran ini ditujukan bagi dosen dan pengajar yang memakai buku ini sebagai buku ajar mata kuliah Pemrograman Mobile satu semester. Seluruh komponen dapat disesuaikan dengan kurikulum masing-masing institusi.</p>
  ${secs.map((s, i) => `<section class="section"><h2 class="sec-title"><span class="no">C.${i + 1}</span><span>${inline(stripNo(s.title))}</span></h2>
    <div class="content-body">${polish(s.content)}</div></section>`).join('')}
  </section>`;
}

function glossaryPage() {
  const sorted = [...glossary].sort((a, b) => a[0].localeCompare(b[0], 'id', { sensitivity: 'base' }));
  let letter = '';
  const items = sorted.map(([term, def]) => {
    const L = term[0].toUpperCase();
    const head = L !== letter ? `<div class="letter">${(letter = L)}</div>` : '';
    return `${head}<dt>${esc(term)}</dt><dd>${inline(def)}</dd>`;
  }).join('');
  return `<section class="fm">${fmHead('', 'Glosarium', 'glosarium')}<dl class="glossary">${items}</dl></section>`;
}

function referencesPage() {
  const linkify = (s) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  return `<section class="fm">${fmHead('', 'Daftar Pustaka', 'daftar-pustaka')}
    <ol class="refs">${references.map((r) => `<li>${linkify(r)}</li>`).join('')}</ol></section>`;
}

function authorsPage() {
  return `<section class="fm">${fmHead('', 'Tentang Penulis', 'tentang-penulis')}
    ${book.authors.map((a) => `<div class="author-card"><h3>${esc(a.name)}</h3>${a.bio ? `<p>${inline(a.bio)}</p>` : ''}</div>`).join('')}
  </section>`;
}

// ---------------------------------------------------------------- dokumen HTML
function documentHtml(title, body) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<base href="${pathToFileURL(root + '/').href}">
<title>${esc(title)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/print-book.css">
</head>
<body class="book">
${body}
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
${['dart', 'bash', 'yaml', 'json', 'kotlin', 'properties', 'sql', 'groovy'].map((l) => `<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${l}.min.js"></script>`).join('\n')}
<script>window.Prism && Prism.highlightAll();</script>
</body>
</html>`;
}

// Halaman kosong disisipkan sebelum bagian yang harus dimulai di halaman kanan (lihat RECTO_IDS).
let blanksBefore = new Set();
const blank = (id) => (blanksBefore.has(id) ? '<div class="blank-page"></div>' : '');

function interiorHtml(pageOf) {
  return documentHtml(book.title, [
    halfTitle(), '<div class="blank-page"></div>', titlePage(), copyrightPage(),
    blank('kata-pengantar') + kataPengantar(), blank('daftar-isi') + tableOfContents(pageOf),
    blank('pendahuluan') + pendahuluan(),
    ...book.parts.flatMap((p) => [blank(p.id) + partPage(p), ...chapters.filter((c) => c.part === p).map((c) => blank(c.id) + chapterHtml(c))]),
    blank('lampiran-a') + appendixA(), appendixB(), appendixC(), blank('glosarium') + glossaryPage(), referencesPage(), authorsPage(),
  ].join('\n'));
}

// ---------------------------------------------------------------- Chrome & PyMuPDF
function printPdf(htmlFile, pdfFile) {
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files',
    '--run-all-compositor-stages-before-draw', '--virtual-time-budget=45000',
    `--print-to-pdf=${pdfFile}`, pathToFileURL(htmlFile).href,
  ], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 900000 });
  if (!fs.existsSync(pdfFile) || fs.statSync(pdfFile).size < 1000) throw new Error(`Gagal membuat ${pdfFile}`);
}

function python(script, args) {
  const file = path.join(workDir, 'step.py');
  fs.writeFileSync(file, script);
  return execFileSync('python3', [file, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 1800000 });
}

// Membaca halaman tujuan setiap tautan internal di halaman daftar isi -> {id: pageIndex}
// Membaca halaman tujuan setiap tautan internal (Chrome menyimpannya sebagai named destination) -> {id: pageIndex}
const READ_LINKS = `
import fitz, json, sys
doc = fitz.open(sys.argv[1])
dest = {}
for page in doc:
    for l in page.get_links():
        name = l.get('nameddest')
        tgt = l.get('page', -1)
        if name and tgt is not None and tgt >= 0:
            dest[name] = tgt
print(json.dumps({'pages': doc.page_count, 'dest': dest}))
`;

function resolveLinkTargets(pdfFile, tocIds) {
  const out = JSON.parse(python(READ_LINKS, [pdfFile]));
  const missing = tocIds.filter((id) => out.dest[id] === undefined);
  if (missing.length) throw new Error(`Halaman untuk entri daftar isi tidak ditemukan: ${missing.slice(0, 5).join(', ')}`);
  return { pageCount: out.pages, map: out.dest };
}

// ---------------------------------------------------------------- build
fs.mkdirSync(outDir, { recursive: true });
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`);

// Daftar id daftar isi sesuai urutan kemunculan
const tocIds = [];
tableOfContents((id) => { tocIds.push(id); return ''; });
const outlineMeta = buildOutlineMeta();

// Pass 1: nomor halaman sementara (lebar sama agar tata letak daftar isi tidak bergeser)
const html1 = path.join(workDir, 'isi-1.html');
const pdf1 = path.join(workDir, 'isi-1.pdf');
fs.writeFileSync(html1, interiorHtml(() => '000'));
log('Render pass 1 (menghitung halaman)...');
printPdf(html1, pdf1);
const pass1 = resolveLinkTargets(pdf1, tocIds);
// Bab, Bagian, dan bagian utama selalu dimulai di halaman kanan (indeks genap; halaman isi pertama = kanan).
// Setiap halaman kosong yang disisipkan menggeser halaman sesudahnya satu langkah.
const RECTO_IDS = ['kata-pengantar', 'pendahuluan', ...book.parts.flatMap((p) => [p.id, ...chapters.filter((c) => c.part === p).map((c) => c.id)]), 'lampiran-a', 'glosarium'];
{
  let shift = 0;
  const anchors = Object.entries(pass1.map).sort((a, b) => a[1] - b[1]);
  const shiftAt = [];
  for (const id of RECTO_IDS) {
    const p = pass1.map[id] + shift;
    if (p % 2 === 1) { blanksBefore.add(id); shift += 1; }
    shiftAt.push([pass1.map[id], shift]);
  }
  // Petakan halaman pass 1 ke halaman setelah penyisipan halaman kosong
  for (const [id, pg] of anchors) {
    let s = 0;
    for (const [start, sh] of shiftAt) if (pg >= start) s = sh;
    pass1.map[id] = pg + s;
  }
}
const mainStart = pass1.map.pendahuluan;
const label = (idx) => (idx >= mainStart ? String(idx - mainStart + 1) : toRoman(idx + 1).toLowerCase());
log(`Pass 1: ${pass1.pageCount} halaman, isi utama mulai di halaman ke-${mainStart + 1}`);

// Pass 2: nomor halaman sebenarnya
const html2 = path.join(workDir, 'isi-2.html');
const pdf2 = path.join(workDir, 'isi-2.pdf');
fs.writeFileSync(html2, interiorHtml((id) => label(pass1.map[id])));
log('Render pass 2 (nomor halaman final)...');
printPdf(html2, pdf2);
const pass2 = resolveLinkTargets(pdf2, tocIds);
const drift = tocIds.filter((id) => pass2.map[id] !== pass1.map[id]);
if (drift.length) console.warn(`Peringatan: ${drift.length} entri bergeser antar-pass (contoh: ${drift.slice(0, 3).join(', ')})`);

// Sampul
const coverHtml = path.join(workDir, 'sampul.html');
const coverPdf = path.join(workDir, 'sampul.pdf');
fs.writeFileSync(coverHtml, documentHtml('Sampul', frontCover() + backCover()));
log('Render sampul...');
printPdf(coverHtml, coverPdf);

// Header, footer, nomor halaman, bookmark, metadata
const pages = pass2.map;
const plan = {
  mainStart,
  pageCount: pass2.pageCount,
  title: book.shortTitle || book.title,
  author: authorNames.join(', '),
  subject: book.subtitle,
  partCount: book.parts.length,
  font: path.join(root, 'book/fonts/PlusJakartaSans-Medium.ttf'),
  fontBold: path.join(root, 'book/fonts/PlusJakartaSans-Bold.ttf'),
  // halaman tanpa header/footer: halaman judul s.d. hak cipta, pemisah bagian, pembuka bab
  noDecor: [...book.parts.map((p) => pages[p.id]), ...chapters.map((c) => pages[c.id])],
  // penanda wilayah: [halamanMulai, teksKiri, teksKanan, warna]
  regions: buildRegions(pages),
  outline: outlineMeta.map(([lvl, title, id]) => [lvl, title, pages[id] ?? null]),
  out: { full: OUT.full, interior: OUT.interior, cover: OUT.cover },
  interior: pdf2,
  cover: coverPdf,
};
fs.writeFileSync(path.join(workDir, 'plan.json'), JSON.stringify(plan));
log('Menambahkan header, footer, bookmark & mengompres PDF...');
execFileSync('python3', [path.join(root, 'tools/book_finish.py'), path.join(workDir, 'plan.json')], { stdio: 'inherit', timeout: 1800000 });

const mb = (f) => `${(fs.statSync(f).size / 1048576).toFixed(1)} MB`;
log(`OK  ${path.relative(root, OUT.full)} (${mb(OUT.full)}, ${pass2.pageCount + 2} halaman)`);
log(`OK  ${path.relative(root, OUT.interior)} (${mb(OUT.interior)})`);
log(`OK  ${path.relative(root, OUT.cover)} (${mb(OUT.cover)})`);
if (keepHtml || sample) console.log(`Folder kerja: ${workDir}`); else fs.rmSync(workDir, { recursive: true, force: true });

// ---------------------------------------------------------------- helper
function toRoman(n) {
  const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
  return s;
}

function plain(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function buildOutlineMeta() {
  const o = [[1, 'Kata Pengantar', 'kata-pengantar'], [1, 'Daftar Isi', 'daftar-isi-h'], [1, 'Pendahuluan', 'pendahuluan']];
  for (const part of book.parts) {
    o.push([1, `Bagian ${part.roman} · ${part.title}`, part.id]);
    for (const c of chapters.filter((x) => x.part === part)) {
      o.push([2, `Bab ${c.no}  ${plain(stripNo(c.mod.title))}`, c.id]);
      c.mod.sections.forEach((s, i) => o.push([3, `${c.no}.${i + 1}  ${plain(toBookText(stripNo(s.title)))}`, `${c.id}-${i + 1}`]));
      o.push([3, 'Rangkuman, Latihan & Uji Pemahaman', `${c.id}-akhir`]);
    }
  }
  o.push([1, 'Lampiran A · Kunci Jawaban', 'lampiran-a'], [1, 'Lampiran B · Ringkasan Perintah & Sintaks', 'lampiran-b'],
    [1, 'Lampiran C · Panduan Pengajar', 'lampiran-c'], [1, 'Glosarium', 'glosarium'],
    [1, 'Daftar Pustaka', 'daftar-pustaka'], [1, 'Tentang Penulis', 'tentang-penulis']);
  // Semua id di atas harus ada di daftar isi agar halamannya diketahui
  return o; // 'daftar-isi-h' tidak ada di daftar isi; halamannya diisi oleh book_finish.py
}

function buildRegions(pg) {
  // [halamanMulai, header halaman kiri (judul bab), header halaman kanan (judul subbab), warna, indeks tab tepi (-1 = tanpa)]
  const r = [];
  const blue = '#1565c0';
  const add = (id, left, right, color, tab = -1) => { if (pg[id] !== undefined) r.push([pg[id], left, right, color, tab]); };
  add('kata-pengantar', 'Kata Pengantar', 'Kata Pengantar', blue);
  add('pendahuluan', 'Pendahuluan', 'Pendahuluan', blue);
  for (const c of chapters) {
    const chap = `Bab ${c.no} · ${plain(stripNo(c.mod.title))}`;
    const tab = book.parts.indexOf(c.part);
    add(c.id, chap, chap, c.part.color, tab);
    c.mod.sections.forEach((s, i) => add(`${c.id}-${i + 1}`, chap, `${c.no}.${i + 1}  ${plain(toBookText(stripNo(s.title)))}`, c.part.color, tab));
    add(`${c.id}-akhir`, chap, 'Rangkuman, Latihan & Uji Pemahaman', c.part.color, tab);
  }
  add('lampiran-a', 'Lampiran A', 'Kunci Jawaban Uji Pemahaman', blue);
  add('lampiran-b', 'Lampiran B', 'Ringkasan Perintah & Sintaks', blue);
  add('lampiran-c', 'Lampiran C', 'Panduan Pengajar: RPS & Penilaian', blue);
  add('glosarium', 'Glosarium', 'Glosarium', blue);
  add('daftar-pustaka', 'Daftar Pustaka', 'Daftar Pustaka', blue);
  add('tentang-penulis', 'Tentang Penulis', 'Tentang Penulis', blue);
  // Wilayah "Daftar Isi" ditambahkan di book_finish.py (halaman pertama yang memuat tautan internal).
  return r.sort((a, b) => a[0] - b[0]);
}
