"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Eye, X, Calendar, ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Supabase Import

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pageCount, setPageCount] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchSales();
  }, [page, startDate, endDate]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      // Supabase Pagination setup
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Start building query
      let query = supabase
        .from("sales")
        .select("*", { count: "exact" })
        .order("date", { ascending: false })
        .range(from, to);

      // Apply Date Filters if present
      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte("date", startOfDay.toISOString());
      }
      
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("date", endOfDay.toISOString());
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setSales(data || []);
      setPageCount(Math.ceil((count || 0) / pageSize) || 1);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openReceipt = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeReceipt = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-PK", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-[#fcfaf8]">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-10 flex flex-col h-screen overflow-hidden transition-all">
        
        <header className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68] font-bold mb-1">Reports</p>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
            <h1 className="text-3xl md:text-4xl font-serif text-[#2d241e]">Sales History</h1>
            
            <div className="flex flex-wrap items-end gap-3 bg-white p-3 rounded-2xl border border-[#f1ede9] shadow-sm w-full lg:w-auto">
              <div className="flex flex-col flex-1 min-w-[120px]">
                <label className="text-[10px] uppercase font-bold text-[#8d7b68] mb-1 px-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="px-3 py-2 border border-[#f1ede9] rounded-xl text-sm outline-none focus:border-[#c8834a] text-[#2d241e] w-full" />
              </div>
              <div className="flex flex-col flex-1 min-w-[120px]">
                <label className="text-[10px] uppercase font-bold text-[#8d7b68] mb-1 px-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="px-3 py-2 border border-[#f1ede9] rounded-xl text-sm outline-none focus:border-[#c8834a] text-[#2d241e] w-full" />
              </div>
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }} className="h-10 px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center" title="Clear Filters">
                  <FilterX size={18} />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 bg-white rounded-[24px] md:rounded-[32px] border border-[#f1ede9] shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[#f8f5f0] sticky top-0 z-10 border-b border-[#e8e0d0]">
                <tr className="text-[11px] text-[#a0958a] uppercase tracking-wider font-bold">
                  <th className="p-4 md:p-6 whitespace-nowrap">Invoice ID</th>
                  <th className="p-4 md:p-6 whitespace-nowrap">Date & Time</th>
                  <th className="p-4 md:p-6 whitespace-nowrap">Payment Method</th>
                  <th className="p-4 md:p-6 text-right whitespace-nowrap">Total Amount</th>
                  <th className="p-4 md:p-6 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center p-10 text-[#a0958a]">Loading sales...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-10 text-[#a0958a]">No sales records found for this period.</td></tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-[#f0ede8] hover:bg-[#fcfaf8] transition-colors">
                      <td className="p-4 md:p-6 font-bold text-[#1a0f0a]">{sale.invoice_id || "N/A"}</td>
                      <td className="p-4 md:p-6 text-[#8d7b68] flex items-center gap-2">
                        <Calendar size={14} className="text-[#c8834a]" /> {formatDate(sale.date)}
                      </td>
                      <td className="p-4 md:p-6">
                        <span className="bg-[#f8f5f0] text-[#8d7b68] px-3 py-1 rounded-full text-xs font-bold border border-[#e8e0d0]">
                          {sale.payment_method || "Cash"}
                        </span>
                      </td>
                      <td className="p-4 md:p-6 text-right font-serif font-bold text-lg text-[#2d241e]">Rs. {sale.total_amount || 0}</td>
                      <td className="p-4 md:p-6 text-center">
                        <button onClick={() => openReceipt(sale)} className="bg-[#1a0f0a] text-white p-2 rounded-xl hover:bg-[#c8834a] transition-colors inline-flex justify-center items-center" title="View Receipt">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && sales.length > 0 && (
            <div className="p-4 border-t border-[#f1ede9] bg-[#fcfaf8] flex justify-between items-center px-4 md:px-6 gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="flex items-center gap-1 md:gap-2 px-3 py-2 bg-white border border-[#e8e0d0] rounded-xl text-xs md:text-sm font-bold text-[#2d241e] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8f5f0]">
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-xs md:text-sm font-bold text-[#8d7b68]">Page {page} of {pageCount}</span>
              <button disabled={page === pageCount || pageCount === 0} onClick={() => setPage(p => Math.min(pageCount, p + 1))} className="flex items-center gap-1 md:gap-2 px-3 py-2 bg-white border border-[#e8e0d0] rounded-xl text-xs md:text-sm font-bold text-[#2d241e] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8f5f0]">
                <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

      </main>

      {/* RECEIPT MODAL */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fcfaf8] w-full max-w-[400px] rounded-[32px] overflow-hidden shadow-2xl relative border border-[#e8e0d0] max-h-[90vh] flex flex-col">
            
            <button onClick={closeReceipt} className="absolute right-4 top-4 bg-white p-2 rounded-full text-[#a0958a] hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
              <X size={20} />
            </button>

            <div className="text-center pt-10 pb-6 px-8 border-b border-dashed border-[#d1c7bc] shrink-0">
              <h2 className="text-2xl font-serif font-bold text-[#1a0f0a] mb-1">Depresso Haus</h2>
              <p className="text-xs text-[#a0958a] uppercase tracking-widest">Digital Receipt</p>
              
              <div className="mt-6 text-left space-y-1 text-sm text-[#8d7b68]">
                <p><span className="font-bold text-[#1a0f0a]">Invoice:</span> {selectedSale.invoice_id}</p>
                <p><span className="font-bold text-[#1a0f0a]">Date:</span> {formatDate(selectedSale.date)}</p>
                <p><span className="font-bold text-[#1a0f0a]">Payment:</span> {selectedSale.payment_method || "Cash"}</p>
              </div>
            </div>

            <div className="px-8 py-6 overflow-y-auto flex-1">
              <h3 className="text-[10px] uppercase tracking-widest text-[#a0958a] font-bold mb-4">Items Ordered</h3>
              <ul className="space-y-4">
                {(() => {
                  try {
                    let itemsData = selectedSale.items;
                    if (typeof itemsData === 'string') itemsData = JSON.parse(itemsData);
                    
                    // Supabase se items ab directly text lines ya JSON objects mein ayenge
                    let textArray = [];
                    if (Array.isArray(itemsData)) {
                      textArray = itemsData[0]?.text ? itemsData[0].text.split("\n") : [];
                    } else if (typeof itemsData === "object" && itemsData.text) {
                      textArray = itemsData.text.split("\n");
                    } else if (typeof itemsData === 'string') {
                      textArray = itemsData.split("\n");
                    }

                    if (textArray.length > 0) {
                      return textArray.map((itemLine, index) => {
                        if (!itemLine.trim()) return null;
                        const parts = itemLine.split(" - "); 
                        return (
                          <li key={index} className="flex justify-between items-start text-sm text-[#1a0f0a]">
                            <span className="pr-4">{parts[0]}</span>
                            <span className="font-bold whitespace-nowrap">{parts[1] || ""}</span>
                          </li>
                        );
                      });
                    }
                  } catch (e) {
                    console.error("Error parsing items:", e);
                  }
                  return <p className="text-sm text-gray-500">No items recorded.</p>;
                })()}
              </ul>
            </div>

            <div className="bg-[#1a0f0a] text-white px-8 py-6 rounded-t-3xl mt-2 shrink-0">
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest text-[#a0958a] font-bold">Total Paid</span>
                <span className="text-3xl font-serif">Rs. {selectedSale.total_amount}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}