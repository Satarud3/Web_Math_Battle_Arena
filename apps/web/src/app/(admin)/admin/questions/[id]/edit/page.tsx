"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, FileText, CheckCircle, AlertTriangle, 
  HelpCircle, ShieldAlert, FolderPlus, LayoutDashboard
} from "lucide-react";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  // Categories list state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [categoryId, setCategoryId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [baseScore, setBaseScore] = useState(100);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        // Fetch categories and question detail in parallel
        const [categoriesRes, questionRes] = await Promise.all([
          api.get("/question-categories"),
          api.get(`/questions/${questionId}`),
        ]);

        setCategories(categoriesRes.data);
        
        const qData = questionRes.data;
        setCategoryId(qData.categoryId);
        setQuestionText(qData.questionText);
        setOptionA(qData.options?.A || "");
        setOptionB(qData.options?.B || "");
        setOptionC(qData.options?.C || "");
        setOptionD(qData.options?.D || "");
        setCorrectAnswer(qData.correctAnswer);
        setExplanation(qData.explanation || "");
        setDifficulty(qData.difficulty);
        setBaseScore(qData.baseScore);
        setIsActive(qData.isActive);
      } catch (err: any) {
        console.error("Gagal memuat data", err);
        showToast("error", "Gagal memuat detail soal atau kategori.");
      } finally {
        setLoadingData(false);
      }
    };
    if (questionId) {
      fetchData();
    }
  }, [questionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      showToast("error", "Silakan pilih kategori soal.");
      return;
    }
    if (!questionText.trim()) {
      showToast("error", "Teks soal tidak boleh kosong.");
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      showToast("error", "Semua pilihan opsi (A, B, C, D) wajib diisi.");
      return;
    }
    if (baseScore < 10) {
      showToast("error", "Base score minimal bernilai 10.");
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        categoryId,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation: explanation || "",
        difficulty,
        baseScore: Number(baseScore),
        isActive,
      };

      await api.patch(`/questions/${questionId}`, payload);
      showToast("success", "Soal matematika berhasil diperbarui!");
      
      // Redirect back to questions list after success
      setTimeout(() => {
        router.push("/admin/questions");
      }, 1500);
    } catch (err: any) {
      console.error("Gagal menyimpan perubahan", err);
      const msg = err.response?.data?.message || "Terjadi kesalahan sistem";
      showToast("error", Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-4xl">
        
        {/* Floating Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 animate-bounce flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl bg-[#0E1524] text-xs font-semibold
            ${toast.type === 'success' ? 'border-emerald-500/40 text-emerald-400' : 'border-red-500/40 text-red-400'}`}
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Back Link */}
        <div>
          <Link 
            href="/admin/questions"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Bank Soal</span>
          </Link>
        </div>

        {/* Form Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <FileText className="text-indigo-400" size={26} />
            <span>Edit Soal Matematika</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Modifikasi pertanyaan, mengubah tingkat kesulitan, pembahasan, atau status keaktifan.
          </p>
        </div>

        {/* Form Element */}
        {loadingData ? (
          <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
            <div className="h-8 bg-[#131A26] rounded-xl w-1/3 animate-pulse" />
            <div className="h-24 bg-[#131A26] rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-[#131A26] rounded-xl animate-pulse" />
              <div className="h-10 bg-[#131A26] rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0E131F] border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
            
            {/* Row 1: Category, Difficulty, Base Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Category Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Kategori Soal <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Tingkat Kesulitan <span className="text-red-500">*</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  required
                >
                  <option value="EASY">Mudah (EASY)</option>
                  <option value="MEDIUM">Sedang (MEDIUM)</option>
                  <option value="HARD">Sulit (HARD)</option>
                </select>
              </div>

              {/* Base Score Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Base Score (Poin) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  min={10}
                  value={baseScore}
                  onChange={(e) => setBaseScore(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

            </div>

            {/* Row 2: Question Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Teks Soal / Pertanyaan <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Tuliskan persamaan kuadrat, soal cerita, atau rumus matematika di sini..."
                className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                required
              />
            </div>

            {/* Row 3: Option Choices A, B, C, D */}
            <div className="border-t border-slate-800 pt-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-indigo-400" />
                <span>Opsi Jawaban & Kunci Jawaban</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option A */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-black text-[9px]">A</span>
                    <span>Opsi A <span className="text-red-500">*</span></span>
                  </label>
                  <input 
                    type="text" 
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="Isi jawaban pilihan A..."
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                {/* Option B */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-black text-[9px]">B</span>
                    <span>Opsi B <span className="text-red-500">*</span></span>
                  </label>
                  <input 
                    type="text" 
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="Isi jawaban pilihan B..."
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                {/* Option C */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-black text-[9px]">C</span>
                    <span>Opsi C <span className="text-red-500">*</span></span>
                  </label>
                  <input 
                    type="text" 
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="Isi jawaban pilihan C..."
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                {/* Option D */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-black text-[9px]">D</span>
                    <span>Opsi D <span className="text-red-500">*</span></span>
                  </label>
                  <input 
                    type="text" 
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="Isi jawaban pilihan D..."
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

              </div>

              {/* Row 4: Correct Answer & Question Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Kunci Jawaban Benar <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    required
                  >
                    <option value="A">Pilihan A</option>
                    <option value="B">Pilihan B</option>
                    <option value="C">Pilihan C</option>
                    <option value="D">Pilihan D</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Status Keaktifan Soal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    required
                  >
                    <option value="true">Aktif (Dapat Dipakai Duel)</option>
                    <option value="false">Nonaktif (Sembunyikan/Soft Delete)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Row 5: Explanation Textarea */}
            <div className="border-t border-slate-800 pt-4 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pembahasan / Penjelasan Soal (Optional)
              </label>
              <textarea 
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Tuliskan langkah-langkah penyelesaian agar player dapat belajar setelah match selesai..."
                className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <Link 
                href="/admin/questions"
                className="px-5 py-2.5 border border-slate-700 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                Batal
              </Link>
              <button 
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
              </button>
            </div>

          </form>
        )}

      </div>
  );
}
