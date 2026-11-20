# Changelog

Semua perubahan signifikan pada proyek ini didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.0] — Audit & Peningkatan Kualitas

### Ditambahkan

#### `README.md`
- Dokumentasi lengkap spesifikasi setiap fitur dalam format tabel (MVP 1–4 dan 3 Challenge).
- Breakdown 24 langkah pengembangan terurut dari fase HTML/CSS dasar hingga Quick Links.
- Tabel skema penyimpanan `localStorage` (key, tipe data, isi).
- Catatan teknis: render pattern, ID generation, dan perilaku timer non-persisten.

#### `js/app.js`
- `timerHasStarted` — flag baru untuk mencegah tombol Stop menampilkan status "Paused" sebelum timer pernah dijalankan.
- `isValidUrl(url)` — fungsi validasi URL menggunakan `new URL()` bawaan browser; hanya menerima protokol `http:` dan `https:`.
- Countdown timer kini juga ditampilkan di **tab title** browser (`MM:SS — Dashboard`) saat sesi sedang berjalan.
- `editInput.select()` pada mode edit inline to-do — teks lama otomatis terseleksi saat edit dibuka.
- `aria-label` pada input edit inline to-do untuk keterbacaan screen reader.
- `aria-pressed` pada tombol Start timer untuk status aksesibilitas yang akurat.
- `aria-invalid="true"` pada field URL Quick Links saat input tidak valid, dibersihkan otomatis saat user mulai mengetik ulang.

#### `css/style.css`
- `:focus-visible` global dengan `box-shadow` ring konsisten — keyboard navigation terlihat jelas di semua elemen interaktif.
- `@media (prefers-reduced-motion: reduce)` — semua transisi dimatikan untuk pengguna yang sensitif terhadap animasi.
- `--min-touch: 44px` (WCAG 2.5.5) — diterapkan ke semua tombol, input, dan link sebagai ukuran target minimum.
- `--focus-ring` sebagai CSS variable terpusat — ring berbeda antara tema light dan dark.
- `input[aria-invalid="true"]` — border dan shadow merah saat field URL tidak valid.
- `#timer-start[aria-pressed="true"]` — style visual "ditekan" saat timer sedang berjalan.
- `.feedback-text` mendapat `border-left: 3px solid var(--danger)` — pesan error tidak bergantung hanya pada warna.
- `.todo-item.completed` mendapat `opacity: 0.75` — seluruh baris meredup, bukan hanya teks.
- `.todo-item:hover:not(.completed)` mendapat background `var(--surface)` — umpan balik hover lebih jelas.
- `.timer-status` mendapat `min-height: 1.4em` — layout tidak bergeser saat teks status berganti.
- `.link-item:hover` — transisi border-color ditambahkan.
- `.link-anchor` mendapat `text-decoration: underline` saat `:focus-visible`.
- Breakpoint `@media (max-width: 400px)` untuk layar sangat kecil (timer dan clock menyusut).
- `.todo-form` dan `.name-form` wrap di layar mobile sehingga tombol tidak terpotong.

### Diperbaiki

#### `js/app.js`

| # | Lokasi | Deskripsi Bug | Perbaikan |
|---|---|---|---|
| 1 | `saveJSON` | `localStorage.setItem` tidak dibungkus `try/catch`; `QuotaExceededError` (mode private / storage penuh) menyebabkan crash diam | Tambah `try/catch` dengan `console.warn` |
| 2 | Theme — load | `localStorage.getItem` langsung, bypass wrapper `loadJSON` | Ganti ke `loadJSON(STORAGE_KEYS.THEME, "light")` |
| 3 | Theme — save | `localStorage.setItem` langsung di dalam `applyTheme()` | Ganti ke `saveJSON` |
| 4 | Theme — toggle | Kondisi `current` membaca `getAttribute` lalu menetapkan string yang sama — logika fragile walau kebetulan benar | Tulis ulang: `const isDark = ... === "dark"; applyTheme(isDark ? "light" : "dark")` |
| 5 | Custom name — load | Nama disimpan sebagai plain string; saat dibaca ulang lewat `JSON.parse` hasilnya `null` | Guard: `if (typeof customName !== "string") customName = ""` |
| 6 | Timer — Stop sebelum Start | Menekan Stop sebelum Start menampilkan status "Paused" tanpa konteks | Tambah flag `timerHasStarted`; Stop hanya bereaksi setelah Start pernah dipanggil |
| 7 | Timer — Start dari 00:00 | Reset `remainingSeconds` ke `FOCUS_DURATION` tapi tidak memanggil `renderTimer()` — display masih `00:00` selama 1 detik pertama | Panggil `renderTimer()` sebelum `setInterval` dimulai |
| 8 | To-do edit — aksesibilitas | Input inline tidak memiliki `aria-label` — tidak terbaca screen reader | Tambah `aria-label="Edit task: [nama task]"` |
| 9 | `isDuplicateTask` — data korup | Tidak ada guard pada `task.text` yang bisa `undefined`/non-string pada data localStorage yang rusak; `.toLowerCase()` melempar TypeError | Tambah `typeof task.text === "string"` sebelum perbandingan |
| 10 | Quick Links — validasi URL | String apapun yang non-kosong lolos (`"notaurl"`, `"hello world"`) dan tersimpan sebagai link rusak | Tambah `isValidUrl()` menggunakan `new URL()` browser; tolak jika bukan `http:` atau `https:` |

---

## [1.0.0] — Initial Commit

- Markup `index.html` dengan layout header + dashboard dua kolom.
- Tema light/dark via CSS custom properties dan atribut `data-theme`.
- Greeting dinamis, jam real-time, dan custom name tersimpan di `localStorage`.
- Focus Timer Pomodoro 25 menit dengan Start, Stop, Reset.
- To-do list dengan tambah, edit inline, hapus, centang selesai, dan pencegahan duplikat.
- Quick Links dengan tambah, hapus, normalisasi URL, dan tiga default links.
- Semua data persisten via `localStorage`.
- Responsif untuk layar ≤ 768 px.
