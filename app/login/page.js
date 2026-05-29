"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Loader icon import kiya

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Naya loader state
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/dashboard");
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Loader start
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, {
        identifier: email,
        password: password,
      });
      localStorage.setItem("token", res.data.jwt);
      router.push("/dashboard");
    } catch (err) {
      alert("Invalid credentials! Please try again.");
      setIsSubmitting(false); // Error par loader band
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e5e5e5]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center">
        <div className="text-3xl text-blue-700 font-bold mb-2">DH</div>
        <h2 className="text-xl text-blue-700 font-semibold">Depresso Haus Store</h2>
        <p className="text-gray-500 text-sm mb-6">Powered by Depresso Haus</p>

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
          disabled={isSubmitting} // Login ke waqt button disable
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