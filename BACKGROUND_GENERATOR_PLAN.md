# BACKGROUND GENERATOR - KẾ HOẠCH TRIỂN KHAI CHI TIẾT

## 📋 TỔNG QUAN DỰ ÁN

**Mục tiêu:** Tạo website tự động tạo background cho hình ảnh sản phẩm sử dụng API Runware, được tích hợp vào cấu trúc dự án Minimal UI hiện có.

**Công nghệ sử dụng:**
- Framework: Next.js với MUI
- Database & Auth: Supabase (Authentication với Google OAuth, Storage cho hình ảnh)
- API: Runware (Remove Background, Upscale, Generate Background)
- Template: Tích hợp vào cấu trúc Minimal UI hiện có

## 🗺️ SITEMAP CHI TIẾT

### 1. Authentication Pages
```
/auth/supabase/
├── sign-in (Đăng nhập với Google OAuth)
├── sign-up (Đăng ký với email verification)
├── verify (Xác thực email)
└── reset-password (Quên mật khẩu)
```

### 2. Background Generator App
```
/background-generator/
├── dashboard (Trang chủ - Overview & Quick Actions)
├── generator (Trang chính - Upload & Process)
├── gallery (Thư viện hình ảnh đã xử lý)
└── settings (Cài đặt tài khoản & API)
```

### 3. Dashboard Integration
```
/dashboard/
├── background-generator/ (Tích hợp vào dashboard chính)
│   ├── overview (Thống kê & Analytics)
│   ├── projects (Quản lý dự án)
│   └── history (Lịch sử xử lý)
```

## 🏗️ CẤU TRÚC FOLDER & FILES

### App Routes
```
src/app/background-generator/
├── layout.jsx (Layout riêng cho Background Generator)
├── page.jsx (Redirect to dashboard)
├── dashboard/
│   ├── page.jsx (Dashboard overview)
│   └── loading.jsx
├── generator/
│   ├── page.jsx (Main generator interface)
│   └── loading.jsx
├── gallery/
│   ├── page.jsx (Image gallery)
│   └── loading.jsx
└── settings/
    ├── page.jsx (Settings page)
    └── loading.jsx
```

### Sections & Components
```
src/sections/background-generator/
├── view/
│   ├── background-generator-dashboard-view.jsx
│   ├── background-generator-generator-view.jsx
│   ├── background-generator-gallery-view.jsx
│   └── background-generator-settings-view.jsx
├── components/
│   ├── image-upload-zone.jsx
│   ├── image-preview-card.jsx
│   ├── background-style-selector.jsx
│   ├── processing-status.jsx
│   ├── result-gallery.jsx
│   └── runware-api-client.jsx
└── hooks/
    ├── use-runware-api.js
    ├── use-image-upload.js
    └── use-background-generator.js
```

### API & Services
```
src/lib/
├── runware.js (Runware API client)
└── supabase-storage.js (Supabase storage helpers)

src/actions/
└── background-generator.js (Server actions)
```

## 📊 DATABASE SCHEMA (SUPABASE)

### Tables
```sql
-- Users table (sử dụng auth.users có sẵn)

-- Projects table
CREATE TABLE bg_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images table
CREATE TABLE bg_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES bg_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  background_removed_url TEXT,
  upscaled_url TEXT,
  final_url TEXT,
  status VARCHAR(50) DEFAULT 'uploaded',
  processing_steps JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Background styles table
CREATE TABLE bg_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  preview_url TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing history table
CREATE TABLE bg_processing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES bg_images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  runware_task_id VARCHAR(255),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  processing_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Buckets
```
- bg-original-images (Public read)
- bg-processed-images (Public read)
- bg-user-uploads (Private)
```

## 🔄 LUỒNG XỬ LÝ CHI TIẾT

### 1. Authentication Flow
```
1. User clicks "Sign in with Google"
2. Redirect to Supabase Auth with Google provider
3. After successful auth, redirect to /background-generator/dashboard
4. Check if user profile exists, create if not
5. Load user's projects and recent images
```

### 2. Image Processing Flow
```
1. Upload Image
   ├── Validate file (type, size)
   ├── Upload to Supabase Storage (bg-user-uploads)
   └── Create record in bg_images table

