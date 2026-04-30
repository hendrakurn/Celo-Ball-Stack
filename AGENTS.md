## Konteks Project

  Project ini adalah StackBall Celo:
  - Game Stack Ball sudah dibuat.
  - Smart contract sudah dibuat dan sudah terintegrasi ke frontend.
  - UI frontend sudah ada.
  - Stack: Next.js App Router, TypeScript, Tailwind CSS, wagmi, viem.
  - Wallet target: MiniPay / injected wallet.
  - ABI dan address contract sudah ada di `lib/abi-contract/`.

  Tugas Codex sekarang adalah mengubah tampilan UI, font, landing background,
navbar kanan atas, dan membuat halaman baru untuk leaderboard serta profile.

  ---

  ## Wajib Dibaca Sebelum Edit Kode

  Sebelum menulis kode apa pun, baca file ini:

  1. `app/layout.tsx`
  2. `app/page.tsx`
  3. `app/globals.css`
  4. `components/game/GameController.tsx`
  5. `app/components/game/leaderboard.tsx`
  6. `app/components/game/player-stats.tsx`
  7. `app/components/game/prize-pool.tsx`
  8. `app/components/game/game-timer.tsx`
  9. `hooks/useWallet.ts`
  10. `hooks/useLeaderboard.ts`
  11. `hooks/usePlayerStats.ts`
  12. `hooks/usePrizePool.ts`

  Karena project memakai Next.js App Router versi baru, baca juga guide relevan
