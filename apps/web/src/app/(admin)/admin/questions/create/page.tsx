"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, FileText, CheckCircle, AlertTriangle, 
  HelpCircle, Code, ListFilter, Cpu
} from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface Category {
  id: string;
  name: string;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

type QuestionType =
  | "MULTIPLE_CHOICE"
  | "FILL_BLANK"
  | "TRUE_FALSE"
  | "SELECT_MULTIPLE"
  | "MATCH_PAIR"
  | "DRAG_ORDER"
  | "ARRANGE_FORMULA"
  | "BUILD_EQUATION"
  | "NUMBER_LINE"
  | "COORDINATE_PLANE"
  | "GEOMETRY_BUILDER"
  | "FUNCTION_GRAPH"
  | "SWIPE_ANSWER"
  | "PUZZLE";

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice", desc: "Pilihan ganda A, B, C, D dengan satu jawaban benar." },
  { value: "FILL_BLANK", label: "Fill in the Blank", desc: "Soal isian singkat/isian matematika numerik." },
  { value: "TRUE_FALSE", label: "True or False", desc: "Pertanyaan benar atau salah." },
  { value: "SELECT_MULTIPLE", label: "Select Multiple", desc: "Pilihan ganda dengan beberapa jawaban benar sekaligus." },
  { value: "MATCH_PAIR", label: "Match Pair", desc: "Menghubungkan pasangan jawaban kiri dan kanan secara tepat." },
  { value: "DRAG_ORDER", label: "Drag Order", desc: "Mengurutkan elemen matematika (contoh: dari kecil ke besar)." },
  { value: "ARRANGE_FORMULA", label: "Arrange Formula", desc: "Menyusun elemen menjadi formula matematika yang valid." },
  { value: "BUILD_EQUATION", label: "Build Equation", desc: "Menyusun potongan angka dan simbol menjadi persamaan." },
  { value: "NUMBER_LINE", label: "Number Line", desc: "Memposisikan titik pada garis bilangan matematika." },
  { value: "COORDINATE_PLANE", label: "Coordinate Plane", desc: "Menentukan titik koordinat pada diagram kartesius." },
  { value: "GEOMETRY_BUILDER", label: "Geometry Builder", desc: "Membangun atau mencocokkan bentuk-bentuk geometri." },
  { value: "FUNCTION_GRAPH", label: "Function Graph", desc: "Menggambar atau menganalisis grafik fungsi matematika." },
  { value: "SWIPE_ANSWER", label: "Swipe Answer", desc: "Menjawab cepat dengan geser kartu kiri/kanan." },
  { value: "PUZZLE", label: "Math Puzzle", desc: "Game logika matematika / puzzle interaktif." }
];

const TEMPLATES: Record<QuestionType, { options?: any; questionData?: any; answerData?: any; correctAnswer?: string }> = {
  MULTIPLE_CHOICE: {
    options: { A: "10", B: "20", C: "30", D: "40" },
    correctAnswer: "B"
  },
  FILL_BLANK: {
    correctAnswer: "25"
  },
  TRUE_FALSE: {
    options: { TRUE: "Benar", FALSE: "Salah" },
    correctAnswer: "TRUE"
  },
  SELECT_MULTIPLE: {
    options: { A: "x = 2", B: "x = -2", C: "x = 3", D: "x = -3" },
    correctAnswer: "A,B"
  },
  MATCH_PAIR: {
    questionData: {
      left: ["1 + 1", "2 + 2", "3 + 3"],
      right: ["4", "6", "2"]
    },
    answerData: {
      "1 + 1": "2",
      "2 + 2": "4",
      "3 + 3": "6"
    },
    correctAnswer: "MATCH"
  },
  DRAG_ORDER: {
    questionData: {
      items: ["1/4", "1/2", "3/4", "1"]
    },
    correctAnswer: "1/4,1/2,3/4,1"
  },
  ARRANGE_FORMULA: {
    questionData: {
      items: ["E", "=", "m", "c", "²"]
    },
    correctAnswer: "E,=,m,c,²"
  },
  BUILD_EQUATION: {
    questionData: {
      elements: ["x", "+", "2", "=", "5"]
    },
    correctAnswer: "x,+,2,=,5"
  },
  NUMBER_LINE: {
    questionData: {
      min: 0,
      max: 10,
      step: 1,
      target: 7
    },
    correctAnswer: "7"
  },
  COORDINATE_PLANE: {
    questionData: {
      targetX: 3,
      targetY: -2
    },
    correctAnswer: "3,-2"
  },
  GEOMETRY_BUILDER: {
    questionData: {
      shape: "triangle",
      sides: 3
    },
    correctAnswer: "3"
  },
  FUNCTION_GRAPH: {
    questionData: {
      functionType: "quadratic",
      equation: "y = x^2"
    },
    correctAnswer: "y=x^2"
  },
  SWIPE_ANSWER: {
    questionData: {
      statement: "Apakah 7 adalah bilangan prima?"
    },
    correctAnswer: "YES"
  },
  PUZZLE: {
    questionData: {
      grid: [[1, 2], [3, null]],
      missingNumber: 4
    },
    correctAnswer: "4"
  }
};