2. Remove Background
   ├── Call Runware removeBackground API
   ├── Poll for completion
   ├── Download result and upload to bg-processed-images
   └── Update bg_images.background_removed_url

3. Upscale Image (Optional)
   ├── Call Runware upscale API
   ├── Poll for completion
   ├── Download result and upload to bg-processed-images
   └── Update bg_images.upscaled_url

4. Generate Background
   ├── User selects style or custom prompt
   ├── Call Runware imageToImage API with LoRA
   ├── Poll for completion
   ├── Download result and upload to bg-processed-images
   └── Update bg_images.final_url

5. Save & Display
   ├── Update processing status
   ├── Show final result
   └── Add to user's gallery
```

## 🎯 GIAI ĐOẠN TRIỂN KHAI

### Phase 1: Foundation Setup (Ngày 1-2)
- [ ] Cấu hình Supabase database schema
- [ ] Thiết lập Google OAuth
- [ ] Tạo basic layout và routing
- [ ] Implement authentication flow

### Phase 2: Core Components (Ngày 3-4)
- [ ] Image upload component
- [ ] Runware API integration
- [ ] Basic image processing workflow
- [ ] Storage integration

### Phase 3: UI/UX Development (Ngày 5-6)
- [ ] Dashboard overview
- [ ] Generator interface
- [ ] Gallery view
- [ ] Processing status indicators

### Phase 4: Advanced Features (Ngày 7-8)
- [ ] Background style selector
- [ ] Custom prompt input
- [ ] Batch processing
- [ ] Download & export options

### Phase 5: Integration & Testing (Ngày 9-10)
- [ ] Dashboard integration
- [ ] Navigation updates
- [ ] Error handling
- [ ] Performance optimization
- [ ] Testing & bug fixes

## 🔧 TECHNICAL REQUIREMENTS

### Dependencies cần thêm
```json
{
  "react-dropzone": "^14.3.8", // Đã có
  "react-image-crop": "^11.0.6", // Cần thêm
  "canvas": "^2.11.2", // Cần thêm cho image processing
  "sharp": "^0.33.2" // Đã có
}
```

### Environment Variables cần thêm
```env
# Runware API (đã có)
RUNWARE_API_KEY=LBHguHXoz6CjrsDFhiQR69vDqJjYV5X7
RUNWARE_API_URL=https://api.runware.ai

# Google OAuth (cần cấu hình)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 📝 CHECKPOINTS & TESTING

### Checkpoint 1: Authentication
- [ ] Google OAuth login works
- [ ] User session persists
- [ ] Redirect after login works

### Checkpoint 2: Image Upload
- [ ] File validation works
- [ ] Upload to Supabase Storage works
- [ ] Preview displays correctly

### Checkpoint 3: Runware Integration
- [ ] Remove background API works
- [ ] Upscale API works
- [ ] Generate background API works

### Checkpoint 4: Full Workflow
- [ ] End-to-end processing works
- [ ] Error handling works
- [ ] Results save correctly

### Checkpoint 5: UI/UX
- [ ] Responsive design
- [ ] Loading states
- [ ] Error messages
- [ ] Success feedback

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Storage buckets created
- [ ] Google OAuth configured
- [ ] Runware API tested
- [ ] Performance optimized
- [ ] Error monitoring setup

## 📊 SUCCESS METRICS

- [ ] User can sign up/login with Google
- [ ] User can upload images successfully
- [ ] Background removal works consistently
- [ ] Image upscaling works
- [ ] Background generation produces good results
- [ ] Gallery displays all processed images
- [ ] Download functionality works
- [ ] Mobile responsive design
- [ ] Fast loading times (<3s for processing start)
