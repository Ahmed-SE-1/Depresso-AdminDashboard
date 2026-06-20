"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Supabase client import kiya hai

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Supabase Login Logic
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert(error.message || "Invalid credentials! Please try again.");
      setIsSubmitting(false);
    } else {
      // Login successful, redirect to dashboard
      // Supabase khud automatically token browser mein save kar leta hai
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e5e5e5]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center">
        <div className="text-3xl text-blue-700 font-bold mb-2">DH</div>
        <h2 className="text-xl text-blue-700 font-semibold">Depresso Haus Store</h2>
        <p className="text-gray-500 text-sm mb-6">Powered by Supabase</p> {/* Yahan Supabase likh diya :) */}

        <input
          type="email"
          placeholder="Email"
          required
          className="w-full p-3 mb-4 bg-gray-100 text-black rounded-lg outline-none border focus:border-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            className="w-full p-3 bg-gray-100 text-black rounded-lg outline-none border focus:border-blue-500"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-3.5 text-gray-400 hover:text-blue-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button 
          disabled={isSubmitting}
          className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}