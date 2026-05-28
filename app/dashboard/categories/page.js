"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "@/components/Sidebar";
import { Plus, Trash2, Tag, Pencil, X } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      // FIX: Added limit=200 and descending sort to show newest first
      const res = await axios.get(`${API_URL}/api/categories?populate=products&pagination[limit]=200&sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  const handleEdit = (cat) => {
    const data = cat?.attributes || cat;
    setEditingId(cat.documentId || cat.id);
    setFormData({
      name: data?.Name || "",
      description: data?.Description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Agar delete hone pe current page khali ho jaye, to pichle page pe le jao
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
    try {
      const token = localStorage.getItem("token");
      const payload = { data: { Name: formData.name, Description: formData.description } };

      // FIX: Added ?status=published to ensure it stays visible if Draft/Publish is enabled
      if (editingId) {
        await axios.put(`${API_URL}/api/categories/${editingId}?status=published`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/api/categories?status=published`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentPage(1); // Nayi category hamesha page 1 par top pe aayegi
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", description: "" });
      fetchCategories();
    } catch (err) {
      alert("Error saving category: " + (err.response?.data?.error?.message || err.message));
    }
  };

  // --- Statistics Logic (Full Array pe base karegi) ---
  const totalProducts = categories.reduce((acc, cat) => {
    const data = cat?.attributes || cat;
    const productsArray = data?.products?.data || data?.products || [];
    return acc + productsArray.length;
  }, 0);

  const emptyCategories = categories.filter(cat => {
    const data = cat?.attributes || cat;
    const productsArray = data?.products?.data || data?.products || [];
    return productsArray.length === 0;
  }).length;

  // --- Pagination Logic ---
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div style={{ background: "#fdfaf5", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ marginLeft: "280px", padding: "40px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <p style={{ color: "#c8834a", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Organisation</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontFamily: "serif", fontSize: "36px", color: "#1a0f0a", margin: 0 }}>Categories</h1>
            <button onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); setIsModalOpen(true); }} style={{ background: "#1a0f0a", color: "white", padding: "12px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", border: "none", cursor: "pointer" }}>
              <Plus size={18} /> New Category
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px", marginBottom: "40px" }}>
          {[
            { label: "Total Categories", value: categories.length },
            { label: "Total Products", value: totalProducts },
            { label: "Empty Categories", value: emptyCategories }
          ].map((stat, i) => (
            <div key={i} style={{ background: "white", padding: "30px", borderRadius: "20px", border: "1px solid #e8e0d0" }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>{stat.label}</p>
              <h2 style={{ margin: "10px 0 0", fontSize: "42px", fontFamily: "serif", color: "#1a0f0a" }}>{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Table & Pagination Container */}
        <div style={{ background: "white", borderRadius: "15px", border: "1px solid #e8e0d0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8f5f0", borderBottom: "1px solid #e8e0d0", textAlign: "left" }}>
              <tr style={{ fontSize: "12px", color: "#a0958a", textTransform: "uppercase" }}>
                <th style={{ padding: "20px" }}>Name</th>
                <th>Description</th>
                <th style={{ textAlign: "center" }}>Linked Products</th>
                <th style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((cat) => {
                const data = cat?.attributes || cat;
                const productsArray = data?.products?.data || data?.products || [];
                const catId = cat.documentId || cat.id;

                return (
                  <tr key={catId} style={{ borderBottom: "1px solid #f0ede8", color: "#1a0f0a" }}>
                    <td style={{ padding: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "#f8f5f0", padding: "8px", borderRadius: "8px" }}>
                        <Tag size={16} color="#c8834a" />
                      </div>
                      {data?.Name || "Unnamed Category"}
                    </td>
                    <td style={{ color: "#a0958a" }}>{data?.Description || "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ background: "#fdfaf5", color: "#c8834a", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", border: "1px solid #e8e0d0" }}>
                        {productsArray.length} items
                      </span>
                    </td>
                    <td style={{ textAlign: "right", paddingRight: "20px" }}>
                      <button onClick={() => handleEdit(cat)} style={{ background: "none", border: "none", color: "#a0958a", cursor: "pointer", marginRight: "10px" }}><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(catId)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}

              {/* No Categories Fallback */}
              {paginatedCategories.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#a0958a" }}>
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderTop: "1px solid #e8e0d0" }}>
              <span style={{ fontSize: "14px", color: "#a0958a", fontWeight: "600" }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, categories.length)} of {categories.length} entries
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e8e0d0", background: currentPage === 1 ? "#f8f5f0" : "white", color: currentPage === 1 ? "#d1c7bc" : "#1a0f0a", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: "600" }}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e8e0d0", background: currentPage === page ? "#1a0f0a" : "white", color: currentPage === page ? "white" : "#1a0f0a", cursor: "pointer", fontWeight: "600" }}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e8e0d0", background: currentPage === totalPages ? "#f8f5f0" : "white", color: currentPage === totalPages ? "#d1c7bc" : "#1a0f0a", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: "600" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
            <div style={{ background: "white", padding: "40px", borderRadius: "24px", width: "500px", position: "relative" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", right: "20px", top: "20px", background: "#f5f0e8", border: "none", borderRadius: "50%", padding: "5px", cursor: "pointer" }}><X size={18} /></button>
              <h2 style={{ fontFamily: "serif", fontSize: "28px", color: "#1a0f0a", marginBottom: "30px" }}>{editingId ? "Edit Category" : "New Category"}</h2>
              
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>Category Name</label>
                  <input style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0ede8", marginTop: "5px", color: "#1a0f0a" }} placeholder="e.g. Hot Drinks" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>Description</label>
                  <textarea style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0ede8", marginTop: "5px", color: "#1a0f0a", resize: "vertical", minHeight: "80px" }} placeholder="Optional..." value={formData.description} onChange={e => setFormData({...formData, description:e.target.value})} />
                </div>
                <button type="submit" style={{ background: "#1a0f0a", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}>
                  Save Category
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}