export default function CreateQuestionPage() {
  const router = useRouter();

  // Categories list state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Form states
  const [categoryId, setCategoryId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState("EASY");
  const [baseScore, setBaseScore] = useState(100);
  const [explanation, setExplanation] = useState("");

  // Options input
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");

  // Select Multiple keys
  const [selectedMultipleAnswers, setSelectedMultipleAnswers] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false
  });

  // Advanced Fields (JSON format)
  const [optionsJson, setOptionsJson] = useState("");
  const [questionDataJson, setQuestionDataJson] = useState("");
  const [answerDataJson, setAnswerDataJson] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/question-categories");
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId(response.data[0].id);
        }
      } catch (err) {
        console.error("Gagal mengambil kategori", err);
        showToast("error", "Gagal memuat daftar kategori soal.");
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Update form inputs when type changes
  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    const template = TEMPLATES[newType];
    
    // Set standard values
    if (newType === "MULTIPLE_CHOICE") {
      setOptionA(template.options?.A || "");
      setOptionB(template.options?.B || "");
      setOptionC(template.options?.C || "");
      setOptionD(template.options?.D || "");
      setCorrectAnswer(template.correctAnswer || "A");
    } else if (newType === "SELECT_MULTIPLE") {
      setOptionA(template.options?.A || "");
      setOptionB(template.options?.B || "");
      setOptionC(template.options?.C || "");
      setOptionD(template.options?.D || "");
      setSelectedMultipleAnswers({ A: true, B: false, C: false, D: false });
      setCorrectAnswer("A");
    } else if (newType === "TRUE_FALSE") {
      setCorrectAnswer("TRUE");
    } else if (newType === "FILL_BLANK") {
      setCorrectAnswer("25");
    } else {
      // For advanced JSON fields
      setCorrectAnswer(template.correctAnswer || "");
      setOptionsJson(template.options ? JSON.stringify(template.options, null, 2) : "");
      setQuestionDataJson(template.questionData ? JSON.stringify(template.questionData, null, 2) : "");
      setAnswerDataJson(template.answerData ? JSON.stringify(template.answerData, null, 2) : "");
    }
  };

  const handleMultipleCheckboxChange = (optionKey: string, checked: boolean) => {
    const updated = { ...selectedMultipleAnswers, [optionKey]: checked };
    setSelectedMultipleAnswers(updated);
    
    // Combine checked into comma-separated string
    const combined = Object.entries(updated)
      .filter(([_, isChecked]) => isChecked)
      .map(([key]) => key)
      .join(",");
    setCorrectAnswer(combined);
  };

  const handleLoadTemplate = () => {
    const template = TEMPLATES[type];
    if (template.options) {
      setOptionsJson(JSON.stringify(template.options, null, 2));
    }
    if (template.questionData) {
      setQuestionDataJson(JSON.stringify(template.questionData, null, 2));
    }
    if (template.answerData) {
      setAnswerDataJson(JSON.stringify(template.answerData, null, 2));
    }
    if (template.correctAnswer) {
      setCorrectAnswer(template.correctAnswer);
    }
    showToast("success", "Template JSON berhasil dimuat!");
  };

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
    if (baseScore < 10) {
      showToast("error", "Base score minimal bernilai 10.");
      return;
    }

    // Dynamic Options validation & packaging
    let finalOptions: any = null;
    let finalQuestionData: any = null;
    let finalAnswerData: any = null;
    let finalCorrectAnswer = correctAnswer;

    try {
      if (type === "MULTIPLE_CHOICE" || type === "SELECT_MULTIPLE") {
        if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
          showToast("error", "Semua pilihan opsi (A, B, C, D) wajib diisi.");
          return;
        }
        finalOptions = { A: optionA, B: optionB, C: optionC, D: optionD };
        if (type === "SELECT_MULTIPLE" && !finalCorrectAnswer) {
          showToast("error", "Pilih minimal satu opsi jawaban benar untuk Select Multiple.");
          return;
        }
      } else if (type === "TRUE_FALSE") {
        finalOptions = { TRUE: "Benar", FALSE: "Salah" };
      } else if (type === "FILL_BLANK") {
        if (!finalCorrectAnswer.trim()) {
          showToast("error", "Jawaban benar tidak boleh kosong.");
          return;
        }
      } else {
        // Parse JSON inputs for advanced types
        if (optionsJson.trim()) {
          finalOptions = JSON.parse(optionsJson);
        }
        if (questionDataJson.trim()) {
          finalQuestionData = JSON.parse(questionDataJson);
        }
        if (answerDataJson.trim()) {
          finalAnswerData = JSON.parse(answerDataJson);
        }
        if (!finalCorrectAnswer.trim()) {
          showToast("error", "Jawaban benar wajib diisi untuk tipe soal interaktif.");
          return;
        }
      }
    } catch (err) {
      showToast("error", "Format JSON input tidak valid. Periksa kembali kurung dan koma.");
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        categoryId,
        questionText,
        options: finalOptions,
        correctAnswer: finalCorrectAnswer,
        type,
        questionData: finalQuestionData,
        answerData: finalAnswerData,
        explanation: explanation || undefined,
        difficulty,
        baseScore: Number(baseScore),
      };

      await api.post("/questions", payload);
      showToast("success", "Soal matematika berhasil ditambahkan ke bank soal!");
      
      // Redirect back to questions list after success
      setTimeout(() => {
        router.push("/admin/questions");
      }, 1500);
    } catch (error: unknown) {
      console.error("Gagal menyimpan soal", error);
      showToast("error", getApiErrorMessage(error, "Terjadi kesalahan sistem"));
    } finally {
      setSubmitting(false);
    }
  };

  const isAdvancedType = ![
    "MULTIPLE_CHOICE",
    "SELECT_MULTIPLE",
    "TRUE_FALSE",
    "FILL_BLANK"
  ].includes(type);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
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
          <span>Tambah Soal Baru</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Pilih tipe soal interaktif matematika baru, kelola detail pertanyaan, opsi, data JSON, dan parameter pembahasannya.
        </p>
      </div>

      {/* Form Element */}
      <form onSubmit={handleSubmit} className="bg-[#0E131F]/80 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
        
        {/* Type Selector Dashboard */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <Cpu size={12} className="text-indigo-400" />
            <span>Jenis Tipe Soal (Interactive Type) <span className="text-red-500">*</span></span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTypeChange(t.value)}
                className={`p-3 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                  type === t.value
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                    : "bg-[#131A26] border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                }`}
              >
                <span className="text-xs font-bold">{t.label}</span>
                <span className="text-[9px] text-slate-500 mt-1 leading-snug truncate w-full">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 1: Category, Difficulty, Base Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
          {/* Category Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Kategori Soal <span className="text-red-500">*</span>
            </label>
            {loadingCats ? (
              <div className="h-11 bg-[#131A26] rounded-xl border border-white/5 animate-pulse" />
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Difficulty Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Tingkat Kesulitan <span className="text-red-500">*</span>
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
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
              className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
            className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            required
          />
        </div>

        {/* Dynamic section based on Type */}

        {/* 1. Multiple Choice Editor */}
        {type === "MULTIPLE_CHOICE" && (
          <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-indigo-400" />
              <span>Opsi Jawaban & Kunci Pilihan Ganda</span>
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
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 max-w-xs mt-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Kunci Jawaban Benar <span className="text-red-500">*</span>
              </label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                required
              >
                <option value="A">Pilihan A</option>
                <option value="B">Pilihan B</option>
                <option value="C">Pilihan C</option>
                <option value="D">Pilihan D</option>
              </select>
            </div>
          </div>
        )}

        {/* 2. Select Multiple Editor */}
        {type === "SELECT_MULTIPLE" && (
          <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ListFilter size={14} className="text-indigo-400" />
              <span>Opsi Jawaban & Kunci Pilih Banyak</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMultipleAnswers.A}
                    onChange={(e) => handleMultipleCheckboxChange("A", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/10 cursor-pointer"
                  />
                  <span>Opsi A (Beri Centang jika Benar)</span>
                </label>
                <input 
                  type="text" 
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="Isi jawaban pilihan A..."
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* Option B */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMultipleAnswers.B}
                    onChange={(e) => handleMultipleCheckboxChange("B", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/10 cursor-pointer"
                  />
                  <span>Opsi B (Beri Centang jika Benar)</span>
                </label>
                <input 
                  type="text" 
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Isi jawaban pilihan B..."
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* Option C */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMultipleAnswers.C}
                    onChange={(e) => handleMultipleCheckboxChange("C", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/10 cursor-pointer"
                  />
                  <span>Opsi C (Beri Centang jika Benar)</span>
                </label>
                <input 
                  type="text" 
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="Isi jawaban pilihan C..."
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* Option D */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMultipleAnswers.D}
                    onChange={(e) => handleMultipleCheckboxChange("D", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/10 cursor-pointer"
                  />
                  <span>Opsi D (Beri Centang jika Benar)</span>
                </label>
                <input 
                  type="text" 
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="Isi jawaban pilihan D..."
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Kunci jawaban saat ini: <strong className="text-indigo-400">{correctAnswer || "Belum dipilih"}</strong>
            </div>
          </div>
        )}

        {/* 3. True or False Editor */}
        {type === "TRUE_FALSE" && (
          <div className="border-t border-white/5 pt-4 flex flex-col gap-2 max-w-xs">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Kunci Jawaban Benar <span className="text-red-500">*</span>
            </label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              required
            >
              <option value="TRUE">Benar (TRUE)</option>
              <option value="FALSE">Salah (FALSE)</option>
            </select>
          </div>
        )}

        {/* 4. Fill in the Blank Editor */}
        {type === "FILL_BLANK" && (
          <div className="border-t border-white/5 pt-4 flex flex-col gap-2 max-w-md">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Jawaban Numerik / Teks yang Benar <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Contoh: 25 atau x = 5..."
              className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
        )}

        {/* 5. Advanced / Interactive Question Editor (JSON columns) */}
        {isAdvancedType && (
          <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-[#131A26]/80 p-4 border border-white/5 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Code size={14} className="text-indigo-400" />
                  <span>Interactive JSON Parameter Editor ({type})</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Lengkapi data parameter permainan menggunakan notasi JSON terstruktur.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadTemplate}
                className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Muat Template Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question Data JSON */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Question Data (JSON)
                </label>
                <textarea 
                  rows={6}
                  value={questionDataJson}
                  onChange={(e) => setQuestionDataJson(e.target.value)}
                  placeholder='{\n  "items": ["1/4", "1/2"]\n}'
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Answer Data JSON */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Answer Data (JSON)
                </label>
                <textarea 
                  rows={6}
                  value={answerDataJson}
                  onChange={(e) => setAnswerDataJson(e.target.value)}
                  placeholder='{\n  "pair1": "answer1"\n}'
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Options JSON */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Options (JSON)
                </label>
                <textarea 
                  rows={4}
                  value={optionsJson}
                  onChange={(e) => setOptionsJson(e.target.value)}
                  placeholder='{\n  "key": "value"\n}'
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Correct Answer Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Correct Answer (String) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Kunci pembanding hasil (contoh: 1/4,1/2,3/4,1)"
                  className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <span className="text-[9px] text-slate-500">Nilai kecocokan saat validasi jawaban di game engine server.</span>
              </div>
            </div>
          </div>
        )}

        {/* Row 5: Explanation Textarea */}
        <div className="border-t border-white/5 pt-4 flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Pembahasan / Penjelasan Soal (Optional)
          </label>
          <textarea 
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Tuliskan langkah-langkah penyelesaian agar player dapat belajar setelah match selesai..."
            className="w-full bg-[#131A26] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
          <Link 
            href="/admin/questions"
            className="px-5 py-2.5 border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </Link>
          <button 
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan Soal"}
          </button>
        </div>

      </form>

    </div>
  );
}
