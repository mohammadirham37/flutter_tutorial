// Data Cheat Sheet Flutter & Dart
window.FLUTTER_CHEATSHEET = {
  "cli": [
    {
      "command": "flutter doctor -v",
      "description": "Memeriksa status lengkap instalasi Flutter SDK, Android Studio, Xcode, dan perangkat yang terhubung."
    },
    {
      "command": "flutter create --org com.kampus nama_proyek",
      "description": "Membuat proyek baru dengan package domain organisasi khusus."
    },
    {
      "command": "flutter run -d chrome",
      "description": "Menjalankan aplikasi di Google Chrome (Web target)."
    },
    {
      "command": "flutter run -d <device_id>",
      "description": "Menjalankan aplikasi di perangkat fisik atau emulator spesifik."
    },
    {
      "command": "flutter pub add <nama_package>",
      "description": "Menambahkan dependensi baru dari pub.dev langsung ke pubspec.yaml."
    },
    {
      "command": "flutter pub get",
      "description": "Mengunduh dan menyinkronkan seluruh dependensi yang terdaftar di pubspec.yaml."
    },
    {
      "command": "flutter clean",
      "description": "Menghapus cache build (solusi jitu jika terjadi error kompilasi aneh)."
    },
    {
      "command": "flutter test",
      "description": "Menjalankan semua automated unit & widget test di folder test/."
    },
    {
      "command": "flutter build apk --split-per-abi",
      "description": "Mengompilasi berkas APK release teroptimasi per arsitektur CPU (ukuran berkas kecil)."
    },
    {
      "command": "flutter build appbundle",
      "description": "Mengompilasi file .aab untuk publikasi ke Google Play Store."
    }
  ],
  "vscode": [
    {
      "shortcutMac": "Cmd + .",
      "shortcutWin": "Ctrl + .",
      "action": "Quick Fix / Refactor Menu (Wrap with Widget, Extract Widget, Remove Widget)"
    },
    {
      "shortcutMac": "r (di terminal)",
      "shortcutWin": "r (di terminal)",
      "action": "Hot Reload (Perbarui perubahan UI dalam 0.5 detik tanpa reset state)"
    },
    {
      "shortcutMac": "R (di terminal)",
      "shortcutWin": "R (di terminal)",
      "action": "Hot Restart (Muat ulang aplikasi dari awal sambil mereset seluruh state)"
    },
    {
      "shortcutMac": "Shift + Option + F",
      "shortcutWin": "Shift + Alt + F",
      "action": "Auto Format Dart Code (Wajib letakkan tanda koma trailing di ujung baris!)"
    },
    {
      "shortcutMac": "stless",
      "shortcutWin": "stless",
      "action": "Snippet cepat membuat kerangka StatelessWidget baru"
    },
    {
      "shortcutMac": "stful",
      "shortcutWin": "stful",
      "action": "Snippet cepat membuat kerangka StatefulWidget baru"
    },
    {
      "shortcutMac": "F5",
      "shortcutWin": "F5",
      "action": "Start Debugging (Menjalankan aplikasi dengan breakpoint)"
    }
  ],
  "dartSyntax": [
    {
      "title": "Null Coalescing (??)",
      "code": "String display = userName ?? 'Tamu Anonim';",
      "desc": "Memberi nilai default jika sisi kiri bernilai null."
    },
    {
      "title": "Null-aware Access (?.)",
      "code": "int? panjang = teks?.length;",
      "desc": "Mengakses properti hanya jika objek tidak null, mencegah crash."
    },
    {
      "title": "Null Assertion (!)",
      "code": "int panjang = teks!.length;",
      "desc": "Memaksa compiler menganggap nilai pasti tidak null (gunakan dengan hati-hati)."
    },
    {
      "title": "Cascade Notation (..)",
      "code": "var cat = Paint()..color = Colors.black..strokeWidth = 2.0;",
      "desc": "Menjalankan beberapa operasi beruntun pada objek yang sama."
    },
    {
      "title": "Collection If",
      "code": "List<Widget> bar = [Text('Halo'), if (isAdmin) TombolAdmin()];",
      "desc": "Menyisipkan elemen ke dalam List secara kondisional."
    },
    {
      "title": "Spread Operator (...)",
      "code": "List<int> gabungan = [1, 2, ...daftarLain];",
      "desc": "Mengekstrak dan menggabungkan elemen dari List lain."
    }
  ],
  "widgetCategory": [
    {
      "category": "Tata Letak (Layout)",
      "widgets": [
        "Container",
        "SizedBox",
        "Row",
        "Column",
        "Stack",
        "Positioned",
        "Expanded",
        "Flexible",
        "Padding",
        "Center",
        "Align",
        "Wrap"
      ]
    },
    {
      "category": "Interaksi & Input",
      "widgets": [
        "ElevatedButton",
        "FilledButton",
        "OutlinedButton",
        "TextButton",
        "IconButton",
        "GestureDetector",
        "InkWell",
        "TextField",
        "TextFormField",
        "Checkbox",
        "Switch",
        "DropdownButtonFormField"
      ]
    },
    {
      "category": "Daftar & Scroll",
      "widgets": [
        "ListView",
        "ListView.builder",
        "GridView.builder",
        "SingleChildScrollView",
        "CustomScrollView",
        "SliverAppBar",
        "RefreshIndicator"
      ]
    },
    {
      "category": "Struktur Layar",
      "widgets": [
        "Scaffold",
        "AppBar",
        "Drawer",
        "NavigationBar",
        "BottomNavigationBar",
        "FloatingActionButton",
        "Card",
        "ListTile"
      ]
    },
    {
      "category": "Asinkronus & State",
      "widgets": [
        "FutureBuilder",
        "StreamBuilder",
        "Consumer",
        "ChangeNotifierProvider",
        "Selector",
        "AnimatedBuilder"
      ]
    }
  ]
};
