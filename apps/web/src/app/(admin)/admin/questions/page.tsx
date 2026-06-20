"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Plus, Eye, Edit, Trash2, RefreshCw, 
  Search, X, CheckCircle, AlertTriangle, LayoutDashboard, FolderPlus
} from "lucide-react";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
}

interface Question {
  id: string;
  questionText: string;
  options: any; // JSON: { A, B, C, D }
  correctAnswer: string;
  explanation: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  baseScore: number;
  isActive: boolean;
  category: Category;
  createdAt: string;
}

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

export default function AdminQuestionsPage() {
  const router = useRouter();

  // Questions and categories state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal states
  const [previewTarget, setPreviewTarget] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/question-categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Gagal memuat kategori", err);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.get("/questions", { params });
      setQuestions(response.data);
    } catch (err: any) {
      console.error("Gagal memuat soal", err);
      setError("Gagal memuat bank soal matematika.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory, selectedDifficulty, debouncedSearch]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/questions/${deleteTarget.id}`);
      
      // If the question is soft deleted because it was used in match history
      if (res.data.isActive === false) {
        showToast("success", "Soal dinonaktifkan (Soft Delete) karena terhubung dengan riwayat pertandingan.");
      } else {
        showToast("success", "Soal berhasil dihapus secara permanen dari database.");
      }
      setDeleteTarget(null);
      fetchQuestions();
    } catch (err: any) {
      console.error("Gagal menghapus soal", err);
      const msg = err.response?.data?.message || "Gagal menghapus soal";
      showToast("error", msg);
    } finally {
      setDeleting(false);
    }
  };

  const getDifficultyBadge = (difficulty: "EASY" | "MEDIUM" | "HARD") => {
    switch (difficulty) {
      case "EASY":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            EASY
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
            MEDIUM
          </span>
        );
      case "HARD":
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
            HARD
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6">
        
        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-bounce flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl bg-[#0E1524] text-xs font-semibold
            ${toast.type === 'success' ? 'border-emerald-500/40 text-emerald-400' : 'border-red-500/40 text-red-400'}"
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Kelola Bank Soal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Tambahkan, edit, dan awasi bank soal matematika untuk pertempuran arena.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={fetchQuestions}
              className="p-2.5 bg-[#121824] hover:bg-[#172030] border border-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <Link 
              href="/admin/questions/create"
              className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-lg"
            >
              <Plus size={14} />
              <span>Buat Soal</span>
            </Link>
          </div>
        </div>

        {/* FilterBar & Search */}
        <div className="p-4 bg-[#0E131F] border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-md">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Cari teks soal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131A26] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#131A26] border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Dropdown */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-[#131A26] border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">Semua Kesulitan</option>
              <option value="EASY">Mudah (EASY)</option>
              <option value="MEDIUM">Sedang (MEDIUM)</option>
              <option value="HARD">Sulit (HARD)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-10 space-y-4">
              <div className="h-6 w-1/4 bg-[#141B2D] rounded animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-12 bg-[#141B2D] rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">📝</span>
              <h4 className="font-bold text-white">Soal Kosong</h4>
              <p className="mt-1">Tidak ada soal yang cocok dengan filter atau kriteria pencarian Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-[#111827]/40">
                    <th className="py-4 px-4">Pertanyaan</th>
                    <th className="py-4 px-4 w-40">Kategori</th>
                    <th className="py-4 px-4 text-center w-28">Kesulitan</th>
                    <th className="py-4 px-4 text-center w-20">Skor</th>
                    <th className="py-4 px-4 text-center w-24">Status</th>
                    <th className="py-4 px-4 text-right w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {questions.map((q) => (
                    <tr key={q.id} className={`hover:bg-[#121927]/30 transition-colors ${!q.isActive ? "opacity-50" : ""}`}>
                      <td className="py-4 px-4 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-white truncate text-xs sm:text-sm" title={q.questionText}>
                          {q.questionText}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-semibold">{q.category.name}</td>
                      <td className="py-4 px-4 text-center">{getDifficultyBadge(q.difficulty)}</td>
                      <td className="py-4 px-4 text-center font-bold text-indigo-400">{q.baseScore}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          q.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                        }`}>
                          {q.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setPreviewTarget(q)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                            title="Preview Soal"
                          >
                            <Eye size={14} />
                          </button>
                          <Link 
                            href={`/admin/questions/${q.id}/edit`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded transition-colors"
                            title="Edit Soal"
                          >
                            <Edit size={14} />
                          </Link>
                          <button 
                            onClick={() => setDeleteTarget(q)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded transition-colors cursor-pointer"
                            title="Hapus Soal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Question Preview Modal */}
        {previewTarget && (
          <div className="fixed inset-0 z-50 bg-[#06080D]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Preview Soal</span>
                  {getDifficultyBadge(previewTarget.difficulty)}
                </h3>
                <button 
                  onClick={() => setPreviewTarget(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
                {/* Teks Pertanyaan */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pertanyaan</h4>
                  <p className="text-white text-base font-semibold mt-1.5 leading-relaxed bg-[#131A26] p-4 rounded-xl border border-slate-800">
                    {previewTarget.questionText}
                  </p>
                </div>

                {/* Grid Pilihan Jawaban */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Pilihan Jawaban</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(previewTarget.options || {}).map(([key, val]) => {
                      const isCorrect = previewTarget.correctAnswer === key;
                      return (
                        <div 
                          key={key}
                          className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 transition-colors ${
                            isCorrect 
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold" 
                              : "bg-[#131A26] border-slate-800 text-slate-300"
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${
                            isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                          }`}>
                            {key}
                          </span>
                          <span className="truncate">{val as string}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pembahasan */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pembahasan / Penjelasan</h4>
                  <p className="text-slate-300 text-xs mt-1.5 leading-relaxed bg-[#172030] p-4 rounded-xl border border-indigo-900/10">
                    {previewTarget.explanation || "Belum ada pembahasan soal ini."}
                  </p>
                </div>

                {/* Meta details */}
                <div className="flex gap-4 border-t border-slate-800 pt-4 text-[10px] font-semibold text-slate-400">
                  <span>Kategori: <strong className="text-indigo-400">{previewTarget.category.name}</strong></span>
                  <span>Base Score: <strong className="text-indigo-400">{previewTarget.baseScore} Poin</strong></span>
                  <span>Status: <strong className={previewTarget.isActive ? "text-emerald-400" : "text-slate-500"}>{previewTarget.isActive ? "Aktif" : "Nonaktif"}</strong></span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setPreviewTarget(null)}
                  className="px-5 py-2 bg-[#121824] hover:bg-[#172030] border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Tutup Preview
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-[#06080D]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-red-900/30 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Hapus Soal?</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Apakah Anda yakin ingin menghapus soal ini?
                    <br />
                    <span className="text-[10px] text-slate-500 italic block mt-2 bg-[#131A26] p-2 rounded border border-slate-850">
                      Catatan: Jika soal sudah terikat di riwayat match, soal akan secara otomatis dinonaktifkan (Soft Delete) untuk menjaga integritas database.
                    </span>
                  </p>
                </div>

                <div className="flex w-full gap-3 mt-2">
                  <button 
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
