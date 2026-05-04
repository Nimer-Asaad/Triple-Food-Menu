# 🍔 Triple Food Menu Display

A modern digital menu system for **Triple Food Restaurant** that allows the owner to manage menu images easily and display them in a clean, customer-friendly interface.

🔗 Live Website:  
https://triple-food-menu.vercel.app/

---

## ✨ Features

### 🧾 Public Menu Display
- Clean vertical menu layout
- Full-screen image display
- Optimized for TV / tablet / QR usage
- Direct contact buttons

### 🔐 Admin Dashboard
- Secure login system
- Upload new menu images
- Delete images
- Reorder images (Move Up / Move Down)
- Session timeout (auto logout after inactivity)
- Change admin password

### 📞 Contact Integration
- Instagram
- Facebook
- WhatsApp (direct chat)
- Phone call (tap to call)

---

## 🛠️ Tech Stack

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **MongoDB Atlas**
- **Cloudinary**
- **Vercel**

---

## 📂 Project Structure

```
src/
 ├── app/
 │    ├── page.tsx        → Public display page
 │    ├── admin/          → Admin dashboard
 │    └── api/            → Backend routes
 │
 ├── components/
 │    ├── ImageGallery
 │    └── ImageUpload
 │
 ├── lib/
 │    ├── mongodb.ts
 │    ├── cloudinary.ts
 │    └── models.ts
```

---

## ⚙️ Environment Variables

Create `.env.local`:

```
MONGODB_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_PASSWORD=your_default_password
```

---

## 🚀 Run Locally

```
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🏗️ Build & Production

```
npm run build
npm start
```

---

## ☁️ Deployment

Deployed using **Vercel**:

```
https://triple-food-menu.vercel.app/
```

---

## 🔒 Security Notes

- Admin authentication is session-based
- Auto logout after inactivity
- Password stored securely (hashed in MongoDB)
- Admin access is isolated from public users

---

## 👨‍💻 Developer

**Eng. Nimer Asaad**

🌐 Portfolio:  
https://www.linkin1.com/nimerziad46  

📷 Instagram:  
https://www.instagram.com/nimer_asaad42/  

📘 Facebook:  
https://www.facebook.com/nimer.assad.10  

💻 GitHub:  
https://github.com/Nimer-Asaad  

📱 WhatsApp:  
+970 569 755 546  

---

## 💡 Use Case

Perfect for:
- Restaurants 🍽️
- Cafes ☕
- Fast food menus 🍔
- Digital menu boards 📺

---

## 📌 Future Improvements

- Add video support 🎥
- QR code generator inside admin
- Multi-language support 🌍
- Categories (Drinks / Meals / Offers)

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
