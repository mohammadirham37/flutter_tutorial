# 📱 Modul Pembelajaran Pemrograman Mobile: Flutter & Dart

Portal materi tutorial dan modul praktikum interaktif **Flutter & Dart** yang dirancang khusus untuk pembelajaran mahasiswa perguruan tinggi (Teknik Informatika, Sistem Informasi, Ilmu Komputer, atau Rekayasa Perangkat Lunak).

Materi ini disusun secara **lengkap, runtut, dan siap ajar**, mencakup fondasi dasar hingga persiapan rilis produksi aplikasi Android/iOS.

---

## 🚀 Cara Membuka & Menjalankan Web

Karena proyek ini berada di dalam direktori `Herd/flutter_tutorial`, Anda memiliki beberapa pilihan praktis untuk membukanya:

### 1. Melalui Laravel Herd (Rekomendasi)
Jika **Laravel Herd** aktif di Mac Anda, buka peramban (browser) dan akses:
```
http://flutter_tutorial.test
atau
http://flutter-tutorial.test
```

### 2. Menggunakan Server Lokal Bawaan (Terminal)
Buka terminal di folder ini, lalu jalankan salah satu:
```bash
# Menggunakan Python 3:
python3 -m http.server 8000
# Lalu buka: http://localhost:8000

# Atau menggunakan PHP CLI:
php -S localhost:8000
# Lalu buka: http://localhost:8000
```

### 3. Buka Langsung (Tanpa Web Server)
Klik ganda berkas `index.html` langsung dari Finder macOS. Semua dependensi data dan styling akan dimuat secara mulus.

### 4. Membagikan ke Mahasiswa via GitHub Pages (Hosting Gratis)
1. Buat repositori publik di GitHub (contoh: `flutter-tutorial-kampus`).
2. Unggah seluruh isi folder ini.
3. Buka menu **Settings** > **Pages** di repositori GitHub, lalu pilih branch `main` dan folder `/ (root)`.
4. Bagikan tautan website GitHub Pages ke mahasiswa Anda untuk dipelajari kapan saja dan di mana saja.

---

## 📚 Struktur Kurikulum 25 Modul (Lengkap & Terurut)

Kurikulum dirancang untuk 1 semester perkuliahan (16 pertemuan + UTS/UAS):

