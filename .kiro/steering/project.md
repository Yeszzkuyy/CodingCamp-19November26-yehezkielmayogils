# Project Steering — To-Do List Life Dashboard

## Stack
- HTML5, CSS3, Vanilla JavaScript (ES2020+)
- Tidak ada framework, bundler, atau dependency eksternal
- Tepat 1 file CSS (`css/style.css`) dan 1 file JS (`js/app.js`)

## Aturan Pengembangan
- Jangan menambahkan file konfigurasi (package.json, tsconfig, dll.)
- Jangan menambahkan file testing
- Jangan menambahkan fitur di luar MVP dan 3 challenge yang sudah ada
- Semua data persisten via `localStorage` — tidak ada backend

## Fitur yang Ada (jangan duplikasi)
1. Header: greeting dinamis + jam + custom name
2. Focus Timer: Pomodoro 25 menit
3. To-Do List: CRUD + duplicate prevention
4. Quick Links: tambah/hapus dengan validasi URL
5. Light/Dark Mode: via `data-theme` attribute + CSS variables

## Konvensi Kode
- `localStorage` selalu diakses lewat `loadJSON` / `saveJSON` (ada error handling)
- ID unik: `task-${Date.now()}` / `link-${Date.now()}`
- Render pattern: clear innerHTML lalu rebuild dari array sumber
- Aksesibilitas: semua tombol punya `aria-label`, input punya focus ring via `:focus-visible`
