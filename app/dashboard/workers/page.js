"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Plus, UserX, Phone, Loader2, Edit, ChevronLeft, ChevronRight } from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", role: "Cashier", phone: "", salary: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 10; // Ek page par kitne workers show honge
  
  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

  const fetchWorkers = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Pagination parameters API mein add kiye
      const res = await axios.get(
        `${API_URL}/api/workers?sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setWorkers(res.data.data || []);
      
      // Strapi se aanay wali pagination details ko state mein save kiya
      if (res.data.meta && res.data.meta.pagination) {
        setPageCount(res.data.meta.pagination.pageCount || 1);
        setCurrentPage(res.data.meta.pagination.page || 1);
      }
    } catch (err) { 
      console.error("Error fetching workers:", err); 
    } finally {
      setIsLoading(false);
    }
  };

  // Jab bhi currentPage change hoga, data dobara fetch hoga
  useEffect(() => { 
    fetchWorkers(currentPage); 
  }, [currentPage]);

  const openAddModal = () => {
    setFormData({ name: "", role: "Cashier", phone: "", salary: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (worker, identifier) => {
    const data = worker.attributes || worker;
    setFormData({
      name: data.name || "",
      role: data.role || "Cashier",
      phone: data.phone || "",
      salary: data.salary || "",
    });
    setEditingId(identifier);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`${API_URL}/api/workers/${editingId}`, { data: formData }, config);
        fetchWorkers(currentPage); // Edit ke baad usi page par rahe
      } else {
        await axios.post(`${API_URL}/api/workers`, { data: formData }, config);
        setCurrentPage(1); // Naya worker add karne ke baad Page 1 par wapis le jayen
        fetchWorkers(1);
      }

      setIsModalOpen(false);
      setFormData({ name: "", role: "Cashier", phone: "", salary: "" });
      setEditingId(null);
    } catch (err) { 
      console.error("Submit Error:", err.response || err);
      const errorMsg = err.response?.data?.error?.message || "Check your Strapi permissions or network.";
      alert(`❌ Error ${editingId ? "updating" : "adding"} worker:\n\n${errorMsg}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteWorker = async (identifier) => {
    if (!confirm("Are you sure you want to remove this worker from the team?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/workers/${identifier}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWorkers(currentPage); // Delete ke baad usi page par list refresh karein
    } catch (err) { 
      console.error("Delete Error:", err.response || err);
      const errorMsg = err.response?.data?.error?.message || "Check your Strapi permissions or network.";
      alert(`❌ Delete failed:\n\n${errorMsg}`); 
    }
  };

  const roleStyles = {
    Manager: "bg-amber-100 text-amber-900",
    Cashier: "bg-emerald-100 text-emerald-900",
    "Stock Keeper": "bg-blue-100 text-blue-900",
  };

  return (
    <div className="flex min-h-screen bg-[#fcfaf8]">
      <Sidebar />
      <main className="flex-1 ml-64 p-10 overflow-y-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68] font-bold mb-2">Management</p>
            <h1 className="text-4xl font-serif text-[#2d241e]">Team Members</h1>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#1e1915] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] transition-all flex items-center gap-2 shadow-lg shadow-black/5 active:scale-95"
          >
            <Plus size={18} /> Add Worker
          </button>
        </div>

        <div className="bg-white rounded-[32px] border border-[#f1ede9] shadow-sm overflow-hidden mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfaf8]/50 text-[#8d7b68] text-[11px] uppercase tracking-widest border-b border-[#f1ede9]">
                <th className="px-8 py-5 font-bold">Member</th>
                <th className="px-8 py-5 font-bold">Designation</th>
                <th className="px-8 py-5 font-bold">Contact</th>
                <th className="px-8 py-5 font-bold">Salary</th>
                <th className="px-8 py-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#fcfaf8]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="animate-spin text-[#3d2b1f] mx-auto mb-2" size={30} />
                    <p className="text-[#8d7b68] text-sm">Loading team members...</p>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[#8d7b68] italic font-serif">
                    No team members registered yet.
                  </td>
                </tr>
              ) : (
                workers.map((w) => {
                  const data = w.attributes || w;
                  const identifier = w.documentId || w.id; 

                  return (
                    <tr key={w.id} className="hover:bg-[#fcfaf8] transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-[#2d241e] text-lg">{data?.name}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${roleStyles[data?.role] || 'bg-gray-100 text-gray-800'}`}>
                          {data?.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[#4a3f35] font-medium flex items-center gap-2">
                        <Phone size={14} className="opacity-40" /> {data?.phone}
                      </td>
                      <td className="px-8 py-6 font-serif font-bold text-[#2d241e]">
                        Rs. {Number(data?.salary || 0).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(w, identifier)}
                            className="p-2 text-[#8d7b68] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit Worker"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteWorker(identifier)}
                            className="p-2 text-[#8d7b68] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove Worker"
                          >
                            <UserX size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && pageCount > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-[20px] border border-[#f1ede9] shadow-sm">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-sm font-medium text-[#4a3f35]">
              Page <strong className="text-[#2d241e]">{currentPage}</strong> of <strong className="text-[#2d241e]">{pageCount}</strong>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

      </main>

      {/* Modal Setup Remains the Same */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1e1915]/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] w-full max-w-md shadow-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-[#2d241e] mb-1">
                {editingId ? "Edit Registration" : "New Registration"}
              </h2>
              <p className="text-sm text-[#8d7b68]">
                {editingId ? "Update member details." : "Add a new member to your store team."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Full Name</label>
                <input
                  required 
                  placeholder="e.g. Ali Raza"
                  value={formData.name}
                  className="w-full p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Role</label>
                <select
                  value={formData.role}
                  className="w-full p-4 bg-[#fcfaf8] text-[#1a0f0a] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium appearance-none"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Stock Keeper">Stock Keeper</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Phone</label>
                  <input
                    required 
                    placeholder="0300-XXXXXXX"
                    value={formData.phone}
                    className="w-full p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Salary (Rs.)</label>
                  <input
                    type="number" 
                    required 
                    placeholder="30000"
                    value={formData.salary}
                    className="w-full p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium"
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button" 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-4 text-[#8d7b68] font-bold text-sm hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-[#d4a373] text-[#1e1915] rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] hover:text-white transition-all shadow-lg shadow-amber-900/10 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (editingId ? "Update" : "Register")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}