di:

  ```txt
  node_modules/next/dist/docs/

  Minimal baca docs untuk:

  - App Router routes/pages
  - Client Components
  - local fonts / font usage jika tersedia

  ———

  ## Font

  Font sudah tersedia di:

  public/fonts/2222.ttf
  public/fonts/Supply Center.ttf

  Aturan font:

  - 2222.ttf dipakai untuk judul utama, brand, heading besar, dan display
    text.
  - Supply Center.ttf dipakai untuk font normal: body, button, nav, stat,
    table, leaderboard, profile, dan semua teks biasa.

  Implementasi wajib:

  - Gunakan next/font/local di app/layout.tsx.
  - Jangan pakai Google font lagi jika local font sudah dipasang.
  - Buat CSS variable:
      - --font-title
      - --font-body
  - body harus memakai --font-body.
  - Heading besar seperti Stack Ball Celo, page title, dan judul utama harus
    memakai --font-title.

  Contoh arah implementasi:

  import localFont from "next/font/local";

  const titleFont = localFont({
    src: "../public/fonts/2222.ttf",
    variable: "--font-title",
  });

  const bodyFont = localFont({
    src: "../public/fonts/Supply Center.ttf",
    variable: "--font-body",
  });

  Lalu pasang variable di <html className="...">.

  ———

  ## Landing Page / Screen Sebelum Connect Wallet

  Saat user pertama kali masuk dan wallet belum connect, flow sekarang
  menampilkan landing screen dengan teks:

  - Onchain arcade
  - Stack Ball Celo
  - Break stacks. Submit your score. Top 3 win CELO every 3 days.
  - prize strip
  - tombol connect wallet
  - Pay only gas fee

  Semua teks dan struktur utama ini harus dipertahankan.

  Yang diubah hanya background.

  Background baru:

  - Background landing harus terlihat seperti tampilan game setelah wallet
    connect.
  - Tampilan game connected screen adalah background langit biru / game
    canvas.
  - Background landing harus memakai versi blur dari tampilan connected game.
  - Blur sekitar 70%.
  - Jangan memakai screenshot image file.
  - Recreate background dengan CSS layer, pseudo-element, gradient, blur, dan
    overlay.
  - Teks landing harus tetap jelas dibaca.
  - Pastikan mobile tidak overlap.

  Implementasi yang disarankan:

  - Tambahkan pseudo-element pada .stackball-connectShell::before.
  - Buat background mirip .stackball-engine atau .stackball-onchainStage.
  - Pakai filter: blur(...), transform: scale(...), dan opacity.
  - Tambahkan overlay gelap/transparan agar teks tetap readable.
  - Konten landing harus berada di atas background blur dengan position:
    relative; z-index.

  ———

  ## Connected Game Screen

  Saat wallet sudah connect, game screen sudah benar untuk pojok kiri atas:

  - Level
  - Score
  - Combo

  Jangan ubah fungsi HUD kiri atas.

  Yang harus diubah:

  - Pojok kanan atas saat ini tidak boleh lagi menampilkan full panel
    leaderboard/profile/prize pool.
  - Ganti bagian kanan atas menjadi navbar/tombol compact.

  Navbar kanan atas harus berisi:

  1. Wallet / Connect Wallet state
      - Jika wallet connect, tampilkan address pendek.
      - Jika belum connect, tampilkan tombol connect.
  2. Leaderboard
      - Link ke /leaderboard
  3. Profile
      - Link ke /profile

  Style navbar:

  - Mirip style HUD kiri atas.
  - Translucent glass.
  - Border putih transparan.
  - Background putih transparan.
  - backdrop-filter: blur(...).
  - Border radius 8px.
  - Dibuat agak memanjang horizontal.
  - Posisi di pojok kanan atas.
  - Tidak menutupi game.
  - Responsive di mobile.

  Gunakan next/link untuk tombol Leaderboard dan Profile.

  ———

  ## Route Baru

  Buat route App Router baru:

  app/leaderboard/page.tsx
  app/profile/page.tsx

  ### /leaderboard

  Page ini harus menampilkan:

  - Leaderboard
  - Period reset timer
  - Prize pool CELO

  Gunakan komponen/hook yang sudah ada:

  - Leaderboard
  - GameTimer
  - PrizePool
  - useLeaderboard
  - usePrizePool

  Page harus:

  - Client component jika memakai wagmi hooks langsung.
  - Punya background game-themed yang konsisten dengan game screen.
  - Punya tombol/link kembali ke /.
  - Tampil bagus di desktop dan mobile.

  ### /profile

  Page ini harus menampilkan:

  - Player statistics

  Gunakan:

  - PlayerStats
  - usePlayerStats
  - useWallet

  Page harus:

  - Menampilkan wallet/address jika connect.
  - Jika belum connect, tampilkan CTA connect wallet.
  - Punya tombol/link kembali ke /.
  - Background konsisten dengan game-themed UI.
  - Tampil bagus di desktop dan mobile.

  ———

  ## Web3 Rules

  Jangan edit file generated ABI/address:

  lib/abi-contract/StackBallGame.ts
  lib/abi-contract/StackBallGame.json
  lib/abi-contract/constants.ts
  lib/abi-contract/Counter.ts
  lib/abi-contract/Counter.json

  Jangan hardcode ABI atau contract address.

  Jika butuh contract data, gunakan existing hooks:

  - hooks/useLeaderboard.ts
  - hooks/usePlayerStats.ts
  - hooks/usePrizePool.ts
  - hooks/useWallet.ts

  Jika butuh ABI/address, import dari:

  import { StackBallGameABI } from "@/lib/abi-contract/StackBallGame";
  import { CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/abi-contract/constants";

  Semua bigint dari contract hanya boleh dikonversi Number() untuk display.

  Prize CELO harus tetap pakai formatEther dari viem.

  ———

  ## Styling Rules

  - Jangan membuat landing page marketing baru. Pertahankan pengalaman game-
    first.
  - Jangan mengubah game mechanic.
  - Jangan mengubah smart contract.
  - Jangan mengubah ABI generated.
  - Jangan membuat card di dalam card.
  - Radius card/panel maksimal 8px kecuali style existing memang sudah
    berbeda.
  - Jangan gunakan negative letter spacing.
  - Pastikan teks tidak overlap di mobile.
  - Pastikan navbar kanan atas tidak menutupi HUD kiri atas.
  - Pastikan landing text tetap readable di atas blurred background.
  - Gunakan class CSS existing sebisa mungkin, lalu tambah class baru hanya
    jika perlu.

  ———

  ## File Target Utama

  Kemungkinan file yang perlu diedit:

  app/layout.tsx
  app/page.tsx
  app/globals.css
  components/game/GameController.tsx

  Kemungkinan file baru:

  app/leaderboard/page.tsx
  app/profile/page.tsx

  Boleh membuat shared component kecil jika benar-benar perlu, misalnya:

  app/components/game/game-nav.tsx

  ———

  ## Acceptance Criteria

  Implementasi dianggap selesai jika:

  1. Font title berubah ke 2222.ttf.
  2. Font body/UI berubah ke Supply Center.ttf.
  3. Landing page tetap menampilkan teks lama, tapi background berubah menjadi
     connected game screen style yang diblur.
  4. Connected game screen tetap menampilkan Level, Score, Combo di kiri atas.
  5. Kanan atas connected game screen menampilkan navbar:
      - wallet/connect
      - leaderboard
      - profile
  6. Full info dock kanan atas tidak muncul lagi di game canvas.
  7. /leaderboard tersedia dan menampilkan leaderboard, timer reset, dan prize
     pool.
  8. /profile tersedia dan menampilkan player stats.
  9. Mobile layout tidak overlap.
  10. Build berhasil.

  ———

  ## Verification

  Setelah implementasi, jalankan:

  pnpm tsc --noEmit
  pnpm build

  Jalankan targeted ESLint untuk file yang diubah, misalnya:

  pnpm exec eslint app/layout.tsx app/page.tsx app/globals.css components/game/
GameController.tsx app/leaderboard/page.tsx app/profile/page.tsx

  Catatan:
  pnpm lint global mungkin gagal karena ikut scan vendor dependency di
  contracts/lib/openzeppelin*. Jika error hanya dari vendor contracts/lib,
  laporkan sebagai caveat, bukan kegagalan task UI.