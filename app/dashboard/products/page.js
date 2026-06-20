"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Sidebar";
import { Search, Plus, Trash2, Pencil, X, Image as ImageIcon, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Supabase Import

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({ name: "", sku: "", price: "", stock: "", category_id: "" });
  
  // NEW: Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) { console.error("Fetch products error:", err); }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) { console.error("Fetch categories error:", err); }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setImageFile(null); 
    setFormData({
      name: item.name || "",
      sku: item.sku || "",
      price: item.price || "",
      stock: item.stock || "",
      category_id: item.category_id || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      alert("Error deleting product.");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // START LOADER
    try {
      let imagePath = undefined;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imagePath = publicUrlData.publicUrl;
      }

      const payloadData = { 
        name: formData.name, 
        sku: formData.sku, 
        price: Number(formData.price), 
        stock: Math.max(0, Number(formData.stock)), // Negative value ko 0 bana dega
        category_id: formData.category_id || null
      };

      if (imagePath) payloadData.image = imagePath;

      if (editingId) {
        const { error } = await supabase.from('products').update(payloadData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payloadData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) { 
      console.error("Error:", err);
      alert("Error saving product: " + err.message); 
    } finally {
      setIsSubmitting(false); // STOP LOADER
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setImageFile(null);
    setFormData({ name: "", sku: "", price: "", stock: "", category_id: "" });
  };

  const filtered = products.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-[#fdfaf5] min-h-screen font-sans">
      <Navbar />
      <div className="p-4 md:p-10 ml-0 md:ml-[280px] transition-all">
        
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#c8834a] text-xs font-bold tracking-[1.5px] uppercase mb-2">Inventory</p>
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <h1 className="font-serif text-3xl md:text-4xl text-[#1a0f0a] m-0">Products</h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center w-full lg:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0958a]" />
                <input 
                  className="w-full sm:w-[280px] p-3 pl-10 rounded-xl border border-[#e8e0d0] outline-none text-[#1a0f0a] focus:border-[#c8834a]"
                  placeholder="Search product..." 
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                className="bg-[#1a0f0a] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-gray-800 transition whitespace-nowrap w-full sm:w-auto" 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
              >
                <Plus size={18} /> Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-[#e8e0d0] overflow-x-auto shadow-sm">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-[#f8f5f0] border-b border-[#e8e0d0]">
              <tr className="text-left text-xs text-[#a0958a] uppercase font-bold tracking-wider">
                <th className="p-5">Preview</th>
                <th className="p-5">SKU</th>
                <th className="p-5">Product Name</th>
                <th className="p-5">Category</th>
                <th className="p-5">Price</th>
                <th className="p-5">Stock</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((item) => (
                <tr key={item.id} className="border-b border-[#f0ede8] text-sm text-[#1a0f0a] hover:bg-gray-50">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-[#f8f5f0] rounded-xl flex items-center justify-center overflow-hidden border border-[#e8e0d0]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} color="#d1c7bc" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-[#a0958a] font-medium">{item.sku || "—"}</td>
                  <td className="p-4 font-bold">{item.name || "Unnamed"}</td>
                  <td className="p-4">{item.categories?.name || "Uncategorized"}</td>
                  <td className="p-4 font-bold text-[#c8834a]">Rs. {item.price || 0}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.stock || 0} items
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(item)} className="text-[#a0958a] hover:text-blue-600 mr-3 transition"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-[#ef4444] hover:text-red-700 transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
                <tr><td colSpan="7" className="text-center p-10 text-[#a0958a]">No products found matching your search.</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-t border-[#e8e0d0] gap-4">
              <span className="text-sm text-[#a0958a] font-semibold">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
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
            <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto relative shadow-2xl">
              
              {/* FIXED: Cross icon turned Red */}
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute right-4 top-4 bg-red-50 p-2 rounded-full text-red-500 hover:bg-red-100 transition-all border border-red-100"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <h2 className="font-serif text-2xl md:text-3xl text-[#1a0f0a] mb-6">{editingId ? "Edit Item" : "Add New Item"}</h2>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                {/* Image Upload */}
                <div className="border-2 border-dashed border-[#e8e0d0] p-6 rounded-2xl text-center bg-[#fdfaf5] relative hover:bg-gray-50 transition">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" disabled={isSubmitting} />
                  <UploadCloud size={30} color="#c8834a" className="mx-auto mb-2" />
                  <p className="m-0 text-sm font-bold text-[#1a0f0a]">{imageFile ? imageFile.name : "Click or drag image to upload"}</p>
                  <p className="mt-1 text-xs text-[#a0958a]">Recommended size: 500x500px</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#a0958a] uppercase">Item Name</label>
                    <input className="w-full p-3 rounded-xl border border-[#f0ede8] mt-1 text-[#1a0f0a] outline-none focus:border-[#c8834a]" placeholder="e.g. Flat White" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} required disabled={isSubmitting} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#a0958a] uppercase">SKU</label>
                    <input className="w-full p-3 rounded-xl border border-[#f0ede8] mt-1 text-[#1a0f0a] outline-none focus:border-[#c8834a]" placeholder="FW-01" value={formData.sku} onChange={e => setFormData({...formData, sku:e.target.value})} required disabled={isSubmitting} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#a0958a] uppercase">Price (Rs.)</label>
                    <input type="number" className="w-full p-3 rounded-xl border border-[#f0ede8] mt-1 text-[#1a0f0a] outline-none focus:border-[#c8834a]" value={formData.price} onChange={e => setFormData({...formData, price:e.target.value})} required disabled={isSubmitting} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#a0958a] uppercase">Initial Stock</label>
                    <input type="number" min="0" onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') e.preventDefault(); // Minus sign blocks completely
                    }} className="w-full p-3 rounded-xl border border-[#f0ede8] mt-1 text-[#1a0f0a] outline-none focus:border-[#c8834a]" value={formData.stock} onChange={e => setFormData({...formData, stock:e.target.value})} required disabled={isSubmitting} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#a0958a] uppercase">Category</label>
                  <select className="w-full p-3 rounded-xl border border-[#f0ede8] mt-1 text-[#1a0f0a] outline-none focus:border-[#c8834a] bg-white" value={formData.category_id} onChange={e => setFormData({...formData, category_id:e.target.value})} disabled={isSubmitting}>
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                      Saving to Haus...
                    </>
                  ) : (
                    "Save to Haus"
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