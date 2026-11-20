# To-Do List Life Dashboard

Mini project untuk RevoU Coding Camp — sebuah dashboard produktivitas harian yang dibangun dengan **HTML, CSS, dan Vanilla JavaScript** murni tanpa framework atau library eksternal.

---

## Daftar Isi

- [Gambaran Proyek](#gambaran-proyek)
- [Struktur File](#struktur-file)
- [Spesifikasi Fitur](#spesifikasi-fitur)
- [Breakdown Langkah Pengembangan](#breakdown-langkah-pengembangan)
- [Penyimpanan Data](#penyimpanan-data)
- [Catatan Teknis](#catatan-teknis)

---

## Gambaran Proyek

Dashboard ini menggabungkan lima komponen produktivitas dalam satu halaman: greeting dinamis dengan jam, focus timer Pomodoro, to-do list, dan quick links — semuanya persisten menggunakan `localStorage` tanpa backend.

---

## Struktur File

```
├── index.html          # Markup utama, satu halaman
├── css/
│   └── style.css       # Seluruh styling: tema, layout, komponen
├── js/
│   └── app.js          # Seluruh logic: timer, to-do, links, tema
└── README.md
```

Aturan keras: tepat **1 file CSS** di `css/` dan **1 file JS** di `js/`. Tidak ada build tool, bundler, atau dependency eksternal.

---

## Spesifikasi Fitur

### MVP 1 — Header Dinamis (Greeting, Tanggal, Jam)

| Aspek | Detail |
|---|---|
| Greeting | Berubah otomatis berdasarkan jam: Good Morning (05–11), Good Afternoon (12–17), Good Evening (18–20), Good Night (21–04) |
| Jam | Format 24-jam `HH:MM:SS`, diperbarui setiap detik via `setInterval` |
| Tanggal | Format panjang bahasa Inggris, contoh: `Monday, November 26, 2024` |
| Custom name | Tombol ✎ membuka form inline; nama disimpan ke `localStorage`; greeting menjadi `Good Morning, [Nama]` |

**Challenge: Custom Name in Greeting** — nama disimpan persisten, form bisa dibatalkan, input dibatasi 30 karakter.

---

### MVP 2 — Focus Timer (Pomodoro 25 Menit)

| Aspek | Detail |
|---|---|
| Durasi | 25 menit (1.500 detik), tidak dapat dikonfigurasi dari UI |
| Tombol Start | Memulai countdown; tidak melakukan apa-apa jika sudah berjalan |
| Tombol Stop | Menjeda timer; status berubah menjadi "Paused" |
| Tombol Reset | Menghentikan dan mengembalikan ke 25:00 |
| Selesai | Saat mencapai 00:00, interval dibersihkan dan status berubah menjadi "Session complete! Take a short break." |
| Tampilan | Format `MM:SS` dengan leading zero |

---

### MVP 3 — To-Do List

| Aspek | Detail |
|---|---|
| Tambah | Form submit; task kosong diabaikan |
| Tampilkan | List `<ul>` yang dirender ulang setiap mutasi |
| Selesaikan | Checkbox mengubah `completed`; teks dicoret |
| Edit | Tombol ✎ membuka input inline di baris yang sama; simpan via tombol Save atau tekan Enter; batal via tombol Cancel atau tekan Escape |
| Hapus | Tombol ✕ menghapus task dari array |
| Counter | Badge `X/Y done` diperbarui setiap render |
| Empty state | Pesan placeholder muncul ketika list kosong |
| Persistensi | Disimpan ke `localStorage` setiap mutasi |

**Challenge: Prevent Duplicate Tasks** — pengecekan dilakukan saat tambah dan saat simpan edit, case-insensitive, dengan pesan error yang ditampilkan di bawah form. Error dibersihkan saat user mulai mengetik ulang.

---

### MVP 4 — Quick Links

| Aspek | Detail |
|---|---|
| Default links | Google, GitHub, YouTube — dimuat sekali saat `localStorage` kosong |
| Tambah | Form dua field: nama situs dan URL |
| Normalisasi URL | Jika input tidak diawali `http://` atau `https://`, otomatis ditambahkan `https://` |
| Buka | Link dibuka di tab baru (`target="_blank"`) dengan `rel="noopener noreferrer"` |
| Hapus | Tombol ✕ di setiap item |
| Persistensi | Disimpan ke `localStorage` setiap mutasi |

---

### Challenge — Light / Dark Mode

| Aspek | Detail |
|---|---|
| Implementasi | Atribut `data-theme="dark"` pada `<html>`; semua warna via CSS custom properties |
| Toggle | Tombol di header kanan; label berubah antara "🌙 Dark Mode" dan "☀️ Light Mode" |
| Persistensi | Preferensi disimpan ke `localStorage` dan diterapkan saat load |

---

## Breakdown Langkah Pengembangan

### Fase 1 — Fondasi (HTML + CSS)
1. Buat markup `index.html` dengan struktur semantik: `<header>`, `<main>`, `<section>` per fitur.
2. Buat CSS variables untuk tema light di `:root` dan tema dark di `[data-theme="dark"]`.
3. Susun layout dua kolom dengan CSS Grid (`dashboard-grid`).
4. Buat komponen dasar: `.card`, `.btn`, `input[type="text"]`.
5. Tambahkan `@media (max-width: 768px)` untuk tampilan mobile single-column.

### Fase 2 — Infrastruktur JS
6. Definisikan konstanta `STORAGE_KEYS` untuk semua key localStorage.
7. Buat helper `loadJSON(key, fallback)` dan `saveJSON(key, value)` dengan `try/catch`.
8. Implementasi `applyTheme()` dan event listener toggle tema.

### Fase 3 — Header Dinamis
9. Implementasi `getGreetingByHour()` dan `updateClockAndGreeting()`.
10. Jalankan `setInterval(updateClockAndGreeting, 1000)` untuk update jam.
11. Implementasi form custom name: show/hide, submit, cancel, simpan ke localStorage.

### Fase 4 — Focus Timer
12. Deklarasikan `remainingSeconds` dan `timerInterval` sebagai state timer.
13. Implementasi `startTimer()`, `stopTimer()`, `resetTimer()`, dan `renderTimer()`.
14. Pasang event listener ke tiga tombol.

### Fase 5 — To-Do List
15. Load tasks dari localStorage.
16. Implementasi `renderTasks()` yang membangun DOM dari array `tasks`.
17. Implementasi `isDuplicateTask()` dengan normalisasi lowercase.
18. Pasang handler submit form untuk tambah task.
19. Implementasi mode edit inline di dalam `renderTasks()`.
20. Implementasi hapus task.

### Fase 6 — Quick Links
21. Load links dari localStorage; isi default jika null.
22. Implementasi `normalizeUrl()`.
23. Implementasi `renderLinks()` dan handler form tambah link.
24. Implementasi hapus link.

---

## Penyimpanan Data

Semua data disimpan di `localStorage` browser dengan key berikut:

| Key | Tipe | Isi |
|---|---|---|
| `life_dashboard_tasks` | JSON array | `[{ id, text, completed }]` |
| `life_dashboard_links` | JSON array | `[{ id, name, url }]` |
| `life_dashboard_name` | string | Nama custom pengguna |
| `life_dashboard_theme` | string | `"light"` atau `"dark"` |

Data tidak dikirim ke mana pun — murni client-side.

---

## Catatan Teknis

- **Tidak ada dependency eksternal.** Tidak ada npm, tidak ada CDN, tidak ada framework.
- **Satu halaman.** Semua fitur ada di `index.html` yang sama.
- **Render pattern.** To-do list dan quick links menggunakan pola "clear and re-render": setiap mutasi data memanggil ulang fungsi render yang membangun ulang seluruh DOM dari array sumber.
- **ID generation.** ID untuk task dan link dibuat dengan `task-${Date.now()}` dan `link-${Date.now()}`, cukup untuk penggunaan single-user.
- **Timer tidak persisten.** State timer direset setiap kali halaman di-refresh, sesuai perilaku Pomodoro yang lazim.
