# Panduan Penulisan Materi

Seluruh materi web ada di folder `content/`. File `assets/js/modules-data.js` dibuat otomatis dari folder ini, jadi jangan edit file tersebut secara langsung.

## Alur kerja

1. Ubah atau tambah file di `content/<NN>-<slug>/`.
2. Jalankan `node tools/build-modules.mjs`.
3. Buka ulang `index.html` di browser.

Build akan gagal dan menampilkan pesan jika ada file section yang hilang, id ganda, jumlah `<pre>` dan `</pre>` tidak sama, atau `correctIndex` kuis di luar jangkauan.

## Struktur satu modul

```
content/11-hive/
├── module.json            # metadata, daftar section, praktikum, kuis
├── 01-pengenalan-hive.html
├── 02-instalasi.html
└── ...
```

- Urutan modul = urutan nama folder. Nomor yang tampil di web (`M11`) diambil dari dua angka awal nama folder. Untuk menyisipkan modul, cukup ganti nama folder.
- `id` modul di `module.json` dipakai untuk menyimpan progres mahasiswa di `localStorage`. Jangan ubah `id` modul yang sudah ada.

### Isi `module.json`

```json
{
  "id": "modul-hive",
  "badge": "Hive NoSQL",
  "category": "Database",
  "title": "Judul Modul",
  "duration": "2 Pertemuan (2 x 150 Menit)",
  "prerequisites": ["Modul 10: Local Storage"],
  "summary": "Ringkasan 1-3 kalimat.",
  "learningOutcomes": ["Mahasiswa mampu ..."],
  "sections": [
    { "id": "pengenalan-hive", "title": "1. Apa itu Hive?", "file": "01-pengenalan-hive.html" }
  ],
  "labAssignment": {
    "title": "Praktikum 11: ...",
    "objective": "...",
    "instructions": ["Langkah 1 ...", "Langkah 2 ..."],
    "expectedOutput": "...",
    "rubric": "..."
  },
  "quiz": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}
```

`id` section harus unik di seluruh web (dipakai sebagai anchor), jadi beri awalan yang khas modul, misalnya `hive-...`.

## Gaya penulisan

- Bahasa Indonesia baku tapi santai, untuk mahasiswa S1 yang baru belajar.
- Urutan selalu dari yang paling sederhana: konsep singkat, contoh kecil, lalu contoh lengkap.
- Setiap konsep baru diberi minimal satu contoh kode yang bisa langsung dijalankan.
- Jelaskan kode setelah ditampilkan: baris mana yang penting dan kenapa.
- Akhiri section yang panjang dengan ringkasan atau kesalahan umum (common mistakes).

## Komponen HTML yang tersedia

Tag yang diizinkan: `a b blockquote br code div em h1-h6 hr i img kbd li mark ol p pre small span strong sub sup table tbody td th thead tr u ul`. Kelas Tailwind boleh dipakai (Tailwind dimuat lewat CDN).

```html
<p class="lead">Paragraf pembuka yang lebih besar.</p>

<h4>Subjudul di dalam section</h4>

<div class="callout callout-info"><h4>ℹ️ Judul</h4><p>Informasi.</p></div>
<div class="callout callout-tip"><h4>💡 Tips</h4><p>Saran praktis.</p></div>
<div class="callout callout-warning"><h4>⚠️ Perhatian</h4><p>Kesalahan umum.</p></div>

<div class="table-responsive">
  <table class="table-custom">
    <thead><tr><th>Kolom</th><th>Kolom</th></tr></thead>
    <tbody><tr><td>...</td><td>...</td></tr></tbody>
  </table>
</div>

<p class="code-file-label">📄 <code>lib/main.dart</code></p>
<pre><code class="language-dart">// kode Dart
</code></pre>
```

Bahasa kode yang didukung pewarnaan: `language-dart`, `language-bash`, `language-yaml`, `language-json`, `language-kotlin`, `language-properties`, `language-sql`, `language-text`.

