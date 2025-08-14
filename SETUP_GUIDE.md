# 🚀 BACKGROUND GENERATOR - HƯỚNG DẪN THIẾT LẬP

## 📋 TỔNG QUAN

Dự án Background Generator đã được cấu hình sẵn với:
- ✅ **Supabase Project**: TiTai (svbfdivnopohjqjwddcv)
- ✅ **Database Tables**: processed_images, user_profiles
- ✅ **Storage Buckets**: images, processed-images, avatars
- ✅ **Environment Template**: .env.local đã có URL và Anon Key

## 🔧 CÁC BƯỚC THIẾT LẬP

### Bước 1: Cài đặt Dependencies

**Option A: Sử dụng script tự động**
```bash
# Chạy file setup.bat (Windows)
setup.bat

# Hoặc chạy thủ công:
yarn install
# hoặc
npm install
```

**Option B: Cài đặt thủ công**
```bash
# Kiểm tra Node.js version (cần >= 20)
node --version

# Cài đặt Yarn nếu chưa có
npm install -g yarn

# Cài đặt dependencies
yarn install
```

### Bước 2: Hoàn thiện Environment Variables

Mở file `.env.local` và điền các giá trị còn thiếu:

#### 🔑 **SUPABASE_SERVICE_ROLE_KEY** (BẮT BUỘC)
```bash
# 1. Truy cập: https://supabase.com/dashboard/project/svbfdivnopohjqjwddcv
# 2. Vào Settings > API
# 3. Copy "service_role" key (secret key)
# 4. Dán vào .env.local:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 🤖 **RUNWARE_API_KEY** (BẮT BUỘC)
```bash
# 1. Truy cập: https://runware.ai/dashboard
# 2. Đăng ký/đăng nhập tài khoản
# 3. Tạo API key mới
# 4. Dán vào .env.local:
RUNWARE_API_KEY=your-runware-api-key-here
```

#### 🔐 **GOOGLE_CLIENT_ID** (BẮT BUỘC cho OAuth)
```bash
# 1. Truy cập: https://console.cloud.google.com/
# 2. Tạo project mới hoặc chọn project có sẵn
# 3. Enable Google+ API
# 4. Tạo OAuth 2.0 Client ID
# 5. Thêm Authorized redirect URIs:
#    - http://localhost:3032/auth/callback
#    - https://svbfdivnopohjqjwddcv.supabase.co/auth/v1/callback
# 6. Copy Client ID và dán vào .env.local:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Bước 3: Cấu hình Supabase Authentication

#### 3.1 Cấu hình Site URL và Redirect URLs
```bash
# Trong Supabase Dashboard > Authentication > Settings:
# Site URL: http://localhost:3032
# Redirect URLs:
# - http://localhost:3032/auth/callback
# - http://localhost:3032/dashboard
```

#### 3.2 Cấu hình Google OAuth Provider
```bash
# Trong Supabase Dashboard > Authentication > Providers:
# 1. Enable Google provider
# 2. Nhập Client ID và Client Secret từ Google Console
```

### Bước 4: Kiểm tra Database Schema

Database đã có sẵn các bảng cần thiết:

```sql
-- Bảng processed_images (✅ Đã có)
-- Chứa thông tin ảnh đã xử lý của users

-- Bảng user_profiles (✅ Đã có)  
-- Chứa thông tin profile của users

-- Storage buckets (✅ Đã có)
-- images: Ảnh gốc
-- processed-images: Ảnh đã xử lý
-- avatars: Avatar users
```

### Bước 5: Chạy Development Server

```bash
# Chạy development server
yarn dev
# hoặc
npm run dev

# Server sẽ chạy tại: http://localhost:3032
```

### Bước 6: Test Functionality

#### 6.1 Test Authentication
```bash
# 1. Mở http://localhost:3032
# 2. Click "Đăng nhập với Google"
# 3. Hoàn thành OAuth flow
# 4. Kiểm tra user được tạo trong Supabase Dashboard
```

#### 6.2 Test Image Processing
```bash
# 1. Truy cập Background Generator
# 2. Upload ảnh test
# 3. Kiểm tra workflow: Upload → Remove BG → Generate BG
# 4. Verify ảnh được lưu trong Storage buckets
```

## 🔍 TROUBLESHOOTING

### Lỗi thường gặp:

#### 1. "Dependencies installation failed"
```bash
# Giải pháp:
# - Kiểm tra Node.js version >= 20
# - Xóa node_modules và package-lock.json
# - Chạy lại: npm install
```

#### 2. "Supabase connection failed"
```bash
# Kiểm tra:
# - NEXT_PUBLIC_SUPABASE_URL đúng format
# - NEXT_PUBLIC_SUPABASE_ANON_KEY không bị cắt
# - Network connection
```

#### 3. "Google OAuth error"
```bash
# Kiểm tra:
# - Client ID đúng format
# - Redirect URIs đã được thêm trong Google Console
# - Google provider đã enable trong Supabase
```

#### 4. "Runware API error"
```bash
# Kiểm tra:
# - API key hợp lệ và chưa hết hạn
# - Account có đủ credits
# - API endpoint accessible
```

## 📊 MONITORING & LOGS

### Development Logs
```bash
# Xem logs trong browser console
# Xem Network tab để debug API calls
# Check Supabase Dashboard > Logs
```

### Production Monitoring
```bash
# Supabase Dashboard > Logs
# Runware Dashboard > Usage
# Google Cloud Console > OAuth logs
```

## 🚀 DEPLOYMENT

### Vercel Deployment
```bash
# 1. Connect GitHub repository
# 2. Configure environment variables in Vercel
# 3. Update redirect URLs với production domain
# 4. Deploy
```

### Environment Variables for Production
```bash
# Update these for production:
NEXT_PUBLIC_SERVER_URL=https://your-domain.com
NEXT_PUBLIC_PRODUCTION_URL=https://your-domain.com

# Add production redirect URLs:
# - https://your-domain.com/auth/callback
# - https://your-domain.com/dashboard
```

## 📞 SUPPORT

Nếu gặp vấn đề, kiểm tra:
1. Console logs trong browser
2. Network requests trong DevTools
3. Supabase Dashboard logs
4. File .env.local có đầy đủ variables

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Dependencies đã cài đặt (node_modules exists)
- [ ] SUPABASE_SERVICE_ROLE_KEY đã điền
- [ ] RUNWARE_API_KEY đã điền  
- [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID đã điền
- [ ] Google OAuth đã cấu hình
- [ ] Supabase Auth settings đã cấu hình
- [ ] Development server chạy thành công
- [ ] Authentication test thành công
- [ ] Image processing test thành công

**🎉 Khi hoàn thành checklist, dự án sẽ sẵn sàng sử dụng!**