| No | Modul | Kategori | Fokus Pembelajaran |
|:---|:---|:---|:---|
| **00** | **Silabus & Kontrak Kuliah** | Pengantar | Rencana Pembelajaran Semester (RPS), CPMK, bobot penilaian & persiapan hardware. |
| **01** | **Pengenalan Flutter & Setup** | Dasar | Arsitektur engine Flutter, instalasi SDK, `flutter doctor`, dan struktur folder proyek. |
| **02** | **Fondasi Bahasa Dart 3 Modern** | Dasar | OOP modern, Sound Null Safety, Record, dan Asynchronous Programming (`Future`, `async/await`). |
| **03** | **Arsitektur Widget & Lifecycle UI** | UI/UX | Filosofi widget tree, perbandingan `Stateless` vs `Stateful`, dan siklus hidup state (`initState`, `dispose`). |
| **04** | **Sistem Layouting & Responsif** | UI/UX | Aturan Constraints, `Row`, `Column`, `Stack`, `Expanded`, `Flexible`, dan `MediaQuery`. |
| **05** | **Interaktivitas & Form Mahasiswa** | Interaksi | Aneka tombol Material 3, `TextEditingController`, validasi `GlobalKey<FormState>`, Dropdown, DatePicker. |
| **06** | **Scrollable Views & List Data** | Performa | Optimalisasi memori dengan `ListView.builder` (viewport recycling), `GridView`, dan `SliverAppBar`. |
| **07** | **Navigasi & Routing Halaman** | Arsitektur | Navigation stack, passing data bolak-balik (`await push` / `pop`), `NavigationBar` tab, dan `GoRouter`. |
| **08** | **Manajemen State Terstruktur dengan GetX & Pola MVC** | Arsitektur | Mengatasi masalah *prop drilling*, `GetxController`, state reaktif `.obs` + `Obx`, `Get.put`/`Get.find`/`Bindings`, workers, struktur folder models/services/controllers/views. |
| **09** | **Integrasi REST API (Networking)** | Jaringan | Package `http`, serialisasi JSON ke Model Dart (`fromJson`), `FutureBuilder`, dan Repository pattern. |
| **10** | **Local Storage & SQLite** | Database | Persistensi data lokal `shared_preferences` (token/tema) dan SQLite database lokal offline-first (`sqflite`). |
| **11** | **Hive: Database NoSQL Lokal** | Database | Box, TypeAdapter, `ValueListenableBuilder`, enkripsi, dan mini project CRUD catatan offline dengan `hive_ce`. |
| **11B** | **Proyek CRUD Mahasiswa: Hive + GetX + MVC** | Proyek | Aplikasi CRUD data mahasiswa dari nol: model + TypeAdapter, `HiveService`, `MahasiswaController`, Binding & named routes, view daftar/form, unit & widget test, listing lengkap siap salin. |
| **12** | **Supabase: Backend Cloud** | Backend | Postgres, SQL Editor, Row Level Security, query CRUD, Auth email/password, dan Realtime. |
| **12B** | **Proyek CRUD Mahasiswa Lanjutan: Supabase + Auth + GetX + MVC** | Proyek | Aplikasi CRUD dari M11B dipindahkan ke Supabase: tabel + RLS per akun, `MahasiswaService` & `AuthService`, `AuthController` (register/login/logout), `AuthMiddleware`, state loading/error, widget test dengan service palsu, listing lengkap siap salin.
| **13** | **Proyek Bagian 1: Auth Login & Register** | Proyek | Arsitektur aplikasi "Catatan Kuliah", tabel profil + trigger, AuthService, AuthController (GetX), AuthGate, layar Login & Register. |
| **14** | **Proyek Bagian 2: CRUD Supabase + Cache Hive** | Proyek | Tabel `notes` + RLS, repository remote/lokal, mode offline, pencarian, tambah/edit/hapus catatan. |
| **15** | **Debugging & Automated Testing** | Kualitas | Membaca error, Flutter DevTools, unit test, fake/mock repository, widget test form login, testing controller GetX, integration test. |
| **16** | **Build Rilis & Capstone Project** | Produksi | App icon, splash, keystore, `--dart-define-from-file`, `flutter build apk --split-per-abi`, dan panduan Tugas Besar. |
| **17** | **Izin Akses (Permission) & Arsitektur Hardware** | Hardware | Plugin & platform channel (`MethodChannel`/`EventChannel`), runtime permission Android/iOS dengan `permission_handler`, UX izin, `PermissionService` + controller GetX. |
| **18** | **Kamera & Galeri** | Hardware | `image_picker` vs package `camera` (preview, ambil foto, lifecycle), simpan foto lokal, unggah ke Supabase Storage, studi kasus foto profil kartu mahasiswa. |
| **19** | **Lokasi & GPS** | Hardware | `geolocator` (posisi, stream, jarak), `geocoding`, peta OpenStreetMap dengan `flutter_map`, studi kasus presensi kampus berbasis radius. |
| **20** | **Sensor Gerak & Kompas** | Hardware | `sensors_plus` (akselerometer, giroskop, magnetometer), filter, deteksi guncangan, waterpass, kompas dengan kompensasi kemiringan. |
| **21** | **Autentikasi Biometrik** | Hardware | `local_auth` 3.x (sidik jari/wajah), penanganan lockout, sesi aman dengan `flutter_secure_storage`, kunci aplikasi Catatan Kuliah. |
| **22** | **Bluetooth, WiFi & Konektivitas** | Hardware | `connectivity_plus`, `network_info_plus`, banner offline & sinkronisasi ulang, BLE dengan `flutter_blue_plus` (scan, connect, GATT). |

---

## 💡 Fitur-Fitur Interaktif Web

1. **Tiga Tab Khusus di Setiap Modul:**
   - 📖 **Materi Kuliah & Teori:** Penjelasan akademis, ilustrasi arsitektur, dan kode implementasi.
   - 💻 **Tugas Praktikum Mandiri:** Lembar tugas mahasiswa dilengkapi langkah pengerjaan dan rubrik penilaian dosen.
   - 🧠 **Kuis Evaluasi Pemahaman:** Kuis interaktif pilihan ganda yang langsung mengoreksi, menghitung skor, dan memberikan penjelasan jawaban benar.
2. **Pencarian Cepat Global (`Cmd + K` / `Ctrl + K`):**
   - Mahasiswa dapat mencari topik, kata kunci widget, atau potongan kode di seluruh 25 modul secara real-time.
3. **Pelacak Progres Mahasiswa (Student Progress Tracker):**
   - Mahasiswa dapat mencentang modul yang telah selesai dipelajari. Progres tersimpan secara otomatis di peramban (`localStorage`).
4. **Efek Selebrasi (Confetti):**
   - Memberikan apresiasi visual ketika mahasiswa menyelesaikan modul atau mendapatkan nilai kuis 100%.
5. **Mode Kuliah / Proyektor (Lecture Mode):**
   - Tombol proyektor di pojok kanan atas untuk menyembunyikan sidebar dan memperbesar ukuran teks agar nyaman saat dosen melakukan presentasi di layar kelas.
