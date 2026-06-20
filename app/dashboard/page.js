"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase"; // Supabase Import
import { 
  Banknote, ShoppingBag, Package, LayoutGrid, 
  Download, TrendingUp, Calendar, Loader2 
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    totalProducts: 0, totalCategories: 0, totalSalesCount: 0,
    totalRevenue: 0, salesToday: 0, revenueToday: 0
  });
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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
      const todayStr = new Date().toLocaleDateString('en-CA');

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
        if (saleDateStr === todayStr) {
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
    </div>
  );
}