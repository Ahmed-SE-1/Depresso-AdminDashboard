"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Sidebar";
import { Plus, Trash2, Tag, Pencil, X } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Supabase Import

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // NEW: Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name || "",
      description: cat.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      
      if (paginatedCategories.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      fetchCategories();
    } catch (err) {
      alert("Error deleting category. It might be linked to products.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // START LOADER
    try {
      const payload = { 
        name: formData.name, 
        description: formData.description 
      };

      if (editingId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
        setCurrentPage(1);
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", description: "" });
      fetchCategories();
    } catch (err) {
      alert("Error saving category: " + err.message);
    } finally {
      setIsSubmitting(false); // STOP LOADER
    }
  };

  const totalProducts = categories.reduce((acc, cat) => acc + (cat.products?.length || 0), 0);
  const emptyCategories = categories.filter(cat => !cat.products || cat.products.length === 0).length;

  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const paginatedCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-[#fdfaf5] min-h-screen font-sans">
      <Navbar />
      <div className="p-4 md:p-10 ml-0 md:ml-[280px] transition-all">
        
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#c8834a] text-xs font-bold tracking-[1.5px] uppercase mb-2">Organisation</p>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h1 className="font-serif text-3xl md:text-4xl text-[#1a0f0a] m-0">Categories</h1>
            <button 
              onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); setIsModalOpen(true); }} 
              className="bg-[#1a0f0a] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-gray-800 transition"
            >
              <Plus size={18} /> New Category
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Categories", value: categories.length },
            { label: "Total Products", value: totalProducts },
            { label: "Empty Categories", value: emptyCategories }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#e8e0d0] shadow-sm">
              <p className="m-0 text-xs font-bold text-[#a0958a] uppercase">{stat.label}</p>
              <h2 className="mt-2 text-4xl font-serif text-[#1a0f0a]">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-[#e8e0d0] overflow-x-auto shadow-sm">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-[#f8f5f0] border-b border-[#e8e0d0] text-left">
              <tr className="text-xs text-[#a0958a] uppercase tracking-wider">
                <th className="p-5 font-semibold">Name</th>
                <th className="p-5 font-semibold">Description</th>
                <th className="p-5 text-center font-semibold">Linked Products</th>
                <th className="p-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((cat) => (
                <tr key={cat.id} className="border-b border-[#f0ede8] text-[#1a0f0a] hover:bg-gray-50">
                  <td className="p-5 font-bold flex items-center gap-3">
                    <div className="bg-[#f8f5f0] p-2 rounded-lg"><Tag size={16} color="#c8834a" /></div>
                    {cat.name}
                  </td>
                  <td className="p-5 text-[#a0958a]">{cat.description || "—"}</td>
                  <td className="p-5 text-center">
                    <span className="bg-[#fdfaf5] text-[#c8834a] px-3 py-1 rounded-full text-xs font-bold border border-[#e8e0d0]">
                      {cat.products?.length || 0} items
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button onClick={() => handleEdit(cat)} className="text-[#a0958a] hover:text-blue-600 mr-3 transition"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="text-[#ef4444] hover:text-red-700 transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {paginatedCategories.length === 0 && (
                <tr><td colSpan="4" className="text-center p-10 text-[#a0958a]">No categories found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-t border-[#e8e0d0] gap-4">
              <span className="text-sm text-[#a0958a] font-semibold">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, categories.length)} of {categories.length} entries
              </span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`px-3 py-2 rounded-lg border border-[#e8e0d0] font-semibold ${currentPage === 1 ? 'bg-[#f8f5f0] text-[#d1c7bc] cursor-not-allowed' : 'bg-white text-[#1a0f0a] hover:bg-gray-50'}`}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 rounded-lg border border-[#e8e0d0] font-semibold ${currentPage === page ? 'bg-[#1a0f0a] text-white' : 'bg-white text-[#1a0f0a] hover:bg-gray-50'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`px-3 py-2 rounded-lg border border-[#e8e0d0] font-semibold ${currentPage === totalPages ? 'bg-[#f8f5f0] text-[#d1c7bc] cursor-not-allowed' : 'bg-white text-[#1a0f0a] hover:bg-gray-50'}`}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 md:p-10 rounded-3xl w-full max-w-[500px] relative shadow-2xl">
              
              {/* FIXED: Cross icon turned Red */}
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute right-4 top-4 bg-red-50 p-2 rounded-full text-red-500 hover:bg-red-100 transition-all border border-red-100"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <h2 className="font-serif text-2xl md:text-3xl text-[#1a0f0a] mb-6">{editingId ? "Edit Category" : "New Category"}</h2>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-bold text-[#a0958a] uppercase">Category Name</label>
                  <input className="w-full p-3 rounded-xl border border-[#f0ede8] mt-1 text-[#1a0f0a] outline-none focus:border-[#c8834a]" placeholder="e.g. Hot Drinks" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} required disabled={isSubmitting} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#a0958a] uppercase">Description</label>
                  <textarea className="w-full p-3 rounded-xl border border-[#f0ede8] mt-1 text-[#1a0f0a] outline-none focus:border-[#c8834a] min-h-[80px] resize-y" placeholder="Optional..." value={formData.description} onChange={e => setFormData({...formData, description:e.target.value})} disabled={isSubmitting} />
                </div>

                {/* UPDATED: Dynamic Button Loader */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`text-white p-4 rounded-xl font-bold text-lg transition mt-2 flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-500 cursor-not-allowed opacity-80' : 'bg-[#1a0f0a] hover:bg-gray-800'}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving Category...
                    </>
                  ) : (
                    "Save Category"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}