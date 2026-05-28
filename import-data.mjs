import axios from 'axios';
import dotenv from 'dotenv';

// .env.local se credentials load karne ke liye
dotenv.config({ path: '.env.local' });

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.YOUR_API_TOKEN_HERE;

const api = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    Authorization: `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json',
  }
});

const categoryCache = {};

// Function: Category check karega ya nayi banayega
async function getOrCreateCategory(categoryName) {
  if (categoryCache[categoryName]) return categoryCache[categoryName];

  try {
    const res = await api.get(`/categories?filters[Name][$eq]=${encodeURIComponent(categoryName)}`);
    
    if (res.data.data && res.data.data.length > 0) {
      const id = res.data.data[0].id || res.data.data[0].documentId; // Added fallback for v5
      categoryCache[categoryName] = id;
      return id;
    } else {
      console.log(`🆕 Creating Category: ${categoryName}`);
      const newCat = await api.post('/categories', { 
        data: { Name: categoryName } 
      });
      const id = newCat.data.data.id || newCat.data.data.documentId;
      categoryCache[categoryName] = id;
      return id;
    }
  } catch (err) {
    console.error(`❌ Category Error (${categoryName}):`, err.response?.data || err.message);
    return null;
  }
}

async function startImport() {
  // Aapka mukammal data list with SKUs added
  const menuItems = [
    { category: 'Signature Haus Drinks', sku: 'BSL-01', name: 'Butterscotch Latte', price: 'Rs. 599' },
    { category: 'Signature Haus Drinks', sku: 'ICC-02', name: 'Iced Caramel Coffee', price: 'Rs. 550' },
    { category: 'Espresso-Based Classics', sku: 'ESP-01', name: 'Espresso', price: 'Rs. 299' },
    { category: 'Espresso-Based Classics', sku: 'AME-02', name: 'Americano', price: 'Rs. 350' },
    { category: 'Espresso-Based Classics', sku: 'CAP-03', name: 'Cappuccino', price: 'Rs. 420' },
    { category: 'Espresso-Based Classics', sku: 'LAT-04', name: 'Latte', price: 'Rs. 449' },
    { category: 'Espresso-Based Classics', sku: 'FLW-05', name: 'Flat White', price: 'Rs. 399' },
    { category: 'Chocolate & Special Drinks', sku: 'MOC-01', name: 'Mocha', price: 'Rs. 480' },
    { category: 'Chocolate & Special Drinks', sku: 'HTC-02', name: 'Hot Chocolate', price: 'Rs. 450' },
    { category: 'Chocolate & Special Drinks', sku: 'IDC-03', name: 'Iced Chocolate', price: 'Rs. 480' },
    { category: 'Chocolate & Special Drinks', sku: 'DBC-04', name: 'Double Chocolate', price: 'Rs. 499' },
    { category: 'Iced Coffee', sku: 'IAM-01', name: 'Iced Americano', price: 'Rs. 350' },
    { category: 'Iced Coffee', sku: 'ILA-02', name: 'Iced Latte', price: 'Rs. 420' },
    { category: 'Iced Coffee', sku: 'IMO-03', name: 'Iced Mocha', price: 'Rs. 450' },
    { category: 'Iced Coffee', sku: 'IHL-04', name: 'Iced Hazelnut Latte', price: 'Rs. 480' },
    { category: 'Iced Coffee', sku: 'IVL-05', name: 'Iced Vanilla Latte', price: 'Rs. 480' },
    { category: 'Iced Coffee', sku: 'ICL-06', name: 'Iced Caramel Latte', price: 'Rs. 500' },
    { category: 'Flavoured Lattes', sku: 'HZL-01', name: 'Hazelnut Latte', price: 'Rs. 480' },
    { category: 'Flavoured Lattes', sku: 'VAL-02', name: 'Vanilla Latte', price: 'Rs. 480' },
    { category: 'Flavoured Lattes', sku: 'CAL-03', name: 'Caramel Latte', price: 'Rs. 499' },
    { category: 'Refreshing Mocktails', sku: 'LEM-01', name: 'Lemonade', price: 'Rs. 250' },
    { category: 'Refreshing Mocktails', sku: 'BLM-02', name: 'Blue Lagoon Mojito', price: 'Rs. 280' },
    { category: 'Refreshing Mocktails', sku: 'PIT-03', name: 'Peach Iced Tea', price: 'Rs. 299' },
    { category: 'Cookies', sku: 'CCC-01', name: 'Chocolate Chunk Cookies', price: 'Rs. 199' },
    { category: 'Cookies', sku: 'DCC-02', name: 'Double Chocolate Cookies', price: 'Rs. 220' },
    { category: 'Cookies', sku: 'RVC-03', name: 'Red Velvet Cookies', price: 'Rs. 250' },
    { category: 'Brownies', sku: 'RGB-01', name: 'Regular Brownie', price: 'Rs. 120' },
    { category: 'Brownies', sku: 'BTB-02', name: 'Bite Brownie', price: 'Rs. 230' },
    { category: 'Haus Combos', sku: 'DFC-01', name: 'Daily Fix Combo', price: 'Rs. 499' },
    { category: 'Haus Combos', sku: 'CTC-02', name: 'Classic Treat Combo', price: 'Rs. 599' },
    { category: 'Haus Combos', sku: 'PHC-03', name: 'Premium Haus Combo', price: 'Rs. 650' },
  ];

  console.log("☕ Haus Inventory Import Start...");

  for (const item of menuItems) {
    try {
      const catId = await getOrCreateCategory(item.category);
      if (!catId) continue;

      // Price se text hata kar number banana
      const cleanPrice = parseInt(item.price.replace(/[^0-9]/g, ""));

      // Payload matching your Strapi fields + SKU
      const payload = {
        data: {
          Name: item.name,
          SKU: item.sku,  // <-- Naya SKU field yahan add kar diya hai
          Price: cleanPrice,
          Stock: 100,
          category: catId
        }
      };

      await api.post('/products', payload);
      console.log(`✅ Success: ${item.name} (${item.sku})`);
    } catch (error) {
      console.error(`❌ Product Error (${item.name}):`, error.response?.data || error.message);
    }
  }

  console.log("✨ Sab data upload ho gaya!");
}

startImport();