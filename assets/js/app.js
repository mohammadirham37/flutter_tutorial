/**
 * FLUTTER TUTORIAL KAMPUS - APP CONTROLLER
 * Logika interaktif: Navigasi, Progress Mahasiswa, Kuis Interaktif, Dark Mode, Pencarian Real-Time
 */

// Teks materi dirender lewat innerHTML. Tanpa escape, sintaks generic Dart seperti
// State<MyWidget> atau Map<String, dynamic> dibaca browser sebagai tag HTML lalu hilang,
// sehingga kode yang tampil dan disalin mahasiswa menjadi rusak. Fungsi ini meng-escape
// setiap '<' yang bukan awal tag HTML yang memang dipakai oleh materi.
const ALLOWED_HTML_TAGS = 'a|b|blockquote|br|code|div|em|h[1-6]|hr|i|img|kbd|li|mark|ol|p|pre|small|span|strong|sub|sup|table|tbody|td|th|thead|tr|u|ul';
const STRAY_LT_REGEX = new RegExp(`<(?!\\/?(?:${ALLOWED_HTML_TAGS})(?=[\\s>\\/])|!--)`, 'gi');

function escapeCodeLikeText(html) {
  return html.replace(STRAY_LT_REGEX, '&lt;');
}

function sanitizeContent(value) {
  if (typeof value === 'string') return escapeCodeLikeText(value);
  if (Array.isArray(value)) return value.map(sanitizeContent);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeContent(v)]));
  }
  return value;
}

