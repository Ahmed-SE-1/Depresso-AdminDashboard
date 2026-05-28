"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check karein ke user ke paas login token hai ya nahi
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Agar token nahi hai toh login page par bhej dein
      router.push("/login");
    } else {
      // Agar logged in hai toh seedha dashboard par bhej dein
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f0]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Checking authentication...</p>
      </div>
    </div>
  );
}