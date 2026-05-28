"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Search, ShoppingCart, Trash2, Loader2 } from "lucide-react";

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

  useEffect(() => { 
    fetchProducts(); 
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/products?pagination[limit]=200&status=published`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data?.data || []);
    } catch (err) { 
      console.error("Error fetching products", err); 
    }
  };

  const addToCart = (product) => {
    const data = product.attributes || product;
    
    const productName = data?.Name || data?.name;
    const productPrice = Number(data?.Price || data?.price) || 0;
    const productStock = Number(data?.Stock || data?.stock) || 0;

    if (!productName || productStock <= 0) return;
    
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { id: product.id, name: productName, price: productPrice, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
      
      const orderItemsString = cart.map((item) => `${item.name} (x${item.qty}) - Rs. ${item.price * item.qty}`).join("\n");

      const itemsBlocksFormat = [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: orderItemsString
            }
          ]
        }
      ];

      const payload = {
        data: {
          Invoice_ID: invoiceId,
          Total_Amount: Number(total),
          Payment_Method: paymentMethod,
          Items: itemsBlocksFormat, 
          Date: new Date().toISOString(), 
        },
      };
      
      await axios.post(`${API_URL}/api/sales`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setReceiptData({
        invoiceId,
        date: new Date().toLocaleString(),
        items: [...cart],
        total: total,
        paymentMethod: paymentMethod // Added to receipt
      });

      setTimeout(() => {
        window.print();
        setCart([]); 
        fetchProducts(); 
        setPaymentMethod("Cash"); // Reset after checkout
      }, 300);

    } catch (err) {
      console.error(err.response?.data || err);
      alert("❌ Error saving sale. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const data = p.attributes || p;
    const name = (data?.Name || data?.name || "").toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s);
  });

  return (
    <>
      <div className="flex min-h-screen bg-[#fcfaf8] print:hidden">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex flex-col h-screen overflow-hidden">
          <header className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d7b68] font-bold mb-1">Point of Sale</p>
            <h1 className="text-3xl font-serif text-[#2d241e]">Create New Order</h1>
          </header>

          <div className="flex gap-6 flex-1 overflow-hidden">
            {/* Products Grid */}
            <div className="flex-[1.5] bg-white rounded-[32px] border border-[#f1ede9] p-6 flex flex-col shadow-sm">
              <div className="relative mb-6">
                <input 
                  placeholder="Search coffee or snacks..." 
                  className="w-full p-4 pl-12 bg-[#fcfaf8] text-[#1a0f0a] placeholder:text-[#a89a8e] rounded-2xl border-none outline-none focus:ring-1 focus:ring-[#3d2b1f] text-sm"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-4 top-4 text-[#a89a8e]" size={18} />
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2">
                {filteredProducts.map(p => {
                  const d = p.attributes || p;
                  const pName = d?.Name || d?.name || "Unnamed Item";
                  const pPrice = d?.Price || d?.price || 0;
                  const pSku = d?.SKU || d?.sku || 'N/A';
                  const pStock = d?.Stock || d?.stock || 0;

                  return (
                    <button key={p.id} onClick={() => addToCart(p)} className="p-5 border border-[#f8f5f2] rounded-[24px] hover:bg-[#3d2b1f] hover:text-white transition-all text-left active:scale-95 group">
                      <h3 className="font-bold text-[#2d241e] group-hover:text-white truncate">{pName}</h3>
                      <p className="text-xs text-[#8d7b68] group-hover:text-[#a89a8e] mb-4">Rs. {pPrice}</p>
                      <div className="flex justify-between items-center opacity-50 group-hover:opacity-100 text-[9px] font-bold uppercase tracking-tighter">
                        <span>SKU: {pSku}</span>
                        <span className={pStock < 5 ? 'text-red-400' : 'text-green-500'}>Stock: {pStock}</span>
                      </div>
                    </button>
                  )
                })}
                
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center text-[#8d7b68] mt-10">
                    No products found.
                  </div>
                )}
              </div>
            </div>

            {/* Checkout Cart */}
            <div className="flex-1 bg-[#1e1915] rounded-[32px] p-8 text-white flex flex-col shadow-2xl">
              <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                <ShoppingCart size={20} className="text-[#d4a373]" />
                <h2 className="text-xl font-serif">Order Summary</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] text-[#8d7b68]">Rs. {item.price} x {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-sm">Rs.{item.price * item.qty}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                
                {cart.length === 0 && (
                  <div className="text-center text-[#8d7b68] mt-10 text-sm">
                    Your cart is empty.
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                
                {/* PAYMENT METHOD SELECTION UI */}
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-widest text-[#8d7b68] font-bold mb-3">Payment Method</p>
                  <div className="flex gap-2">
                    {["Cash", "Card", "Online"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                          paymentMethod === method 
                            ? "bg-[#d4a373] text-[#1e1915]" 
                            : "bg-white/5 text-[#8d7b68] hover:bg-white/10"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-[10px] uppercase tracking-widest text-[#8d7b68] font-bold">Total</span>
                  <span className="text-4xl font-serif">Rs. {total}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing || cart.length === 0}
                  className="w-full bg-[#d4a373] text-[#1e1915] py-5 rounded-2xl font-black text-sm tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : "FINALIZE BILL"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PRINT RECEIPT UI */}
      {receiptData && (
        <div className="hidden print:block w-full max-w-[80mm] mx-auto text-black bg-white p-4 font-mono text-sm">
          <div className="text-center mb-6">
            <h2 className="font-bold text-2xl mb-1">Depresso Haus</h2>
            <p className="text-xs text-gray-600">Multan, Pakistan</p>
            <p className="text-xs text-gray-600 mt-2">Invoice: {receiptData.invoiceId}</p>
            <p className="text-xs text-gray-600">{receiptData.date}</p>
          </div>
          
          <div className="border-t border-b border-black py-2 mb-4 border-dashed">
            <div className="flex justify-between font-bold text-xs mb-2">
              <span>Item</span>
              <span>Amount</span>
            </div>
            {receiptData.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs mb-1">
                <span>{item.qty}x {item.name}</span>
                <span>Rs. {item.price * item.qty}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between font-bold text-lg mb-2">
            <span>TOTAL</span>
            <span>Rs. {receiptData.total}</span>
          </div>
          
          <div className="flex justify-between text-xs mb-6">
            <span>Payment Method:</span>
            <span className="font-bold">{receiptData.paymentMethod}</span>
          </div>
          
          <div className="text-center text-xs mt-8">
            <p className="mb-1">Thank you for your visit!</p>
            <p>Please come again</p>
          </div>
        </div>
      )}
    </>
  );
}