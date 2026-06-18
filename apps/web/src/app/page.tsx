import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="border-b border-card bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              MATH BATTLE ARENA
            </span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-text-muted">
            <Link href="/" className="text-foreground transition-colors">Home</Link>
            <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-text-muted hover:text-foreground transition-colors"
            >
              Masuk
            </Link>
            <Link 
              href="/register" 
              className="px-4 h-10 flex items-center justify-center text-sm font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all"
            >
              Mulai Bermain
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-grow">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background decorative glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10 animate-pulse delay-75"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              Belajar Matematika Seperti <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                Bertarung di Arena Game!
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-text-muted">
              Uji kecepatan berpikir dan logika matematika Anda. Hadapi lawan secara real-time, menangkan duel 1v1, dapatkan medali, dan capai peringkat tertinggi!
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 h-14 flex items-center justify-center text-base font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300"
              >
                Daftar Sekarang
              </Link>
              <Link 
                href="/leaderboard" 
                className="px-8 h-14 flex items-center justify-center text-base font-semibold rounded-lg bg-card border border-primary/20 text-foreground hover:bg-card/80 hover:border-primary/50 transition-all duration-300"
              >
                Lihat Peringkat
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-card/30 border-y border-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-white">Fitur Utama Arena</h2>
              <p className="mt-4 text-text-muted">Semua yang Anda butuhkan untuk mengasah otak dengan cara yang kompetitif dan menyenangkan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mb-4 group-hover:bg-primary/20 transition-colors">
                  ⚔️
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Duel 1 vs 1</h3>
                <p className="text-sm text-text-muted">Bertanding matematika secara langsung (real-time) dengan lawan seimbang lewat matchmaking pintar.</p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary text-xl font-bold mb-4 group-hover:bg-secondary/20 transition-colors">
                  🧠
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mode Latihan</h3>
                <p className="text-sm text-text-muted">Latih logika dan pemecahan masalah Anda secara mandiri tanpa tekanan waktu atau peringkat.</p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-xl font-bold mb-4 group-hover:bg-accent/20 transition-colors">
                  🏆
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sistem Peringkat</h3>
                <p className="text-sm text-text-muted">Kumpulkan rating poin dari setiap kemenangan dan tingkatkan tier Anda dari Bronze hingga Master.</p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center text-success text-xl font-bold mb-4 group-hover:bg-success/20 transition-colors">
                  📊
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Statistik Pemain</h3>
                <p className="text-sm text-text-muted">Pantau kemajuan Anda melalui grafik akurasi jawaban, waktu respon rata-rata, dan histori pertandingan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Leaderboard Preview */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-8">Puncak Papan Peringkat</h2>
            <div className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-lg">
              <div className="p-4 bg-background/50 border-b border-primary/10 flex justify-between font-semibold text-text-muted text-sm">
                <span>Peringkat</span>
                <span className="flex-1 text-left pl-8">Pemain</span>
                <span>Poin Rating</span>
              </div>
              <div className="divide-y divide-primary/5">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-accent font-bold text-lg w-8">🥇 1</span>
                  <span className="flex-1 text-left pl-8 font-medium">Raka_MathMaster</span>
                  <span className="font-bold text-accent">2,450 XP</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-300 font-bold text-lg w-8">🥈 2</span>
                  <span className="flex-1 text-left pl-8 font-medium">Sinta_Aritmetika</span>
                  <span className="font-bold text-secondary">2,210 XP</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-amber-600 font-bold text-lg w-8">🥉 3</span>
                  <span className="flex-1 text-left pl-8 font-medium">Dimas_Logika</span>
                  <span className="font-bold text-primary">2,080 XP</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <Link 
                href="/leaderboard" 
                className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                Lihat Selengkapnya &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-card py-8 bg-background/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>&copy; 2026 Math Battle Arena. Dibuat untuk kesenangan dan kecerdasan.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Panduan</a>
            <a href="#" className="hover:text-foreground transition-colors">Aturan</a>
            <a href="#" className="hover:text-foreground transition-colors">Kontak</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
