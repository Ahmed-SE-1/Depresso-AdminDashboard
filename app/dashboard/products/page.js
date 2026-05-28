"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "@/components/Sidebar";
import { Search, Plus, Trash2, Pencil, X, Image as ImageIcon, UploadCloud } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Ek page par kitne products show karne hain
  
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({ name: "", sku: "", price: "", stock: "", category: "" });

  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Search badalne par page 1 par wapas aane ke liye
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch only published ones by default
      const res = await axios.get(`${API_URL}/api/products?populate=*&pagination[limit]=200&sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data?.data || res.data || []);
    } catch (err) { console.error("Fetch products error:", err); }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data?.data || res.data || []);
    } catch (err) { console.error("Fetch categories error:", err); }
  };

  const handleEdit = (item) => {
    const data = item?.attributes || item; 
    if (!data) return;

    const targetId = item.documentId || item.id;
    const catId = data?.category?.data?.documentId || data?.category?.documentId || data?.category?.id || "";
    
    setEditingId(targetId);
    setImageFile(null); 
    setFormData({
      name: data?.Name || "",
      sku: data?.SKU || "",
      price: data?.Price || "",
      stock: data?.Stock || "",
      category: catId
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert("Error deleting product.");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      let uploadedImageId = null;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("files", imageFile);
        
        const uploadRes = await axios.post(`${API_URL}/api/upload`, uploadData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        });
        uploadedImageId = uploadRes.data[0].id; 
      }

      // Payload (publishedAt removed to let API handle status parameter)
      const payloadData = { 
        Name: formData.name, 
        SKU: formData.sku, 
        Price: Number(formData.price), 
        Stock: Number(formData.stock)
      };

      if (formData.category) payloadData.category = formData.category;
      
      if (uploadedImageId) {
        payloadData.Image = uploadedImageId; 
      }

      // FIX: Add ?status=published to ensure Strapi publishes the entry automatically
      if (editingId) {
        await axios.put(`${API_URL}/api/products/${editingId}?status=published`, { data: payloadData }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/products?status=published`, { data: payloadData }, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) { 
      console.error("Full Error:", err.response?.data);
      alert("Error saving product: " + (err.response?.data?.error?.message || "Check console.")); 
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setImageFile(null);
    setFormData({ name: "", sku: "", price: "", stock: "", category: "" });
  };

  // --- Filtering & Pagination Logic ---
  const filtered = products.filter(p => {
    const data = p?.attributes || p;
    return (data?.Name || "").toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div style={{ background: "#fdfaf5", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Navbar />
      <div style={{ marginLeft: "280px", padding: "40px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <p style={{ color: "#c8834a", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Inventory</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontFamily: "serif", fontSize: "36px", color: "#1a0f0a", margin: 0 }}>Products</h1>
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a0958a" }} />
                <input 
                  style={{ padding: "12px 12px 12px 40px", borderRadius: "10px", border: "1px solid #e8e0d0", width: "280px", outline: "none", color: "#1a0f0a" }}
                  placeholder="Search product..." 
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button style={{ background: "#1a0f0a", color: "white", padding: "12px 24px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", border: "none", cursor: "pointer" }} onClick={() => { resetForm(); setIsModalOpen(true); }}>
                <Plus size={18} /> Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ background: "white", borderRadius: "15px", border: "1px solid #e8e0d0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8f5f0", borderBottom: "1px solid #e8e0d0" }}>
              <tr style={{ textAlign: "left", fontSize: "12px", color: "#a0958a", textTransform: "uppercase", fontWeight: "700" }}>
                <th style={{ padding: "20px" }}>Preview</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((item) => {
                const data = item?.attributes || item;
                const catData = data?.category?.data?.attributes || data?.category || {};
                
                const imgObj = data?.Image || data?.image || data?.Image?.data?.attributes;
                const imgUrl = imgObj?.url;
                const fullImageUrl = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `${API_URL}${imgUrl}`) : null;

                const targetId = item.documentId || item.id;

                return (
                  <tr key={targetId} style={{ borderBottom: "1px solid #f0ede8", fontSize: "14px", color: "#1a0f0a" }}>
                    <td style={{ padding: "15px 20px" }}>
                      <div style={{ width: "45px", height: "45px", background: "#f8f5f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {fullImageUrl ? (
                          <img src={fullImageUrl} alt={data?.Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <ImageIcon size={20} color="#d1c7bc" />
                        )}
                      </div>
                    </td>
                    <td style={{ color: "#a0958a" }}>{data?.SKU || "—"}</td>
                    <td style={{ fontWeight: "700" }}>{data?.Name || "Unnamed"}</td>
                    <td>{catData?.Name || "Uncategorized"}</td>
                    <td style={{ fontWeight: "700" }}>Rs. {data?.Price || 0}</td>
                    <td>{data?.Stock || 0} items</td>
                    <td style={{ textAlign: "right", paddingRight: "20px" }}>
                      <button onClick={() => handleEdit(item)} style={{ background: "none", border: "none", color: "#a0958a", cursor: "pointer", marginRight: "10px" }}><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(targetId)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
              
              {/* No Products Found Fallback */}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#a0958a" }}>
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderTop: "1px solid #e8e0d0" }}>
              <span style={{ fontSize: "14px", color: "#a0958a", fontWeight: "600" }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
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
            <div style={{ background: "white", padding: "40px", borderRadius: "24px", width: "500px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", right: "20px", top: "20px", background: "#f5f0e8", border: "none", borderRadius: "50%", padding: "5px", cursor: "pointer" }}><X size={18} /></button>
              <h2 style={{ fontFamily: "serif", fontSize: "28px", color: "#1a0f0a", marginBottom: "20px" }}>{editingId ? "Edit Item" : "Add New Item"}</h2>
              
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Image Upload Section */}
                <div style={{ border: "2px dashed #e8e0d0", padding: "20px", borderRadius: "15px", textAlign: "center", background: "#fdfaf5", position: "relative" }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} 
                  />
                  <UploadCloud size={24} color="#c8834a" style={{ marginBottom: "10px" }} />
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#1a0f0a" }}>
                    {imageFile ? imageFile.name : "Click or drag image to upload"}
                  </p>
                  <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#a0958a" }}>Recommended size: 500x500px</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>Item Name</label>
                    <input style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0ede8", marginTop: "5px", color: "#1a0f0a" }} placeholder="e.g. Flat White" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>SKU</label>
                    <input style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0ede8", marginTop: "5px", color: "#1a0f0a" }} placeholder="FW-01" value={formData.sku} onChange={e => setFormData({...formData, sku:e.target.value})} required />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>Price (Rs.)</label>
                    <input type="number" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0ede8", marginTop: "5px", color: "#1a0f0a" }} value={formData.price} onChange={e => setFormData({...formData, price:e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>Initial Stock</label>
                    <input type="number" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0ede8", marginTop: "5px", color: "#1a0f0a" }} value={formData.stock} onChange={e => setFormData({...formData, stock:e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#a0958a", textTransform: "uppercase" }}>Category</label>
                  <select style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #f0ede8", marginTop: "5px", color: "#1a0f0a", background: "white" }} value={formData.category} onChange={e => setFormData({...formData, category:e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => {
                      const cData = c?.attributes || c;
                      return <option key={c.documentId || c.id} value={c.documentId || c.id}>{cData?.Name}</option>
                    })}
                  </select>
                </div>
                <button type="submit" style={{ background: "#1a0f0a", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "700", fontSize: "16px", cursor: "pointer", marginTop: "10px" }}>
                  Save to Haus
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}