"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase"; // Supabase Import
import {
  Banknote, ShoppingBag, Package, LayoutGrid,
  Download, TrendingUp, Calendar, Loader2,
  Sun, Moon, Lock, Unlock, Copy, X, RefreshCw, Check
} from "lucide-react";

const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    totalProducts: 0, totalCategories: 0, totalSalesCount: 0,
    totalRevenue: 0, salesToday: 0, revenueToday: 0
  });
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ---- Shift system state ----
  const [categories, setCategories] = useState([]);
  const [catMap, setCatMap] = useState({}); // lowercased product name -> category name
  const [categoryOrder, setCategoryOrder] = useState([]); // category names in db order
  const [todaySales, setTodaySales] = useState([]); // today's sales, ascending by time
  const [todayShifts, setTodayShifts] = useState({ morning: null, evening: null });
  const [shiftHistory, setShiftHistory] = useState([]);
  const [shiftLoading, setShiftLoading] = useState(true);

  const [openModalType, setOpenModalType] = useState(null); // 'morning' | 'evening' | null
  const [openCidInput, setOpenCidInput] = useState("");
  const [closeModalType, setCloseModalType] = useState(null);
  const [closeCidInput, setCloseCidInput] = useState("");
  const [cashoutInput, setCashoutInput] = useState("0");
  const [shiftSubmitting, setShiftSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const todayStr = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    fetchDashboardData();
    fetchShiftEssentials();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Promise.all for fetching counts and sales simultaneously
      const [
        { count: prodCount }, 
        { count: catCount }, 
        { data: allSales }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('*').order('date', { ascending: false })
      ]);

      const salesDataList = allSales || [];
      const todayStrLocal = new Date().toLocaleDateString('en-CA');

      let tRevenue = 0;
      let revToday = 0;
      let slsToday = 0;
      const dailyGroup = {};

      salesDataList.forEach(sale => {
        const amount = Number(sale.total_amount || 0);
        tRevenue += amount;

        const saleDate = new Date(sale.date || sale.created_at);
        const saleDateStr = saleDate.toLocaleDateString('en-CA');

        // Today's Stats
        if (saleDateStr === todayStrLocal) {
          revToday += amount;
          slsToday += 1;
        }

        // Daily Breakdown Grouping
        if (!dailyGroup[saleDateStr]) {
          dailyGroup[saleDateStr] = { date: saleDateStr, orders: 0, revenue: 0 };
        }
        dailyGroup[saleDateStr].revenue += amount;
        dailyGroup[saleDateStr].orders += 1;
      });

      const sortedDailyList = Object.values(dailyGroup).sort((a, b) => b.date.localeCompare(a.date));
      setDailyBreakdown(sortedDailyList);

      setStats({
        totalProducts: prodCount || 0,
        totalCategories: catCount || 0,
        totalSalesCount: salesDataList.length,
        totalRevenue: tRevenue,
        salesToday: slsToday,
        revenueToday: revToday
      });

    } catch (error) { 
      console.error("Error fetching dashboard analytics:", error); 
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- SHIFT SYSTEM LOGIC ----------------

  const fetchShiftEssentials = async () => {
    setShiftLoading(true);
    try {
      const dayStart = new Date(`${todayStr}T00:00:00`);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [
        { data: catData },
        { data: prodData },
        { data: salesData },
        { data: shiftsData },
        { data: historyData },
      ] = await Promise.all([
        supabase.from('categories').select('id,name').order('id', { ascending: true }),
        supabase.from('products').select('id,name,category_id'),
        supabase.from('sales').select('*')
          .gte('date', dayStart.toISOString())
          .lt('date', dayEnd.toISOString())
          .order('date', { ascending: true }),
        supabase.from('shifts').select('*').eq('shift_date', todayStr),
        supabase.from('shifts').select('*').eq('status', 'closed').order('shift_date', { ascending: false }).limit(14),
      ]);

      const cats = catData || [];
      const catNameById = {};
      cats.forEach(c => { catNameById[c.id] = c.name; });

      const map = {};
      (prodData || []).forEach(p => {
        if (p.name) map[p.name.trim().toLowerCase()] = catNameById[p.category_id] || "Uncategorized";
      });

      setCategories(cats);
      setCatMap(map);
      setCategoryOrder(cats.map(c => c.name));
      setTodaySales(salesData || []);

      const shiftsObj = { morning: null, evening: null };
      (shiftsData || []).forEach(s => { shiftsObj[s.shift_type] = s; });
      setTodayShifts(shiftsObj);

      setShiftHistory(historyData || []);
    } catch (err) {
      console.error("Error fetching shift data:", err);
    } finally {
      setShiftLoading(false);
    }
  };

  // Parses one entry of the sales.items jsonb array. Handles both
  // plain-string items ("Mocha (x1) - Rs. 500") and object items
  // (e.g. { text: "..." }), since existing data has a mix of both.
  const parseItemEntry = (entry) => {
    let str = null;
    if (typeof entry === "string") {
      str = entry;
    } else if (entry && typeof entry === "object") {
      str = entry.text || null;
      if (!str && entry.name) {
        return { name: String(entry.name), qty: Number(entry.qty || entry.quantity || 1) };
      }
    }
    if (!str) return { name: "Unknown", qty: 1 };
    const match = str.match(/^(.*?)\s*\(x(\d+)\)/i);
    if (match) {
      return { name: match[1].trim(), qty: parseInt(match[2], 10) || 1 };
    }
    return { name: str.trim(), qty: 1 };
  };

  // Computes order range, order count, total money, and per-category
  // item breakdown for a shift, using the day's sales sorted by time.
  const computeShiftStats = (shift) => {
    if (!shift) return null;
    const startTime = new Date(shift.opened_at).getTime();
    const endTime = shift.closed_at ? new Date(shift.closed_at).getTime() : Date.now();

    let firstIdx = null, lastIdx = null, totalMoney = 0;
    const breakdown = {};
    categoryOrder.forEach(c => { breakdown[c] = 0; });
    let uncategorized = 0;

    todaySales.forEach((sale, idx) => {
      const t = new Date(sale.date || sale.created_at).getTime();
      if (t >= startTime && t <= endTime) {
        const orderNo = idx + 1;
        if (firstIdx === null) firstIdx = orderNo;
        lastIdx = orderNo;
        totalMoney += Number(sale.total_amount || 0);

        const items = Array.isArray(sale.items) ? sale.items : [];
        items.forEach(entry => {
          const { name, qty } = parseItemEntry(entry);
          const cat = catMap[name.trim().toLowerCase()];
          if (cat && Object.prototype.hasOwnProperty.call(breakdown, cat)) {
            breakdown[cat] += qty;
          } else {
            uncategorized += qty;
          }
        });
      }
    });

    if (uncategorized > 0) breakdown["Uncategorized"] = uncategorized;

    return {
      order_range: firstIdx ? `${firstIdx}-${lastIdx}` : "0-0",
      order_count: firstIdx ? (lastIdx - firstIdx + 1) : 0,
      total_money: totalMoney,
      category_breakdown: breakdown,
    };
  };

  const openOpenModal = (type) => {
    setOpenModalType(type);
    if (type === "evening" && todayShifts.morning && todayShifts.morning.status === "closed") {
      setOpenCidInput(String(todayShifts.morning.closing_cid ?? ""));
    } else {
      setOpenCidInput("");
    }
  };

  const openCloseModal = (type) => {
    setCloseModalType(type);
    setCloseCidInput("");
    setCashoutInput("0");
  };

  const handleOpenShift = async () => {
    if (openCidInput === "" || isNaN(Number(openCidInput))) {
      return alert("Opening CID likhna zaroori hai");
    }
    setShiftSubmitting(true);
    try {
      const { error } = await supabase.from('shifts').insert([{
        shift_date: todayStr,
        shift_type: openModalType,
        status: "open",
        opened_at: new Date().toISOString(),
        opening_cid: Number(openCidInput),
      }]);
      if (error) throw error;
      setOpenModalType(null);
      setOpenCidInput("");
      fetchShiftEssentials();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setShiftSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (closeCidInput === "" || isNaN(Number(closeCidInput))) {
      return alert("Closing CID likhna zaroori hai");
    }
    setShiftSubmitting(true);
    try {
      const shift = todayShifts[closeModalType];
      const closedAt = new Date().toISOString();
      const stats = computeShiftStats({ ...shift, closed_at: closedAt });

      const { error } = await supabase.from('shifts').update({
        status: "closed",
        closed_at: closedAt,
        closing_cid: Number(closeCidInput),
        cashout: Number(cashoutInput) || 0,
        order_range: stats.order_range,
        order_count: stats.order_count,
        total_money: stats.total_money,
        category_breakdown: stats.category_breakdown,
      }).eq('id', shift.id);
      if (error) throw error;

      setCloseModalType(null);
      setCloseCidInput("");
      setCashoutInput("0");
      fetchShiftEssentials();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setShiftSubmitting(false);
    }
  };

  const generateEODText = (shift) => {
    const d = new Date(`${shift.shift_date}T00:00:00`);
    const dateLabel = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
    const lines = [];
    lines.push(`EOD ${dateLabel} ${shift.shift_type}`);
    lines.push(`Order ${shift.order_range || "0-0"}`);
    const breakdown = shift.category_breakdown || {};
    Object.entries(breakdown).forEach(([cat, count]) => {
      lines.push(`${cat} ${count}`);
    });
    lines.push(`Money ${Math.round(shift.total_money || 0)}`);
    lines.push(`Cashout ${Math.round(shift.cashout || 0)}`);
    lines.push(`CiD ${Math.round(shift.closing_cid || 0)}`);
    return lines.join("\n");
  };

  const copyEOD = async (shift) => {
    try {
      await navigator.clipboard.writeText(generateEODText(shift));
      setCopiedId(shift.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      alert("Copy nahi ho saka, browser permission check karein.");
    }
  };

  // -------------------------------------------------------

  const downloadRevenueReport = () => {
    if (dailyBreakdown.length === 0) return alert("No sales data available to download!");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Total Orders,Daily Revenue (Rs.)\n";

    dailyBreakdown.forEach(row => {
      csvContent += `${row.date},${row.orders},${row.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daily_Revenue_Report_${new Date().toLocaleDateString('en-CA')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statCards = [
    { label: "Total Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: Banknote, color: "text-green-600", bg: "bg-green-50" },
    { label: "Today's Revenue", value: `Rs. ${stats.revenueToday.toLocaleString()}`, icon: TrendingUp, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Total Orders Built", value: stats.totalSalesCount, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Products", value: stats.totalProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#fcfaf8]">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 flex items-center justify-center transition-all">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#3d2b1f] mx-auto mb-4" size={40} />
            <p className="text-[#8d7b68] font-medium animate-pulse">Loading Analytics Dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  const shiftMeta = {
    morning: { label: "Morning Shift", icon: Sun, color: "text-amber-600", bg: "bg-amber-50", ring: "border-amber-200" },
    evening: { label: "Evening Shift", icon: Moon, color: "text-indigo-600", bg: "bg-indigo-50", ring: "border-indigo-200" },
  };

  return (
    <div className="flex min-h-screen bg-[#fcfaf8]">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-10 overflow-y-auto transition-all">
        
        <header className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68] font-bold mb-2">Live Analytics & Performance</p>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-[#2d241e]">Admin Dashboard</h1>
          </div>
          
          <button onClick={downloadRevenueReport} className="flex items-center justify-center gap-2 bg-[#3d2b1f] hover:bg-[#2d241e] text-white px-6 py-3 md:py-4 rounded-2xl text-xs font-bold tracking-wider transition-all shadow-sm active:scale-95 w-full md:w-auto">
            <Download size={16} /> DOWNLOAD REPORT
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] md:rounded-[28px] border border-[#f1ede9] shadow-sm hover:shadow-md transition-all group">
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                <card.icon size={22} className={card.color} />
              </div>
              <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#a89a8e] font-bold mb-1">{card.label}</p>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2d241e]">{card.value}</h2>
            </div>
          ))}
        </div>

        {/* ---------------- SHIFT SYSTEM ---------------- */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="text-[#8d7b68]" size={20} />
              <h3 className="text-lg font-serif font-bold text-[#2d241e]">Today's Shifts</h3>
            </div>
            <button onClick={fetchShiftEssentials} className="p-2 text-[#8d7b68] hover:text-[#2d241e] hover:bg-white rounded-xl transition-all" title="Refresh">
              <RefreshCw size={16} className={shiftLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {["morning", "evening"].map((type) => {
              const meta = shiftMeta[type];
              const shift = todayShifts[type];
              const Icon = meta.icon;
              const liveStats = shift && shift.status === "open" ? computeShiftStats(shift) : null;

              return (
                <div key={type} className={`bg-white rounded-[24px] md:rounded-[28px] border ${meta.ring} shadow-sm p-6 md:p-7`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center`}>
                        <Icon size={20} className={meta.color} />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-[#2d241e]">{meta.label}</h4>
                        <p className="text-[11px] text-[#a89a8e] font-medium">
                          {!shift ? "Shuru nahi hui" : shift.status === "open" ? "Continuing" : "Closed"}
                        </p>
                      </div>
                    </div>
                    {!shift ? (
                      <Unlock size={16} className="text-[#c9beb2]" />
                    ) : shift.status === "open" ? (
                      <Unlock size={16} className="text-emerald-500" />
                    ) : (
                      <Lock size={16} className="text-[#8d7b68]" />
                    )}
                  </div>

                  {!shift && (
                    <button
                      onClick={() => openOpenModal(type)}
                      className="w-full py-3 md:py-4 bg-[#1e1915] text-white rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] transition-all shadow-sm"
                    >
                      Open {meta.label}
                    </button>
                  )}

                  {shift && shift.status === "open" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#fcfaf8] rounded-xl p-3">
                          <p className="text-[9px] uppercase text-[#a89a8e] font-bold mb-1">Opening CID</p>
                          <p className="text-sm font-bold text-[#2d241e]">Rs. {Number(shift.opening_cid || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-[#fcfaf8] rounded-xl p-3">
                          <p className="text-[9px] uppercase text-[#a89a8e] font-bold mb-1">Orders So Far</p>
                          <p className="text-sm font-bold text-[#2d241e]">{liveStats?.order_count ?? 0}</p>
                        </div>
                        <div className="bg-[#fcfaf8] rounded-xl p-3">
                          <p className="text-[9px] uppercase text-[#a89a8e] font-bold mb-1">Money So Far</p>
                          <p className="text-sm font-bold text-[#2d241e]">Rs. {Number(liveStats?.total_money || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openCloseModal(type)}
                        className="w-full py-3 md:py-4 bg-[#d4a373] text-[#1e1915] rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] hover:text-white transition-all shadow-sm"
                      >
                        Close {meta.label}
                      </button>
                    </div>
                  )}

                  {shift && shift.status === "closed" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-[#fcfaf8] rounded-xl p-3">
                          <p className="text-[9px] uppercase text-[#a89a8e] font-bold mb-1">Orders</p>
                          <p className="font-bold text-[#2d241e]">{shift.order_range} ({shift.order_count})</p>
                        </div>
                        <div className="bg-[#fcfaf8] rounded-xl p-3">
                          <p className="text-[9px] uppercase text-[#a89a8e] font-bold mb-1">Money</p>
                          <p className="font-bold text-[#2d241e]">Rs. {Number(shift.total_money || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-[#fcfaf8] rounded-xl p-3">
                          <p className="text-[9px] uppercase text-[#a89a8e] font-bold mb-1">Cashout</p>
                          <p className="font-bold text-[#2d241e]">Rs. {Number(shift.cashout || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-[#fcfaf8] rounded-xl p-3">
                          <p className="text-[9px] uppercase text-[#a89a8e] font-bold mb-1">Closing CID</p>
                          <p className="font-bold text-[#2d241e]">Rs. {Number(shift.closing_cid || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyEOD(shift)}
                        className="w-full py-3 bg-[#fcfaf8] border border-[#f1ede9] text-[#4a3f35] rounded-2xl font-bold text-sm hover:bg-[#f1ede9] transition-all flex items-center justify-center gap-2"
                      >
                        {copiedId === shift.id ? <><Check size={16} className="text-emerald-600" /> Copied!</> : <><Copy size={16} /> Copy EOD Text</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------- SHIFT HISTORY ---------------- */}
        {shiftHistory.length > 0 && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-[#f1ede9] p-4 md:p-8 shadow-sm overflow-x-auto mb-10">
            <div className="flex items-center gap-3 mb-6 border-b border-[#f1ede9] pb-4">
              <Lock className="text-[#8d7b68]" size={20} />
              <h3 className="text-lg font-serif font-bold text-[#2d241e]">Shift History (EOD Records)</h3>
            </div>
            <div className="min-w-[600px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1ede9] text-[11px] uppercase tracking-wider text-[#a89a8e] font-bold">
                    <th className="pb-4 pt-2">Date</th>
                    <th className="pb-4 pt-2">Shift</th>
                    <th className="pb-4 pt-2">Orders</th>
                    <th className="pb-4 pt-2 text-right">Money</th>
                    <th className="pb-4 pt-2 text-right">CiD</th>
                    <th className="pb-4 pt-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fdfbf9]">
                  {shiftHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-[#fcfaf8]/50 transition-colors text-sm text-[#2d241e]">
                      <td className="py-4 font-medium">{new Date(`${s.shift_date}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="py-4 capitalize text-[#8d7b68]">{s.shift_type}</td>
                      <td className="py-4 text-[#8d7b68]">{s.order_range} ({s.order_count})</td>
                      <td className="py-4 font-bold text-right text-green-700">Rs. {Number(s.total_money || 0).toLocaleString()}</td>
                      <td className="py-4 text-right">Rs. {Number(s.closing_cid || 0).toLocaleString()}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => copyEOD(s)} className="p-2 text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all" title="Copy EOD Text">
                          {copiedId === s.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-[#f1ede9] p-4 md:p-8 shadow-sm overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-[#f1ede9] pb-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-[#8d7b68]" size={20} />
              <h3 className="text-lg font-serif font-bold text-[#2d241e]">Daily Revenue Breakdown</h3>
            </div>
            <span className="text-xs text-[#a89a8e] font-medium bg-[#fcfaf8] px-3 py-1 rounded-full border border-[#f1ede9] self-start sm:self-auto">
              Showing last {dailyBreakdown.length} active days
            </span>
          </div>

          {dailyBreakdown.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#a89a8e] italic">No historical sales data found.</p>
            </div>
          ) : (
            <div className="min-w-[500px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1ede9] text-[11px] uppercase tracking-wider text-[#a89a8e] font-bold">
                    <th className="pb-4 pt-2">Date</th>
                    <th className="pb-4 pt-2">Orders Processed</th>
                    <th className="pb-4 pt-2 text-right">Daily Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fdfbf9]">
                  {dailyBreakdown.map((row, index) => (
                    <tr key={index} className="hover:bg-[#fcfaf8]/50 transition-colors text-sm text-[#2d241e]">
                      <td className="py-4 font-medium">{new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="py-4 text-[#8d7b68]">{row.orders} orders</td>
                      <td className="py-4 font-bold text-right text-green-700">Rs. {row.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* ---- Open Shift Modal ---- */}
      {openModalType && (
        <div className="fixed inset-0 bg-[#1e1915]/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-6 md:p-8 rounded-[32px] w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl text-[#2d241e]">Open {shiftMeta[openModalType].label}</h3>
              <button onClick={() => setOpenModalType(null)} className="p-2 text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all"><X size={20} /></button>
            </div>

            {openModalType === "evening" && (
              <p className="text-xs text-[#8d7b68] bg-[#fcfaf8] p-3 rounded-xl">
                {todayShifts.morning && todayShifts.morning.status === "closed"
                  ? "Ye amount morning shift ke closing CID se liya gaya hai. Agar cash match karta hai to confirm kar dein, warna edit kar lein."
                  : "Morning shift abhi close nahi hui, is liye amount manually likhein."}
              </p>
            )}

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Opening CID (Cash in Drawer)</label>
              <input
                type="number"
                autoFocus
                placeholder="e.g. 5000"
                value={openCidInput}
                onChange={(e) => setOpenCidInput(e.target.value)}
                className="w-full p-3 md:p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium"
              />
            </div>

            <button
              onClick={handleOpenShift}
              disabled={shiftSubmitting}
              className="w-full py-3 md:py-4 bg-[#1e1915] text-white rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {shiftSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Confirm & Open Shift"}
            </button>
          </div>
        </div>
      )}

      {/* ---- Close Shift Modal ---- */}
      {closeModalType && (
        <div className="fixed inset-0 bg-[#1e1915]/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-6 md:p-8 rounded-[32px] w-full max-w-md shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl text-[#2d241e]">Close {shiftMeta[closeModalType].label}</h3>
              <button onClick={() => setCloseModalType(null)} className="p-2 text-[#8d7b68] hover:text-[#2d241e] hover:bg-[#fcfaf8] rounded-xl transition-all"><X size={20} /></button>
            </div>

            {(() => {
              const shift = todayShifts[closeModalType];
              const preview = computeShiftStats(shift);
              return (
                <div className="bg-[#fcfaf8] rounded-2xl p-4 space-y-2">
                  <p className="text-[11px] uppercase font-bold text-[#8d7b68] mb-2">Auto-Calculated Summary</p>
                  <div className="flex justify-between text-sm"><span className="text-[#8d7b68]">Order Range</span><span className="font-bold text-[#2d241e]">{preview.order_range}</span></div>
                  {Object.entries(preview.category_breakdown).map(([cat, count]) => (
                    <div key={cat} className="flex justify-between text-sm"><span className="text-[#8d7b68]">{cat}</span><span className="font-bold text-[#2d241e]">{count}</span></div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-[#f1ede9]"><span className="text-[#8d7b68]">Money</span><span className="font-bold text-[#2d241e]">Rs. {preview.total_money.toLocaleString()}</span></div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Closing CID</label>
                <input
                  type="number"
                  placeholder="e.g. 4170"
                  value={closeCidInput}
                  onChange={(e) => setCloseCidInput(e.target.value)}
                  className="w-full p-3 md:p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-[#4a3f35] ml-1">Cashout</label>
                <input
                  type="number"
                  placeholder="0"
                  value={cashoutInput}
                  onChange={(e) => setCashoutInput(e.target.value)}
                  className="w-full p-3 md:p-4 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#b8ad9e] rounded-2xl border-2 border-transparent outline-none focus:border-[#d4a373] transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleCloseShift}
              disabled={shiftSubmitting}
              className="w-full py-3 md:py-4 bg-[#d4a373] text-[#1e1915] rounded-2xl font-bold text-sm hover:bg-[#3d2b1f] hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {shiftSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Confirm & Close Shift"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}