## Aturan kode

- Di dalam `<pre><code>`, tulis `<` sebagai `&lt;`, `>` sebagai `&gt;`, dan `&` sebagai `&amp;`. Contoh: `List&lt;String&gt;`, `a &amp;&amp; b`, `=&gt;`.
- Beri label file (`code-file-label`) jika kode adalah file utuh. Kode berlabel `lib/main.dart` harus program lengkap yang bisa dijalankan setelah isi `main.dart` bawaan dihapus.
- Kode harus lolos `flutter analyze` tanpa error pada Flutter stabil terbaru. Uji di proyek sementara sebelum menulis ke materi.
- Pakai API terbaru: Material 3, `withValues(alpha: ...)` bukan `withOpacity`, `super.key`, `const` constructor, cek `mounted` / `context.mounted` setelah `await`.
- Untuk package, tunjukkan perintah `flutter pub add <nama>` dan jangan menulis nomor versi yang dikarang.

## Screenshot hasil kode

Setiap contoh kode Flutter yang menampilkan UI wajib diikuti screenshot hasilnya, diambil dari Android Emulator (bukan gambar karangan).

1. Pastikan emulator menyala dan runner aktif. Runner adalah proyek `/tmp/shot_runner` yang dijalankan sekali dengan `/tmp/shot_runner/tool/start.sh`. Proyek ini sudah memuat package `provider`, `go_router`, `http`, `shared_preferences`, `sqflite`, `path`, `path_provider`, `hive_ce`, `hive_ce_flutter`, `supabase_flutter`, `intl`, `uuid`, `flutter_secure_storage`.
2. Ambil screenshot:

```bash
# File tunggal: menjadi lib/main.dart
/tmp/shot_runner/tool/shot.sh contoh.dart assets/img/screenshots/05-form-input/login-kosong.jpg

# Proyek multi-file: isi folder disalin menjadi lib/
/tmp/shot_runner/tool/shot.sh /tmp/proyek/lib assets/img/screenshots/11-hive/home.jpg

# Dengan interaksi sebelum screenshot (dipisah titik koma)
/tmp/shot_runner/tool/shot.sh contoh.dart out.jpg "tap Masuk; sleep 1"
/tmp/shot_runner/tool/shot.sh contoh.dart out.jpg "tap Email; text budi@mail.com; tap Simpan"
```

Aksi yang tersedia: `tap <teks yang terlihat>` (cocok persis didahulukan, lalu cocok sebagian), `tapxy <x> <y>` (koordinat layar 1080x2400), `text <isi>`, `key <BACK|ENTER|...>`, `scroll`, `sleep <detik>`. Skrip mengunci emulator sehingga aman dipakai bergantian. Jangan memakai `key BACK` di halaman pertama aplikasi, karena aplikasi akan tertutup. Jika runner rusak, skrip otomatis menjalankannya ulang (sekitar 1-2 menit). Kode yang gagal dikompilasi menghasilkan pesan `compile error`.

3. Lihat hasilnya dulu (pastikan tampilan sesuai yang dijelaskan), lalu sisipkan tepat setelah blok kode:

```html
<div class="screenshot-row">
  <div class="screenshot">
    <img src="assets/img/screenshots/05-form-input/login-kosong.jpg" alt="Form login kosong" loading="lazy">
    <div class="screenshot-caption">Tampilan awal form login</div>
  </div>
  <div class="screenshot">
    <img src="assets/img/screenshots/05-form-input/login-error.jpg" alt="Pesan validasi muncul" loading="lazy">
    <div class="screenshot-caption">Setelah tombol Masuk ditekan dengan form kosong</div>
  </div>
</div>
```

Simpan gambar di `assets/img/screenshots/<nama-folder-modul>/` dengan nama file deskriptif berhuruf kecil dan tanda hubung.
