"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Browser se token uthayen
    const token = localStorage.getItem("token");

    // 2. Agar token nahi hai toh seedha Login Page (/) par bhej dein
    if (!token) {
      router.push("/");
    } else {
      // 3. Agar token mil gaya toh content show karein
      setIsAuthenticated(true);
    }
  }, [router]);

  // Jab tak check ho raha hai, tab tak empty ya loader show karein
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2ece0]">
        <div className="text-[#a89880] font-medium tracking-widest animate-pulse uppercase text-xs">
          Verifying Session...
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;600&display=swap');

        .dh-layout {
          display: flex;
          background: #f2ece0;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        .dh-main {
          flex: 1;
          margin-left: 210px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dh-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 32px;
          background: rgba(242, 236, 224, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e4dccf;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .dh-topbar-date {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a89880;
        }

        .dh-topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dh-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          border: 1px solid #e4dccf;
          border-radius: 30px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #1a0f0a;
        }
        .dh-status-dot {
          width: 7px; height: 7px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .dh-avatar {
          width: 36px; height: 36px;
          background: #1a0f0a;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #c8834a;
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .dh-page-content {
          flex: 1;
          padding: 32px;
        }
      `}</style>

      <div className="dh-layout">
        <Sidebar />

        <div className="dh-main">
          {/* Top Header */}
          <header className="dh-topbar">
            <span className="dh-topbar-date">
              Admin Panel &nbsp;/&nbsp; {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            <div className="dh-topbar-right">
              <div className="dh-status-badge">
                <span className="dh-status-dot"></span>
                Admin · Online
              </div>
              <div className="dh-avatar">A</div>
            </div>
          </header>

          {/* Page Content */}
          <main className="dh-page-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}