"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Plus, UserX, Phone, Loader2, Edit, ChevronLeft, ChevronRight, QrCode, X, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase"; // Supabase Import

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", role: "Cashier", phone: "", salary: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // QR Modal state
  const [qrWorker, setQrWorker] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 10; 

  useEffect(() => { 
    fetchWorkers(currentPage); 
  }, [currentPage]);

  const fetchWorkers = async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('workers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      setWorkers(data || []);
      setPageCount(Math.ceil((count || 0) / pageSize) || 1);
    } catch (err) { 
      console.error("Error fetching workers:", err); 
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({ name: "", role: "Cashier", phone: "", salary: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (worker) => {
    setFormData({
      name: worker.name || "",
      role: worker.role || "Cashier",
      phone: worker.phone || "",
      salary: worker.salary || "",
    });
    setEditingId(worker.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        salary: Number(formData.salary)
      };

      if (editingId) {
        const { error } = await supabase.from('workers').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workers').insert([payload]);
        if (error) throw error;
        setCurrentPage(1); 
      }

      setIsModalOpen(false);
      setFormData({ name: "", role: "Cashier", phone: "", salary: "" });
      setEditingId(null);
      fetchWorkers(editingId ? currentPage : 1);
    } catch (err) { 
      alert(`❌ Error saving worker:\n\n${err.message}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteWorker = async (id) => {
    if (!confirm("Are you sure you want to remove this worker from the team?")) return;
    try {
      const { error } = await supabase.from('workers').delete().eq('id', id);
      if (error) throw error;
      
      if (workers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchWorkers(currentPage);
      }
    } catch (err) { 
      alert(`❌ Delete failed:\n\n${err.message}`); 
    }
  };

  // FIXED: Converted multi-line text to clean, structured JSON to fix 'No data found' errors across all scanner apps.
  const getQRData = (w) => {
    if (!w) return "";
    return JSON.stringify({
      id: w.id,
      name: w.name,
      role: w.role,
      phone: w.phone,
      salary: `Rs. ${Number(w.salary || 0).toLocaleString()}`
    });
  };

  const downloadQR = (w) => {
    const canvas = document.getElementById("worker-qr-canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(w.name || "worker").replace(/\s+/g, "_")}_QR.png`;
    link.click();
  };

  const roleStyles = {
    Manager: "bg-amber-100 text-amber-900",
    Cashier: "bg-emerald-100 text-emerald-900",
    Barista: "bg-sky-100 text-sky-900",
    "Stock Keeper": "bg-blue-100 text-blue-900",
  };

  return (
    <div className="flex min-h-screen bg-[#fcfaf8]">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-10 overflow-y-auto transition-all">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 md:mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68] font-bold mb-2">Management</p>
            <h1 className="text-3xl md:text-4xl font-serif text-[#2d241e]">Team Members</h1>
          </div>
          <button onClick={openAddModal} className="bg-[#1e1915] text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] transition-all flex items-center justify-center gap-2 shadow-lg w-full md:w-auto">
            <Plus size={18} /> Add Worker
          </button>
        </div>

        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-[#f1ede9] shadow-sm overflow-hidden mb-6 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#fcfaf8]/50 text-[#8d7b68] text-[11px] uppercase tracking-widest border-b border-[#f1ede9]">
                <th className="px-6 md:px-8 py-5 font-bold whitespace-nowrap">Member</th>
                <th className="px-6 md:px-8 py-5 font-bold whitespace-nowrap">Designation</th>
                <th className="px-6 md:px-8 py-5 font-bold whitespace-nowrap">Contact</th>
                <th className="px-6 md:px-8 py-5 font-bold whitespace-nowrap">Salary</th>
                <th className="px-6 md:px-8 py-5 font-bold text-right whitespace-nowrap">Action</th>
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
                <tr><td colSpan={5} className="py-20 text-center text-[#8d7b68] italic font-serif">No team members registered yet.</td></tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.id} className="hover:bg-[#fcfaf8] transition-colors group">
                    <td className="px-6 md:px-8 py-6">
                      <p className="font-bold text-[#2d241e] text-lg">{w.name}</p>
                    </td>
                    <td className="px-6 md:px-8 py-6">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${roleStyles[w.role] || 'bg-gray-100 text-gray-800'}`}>
                        {w.role}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-6 text-[#4a3f35] font-medium flex items-center gap-2 whitespace-nowrap">
                      <Phone size={14} className="opacity-40" /> {w.phone}
                    </td>
                    <td className="px-6 md:px-8 py-6 font-serif font-bold text-[#2d241e] whitespace-nowrap">
                      Rs. {Number(w.salary || 0).toLocaleString()}
                    </td>
                    <td className="px-6 md:px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setQrWorker(w)} className="p-2 text-[#8d7b68] hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="View QR Code"><QrCode size={18} /></button>
                        <button onClick={() => openEditModal(w)} className="p-2 text-[#8d7b68] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Worker"><Edit size={18} /></button>
                        <button onClick={() => deleteWorker(w.id)} className="p-2 text-[#8d7b68] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Remove Worker"><UserX size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && pageCount > 1 && (
          <div className="flex items-center justify-between bg-white px-4 md:px-6 py-4 rounded-[20px] border border-[#f1ede9] shadow-sm gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="text-xs md:text-sm font-medium text-[#4a3f35]">Page <strong className="text-[#2d241e]">{currentPage}</strong> of <strong className="text-[#2d241e]">{pageCount}</strong></span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))} disabled={currentPage === pageCount} className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent">
              <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1e1915]/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] w-full max-w-md shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-xl md:text-2xl font-serif text-[#2d241e] mb-1">{editingId ? "Edit Registration" : "New Registration"}</h2>
              <p className="text-xs md:text-sm text-[#8d7b68]">{editingId ? "Update member details." : "Add a new member to your store team."}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] md:text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Full Name</label>
                <input required placeholder="e.g. Ali Raza" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 md:p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full p-3 md:p-4 bg-[#fcfaf8] text-[#1a0f0a] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium appearance-none">
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Barista">Barista</option>
                  <option value="Stock Keeper">Stock Keeper</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] md:text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Phone</label>
                  <input required placeholder="0300-XXXXXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 md:p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] md:text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Salary (Rs.)</label>
                  <input type="number" required placeholder="30000" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="w-full p-3 md:p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="flex-1 py-3 md:py-4 text-[#8d7b68] font-bold text-sm hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-2xl transition-all">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-3 md:py-4 bg-[#d4a373] text-[#1e1915] rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (editingId ? "Update" : "Register")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Code View Modal */}
      {qrWorker && (
        <div className="fixed inset-0 bg-[#1e1915]/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-6 md:p-8 rounded-[32px] w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl text-[#2d241e]">{qrWorker.name}</h3>
                <span className={`inline-block mt-1 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${roleStyles[qrWorker.role] || 'bg-gray-100 text-gray-800'}`}>
                  {qrWorker.role}
                </span>
              </div>
              <button onClick={() => setQrWorker(null)} className="p-2 text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-center bg-[#fcfaf8] p-6 rounded-2xl">
              <QRCodeCanvas
                id="worker-qr-canvas"
                value={getQRData(qrWorker)}
                size={200}
                level="M"
                includeMargin={true}
                fgColor="#1e1915"
              />
            </div>

            <p className="text-xs text-center text-[#8d7b68]">Scan this code to view {qrWorker.name.split(" ")[0]}'s details</p>

            <button onClick={() => downloadQR(qrWorker)} className="w-full py-3 md:py-4 bg-[#1e1915] text-white rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] transition-all shadow-lg flex items-center justify-center gap-2">
              <Download size={16} /> Download QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}