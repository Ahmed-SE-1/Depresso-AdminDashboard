"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Eye, X, Calendar, ChevronLeft, ChevronRight, FilterX } from "lucide-react";

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

  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

  useEffect(() => {
    fetchSales();
  }, [page, startDate, endDate]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      let query = `${API_URL}/api/sales?sort=Date:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

      // Date Filter Fix:
      // Strapi needs ISO 8601 strings for Datetime comparisons
      if (startDate) {
        // Set to start of the day in local time, then convert to ISO string (UTC)
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        query += `&filters[Date][$gte]=${startOfDay.toISOString()}`;
      }
      
      if (endDate) {
        // Set to end of the day in local time, then convert to ISO string (UTC)
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query += `&filters[Date][$lte]=${endOfDay.toISOString()}`;
      }

      const res = await axios.get(query, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSales(res.data?.data || []);
      setPageCount(res.data?.meta?.pagination?.pageCount || 1);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openReceipt = (sale) => {
    setSelectedSale(sale.attributes || sale);
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
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-[#fcfaf8]">
      <Sidebar />
      <main className="flex-1 ml-64 p-10 flex flex-col h-screen overflow-hidden">
        
        <header className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68] font-bold mb-1">Reports</p>
          <div className="flex justify-between items-end">
            <h1 className="text-4xl font-serif text-[#2d241e]">Sales History</h1>
            
            <div className="flex items-end gap-4 bg-white p-3 rounded-2xl border border-[#f1ede9] shadow-sm">
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#8d7b68] mb-1 px-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-[#f1ede9] rounded-xl text-sm outline-none focus:border-[#c8834a] text-[#2d241e]"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#8d7b68] mb-1 px-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-[#f1ede9] rounded-xl text-sm outline-none focus:border-[#c8834a] text-[#2d241e]"
                />
              </div>
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }}
                  className="h-10 px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
                  title="Clear Filters"
                >
                  <FilterX size={18} />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 bg-white rounded-[32px] border border-[#f1ede9] shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8f5f0] sticky top-0 z-10 border-b border-[#e8e0d0]">
                <tr className="text-[11px] text-[#a0958a] uppercase tracking-wider font-bold">
                  <th className="p-6">Invoice ID</th>
                  <th className="p-6">Date & Time</th>
                  <th className="p-6">Payment Method</th>
                  <th className="p-6 text-right">Total Amount</th>
                  <th className="p-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center p-10 text-[#a0958a]">Loading sales...</td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-10 text-[#a0958a]">No sales records found for this period.</td>
                  </tr>
                ) : (
                  sales.map((sale) => {
                    const data = sale.attributes || sale;
                    return (
                      <tr key={sale.id} className="border-b border-[#f0ede8] hover:bg-[#fcfaf8] transition-colors">
                        <td className="p-6 font-bold text-[#1a0f0a]">{data.Invoice_ID || "N/A"}</td>
                        <td className="p-6 text-[#8d7b68] flex items-center gap-2">
                          <Calendar size={14} className="text-[#c8834a]" />
                          {formatDate(data.Date)}
                        </td>
                        <td className="p-6">
                          <span className="bg-[#f8f5f0] text-[#8d7b68] px-3 py-1 rounded-full text-xs font-bold border border-[#e8e0d0]">
                            {data.Payment_Method || "Cash"}
                          </span>
                        </td>
                        <td className="p-6 text-right font-serif font-bold text-lg text-[#2d241e]">
                          Rs. {data.Total_Amount || 0}
                        </td>
                        <td className="p-6 text-center">
                          <button 
                            onClick={() => openReceipt(sale)}
                            className="bg-[#1a0f0a] text-white p-2 rounded-xl hover:bg-[#c8834a] transition-colors inline-flex justify-center items-center"
                            title="View Receipt"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && sales.length > 0 && (
            <div className="p-4 border-t border-[#f1ede9] bg-[#fcfaf8] flex justify-between items-center px-6">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e0d0] rounded-xl text-sm font-bold text-[#2d241e] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8f5f0]"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm font-bold text-[#8d7b68]">
                Page {page} of {pageCount}
              </span>
              <button 
                disabled={page === pageCount || pageCount === 0}
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e0d0] rounded-xl text-sm font-bold text-[#2d241e] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8f5f0]"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

      </main>

      {/* RECEIPT MODAL */}
      {isModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#fcfaf8] w-[400px] rounded-[32px] overflow-hidden shadow-2xl relative border border-[#e8e0d0]">
            
            <button 
              onClick={closeReceipt}
              className="absolute right-4 top-4 bg-white p-2 rounded-full text-[#a0958a] hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
            >
              <X size={20} />
            </button>

            <div className="text-center pt-10 pb-6 px-8 border-b border-dashed border-[#d1c7bc]">
              <h2 className="text-2xl font-serif font-bold text-[#1a0f0a] mb-1">Depresso Haus</h2>
              <p className="text-xs text-[#a0958a] uppercase tracking-widest">Digital Receipt</p>
              
              <div className="mt-6 text-left space-y-1 text-sm text-[#8d7b68]">
                <p><span className="font-bold text-[#1a0f0a]">Invoice:</span> {selectedSale.Invoice_ID}</p>
                <p><span className="font-bold text-[#1a0f0a]">Date:</span> {formatDate(selectedSale.Date)}</p>
                <p><span className="font-bold text-[#1a0f0a]">Payment:</span> {selectedSale.Payment_Method || "Cash"}</p>
              </div>
            </div>

            <div className="px-8 py-6 max-h-[300px] overflow-y-auto">
              <h3 className="text-[10px] uppercase tracking-widest text-[#a0958a] font-bold mb-4">Items Ordered</h3>
              <ul className="space-y-4">
                {(() => {
                  const itemsData = selectedSale.Items;
                  
                  if (!itemsData || itemsData.length === 0) {
                    return <p className="text-sm text-gray-500">No items recorded.</p>;
                  }

                  let itemsText = "";

                  // FIX: Handle "Rich text (Blocks)" format
                  if (Array.isArray(itemsData)) {
                    // Extract text from the block structure
                    itemsText = itemsData[0]?.children?.[0]?.text || "";
                  } else if (typeof itemsData === "string") {
                    // Fallback for any old strings
                    itemsText = itemsData;
                  }

                  if (itemsText) {
                    return itemsText.split("\n").map((itemLine, index) => {
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

                  return <p className="text-sm text-gray-500">No items recorded.</p>;
                })()}
              </ul>
            </div>

            <div className="bg-[#1a0f0a] text-white px-8 py-6 rounded-t-3xl mt-2">
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest text-[#a0958a] font-bold">Total Paid</span>
                <span className="text-3xl font-serif">Rs. {selectedSale.Total_Amount}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}