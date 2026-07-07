"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  FolderPlus, Edit, Trash2, ShieldAlert, Plus, 
  X, CheckCircle, AlertTriangle, RefreshCw, Search, ArrowDownUp
} from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count: {
    questions: number;
  };
}

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"name" | "questions">("name");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/question-categories");
      setCategories(response.data);
    } catch (error: unknown) {
      console.error("Gagal memuat kategori", error);
      setError("Gagal memuat daftar kategori soal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchCategories());
  }, [fetchCategories]);

  const openAddModal = () => {
    setEditId(null);
    setFormName("");
    setFormDesc("");
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("error", "Nama kategori tidak boleh kosong");
      return;
    }

    try {
      setSubmitting(true);
      if (editId) {
        // Edit category
        await api.patch(`/question-categories/${editId}`, {
          name: formName,
          description: formDesc,
        });
        showToast("success", "Kategori berhasil diperbarui!");
      } else {
        // Create category
        await api.post("/question-categories", {
          name: formName,
          description: formDesc,
        });
        showToast("success", "Kategori baru berhasil ditambahkan!");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (error: unknown) {
      console.error("Gagal menyimpan kategori", error);
      showToast("error", getApiErrorMessage(error, "Terjadi kesalahan sistem"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (cat: Category) => {
    if (cat._count.questions > 0) {
      showToast(
        "error",
        `Kategori "${cat.name}" memiliki ${cat._count.questions} soal dan tidak bisa dihapus!`
      );
      return;
    }
    setDeleteTarget(cat);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/question-categories/${deleteTarget.id}`);
      showToast("success", `Kategori "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (error: unknown) {
      console.error("Gagal menghapus kategori", error);
      showToast("error", getApiErrorMessage(error, "Terjadi kesalahan"));
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories
    .filter((category) => `${category.name} ${category.description || ""}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((first, second) => sortOrder === "questions"
      ? second._count.questions - first._count.questions
      : first.name.localeCompare(second.name, "id"));

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6">
        
        {/* Floating Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 animate-bounce flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl bg-[#0E1524] text-xs font-semibold ${toast.type === "success" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400"}`}
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Kelola Kategori Soal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Buat dan modifikasi pengelompokan materi matematika untuk bank soal.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchCategories}
              className="p-2.5 bg-[#121824] hover:bg-[#172030] border border-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-lg"
            >
              <Plus size={14} />
              <span>Tambah Kategori</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0E131F]/80 backdrop-blur p-4 sm:grid-cols-[1fr_190px] shadow-xl">
          <label className="relative">
            <span className="sr-only">Cari kategori</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama atau deskripsi kategori..." className="min-h-11 w-full rounded-xl border border-white/10 bg-[#131A26] py-2.5 pl-10 pr-4 text-xs text-white outline-none transition focus:border-indigo-500" />
          </label>
          <label className="relative">
            <span className="sr-only">Urutkan kategori</span>
            <ArrowDownUp className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "name" | "questions")} className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#131A26] py-2.5 pl-10 pr-4 text-xs font-semibold text-white outline-none transition focus:border-indigo-500 cursor-pointer">
              <option value="name">Urutkan: Nama</option>
              <option value="questions">Urutkan: Jumlah Soal</option>
            </select>
          </label>
        </div>

        {/* Table / Loader */}
        <div className="bg-[#0E131F]/80 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-10 space-y-4">
              <div className="h-6 w-1/4 bg-[#141B2D] rounded animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-12 bg-[#141B2D] rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <FolderPlus className="mb-2 h-9 w-9 text-slate-500" aria-hidden="true" />
              <h4 className="font-bold text-white">Kategori Tidak Ditemukan</h4>
              <p className="mt-1">Ubah kata kunci atau tambah kategori baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-[#111827]/40">
                    <th className="py-4 px-4 w-1/4">Nama Kategori</th>
                    <th className="py-4 px-4 w-1/2">Deskripsi</th>
                    <th className="py-4 px-4 text-center w-32">Jumlah Soal</th>
                    <th className="py-4 px-4 text-right w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#121927]/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-white text-sm">{cat.name}</td>
                      <td className="py-4 px-4 text-slate-400 line-clamp-2 mt-1 block border-none">{cat.description || "-"}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                          {cat._count.questions} Soal
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(cat)}
                            aria-label={`Edit kategori ${cat.name}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded transition-colors cursor-pointer"
                            title="Edit Kategori"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(cat)}
                            aria-label={`Hapus kategori ${cat.name}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 rounded transition-colors cursor-pointer"
                            title="Hapus Kategori"
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

        {/* Create/Edit Form Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-[#06080D]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderPlus className="text-indigo-400" size={18} />
                  <span>{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</span>
                </h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Nama Kategori <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Aritmetika, Aljabar..."
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Deskripsi Kategori
                  </label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Tuliskan cakupan materi pembelajaran kategori ini..."
                    rows={4}
                    className="w-full bg-[#131A26] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    maxLength={200}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-800 pt-4">
                  <button 
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Kategori"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-[#06080D]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-red-900/30 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle size={21} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Hapus Kategori?</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Apakah Anda yakin ingin menghapus kategori <span className="text-white font-bold">&quot;{deleteTarget.name}&quot;</span> secara permanen? Aksi ini tidak dapat dibatalkan.
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
