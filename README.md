# CBT Pro - Computer Based Test Platform

Aplikasi ujian berbasis komputer yang modern, aman, dan mudah digunakan untuk sekolah-sekolah di Indonesia.

## 🎯 Fitur Utama

### Untuk Siswa
- **Login Token Sederhana**: Masuk ujian hanya dengan nama, kelas, dan token
- **Mode Fullscreen**: Fokus maksimal saat mengerjakan ujian
- **Timer Otomatis**: Countdown timer yang jelas di header
- **Navigasi Soal Mudah**: Sidebar dengan status jawaban (Hijau: Sudah dijawab, Kuning: Ragu-ragu, Abu: Belum)
- **Auto-Save Jawaban**: Jawaban tersimpan otomatis ke localStorage dan backend
- **Anti-Cheat System**: Deteksi pergantian tab/window, peringatan otomatis, force submit setelah 3 pelanggaran

### Untuk Guru
- **Manajemen Bank Soal**: Buat dan kelola soal (Pilihan Ganda, Essay, Susun Kalimat)
- **Pengaturan Ujian**: Set durasi, token, acak soal/opsi
- **Live Monitoring**: Pantau siswa yang sedang ujian secara real-time
- **Export CSV**: Download hasil ujian dalam format CSV
- **Quota System**: Free tier (20 soal, 10 siswa), Pro tier (unlimited)
- **Berlangganan**: Integrasi Midtrans untuk upgrade ke paket Pro

### Untuk Superadmin
- **User Management**: Approve/reject pendaftaran guru
- **Monitoring Platform**: Lihat statistik guru dan langganan

## 🚀 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database dengan Motor (async driver)
- **JWT Authentication** - Secure token-based auth
- **Midtrans** - Payment gateway integration
- **Pandas** - CSV export functionality

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

## 🔐 Default Credentials

**Superadmin:**
- Email: `admin@cbtpro.com`
- Password: `admin123`

## 🚀 Next Action Items

### Phase 2 - Full Dashboard Implementation
1. **Teacher Dashboard**: Build comprehensive dashboard with question bank management, exam creation wizard, live monitoring interface, and results viewing UI
2. **Superadmin Dashboard**: Complete superadmin panel with user approval interface, pricing management, and platform statistics
3. **Subscription Flow**: Payment page with Midtrans Snap, subscription status page, and auto-redirect after payment
4. **Enhanced Features**: Question editing, exam duplication, multi-type question support UI, and manual essay grading interface

---

**Built with ❤️ using Emergent Platform**