document.addEventListener('DOMContentLoaded', () => {
  // --- INICIALISASI STATE ---
  const state = {
    modules: sanitizeContent(window.FLUTTER_MODULES || []),
    cheatsheet: sanitizeContent(window.FLUTTER_CHEATSHEET || {}),
    currentModuleId: 'modul-00',
    currentTab: 'materi', // 'materi', 'praktikum', 'kuis'
    currentCategory: 'Semua', // Category filter for sidebar
    isCheatsheetView: false,
    completedModules: JSON.parse(localStorage.getItem('flutter_completed_modules') || '[]'),
    quizAnswers: {}, // Menyimpan jawaban sementara kuis per modul
    isDarkMode: localStorage.getItem('flutter_theme') === 'dark' || 
                (!('flutter_theme' in localStorage) && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false),
    codeTheme: localStorage.getItem('flutter_code_theme') || 'dark', // 'dark' | 'light'
    isLectureMode: false,
  };

  // --- ELEMEN DOM ---
  const sidebarListEl = document.getElementById('sidebar-modules-list');
  const sidebarCategoryFiltersEl = document.getElementById('sidebar-category-filters');
  const contentAreaEl = document.getElementById('content-area');
  const progressTextEl = document.getElementById('progress-text');
  const progressBarEl = document.getElementById('progress-bar-fill');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const codeThemeGlobalBtn = document.getElementById('code-theme-global-btn');
  const lectureToggleBtn = document.getElementById('lecture-toggle-btn');
  const printBtn = document.getElementById('print-btn');
  const searchInputEl = document.getElementById('global-search-input');
  const searchResultsModal = document.getElementById('search-results-modal');
  const searchResultsList = document.getElementById('search-results-list');
  const closeSearchBtn = document.getElementById('close-search-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');
  const sidebarEl = document.getElementById('sidebar');
  const cheatsheetNavBtn = document.getElementById('cheatsheet-nav-btn');
  const capstoneNavBtn = document.getElementById('capstone-nav-btn');
  const navModulesBtn = document.getElementById('nav-modules-btn');
  const navCheatsheetBtn = document.getElementById('nav-cheatsheet-btn');
  const navCapstoneBtn = document.getElementById('nav-capstone-btn');
  const mobNavModules = document.getElementById('mob-nav-modules');
  const mobNavCheatsheet = document.getElementById('mob-nav-cheatsheet');
  const mobNavCapstone = document.getElementById('mob-nav-capstone');
  const mobNavMenu = document.getElementById('mob-nav-menu');

  // --- SETUP THEME ---
  function applyTheme() {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
      if (themeToggleBtn) {
        themeToggleBtn.innerHTML = `
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>`;
      }
    } else {
      document.documentElement.classList.remove('dark');
      if (themeToggleBtn) {
        themeToggleBtn.innerHTML = `
          <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>`;
      }
    }
    localStorage.setItem('flutter_theme', state.isDarkMode ? 'dark' : 'light');

    // Jika pengguna belum pernah memilih tema kode khusus, sinkronkan tema kode dengan tema situs
    if (!localStorage.getItem('flutter_code_theme')) {
      state.codeTheme = state.isDarkMode ? 'dark' : 'light';
      updateAllCodeSnippetThemes();
    }
  }

  themeToggleBtn?.addEventListener('click', () => {
    state.isDarkMode = !state.isDarkMode;
    applyTheme();
  });

  codeThemeGlobalBtn?.addEventListener('click', () => {
    toggleCodeTheme();
  });

  // --- LECTURE MODE TOGGLE ---
  lectureToggleBtn?.addEventListener('click', () => {
    state.isLectureMode = !state.isLectureMode;
    document.body.classList.toggle('lecture-mode', state.isLectureMode);
    lectureToggleBtn.classList.toggle('bg-indigo-100', state.isLectureMode);
    lectureToggleBtn.classList.toggle('text-indigo-600', state.isLectureMode);
    showToast(state.isLectureMode ? 'Mode Kuliah / Proyektor Aktif (Layar Penuh Fokus)' : 'Mode Kuliah Dinonaktifkan');
  });

  // --- PRINT BUTTON ---
  printBtn?.addEventListener('click', () => {
    window.print();
  });

  // --- MOBILE SIDEBAR DRAWER ---
  function toggleMobileSidebar(open) {
    if (!sidebarEl || !mobileSidebarBackdrop) return;
    if (open) {
      sidebarEl.classList.remove('-translate-x-full');
      mobileSidebarBackdrop.classList.remove('hidden');
    } else {
      sidebarEl.classList.add('-translate-x-full');
      mobileSidebarBackdrop.classList.add('hidden');
    }
  }

  mobileMenuBtn?.addEventListener('click', () => toggleMobileSidebar(true));
  closeSidebarBtn?.addEventListener('click', () => toggleMobileSidebar(false));
  mobileSidebarBackdrop?.addEventListener('click', () => toggleMobileSidebar(false));

  // --- UPDATE PROGRESS MAHASISWA ---
  function updateProgress() {
    const total = state.modules.length;
    const completed = state.completedModules.length;
    const percent = Math.round((completed / total) * 100);

    if (progressTextEl) {
      progressTextEl.textContent = `${completed} dari ${total} Modul Selesai (${percent}%)`;
    }
    if (progressBarEl) {
      progressBarEl.style.width = `${percent}%`;
    }
  }

  // --- SAFE URL HASH UPDATER (Mencegah warning 'file:' security origin pada Chromium/WebView) ---
  function setSafeHash(targetId) {
    try {
      localStorage.setItem('flutter_current_module', targetId);
      if (window.location.protocol !== 'file:') {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', '#' + targetId);
        } else {
          window.location.hash = targetId;
        }
      } else {
        // Pada protokol file://, hindari window.location.hash langsung agar iframe/webview sandbox tidak memunculkan warning
        if (window.self === window.top && window.history && window.history.replaceState) {
          window.history.replaceState(null, '', '#' + targetId);
        }
      }
    } catch (err) {
      // Abaikan jika sandbox browser membatasi akses history
    }
  }

  // --- CENTRAL NAVIGATION CONTROLLER ---
  function navigateToModule(moduleId, tab = 'materi', targetSectionId = null, shouldScrollTop = true) {
    state.isCheatsheetView = false;
    state.currentModuleId = moduleId;
    state.currentTab = tab || 'materi';
    setSafeHash(moduleId);
    renderSidebar();
    renderModuleContent();
    toggleMobileSidebar(false);
    updateActiveNavStyles();

    if (targetSectionId) {
      setTimeout(() => {
        const targetSec = document.getElementById(targetSectionId);
        if (targetSec && typeof targetSec.scrollIntoView === 'function') {
          targetSec.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else if (shouldScrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- UPDATE ACTIVE NAVIGATION HIGHLIGHTS ---
  function updateActiveNavStyles() {
    const isModulesActive = !state.isCheatsheetView && state.currentModuleId !== 'modul-12';
    const isCheatsheetActive = state.isCheatsheetView;
    const isCapstoneActive = !state.isCheatsheetView && state.currentModuleId === 'modul-12';

    // Desktop navbar items
    const updateDesktopBtn = (btn, isActive, activeColorClass) => {
      if (!btn) return;
      if (isActive) {
        btn.classList.add(activeColorClass, 'bg-white', 'dark:bg-slate-700', 'shadow-sm', 'font-bold');
        btn.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('text-indigo-600', 'text-amber-600', 'text-purple-600', 'dark:text-indigo-400', 'dark:text-amber-400', 'dark:text-purple-400', 'bg-white', 'dark:bg-slate-700', 'bg-slate-100', 'dark:bg-slate-800', 'shadow-sm', 'font-bold');
        btn.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    };

    updateDesktopBtn(navModulesBtn, isModulesActive, 'text-indigo-600');
    updateDesktopBtn(navCheatsheetBtn, isCheatsheetActive, 'text-amber-600');
    updateDesktopBtn(navCapstoneBtn, isCapstoneActive, 'text-purple-600');

    // Mobile bottom nav items
    const updateMobBtn = (btn, isActive, activeColorClass) => {
      if (!btn) return;
      if (isActive) {
        btn.classList.add(activeColorClass, 'font-bold');
        btn.classList.remove('text-slate-500', 'dark:text-slate-400');
      } else {
        btn.classList.remove('text-indigo-600', 'text-amber-600', 'text-purple-600', 'dark:text-indigo-400', 'dark:text-amber-400', 'dark:text-purple-400', 'font-bold');
        btn.classList.add('text-slate-500', 'dark:text-slate-400');
      }
    };

    updateMobBtn(mobNavModules, isModulesActive, 'text-indigo-600');
    updateMobBtn(mobNavCheatsheet, isCheatsheetActive, 'text-amber-600');
    updateMobBtn(mobNavCapstone, isCapstoneActive, 'text-purple-600');
  }

  // --- RENDER CATEGORY FILTER PILLS ---
  function renderCategoryFilters() {
    if (!sidebarCategoryFiltersEl) return;
    const categories = ['Semua', 'Dasar', 'UI/UX', 'Arsitektur', 'Data', 'Rilis'];
    sidebarCategoryFiltersEl.innerHTML = categories.map(cat => `
      <button type="button" class="category-pill ${state.currentCategory === cat ? 'active' : ''}" data-category="${cat}">
        ${cat}
      </button>
    `).join('');

    sidebarCategoryFiltersEl.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentCategory = btn.getAttribute('data-category');
        renderCategoryFilters();
        renderSidebar();
      });
    });
  }

  // --- RENDER SIDEBAR ---
  function renderSidebar() {
    if (!sidebarListEl) return;
    sidebarListEl.innerHTML = '';

    const filtered = state.modules.filter(m => {
      if (state.currentCategory === 'Semua') return true;
      if (state.currentCategory === 'Dasar') return m.category === 'Silabus' || m.category === 'Dasar';
      if (state.currentCategory === 'UI/UX') return m.category === 'UI/UX' || m.category === 'Interaktivitas';
      if (state.currentCategory === 'Arsitektur') return m.category === 'Performa' || m.category === 'Arsitektur';
      if (state.currentCategory === 'Data') return m.category === 'Jaringan' || m.category === 'Penyimpanan';
      if (state.currentCategory === 'Rilis') return m.category === 'Kualitas' || m.category === 'Produksi';
      return m.category === state.currentCategory;
    });

    if (filtered.length === 0) {
      sidebarListEl.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Tidak ada modul di kategori ini.</div>';
    } else {
      filtered.forEach((mod) => {
        const isCompleted = state.completedModules.includes(mod.id);
        const isActive = !state.isCheatsheetView && state.currentModuleId === mod.id;

        const itemEl = document.createElement('div');
        itemEl.className = `group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all select-none ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
        }`;
        itemEl.setAttribute('data-module-card', mod.id);

        itemEl.innerHTML = `
          <button type="button" class="mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
            isCompleted 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-white dark:bg-slate-800'
          }" data-toggle-complete="${mod.id}" title="${isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}">
            ${isCompleted ? '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
          </button>
          <div class="flex-1 min-w-0 pointer-events-none">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-xs px-1.5 py-0.5 rounded font-mono font-medium ${
                isActive ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }">M${mod.number}</span>
              <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">${mod.category}</span>
            </div>
            <div class="text-sm truncate leading-snug">${mod.title}</div>
          </div>
        `;

        // Klik di mana saja pada item modul akan berpindah modul!
        itemEl.addEventListener('click', (e) => {
          if (e.target.closest('[data-toggle-complete]')) return;
          navigateToModule(mod.id, 'materi', null, true);
        });

        // Event klik centang selesai
        itemEl.querySelector('[data-toggle-complete]')?.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleModuleComplete(mod.id);
        });

        sidebarListEl.appendChild(itemEl);
      });
    }

    updateActiveNavStyles();
  }

  // --- TOGGLE COMPLETION ---
  function toggleModuleComplete(modId) {
    const idx = state.completedModules.indexOf(modId);
    if (idx > -1) {
      state.completedModules.splice(idx, 1);
      showToast('Status modul diperbarui: Belum Selesai');
    } else {
      state.completedModules.push(modId);
      triggerCelebration();
      showToast('🎉 Selamat! Modul berhasil ditandai selesai.');
    }
    localStorage.setItem('flutter_completed_modules', JSON.stringify(state.completedModules));
    updateProgress();
    renderSidebar();
    
    // Update tombol di bawah jika modul yang aktif sama
    const finishBtn = document.getElementById('mark-finish-module-btn');
    if (finishBtn) {
      const isDone = state.completedModules.includes(state.currentModuleId);
      finishBtn.innerHTML = isDone 
        ? `<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> Modul Ini Sudah Selesai`
        : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Tandai Modul Selesai`;
    }
  }

  // --- CONFETTI EFFECT ---
  function triggerCelebration() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  }

  // --- TOAST NOTIFICATION ---
  function showToast(message) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm animate-bounce';
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // --- RENDER MODULE CONTENT ---
  function renderModuleContent() {
    if (!contentAreaEl) return;
    const mod = state.modules.find(m => m.id === state.currentModuleId) || state.modules[0];
    const isDone = state.completedModules.includes(mod.id);
    const modIdx = state.modules.findIndex(m => m.id === mod.id);
    const prevMod = modIdx > 0 ? state.modules[modIdx - 1] : null;
    const nextMod = modIdx < state.modules.length - 1 ? state.modules[modIdx + 1] : null;

    contentAreaEl.innerHTML = `
      <!-- Header Banner Modul -->
      <div class="mb-8 p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="badge bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">Modul ${mod.number}</span>
          <span class="badge bg-blue-400/20 text-blue-200 border border-blue-400/30">${mod.badge}</span>
          <span class="badge bg-purple-400/20 text-purple-200 border border-purple-400/30">${mod.duration}</span>
        </div>
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 text-white">${mod.title}</h1>
        <p class="text-indigo-100/90 text-base md:text-lg max-w-3xl leading-relaxed mb-4">${mod.summary}</p>

        <!-- Unduh PDF -->
        <div class="no-print flex flex-wrap gap-2 mb-6">
          ${mod.pdf ? `
          <a href="${mod.pdf}" download class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-semibold shadow-sm transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Unduh PDF Modul ${mod.number}
          </a>` : ''}
          <a href="assets/pdf/modul-flutter-lengkap.pdf" download class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-semibold transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            Unduh Semua Modul (PDF)
          </a>
        </div>
        
        <!-- Capaian Pembelajaran (CPMK) -->
        <div class="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
          <div class="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Capaian Pembelajaran Mahasiswa (CPMK):
          </div>
          <ul class="text-xs md:text-sm text-indigo-50 space-y-1 pl-5 list-disc">
            ${mod.learningOutcomes.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Navigation Tabs (Materi, Praktikum, Kuis) -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 sticky top-16 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md z-20 py-2">
        <button type="button" data-tab="materi" class="tab-btn px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
          state.currentTab === 'materi'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
        }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          Materi Kuliah & Teori
        </button>
        <button type="button" data-tab="praktikum" class="tab-btn px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
          state.currentTab === 'praktikum'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
        }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
          Tugas Praktikum Mandiri
        </button>
        <button type="button" data-tab="kuis" class="tab-btn px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
          state.currentTab === 'kuis'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
        }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          Kuis Pemahaman (${mod.quiz ? mod.quiz.length : 0})
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="tab-content-container" class="prose max-w-none text-slate-800 dark:text-slate-200">
        ${renderTabContent(mod)}
      </div>

      <!-- Footer Navigation Modul -->
      <div id="footer-navigation" class="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          ${prevMod ? `
            <button type="button" data-go-module="${prevMod.id}" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-sm font-medium transition-all shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              <span>M${prevMod.number}: ${prevMod.title.substring(0, 24)}...</span>
            </button>
          ` : '<span class="text-xs text-slate-400">Awal Modul</span>'}
        </div>

        <div>
          <button type="button" id="mark-finish-module-btn" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${
            isDone 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
          } font-medium text-sm transition-all">
            ${isDone 
              ? `<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> Modul Ini Sudah Selesai`
              : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Tandai Modul Selesai`
            }
          </button>
        </div>

        <div>
          ${nextMod ? `
            <button type="button" data-go-module="${nextMod.id}" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-sm font-medium transition-all shadow-sm">
              <span>M${nextMod.number}: ${nextMod.title.substring(0, 24)}...</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          ` : '<span class="text-xs text-slate-400">Akhir Kurikulum</span>'}
        </div>
      </div>
    `;

    // Pasang listener pada Tab Buttons
    contentAreaEl.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentTab = btn.getAttribute('data-tab');
        renderModuleContent();
      });
    });

    // Pasang listener tombol prev / next
    contentAreaEl.querySelectorAll('[data-go-module]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-go-module');
        state.currentModuleId = targetId;
        state.currentTab = 'materi';
        setSafeHash(targetId);
        renderSidebar();
        renderModuleContent();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Pasang listener tombol Tandai Selesai
    document.getElementById('mark-finish-module-btn')?.addEventListener('click', () => {
      toggleModuleComplete(mod.id);
    });

    // Setup Code Copy Buttons & Syntax Highlighting
    enhanceCodeBlocks();
    setupQuizListeners(mod);

    // Re-run Prism.js syntax highlight
    if (window.Prism && typeof window.Prism.highlightAll === 'function') {
      window.Prism.highlightAll();
    }
  }

  // --- RENDER TAB CONTENT ---
  function renderTabContent(mod) {
    if (state.currentTab === 'praktikum') {
      const lab = mod.labAssignment;
      if (!lab) return '<div class="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">Tidak ada tugas praktikum pada modul pengantar ini.</div>';
      
      return `
        <div class="card p-6 md:p-8 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm mb-6">
          <div class="flex items-center gap-3 mb-4">
            <span class="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            </span>
            <div>
              <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white m-0">${lab.title}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 m-0">Tugas Praktikum Mandiri Mahasiswa</p>
            </div>
          </div>

          <div class="callout callout-info">
            <h4>🎯 Sasaran Praktikum</h4>
            <p>${lab.objective}</p>
          </div>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-3">Langkah-Langkah Pengerjaan:</h3>
          <ol class="space-y-3 pl-6 list-decimal text-slate-700 dark:text-slate-300">
            ${lab.instructions.map(step => `<li class="leading-relaxed">${step}</li>`).join('')}
          </ol>

          <div class="mt-8 p-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Output Hasil yang Diharapkan:
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-300 m-0">${lab.expectedOutput}</p>
          </div>

          <div class="mt-4 p-5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div class="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Rubrik Penilaian Asisten / Dosen:
            </div>
            <p class="text-sm text-amber-700 dark:text-amber-200 m-0">${lab.rubric}</p>
          </div>
        </div>
      `;
    }

    if (state.currentTab === 'kuis') {
      const quiz = mod.quiz || [];
      if (quiz.length === 0) return '<div class="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">Tidak ada kuis pada modul ini.</div>';

      return `
        <div id="quiz-section" class="space-y-8">
          <div class="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
            <h2 class="text-xl font-bold text-indigo-900 dark:text-indigo-200 m-0">Kuis Evaluasi Pemahaman Modul</h2>
            <p class="text-sm text-indigo-700 dark:text-indigo-300 mt-1 mb-0">Uji pemahaman Anda terhadap konsep yang baru saja dipelajari. Pilihlah salah satu jawaban yang paling tepat.</p>
          </div>

          ${quiz.map((q, qIndex) => `
            <div class="card p-6 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm" data-question-index="${qIndex}">
              <div class="font-bold text-base md:text-lg text-slate-900 dark:text-white mb-4">
                <span class="text-indigo-600 dark:text-indigo-400 mr-1.5">Pertanyaan ${qIndex + 1}:</span> ${q.question}
              </div>

              <div class="space-y-3 options-container">
                ${q.options.map((opt, optIndex) => `
                  <div class="quiz-option" data-option-index="${optIndex}">
                    <div class="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-500 option-bullet">
                      ${String.fromCharCode(65 + optIndex)}
                    </div>
                    <div class="flex-1 text-sm text-slate-700 dark:text-slate-200">${opt}</div>
                  </div>
                `).join('')}
              </div>

              <div class="quiz-feedback-box hidden mt-4 p-4 rounded-xl text-sm"></div>
            </div>
          `).join('')}

          <div class="text-center pt-4">
            <button type="button" id="submit-quiz-btn" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all">
              Periksa Jawaban Kuis
            </button>
          </div>
        </div>
      `;
    }

    // Default: Materi Kuliah & Teori
    return mod.sections.map(sec => `
      <section id="${sec.id}" class="mb-12">
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 mb-4">
          ${sec.title}
        </h2>
        <div class="content-body text-slate-700 dark:text-slate-300 text-base leading-relaxed">
          ${sec.content}
        </div>
      </section>
    `).join('');
  }

  // --- SETUP QUIZ LISTENERS ---
  function setupQuizListeners(mod) {
    if (state.currentTab !== 'kuis' || !mod.quiz) return;
    const userAnswers = {};

    document.querySelectorAll('[data-question-index]').forEach(qCard => {
      const qIndex = parseInt(qCard.getAttribute('data-question-index'), 10);
      const options = qCard.querySelectorAll('.quiz-option');

      options.forEach(opt => {
        opt.addEventListener('click', () => {
          // Deselect siblings
          options.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          userAnswers[qIndex] = parseInt(opt.getAttribute('data-option-index'), 10);
        });
      });
    });

    document.getElementById('submit-quiz-btn')?.addEventListener('click', () => {
      let correctCount = 0;
      const total = mod.quiz.length;

      document.querySelectorAll('[data-question-index]').forEach(qCard => {
        const qIndex = parseInt(qCard.getAttribute('data-question-index'), 10);
        const qData = mod.quiz[qIndex];
        const selected = userAnswers[qIndex];
        const feedbackEl = qCard.querySelector('.quiz-feedback-box');
        const options = qCard.querySelectorAll('.quiz-option');

        if (selected === undefined) {
          if (feedbackEl) {
            feedbackEl.className = 'quiz-feedback-box mt-4 p-4 rounded-xl text-sm bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
            feedbackEl.innerHTML = '⚠️ Anda belum memilih jawaban untuk pertanyaan ini.';
            feedbackEl.classList.remove('hidden');
          }
          return;
        }

        const isCorrect = selected === qData.correctIndex;
        if (isCorrect) correctCount++;

        options.forEach((opt, idx) => {
          opt.classList.remove('selected', 'correct', 'incorrect');
          if (idx === qData.correctIndex) {
            opt.classList.add('correct');
          } else if (idx === selected && !isCorrect) {
            opt.classList.add('incorrect');
          }
        });

        if (feedbackEl) {
          feedbackEl.className = `quiz-feedback-box mt-4 p-4 rounded-xl text-sm ${
            isCorrect 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' 
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
          }`;
          feedbackEl.innerHTML = `
            <div class="font-bold mb-1">${isCorrect ? '✅ Jawaban Anda Benar!' : '❌ Jawaban Belum Tepat'}</div>
            <p class="m-0">${qData.explanation}</p>
          `;
          feedbackEl.classList.remove('hidden');
        }
      });

      if (correctCount === total) {
        triggerCelebration();
        showToast(`🎉 Sempurna! Skor Anda: ${correctCount}/${total} (100%)`);
      } else {
        showToast(`Skor Kuis Anda: ${correctCount}/${total}`);
      }
    });
  }

  // --- CODE THEME TOGGLER HELPERS ---
  function updateCodeContainerTheme(container, theme) {
    if (theme === 'light') {
      container.classList.remove('code-theme-dark');
      container.classList.add('code-theme-light');
    } else {
      container.classList.remove('code-theme-light');
      container.classList.add('code-theme-dark');
    }

    const toggleBtn = container.querySelector('.code-theme-toggle-btn');
    if (toggleBtn) {
      if (theme === 'light') {
        toggleBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          <span class="font-medium text-[11px]">Terang</span>
        `;
        toggleBtn.title = "Tema Kode saat ini: Terang (Klik untuk ganti ke Mode Gelap)";
      } else {
        toggleBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
          <span class="font-medium text-[11px]">Gelap</span>
        `;
        toggleBtn.title = "Tema Kode saat ini: Gelap (Klik untuk ganti ke Mode Terang)";
      }
    }
  }

  function updateAllCodeSnippetThemes() {
    document.querySelectorAll('.code-container').forEach(c => {
      updateCodeContainerTheme(c, state.codeTheme);
    });
  }

  function toggleCodeTheme() {
    state.codeTheme = state.codeTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('flutter_code_theme', state.codeTheme);
    updateAllCodeSnippetThemes();
    showToast(state.codeTheme === 'light' ? '☀️ Mode Terang diaktifkan pada cuplikan kode' : '🌙 Mode Gelap diaktifkan pada cuplikan kode');
  }

  // --- ENHANCE CODE BLOCKS WITH THEME TOGGLE & COPY BUTTON ---
  function enhanceCodeBlocks() {
    document.querySelectorAll('pre code').forEach((codeBlock) => {
      const pre = codeBlock.parentElement;
      if (pre.parentElement.classList.contains('code-container')) return;

      const container = document.createElement('div');
      container.className = `code-container code-theme-${state.codeTheme}`;

      // Detect language
      let lang = 'code';
      codeBlock.classList.forEach(cls => {
        if (cls.startsWith('language-')) lang = cls.replace('language-', '');
      });

      const header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="code-lang-badge uppercase tracking-wider font-semibold text-xs">${lang}</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="code-theme-toggle-btn" title="Ganti mode tema kode (Terang / Gelap)">
            ${state.codeTheme === 'light' ? `
              <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <span class="font-medium text-[11px]">Terang</span>
            ` : `
              <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
              </svg>
              <span class="font-medium text-[11px]">Gelap</span>
            `}
          </button>
          <button type="button" class="code-copy-btn" title="Salin seluruh kode ke clipboard">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            <span class="text-[11px]">Salin Kode</span>
          </button>
        </div>
      `;

      pre.parentNode.insertBefore(container, pre);
      container.appendChild(header);
      container.appendChild(pre);

      // Listener for code theme switch
      header.querySelector('.code-theme-toggle-btn')?.addEventListener('click', () => {
        toggleCodeTheme();
      });

      // Listener for copy code
      header.querySelector('.code-copy-btn')?.addEventListener('click', () => {
        const text = codeBlock.innerText;
        navigator.clipboard.writeText(text).then(() => {
          const btn = header.querySelector('.code-copy-btn');
          btn.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-[11px]">Tersalin!</span>
          `;
          setTimeout(() => {
            btn.innerHTML = `
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              <span class="text-[11px]">Salin Kode</span>
            `;
          }, 2000);
        });
      });
    });
  }

  // --- RENDER CHEATSHEET VIEW ---
  function renderCheatsheet() {
    if (!contentAreaEl) return;
    const cs = state.cheatsheet;
    state.isCheatsheetView = true;

    contentAreaEl.innerHTML = `
      <div class="mb-8 p-6 md:p-8 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg">
        <h1 class="text-3xl md:text-4xl font-extrabold mb-3">Flutter & Dart Cheat Sheet</h1>
        <p class="text-purple-100 max-w-2xl text-base md:text-lg">Referensi cepat perintah CLI terminal, shortcut VS Code, sintaks kunci Dart 3, dan pengelompokan widget utama Flutter untuk praktikum mahasiswa.</p>
      </div>

      <!-- Section CLI -->
      <section class="mb-10">
        <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <span>💻 Perintah CLI Terminal (Flutter Essentials)</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cs.cli.map(item => `
            <div class="card p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
              <code class="text-indigo-600 dark:text-indigo-400 font-bold font-mono text-sm block mb-1">${item.command}</code>
              <p class="text-xs text-slate-600 dark:text-slate-300 m-0">${item.description}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Section Shortcuts -->
      <section class="mb-10">
        <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <span>⌨️ Shortcut VS Code Developer Mobile</span>
        </h2>
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Aksi / Perintah</th>
                <th>Shortcut macOS</th>
                <th>Shortcut Windows / Linux</th>
              </tr>
            </thead>
            <tbody>
              ${cs.vscode.map(sc => `
                <tr>
                  <td class="font-medium">${sc.action}</td>
                  <td><kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-700 border rounded text-xs font-mono">${sc.shortcutMac}</kbd></td>
                  <td><kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-700 border rounded text-xs font-mono">${sc.shortcutWin}</kbd></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Section Dart 3 Syntax -->
      <section class="mb-10">
        <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <span>🎯 Sintaks Kunci Dart 3 Modern</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cs.dartSyntax.map(syn => `
            <div class="card p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
              <div class="font-bold text-slate-900 dark:text-white text-sm mb-1">${syn.title}</div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">${syn.desc}</p>
              <pre><code class="language-dart">${syn.code}</code></pre>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Section Widgets by Category -->
      <section class="mb-10">
        <h2 class="text-xl md:text-2xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <span>🧱 Taksonomi Widget Penting Flutter</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cs.widgetCategory.map(cat => `
            <div class="card p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
              <h3 class="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2">${cat.category}</h3>
              <div class="flex flex-wrap gap-1.5">
                ${cat.widgets.map(w => `<span class="badge badge-primary font-mono text-xs">${w}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    enhanceCodeBlocks();
    if (window.Prism && typeof window.Prism.highlightAll === 'function') {
      window.Prism.highlightAll();
    }
  }

  // --- NAVIGATION EVENT LISTENERS ---
  // Brand Home Logo Click
  document.getElementById('brand-home-btn')?.addEventListener('click', () => {
    navigateToModule('modul-00', 'materi', null, true);
  });

  // Sidebar Capstone Nav Button Click
  document.getElementById('capstone-nav-btn')?.addEventListener('click', () => {
    navigateToModule('modul-12', 'materi', 'capstone-guidelines', true);
  });

  // Sidebar Cheatsheet Nav Button Click
  cheatsheetNavBtn?.addEventListener('click', () => {
    renderCheatsheet();
    setSafeHash('cheatsheet');
    renderSidebar();
    toggleMobileSidebar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Desktop Navbar Links
  navModulesBtn?.addEventListener('click', () => {
    navigateToModule(state.currentModuleId || 'modul-00', 'materi', null, true);
  });

  navCheatsheetBtn?.addEventListener('click', () => {
    renderCheatsheet();
    setSafeHash('cheatsheet');
    renderSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  navCapstoneBtn?.addEventListener('click', () => {
    navigateToModule('modul-12', 'materi', 'capstone-guidelines', true);
  });

  // Mobile Bottom Navigation Links
  mobNavModules?.addEventListener('click', () => {
    navigateToModule(state.currentModuleId || 'modul-00', 'materi', null, true);
  });

  mobNavCheatsheet?.addEventListener('click', () => {
    renderCheatsheet();
    setSafeHash('cheatsheet');
    renderSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  mobNavCapstone?.addEventListener('click', () => {
    navigateToModule('modul-12', 'materi', 'capstone-guidelines', true);
  });

  mobNavMenu?.addEventListener('click', () => {
    toggleMobileSidebar(true);
  });

  // --- GLOBAL SEARCH MODAL ---
  function openSearchModal() {
    searchResultsModal?.classList.remove('hidden');
    searchInputEl?.focus();
  }

  function closeSearchModal() {
    searchResultsModal?.classList.add('hidden');
  }

  closeSearchBtn?.addEventListener('click', closeSearchModal);
  searchResultsModal?.addEventListener('click', (e) => {
    if (e.target === searchResultsModal) closeSearchModal();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === 'Escape') {
      closeSearchModal();
    }
  });

  // Handle Search Input Typing
  searchInputEl?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!searchResultsList) return;

    if (!query) {
      searchResultsList.innerHTML = '<div class="text-sm text-slate-400 text-center py-8">Ketik kata kunci pencarian (contoh: Provider, SQLite, Column, initState)...</div>';
      return;
    }

    const matches = [];
    state.modules.forEach(mod => {
      // Check title or summary
      if (mod.title.toLowerCase().includes(query) || mod.summary.toLowerCase().includes(query)) {
        matches.push({
          type: 'Modul',
          moduleId: mod.id,
          title: `Modul ${mod.number}: ${mod.title}`,
          snippet: mod.summary.substring(0, 110) + '...'
        });
      }

      // Check sections
      mod.sections.forEach(sec => {
        if (sec.title.toLowerCase().includes(query) || sec.content.toLowerCase().includes(query)) {
          // Extract plain text snippet
          const tmp = document.createElement('div');
          tmp.innerHTML = sec.content;
          const text = tmp.textContent || tmp.innerText || '';
          const idx = text.toLowerCase().indexOf(query);
          const snippet = text.substring(Math.max(0, idx - 40), Math.min(text.length, idx + 100));

          matches.push({
            type: 'Topik',
            moduleId: mod.id,
            sectionId: sec.id,
            title: `${sec.title} (Modul ${mod.number})`,
            snippet: '...' + snippet + '...'
          });
        }
      });
    });

    if (matches.length === 0) {
      searchResultsList.innerHTML = `<div class="text-sm text-slate-400 text-center py-8">Tidak ditemukan hasil untuk "<strong>${query}</strong>"</div>`;
      return;
    }

    searchResultsList.innerHTML = matches.slice(0, 12).map((res, i) => `
      <div class="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700" data-search-target="${res.moduleId}" data-search-sec="${res.sectionId || ''}">
        <div class="flex items-center gap-2 mb-1">
          <span class="badge ${res.type === 'Modul' ? 'badge-primary' : 'badge-success'} text-[10px]">${res.type}</span>
          <span class="font-bold text-sm text-slate-800 dark:text-slate-100">${res.title}</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 m-0 leading-relaxed">${res.snippet}</p>
      </div>
    `).join('');

    searchResultsList.querySelectorAll('[data-search-target]').forEach(item => {
      item.addEventListener('click', () => {
        const modId = item.getAttribute('data-search-target');
        const secId = item.getAttribute('data-search-sec');
        closeSearchModal();
        state.isCheatsheetView = false;
        state.currentModuleId = modId;
        state.currentTab = 'materi';
        setSafeHash(modId);
        renderSidebar();
        renderModuleContent();

        if (secId) {
          setTimeout(() => {
            const targetSec = document.getElementById(secId);
            if (targetSec && typeof targetSec.scrollIntoView === 'function') {
              targetSec.scrollIntoView({ behavior: 'smooth' });
            }
          }, 150);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  });

  // Search trigger buttons (Desktop + Mobile)
  document.getElementById('search-trigger-btn')?.addEventListener('click', openSearchModal);
  document.getElementById('mobile-search-btn')?.addEventListener('click', openSearchModal);

  // --- INITIAL ROUTING CHECK ---
  let initialId = 'modul-00';
  try {
    const rawHash = window.location.hash.replace('#', '');
    if (rawHash === 'cheatsheet') {
      initialId = 'cheatsheet';
    } else if (rawHash && state.modules.some(m => m.id === rawHash)) {
      initialId = rawHash;
    } else {
      const saved = localStorage.getItem('flutter_current_module');
      if (saved && (saved === 'cheatsheet' || state.modules.some(m => m.id === saved))) {
        initialId = saved;
      }
    }
  } catch (e) {
    initialId = 'modul-00';
  }

  if (initialId === 'cheatsheet') {
    renderCheatsheet();
  } else {
    state.currentModuleId = initialId;
    renderModuleContent();
  }

  // --- FIRST RENDER ---
  applyTheme();
  updateProgress();
  renderSidebar();
});
