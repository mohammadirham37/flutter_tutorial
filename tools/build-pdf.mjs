#!/usr/bin/env node
// Membuat versi PDF materi dari assets/js/modules-data.js memakai Google Chrome headless.
//
// Hasil:
//   assets/pdf/<NN>-<slug>.pdf          -> satu PDF per modul
//   assets/pdf/modul-flutter-lengkap.pdf -> seluruh modul dalam satu buku
//
// Jalankan setelah build materi:
//   node tools/build-modules.mjs && node tools/build-pdf.mjs
// Opsi:
//   --only=11-hive   hanya membuat PDF modul tertentu (boleh dipisah koma)
//   --no-book        tidak membuat PDF buku lengkap
//   CHROME=/path/ke/chrome untuk mengganti lokasi Chrome.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/pdf');
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flutter-tutorial-pdf-'));

const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);
const withBook = !args.includes('--no-book');

const chromeCandidates = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const chrome = chromeCandidates.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('Google Chrome tidak ditemukan. Set variabel CHROME ke lokasi executable Chrome.');
  process.exit(1);
}

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/modules-data.js'), 'utf8'), ctx);
const modules = ctx.window.FLUTTER_MODULES;

// Sama dengan app.js: '<' yang bukan tag HTML yang diizinkan (misal List<String>) di-escape.
const ALLOWED_HTML_TAGS = 'a|b|blockquote|br|code|div|em|h[1-6]|hr|i|img|kbd|li|mark|ol|p|pre|small|span|strong|sub|sup|table|tbody|td|th|thead|tr|u|ul';
const STRAY_LT_REGEX = new RegExp(`<(?!\\/?(?:${ALLOWED_HTML_TAGS})(?=[\\s>\\/])|!--)`, 'gi');
const html = (s) => String(s ?? '').replace(STRAY_LT_REGEX, '&lt;');
const text = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const generatedAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function renderModule(mod) {
  const lab = mod.labAssignment;
  const quiz = mod.quiz || [];
  return `
<article class="module">
  <header class="module-cover">
    <div class="cover-kicker">Modul ${mod.number} · ${text(mod.badge)}</div>
    <h1>${html(mod.title)}</h1>
    <p class="cover-summary">${html(mod.summary)}</p>
    <table class="cover-meta">
      <tr><th>Durasi</th><td>${html(mod.duration)}</td></tr>
      <tr><th>Prasyarat</th><td>${(mod.prerequisites || []).map(html).join('<br>')}</td></tr>
    </table>
    <h3>Capaian Pembelajaran</h3>
    <ul>${(mod.learningOutcomes || []).map((o) => `<li>${html(o)}</li>`).join('')}</ul>
    <h3>Daftar Isi Modul</h3>
    <ol class="toc">${mod.sections.map((s) => `<li>${html(s.title.replace(/^\d+\.\s*/, ''))}</li>`).join('')}
      ${lab ? '<li>Tugas Praktikum</li>' : ''}${quiz.length ? '<li>Kuis Pemahaman &amp; Kunci Jawaban</li>' : ''}</ol>
  </header>

  ${mod.sections.map((s) => `
  <section class="material">
    <h2>${html(s.title)}</h2>
    <div class="content-body">${html(s.content)}</div>
  </section>`).join('')}

  ${lab ? `
  <section class="material lab">
    <h2>Tugas Praktikum: ${html(lab.title)}</h2>
    <div class="callout callout-info"><h4>Sasaran Praktikum</h4><p>${html(lab.objective)}</p></div>
    <h3>Langkah Pengerjaan</h3>
    <ol>${lab.instructions.map((i) => `<li>${html(i)}</li>`).join('')}</ol>
    <h3>Output yang Diharapkan</h3>
    <p>${html(lab.expectedOutput)}</p>
    <h3>Rubrik Penilaian</h3>
    <p>${html(lab.rubric)}</p>
  </section>` : ''}

  ${quiz.length ? `
  <section class="material quiz">
    <h2>Kuis Pemahaman</h2>
    ${quiz.map((q, i) => `
    <div class="quiz-item">
      <p class="quiz-q"><strong>${i + 1}.</strong> ${html(q.question)}</p>
      <ol class="quiz-options">${q.options.map((o, j) => `<li><span>${LETTERS[j]}.</span> ${html(o)}</li>`).join('')}</ol>
    </div>`).join('')}
    <h3 class="answer-key">Kunci Jawaban &amp; Pembahasan</h3>
    ${quiz.map((q, i) => `
    <p class="answer"><strong>${i + 1}. ${LETTERS[q.correctIndex]}</strong> — ${html(q.explanation)}</p>`).join('')}
  </section>` : ''}
</article>`;
}

