"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { 
  Banknote, 
  ShoppingBag, 
  Package, 
  LayoutGrid, 
  Download, 
  TrendingUp, 
  Calendar,
  Loader2 
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    totalProducts: 0, 
    totalCategories: 0,
    totalSalesCount: 0,
    totalRevenue: 0,
    salesToday: 0,
    revenueToday: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

      // Promise.all se tamam data fetch kar rahe hain (Sales ki limit barha di taake purani history bhi aaye)
      const [prodRes, catRes, salesRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, config),
        axios.get(`${API_URL}/api/categories`, config),
        axios.get(`${API_URL}/api/sales?pagination[limit]=1000&sort=Date:desc`, config)
      ]);

      const allSales = salesRes.data?.data || [];
      setSalesData(allSales);

      // Dates calculate karne ke liye
      const todayStr = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

      let tRevenue = 0;
      let revToday = 0;
      let slsToday = 0;
      const dailyGroup = {};

      allSales.forEach(sale => {
        const attr = sale.attributes || sale;
        const amount = Number(attr.Total_Amount || sale.Total_Amount || 0);
        tRevenue += amount;

        // Sale ki exact date nikalna
        const saleDate = new Date(attr.Date || attr.createdAt);
        const saleDateStr = saleDate.toLocaleDateString('en-CA');

        // Today's Stats Filter
        if (saleDateStr === todayStr) {
          revToday += amount;
          slsToday += 1;
        }

        // Daily Breakdown Grouping (Revenue Per Day ke liye)
        if (!dailyGroup[saleDateStr]) {
          dailyGroup[saleDateStr] = { date: saleDateStr, orders: 0, revenue: 0 };
        }
        dailyGroup[saleDateStr].revenue += amount;
        dailyGroup[saleDateStr].orders += 1;
      });

      // Object ko array mein convert karke sort karna (Newest date first)
      const sortedDailyList = Object.values(dailyGroup).sort((a, b) => b.date.localeCompare(a.date));
      setDailyBreakdown(sortedDailyList);

      setStats({
        totalProducts: prodRes.data?.meta?.pagination?.total || 0,
        totalCategories: catRes.data?.meta?.pagination?.total || 0,
        totalSalesCount: allSales.length,
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

  // REVENUE PER DAY DOWNLOAD FUNCTION (Excel/CSV File)
  const downloadRevenueReport = () => {
    if (dailyBreakdown.length === 0) return alert("No sales data available to download!");

    // CSV Header aur Rows banana
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Total Orders,Daily Revenue (Rs.)\n";

    dailyBreakdown.forEach(row => {
      csvContent += `${row.date},${row.orders},${row.revenue}\n`;
    });

    // File download trigger karna
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daily_Revenue_Report_${new Date().toLocaleDateString('en-CA')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statCards = [
    { label: "Total Revenue (All Time)", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: Banknote, color: "text-green-600", bg: "bg-green-50" },
    { label: "Today's Revenue", value: `Rs. ${stats.revenueToday.toLocaleString()}`, icon: TrendingUp, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Total Orders Built", value: stats.totalSalesCount, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Products", value: stats.totalProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#fcfaf8]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
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
      <main className="flex-1 ml-64 p-10 overflow-y-auto">
        
        {/* Header Section */}
        <header className="mb-10 flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68] font-bold mb-2">Live Analytics & Performance</p>
            <h1 className="text-4xl font-serif font-medium text-[#2d241e]">Admin Dashboard</h1>
          </div>
          
          {/* Export Button */}
          <button 
            onClick={downloadRevenueReport}
            className="flex items-center gap-2 bg-[#3d2b1f] hover:bg-[#2d241e] text-white px-6 py-3 rounded-2xl text-xs font-bold tracking-wider transition-all shadow-sm hover:shadow active:scale-95"
          >
            <Download size={16} />
            DOWNLOAD REVENUE REPORT
          </button>
        </header>

        {/* Analytics Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-[28px] border border-[#f1ede9] shadow-sm hover:shadow-md transition-all group">
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <card.icon size={22} className={card.color} />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-[#a89a8e] font-bold mb-1">{card.label}</p>
              <h2 className="text-2xl font-serif font-bold text-[#2d241e]">{card.value}</h2>
            </div>
          ))}
        </div>

        {/* Bottom Section: Revenue Per Day Insights Table */}
        <div className="bg-white rounded-[32px] border border-[#f1ede9] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-[#f1ede9] pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-[#8d7b68]" size={20} />
              <h3 className="text-lg font-serif font-bold text-[#2d241e]">Daily Revenue Breakdown</h3>
            </div>
            <span className="text-xs text-[#a89a8e] font-medium bg-[#fcfaf8] px-3 py-1 rounded-full border border-[#f1ede9]">
              Showing last {dailyBreakdown.length} active days
            </span>
          </div>

          {dailyBreakdown.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#a89a8e] italic">No historical sales data found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f1ede9] text-[11px] uppercase tracking-wider text-[#a89a8e] font-bold">
                    <th className="pb-4 pt-2 font-bold">Date</th>
                    <th className="pb-4 pt-2 font-bold">Orders Processed</th>
                    <th className="pb-4 pt-2 font-bold text-right">Daily Revenue</th>
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