6. **Unduh PDF & Cetak Handout:**
   - Tombol **Unduh PDF Modul** di setiap modul dan tombol **Unduh Semua Modul** (ikon unduh di navbar) untuk file PDF siap baca/cetak, lengkap dengan screenshot, praktikum, kuis, dan kunci jawaban.
   - Tombol cetak yang diformat khusus dengan stylesheet cetak (`@media print`) untuk mencetak materi sebagai handout fisik.
7. **Cheat Sheet Lengkap:**
   - Referensi kilat perintah CLI Flutter, shortcut penting VS Code (macOS & Windows), sintaks kunci Dart 3, dan klasifikasi widget.
8. **Dukungan Dark Mode & Light Mode Situs:**
   - Transisi mulus antara tema gelap dan terang seluruh situs sesuai preferensi pengguna.
9. **Mode Terang & Gelap Khusus Cuplikan Kode (Code Snippets):**
   - Setiap kotak kode dilengkapi tombol sakelar tema `☀️ Terang` / `🌙 Gelap` (serta tombol global `</>` di navbar atas).
   - Mode Terang (GitHub Light style) sangat ideal untuk presentasi di proyektor kelas dengan pencahayaan terang agar sintaks kode terbaca jelas oleh mahasiswa di deretan belakang.
   - Pilihan tema kode tersimpan otomatis di `localStorage`.

---

## 🛠️ Panduan Kustomisasi Materi

Materi disimpan sebagai file HTML biasa di folder `content/`, satu folder per modul:

```
content/
├── PANDUAN-PENULISAN.md      <-- aturan format, komponen HTML, dan cara membuat screenshot
├── 00-silabus/
│   ├── module.json           <-- judul, ringkasan, daftar section, praktikum, kuis
│   ├── 01-rps-overview.html  <-- isi section
│   └── ...
└── 16-build-rilis/
```

Setelah mengubah isi `content/`, jalankan:

```bash
node tools/build-modules.mjs
```

Untuk memperbarui file PDF yang bisa diunduh dari web (butuh Google Chrome):

```bash
node tools/build-pdf.mjs                  # semua modul + buku lengkap
node tools/build-pdf.mjs --only=11-hive   # satu modul saja
```

Hasilnya ada di `assets/pdf/`: satu PDF per modul dan `modul-flutter-lengkap.pdf`.

### 📖 Versi Buku (B5, siap cetak)

Seluruh materi juga bisa disusun menjadi buku *Pemrograman Mobile dengan Flutter & Dart* (Ir. Mohammad Irham Akbar, S.Kom., M.Cs. & Azis Amirulbahar, S.Pd., M.T.I.), lengkap dengan sampul, kata pengantar, daftar isi bernomor halaman, 7 bagian / 23 bab, rangkuman, latihan, uji pemahaman, lampiran, glosarium, daftar pustaka, dan bookmark PDF. Butuh Google Chrome serta Python 3 + PyMuPDF (`pip install pymupdf`).

```bash
node tools/build-modules.mjs && node tools/build-book.mjs
node tools/build-book.mjs --only=05-form-input   # buku contoh berisi bab tertentu (cepat, untuk mencoba desain)
```

Hasil di `assets/pdf/`:
- `buku-flutter-dart.pdf`: buku lengkap dengan sampul depan dan belakang (untuk dibaca digital)
- `buku-flutter-dart-isi.pdf`: isi buku tanpa sampul (untuk naik cetak; bab selalu dimulai di halaman kanan)
- `buku-flutter-dart-sampul.pdf`: sampul depan dan belakang

Naskah khusus buku ada di folder `book/`: `book.json` (judul, penulis, biodata, pembagian Bagian), `rangkuman.json` (rangkuman tiap bab), `front/` (kata pengantar dan pendahuluan), serta `back/` (glosarium dan daftar pustaka). Desainnya diatur di `assets/css/print-book.css`. Saat buku dibuat, rujukan "Modul 13" otomatis menjadi "Bab 14" sesuai urutan bab buku.

Perintah build materi menyusun ulang `assets/js/modules-data.js` (jangan edit file itu langsung). Urutan dan nomor modul mengikuti awalan angka nama folder (modul sisipan boleh memakai huruf, misalnya `11b-...` tampil sebagai M11B). Gambar screenshot hasil kode ada di `assets/img/screenshots/`.

File lain yang bisa diubah:
- **`assets/js/cheatsheet-data.js`**: Tempat data perintah CLI dan shortcut editor.
- **`assets/css/style.css`**: Pengaturan gaya visual, warna tema, dan tampilan cetak.

Selamat mengajar dan membimbing mahasiswa menjadi pengembang mobile Flutter handal! 🚀