function page(title, body) {
  const base = pathToFileURL(root + '/').href;
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<base href="${base}">
<title>${text(title)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/print-pdf.css">
</head>
<body class="pdf">
${body}
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-dart.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-yaml.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-kotlin.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-properties.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-sql.min.js"></script>
<script>
  document.querySelectorAll('img').forEach((img) => img.removeAttribute('loading'));
  window.Prism && Prism.highlightAll();
</script>
</body>
</html>`;
}

function bookCover() {
  return `
<header class="book-cover">
  <div class="cover-kicker">Modul Pembelajaran Pemrograman Mobile</div>
  <h1>Flutter &amp; Dart</h1>
  <p class="cover-summary">Dari dasar Dart, widget, dan layout hingga penyimpanan lokal Hive, backend Supabase, proyek CRUD dengan login &amp; register, testing, dan rilis aplikasi.</p>
  <p class="cover-org">Program Studi S1 Informatika · Fakultas Teknik<br>Universitas Jenderal Soedirman</p>
  <p class="cover-date">Versi ${generatedAt}</p>
</header>
<section class="book-toc">
  <h2>Daftar Isi</h2>
  <ol class="toc">${modules.map((m) => `<li><strong>Modul ${m.number}</strong> — ${html(m.title)}</li>`).join('')}</ol>
</section>`;
}

function printPdf(htmlFile, pdfFile) {
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--allow-file-access-from-files',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=20000',
    `--print-to-pdf=${pdfFile}`,
    pathToFileURL(htmlFile).href,
  ], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 300000 });
  if (!fs.existsSync(pdfFile) || fs.statSync(pdfFile).size < 1000) {
    throw new Error(`Gagal membuat ${pdfFile}`);
  }
}

// Opsional: perkecil PDF (sekitar 40%) jika Python + PyMuPDF tersedia (pip install pymupdf).
const canCompact = (() => {
  try { execFileSync('python3', ['-c', 'import fitz'], { stdio: 'ignore' }); return true; } catch { return false; }
})();
if (!canCompact) console.log('Info: PyMuPDF tidak ditemukan, PDF tidak dikompres (pip install pymupdf).');

function compact(pdfFile) {
  if (!canCompact) return;
  const tmp = `${pdfFile}.tmp`;
  execFileSync('python3', ['-c',
    'import fitz,sys; d=fitz.open(sys.argv[1]); d.save(sys.argv[2], garbage=1, deflate=True, use_objstms=1)',
    pdfFile, tmp], { stdio: 'inherit', timeout: 900000 });
  fs.renameSync(tmp, pdfFile);
}

fs.mkdirSync(outDir, { recursive: true });
const kb = (f) => `${Math.round(fs.statSync(f).size / 1024)} KB`;

for (const mod of modules) {
  if (only.length && !only.includes(mod.folder)) continue;
  const htmlFile = path.join(workDir, `${mod.folder}.html`);
  const pdfFile = path.join(outDir, `${mod.folder}.pdf`);
  fs.writeFileSync(htmlFile, page(`Modul ${mod.number} - ${mod.title}`, renderModule(mod)));
  printPdf(htmlFile, pdfFile);
  compact(pdfFile);
  console.log(`OK  ${path.relative(root, pdfFile)} (${kb(pdfFile)})`);
}

if (withBook && !only.length) {
  const htmlFile = path.join(workDir, 'modul-flutter-lengkap.html');
  const pdfFile = path.join(outDir, 'modul-flutter-lengkap.pdf');
  fs.writeFileSync(htmlFile, page('Modul Flutter & Dart Lengkap', bookCover() + modules.map(renderModule).join('')));
  printPdf(htmlFile, pdfFile);
  compact(pdfFile);
  console.log(`OK  ${path.relative(root, pdfFile)} (${kb(pdfFile)})`);
}

fs.rmSync(workDir, { recursive: true, force: true });
