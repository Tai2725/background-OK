# PHÂN TÍCH SOURCE CODE - BACKGROUND GENERATOR

## 📋 TỔNG QUAN

Đây là phân tích chi tiết source code của ứng dụng **Background Generator** - một web app tạo background chuyên nghiệp cho ảnh sản phẩm bằng AI.

**Stack công nghệ chính:**
- Frontend: Next.js (App Router) + React + MUI (Minimal UI template)
- Backend: Next.js API Routes + Supabase (Auth + Storage + Database)
- AI Service: Runware API (remove background + generate background)
- Database: PostgreSQL (qua Supabase)
- Storage: Supabase Storage (buckets: images, processed-images)

---

## 1. CẤU TRÚC, NGÔN NGỮ VÀ CẤU HÌNH

### 1.1. Cấu trúc thư mục chính

```
src/
├── app/
│   ├── background-generator/          # Main app pages
│   │   ├── generator/page.jsx         # Trang chính tạo background
│   │   ├── dashboard/page.jsx         # Dashboard thống kê
│   │   ├── gallery/page.jsx           # Gallery ảnh đã xử lý
│   │   └── settings/page.jsx          # Cài đặt
│   └── api/
│       └── runware/
│           ├── route.js               # API proxy đơn lẻ
│           └── batch/route.js         # API xử lý theo lô
├── sections/background-generator/     # UI Components
│   ├── components/
│   │   ├── modern-workflow.jsx       # Main workflow UI
│   │   ├── image-upload-zone.jsx     # Upload component
│   │   ├── background-style-selector.jsx
│   │   └── image-preview-panel.jsx
│   └── view/
│       └── background-generator-new-view.jsx  # Main view controller
├── lib/
│   ├── runware-service.js            # Client service gọi API nội bộ
│   ├── image-upload-service.js       # Upload ảnh lên Supabase
│   ├── supabase.js                   # Supabase client config
│   ├── supabase-services.js          # User profile & stats services
│   └── runware.js                    # ⚠️ Legacy code (cần xóa)
└── auth/
    ├── context/supabase/             # Supabase auth provider
    └── hooks/                        # Auth hooks
```

### 1.2. Ngôn ngữ và Runtime

- **Ngôn ngữ:** JavaScript/JSX (không dùng TypeScript)
- **Runtime:** Node.js >= 20
- **Framework:** Next.js với App Router
- **UI Library:** MUI + Minimal UI template
- **Build Tool:** Turbopack (dev), Next.js build (production)
- **Port:** 3032

### 1.3. Cấu hình quan trọng

**package.json scripts:**
```json
{
  "dev": "next dev -p 3032 --turbopack",
  "start": "next start -p 3032",
  "build": "next build"
}
```

**Biến môi trường cần thiết (.env.local):**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Chỉ server-side

# Runware AI
RUNWARE_API_KEY=xxx            # Chỉ server-side
RUNWARE_API_URL=https://api.runware.ai

# App Config
PORT=3032
NEXT_PUBLIC_SERVER_URL=http://localhost:3032
```

---

## 2. Ý TƯỞNG VÀ CHỨC NĂNG CỦA APP

### 2.1. Mục tiêu chính
Tạo background chuyên nghiệp cho ảnh sản phẩm bằng AI, giúp các shop online/photographer tạo ảnh marketing đẹp mắt.

### 2.2. Quy trình workflow (4 bước)

1. **Upload Ảnh:** Người dùng tải lên ảnh sản phẩm gốc
2. **Xóa Background:** AI tự động phát hiện và xóa background (tạo mask)
3. **Chọn Style:** Người dùng chọn style có sẵn hoặc nhập prompt tùy chỉnh
4. **Tạo Background:** AI sinh background mới dựa trên style đã chọn

### 2.3. Tính năng bổ sung
- Dashboard thống kê (số ảnh đã xử lý, tỷ lệ thành công)
- Gallery lưu trữ ảnh đã xử lý
- Batch processing (xử lý nhiều ảnh cùng lúc)
- Download ảnh kết quả
- Tích hợp Google OAuth qua Supabase

---

## 3. LUỒNG HOẠT ĐỘNG VÀ CẤU TRÚC REQUEST

### 3.1. Kiến trúc tổng thể

```
Client (UI) → RunwareService → Next.js API Routes → Runware API
     ↓              ↓                    ↓
Supabase Auth → Access Token → Server Verification
     ↓
Supabase Storage + Database
```

### 3.2. Xác thực (Authentication Flow)

**Client-side:**
```javascript
// Lấy token từ Supabase session
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Gửi kèm header
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Server-side:**
```javascript
// Verify token bằng Service Role Key
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3.3. Format Request mới (sau refactor)

**POST /api/runware**
```json
{
  "operation": "removeBackground" | "inpainting" | "generateImage" | "upscale" | "uploadImage",
  "data": {
    // Cho removeBackground
    "inputImage": "https://example.com/image.jpg",

    // Cho inpainting (workflow mới)
    "seedImage": "https://example.com/original.jpg",    // Ảnh gốc
    "maskImage": "https://example.com/mask.png",        // Mask từ removeBackground
    "positivePrompt": "professional studio background",
    "negativePrompt": "blurry, low quality",

    // Cho generateImage (legacy)
    "prompt": "professional studio background",
    "inputImage": "https://example.com/image.jpg"       // Optional cho img2img
  },
  "options": {
    "model": "runware:102@1",      // FLUX Fill cho inpainting
    "outputFormat": "PNG",
    "outputType": "URL",
    "width": 1024,
    "height": 1024,
    "steps": 25,
    "CFGScale": 7.0,
    "strength": 0.8,               // Cho inpainting
    "maskMargin": 32               // Margin cho mask blending
  }
}
```

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "taskUUID": "xxx-xxx-xxx",
    "imageUUID": "xxx-xxx-xxx", 
    "imageURL": "https://runware.ai/result.png",
    "cost": 0.05,
    "operation": "removeBackground"
  }
}
```

### 3.4. Batch Processing

**POST /api/runware/batch**
```json
{
  "files": [
    { "filename": "product1.jpg", "base64": "data:image/jpeg;base64,..." },
    { "filename": "product2.jpg", "base64": "data:image/jpeg;base64,..." }
  ],
  "operation": "removeBackground",
  "options": { "model": "runware:109@1" }
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "index": 0, "filename": "product1.jpg", "success": true, "data": {...} },
    { "index": 1, "filename": "product2.jpg", "success": false, "error": "..." }
  ],
  "summary": {
    "total": 2,
    "successful": 1, 
    "failed": 1,
    "totalCost": 0.05
  }
}
```

### 3.5. Database Schema

**Bảng processed_images:**
```sql
CREATE TABLE processed_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  original_url TEXT NOT NULL,
  background_removed_url TEXT,
  final_url TEXT,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Buckets:**
- `images`: Ảnh gốc (path: `userId/original/filename`)
- `processed-images`: Ảnh đã xử lý (path: `userId/processed/imageId/filename`)

---

## 4. ĐIỂM MẠNH HIỆN Tại

✅ **Kiến trúc phân tầng rõ ràng:**
- UI tách biệt trong `sections/`
- Business logic trong `lib/`
- API routes bảo mật API key

✅ **Bảo mật tốt:**
- API key chỉ ở server-side
- Xác thực nhất quán qua Supabase token
- Validate input đầy đủ

✅ **UX/UI chất lượng:**
- Workflow stepper trực quan
- Loading states và error handling chi tiết
- Responsive design với MUI

✅ **Retry logic và error handling:**
- Server tự động retry khi lỗi 5xx
- Validate response từ Runware API
- Chuẩn hóa error messages

---

## 5. VẤN ĐỀ VÀ ĐIỂM CẦN CẢI THIỆN

### 🔴 Vấn đề nghiêm trọng

1. **Code legacy trùng lặp:**
   - `src/lib/runware.js` không được sử dụng nhưng vẫn tồn tại
   - Gây confusion và tăng bundle size

2. **Naming không nhất quán:**
   - `background_removed_url` vs `background_removed_supabase_url`
   - `final_url` vs `final_supabase_url`
   - Khó maintain và debug

3. **Validation rải rác:**
   - Không có schema validation tập trung
   - Logic validate lặp lại ở nhiều nơi

### 🟡 Vấn đề trung bình

4. **HTTP client không thống nhất:**
   - `runware-service.js` dùng `fetch`
   - `auth-provider.jsx` set headers cho `axios`
   - Không có interceptors chung

5. **Batch processing chậm:**
   - Xử lý tuần tự với delay 500ms
   - Không tận dụng concurrency

6. **Logging không chuyên nghiệp:**
   - Nhiều `console.log` trong production
   - Log sensitive data (tokens, base64)

### 🟢 Cải thiện nhỏ

7. **TypeScript:**
   - Hiện tại dùng JavaScript thuần
   - Khó catch lỗi type runtime

8. **Testing:**
   - Chưa có unit tests
   - Khó đảm bảo quality khi refactor

---

## 6. KẾ HOẠCH REFACTOR (3 GIAI ĐOẠN)

### ✅ Giai đoạn 1: Dọn dẹp và chuẩn hóa (HOÀN THÀNH)

**Mục tiêu:** Loại bỏ code thừa, chuẩn hóa interfaces

**Công việc đã hoàn thành:**
- [x] Xóa `src/lib/runware.js` (legacy)
- [x] Tạo schema validation với Zod cho `/api/runware`
- [x] Chuẩn hóa naming DB fields (`mask_url`, `final_supabase_url`)
- [x] Tách `verifyAuth` thành utility function (`src/server/auth/verify-auth.js`)
- [x] Tạo `src/server/runware/client.js` wrap Runware API calls
- [x] Cập nhật workflow từ `generateImage` sang `inpainting` với `seedImage` + `maskImage`
- [x] Cập nhật client service và UI components để sử dụng workflow mới

### 🚀 Giai đoạn 2: Tối ưu hiệu năng (2-3 ngày)

**Mục tiêu:** Cải thiện performance và UX

**Công việc:**
- [ ] Implement concurrency cho batch processing (p-limit)
- [ ] Thêm proper logging với levels (debug/info/error)
- [ ] Optimize image handling (lazy loading, compression)
- [ ] Add caching cho frequently used data
- [ ] Implement proper error boundaries

### 🔧 Giai đoạn 3: Chất lượng dài hạn (3-5 ngày)

**Mục tiêu:** Đảm bảo maintainability và scalability

**Công việc:**
- [ ] Migrate sang TypeScript (ít nhất cho lib/ và server/)
- [ ] Thêm unit tests cho core functions
- [ ] Setup CI/CD pipeline
- [ ] Add monitoring và analytics
- [ ] Documentation API với OpenAPI/Swagger

---

## 7. NEXT STEPS

### Ưu tiên cao (Làm ngay)
1. Xóa code legacy `runware.js`
2. Chuẩn hóa database schema naming
3. Tạo schema validation cho API endpoints

### Ưu tiên trung bình (Tuần tới)
4. Implement proper logging
5. Optimize batch processing
6. Add error boundaries

### Ưu tiên thấp (Tháng tới)
7. TypeScript migration
8. Comprehensive testing
9. Performance monitoring

---

## 📞 LIÊN HỆ VÀ HỖ TRỢ

Nếu cần hỗ trợ implement bất kỳ phần nào trong kế hoạch refactor, hãy cho mình biết!

**Tài liệu tham khảo:**
- [Supabase Documentation](https://supabase.com/docs)
- [Runware API Documentation](https://docs.runware.ai)
- [Next.js App Router](https://nextjs.org/docs/app)
- [MUI Components](https://mui.com/components/)

---

## 8. CHI TIẾT KỸ THUẬT BỔ SUNG

### 8.1. Runware API Integration Details

**Models được sử dụng:**
- `runware:109@1`: Remove background (có hỗ trợ returnOnlyMask)
- `runware:100@1`: Text-to-image generation
- `runware:101@1`: FLUX model (chất lượng cao hơn)
- `runware:111@1`: Image upscaling

**Settings tối ưu cho removeBackground:**
```javascript
const settings = {
  returnOnlyMask: true,           // Trả về mask thay vì ảnh đã xóa BG
  postProcessMask: true,          // Cải thiện chất lượng mask
  alphaMatting: true,             // Làm mịn edges
  alphaMattingForegroundThreshold: 240,
  alphaMattingBackgroundThreshold: 15,
  alphaMattingErodeSize: 8,
  rgba: [255, 255, 255, 0]        // Background trong suốt
};
```

**Parameters tối ưu cho generateBackground:**
```javascript
const options = {
  model: 'runware:101@1',         // FLUX model
  width: 1024,
  height: 1024,
  steps: 25,                      // Tăng cho chất lượng tốt hơn
  CFGScale: 7.0,                  // Balance giữa prompt adherence và creativity
  strength: 0.75,                 // Cho img2img
  scheduler: 'Euler',             // Deterministic scheduler
  outputFormat: 'PNG',
  outputQuality: 95
};
```

### 8.2. Database Relationships và Indexes

**Indexes cần thiết:**
```sql
-- Index cho query theo user
CREATE INDEX idx_processed_images_user_id ON processed_images(user_id);

-- Index cho query theo status
CREATE INDEX idx_processed_images_status ON processed_images(status);

-- Index cho query theo thời gian (dashboard stats)
CREATE INDEX idx_processed_images_created_at ON processed_images(created_at);

-- Composite index cho pagination
CREATE INDEX idx_processed_images_user_created ON processed_images(user_id, created_at DESC);
```

**Row Level Security (RLS) Policies:**
```sql
-- Users chỉ có thể xem/sửa ảnh của mình
CREATE POLICY "Users can view own images" ON processed_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON processed_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON processed_images
  FOR UPDATE USING (auth.uid() = user_id);
```

### 8.3. Error Codes và Handling

**Client-side Error Types:**
```javascript
const ERROR_TYPES = {
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  REMOVE_BG_FAILED: 'REMOVE_BG_FAILED',
  GENERATE_BG_FAILED: 'GENERATE_BG_FAILED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_IMAGE: 'INVALID_IMAGE'
};
```

**Server-side Error Mapping:**
```javascript
const mapRunwareError = (error) => {
  if (error.message?.includes('quota')) return 'QUOTA_EXCEEDED';
  if (error.message?.includes('invalid image')) return 'INVALID_IMAGE';
  if (error.status === 401) return 'AUTH_REQUIRED';
  return 'UNKNOWN_ERROR';
};
```

### 8.4. Performance Optimizations

**Image Optimization:**
```javascript
// Resize ảnh trước khi upload nếu quá lớn
const MAX_DIMENSION = 2048;
const resizeImage = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const { width, height } = calculateDimensions(img, MAX_DIMENSION);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    };

    img.src = URL.createObjectURL(file);
  });
};
```

**Caching Strategy:**
```javascript
// Cache user stats trong 5 phút
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const statsCache = new Map();

const getCachedStats = (userId) => {
  const cached = statsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};
```

### 8.5. Security Best Practices

**Input Validation:**
```javascript
const validateImageUpload = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported');
  }

  if (file.size > maxSize) {
    throw new Error('File too large');
  }
};
```

**Rate Limiting:**
```javascript
// Implement rate limiting cho API routes
const rateLimiter = new Map();

const checkRateLimit = (userId, limit = 10, window = 60000) => {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];

  // Remove old requests outside window
  const validRequests = userRequests.filter(time => now - time < window);

  if (validRequests.length >= limit) {
    throw new Error('Rate limit exceeded');
  }

  validRequests.push(now);
  rateLimiter.set(userId, validRequests);
};
```

### 8.6. Monitoring và Analytics

**Key Metrics cần track:**
```javascript
const METRICS = {
  // Business metrics
  IMAGES_PROCESSED_TOTAL: 'images_processed_total',
  IMAGES_PROCESSED_SUCCESS: 'images_processed_success',
  IMAGES_PROCESSED_FAILED: 'images_processed_failed',

  // Performance metrics
  API_RESPONSE_TIME: 'api_response_time',
  RUNWARE_API_LATENCY: 'runware_api_latency',
  IMAGE_UPLOAD_TIME: 'image_upload_time',

  // User metrics
  DAILY_ACTIVE_USERS: 'daily_active_users',
  USER_RETENTION_RATE: 'user_retention_rate'
};
```

**Health Check Endpoint:**
```javascript
// GET /api/health
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    runware: await checkRunwareAPI(),
    timestamp: new Date().toISOString()
  };

  const isHealthy = Object.values(checks).every(check =>
    typeof check === 'boolean' ? check : check.status === 'ok'
  );

  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 503
  });
}
```

---

## 9. DEPLOYMENT VÀ DEVOPS

### 9.1. Environment Setup

**Development:**
```bash
# Clone repository
git clone <repo-url>
cd productBackground

# Install dependencies
yarn install

# Setup environment
cp .env.example .env.local
# Fill in required variables

# Run development server
yarn dev
```

**Production Build:**
```bash
# Build application
yarn build

# Start production server
yarn start

# Or deploy to Vercel
vercel --prod
```

### 9.2. Docker Configuration

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3032
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3032:3032"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
```

### 9.3. CI/CD Pipeline

**GitHub Actions workflow:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 10. TROUBLESHOOTING GUIDE

### 10.1. Common Issues

**Issue: "Runware API key chưa được cấu hình"**
```bash
# Solution: Check environment variables
echo $RUNWARE_API_KEY
# Make sure it's set in .env.local
```

**Issue: "Invalid or expired token"**
```bash
# Solution: Check Supabase auth
# 1. Verify SUPABASE_SERVICE_ROLE_KEY is correct
# 2. Check if user session is valid
# 3. Ensure token is passed in Authorization header
```

**Issue: Upload fails with "File too large"**
```javascript
// Solution: Check file size limits
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
if (file.size > MAX_FILE_SIZE) {
  // Compress or resize image before upload
}
```

### 10.2. Debug Commands

**Check API connectivity:**
```bash
# Test Runware API
curl -X GET http://localhost:3032/api/runware \
  -H "Authorization: Bearer <supabase-token>"

# Test Supabase connection
curl -X GET "<SUPABASE_URL>/rest/v1/processed_images" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <user-token>"
```

**Database queries for debugging:**
```sql
-- Check recent processed images
SELECT id, status, created_at, updated_at
FROM processed_images
ORDER BY created_at DESC
LIMIT 10;

-- Check user activity
SELECT user_id, COUNT(*) as total_images,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM processed_images
GROUP BY user_id;
```

---

## 11. FUTURE ENHANCEMENTS

### 11.1. Planned Features

**Short-term (1-2 months):**
- [ ] Batch processing UI improvements
- [ ] More background style presets
- [ ] Image history and favorites
- [ ] Basic usage analytics dashboard

**Medium-term (3-6 months):**
- [ ] Advanced editing tools (crop, rotate, filters)
- [ ] Team collaboration features
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)

**Long-term (6+ months):**
- [ ] Custom AI model training
- [ ] Video background replacement
- [ ] Marketplace for background templates
- [ ] Enterprise features (SSO, admin panel)

### 11.2. Technical Debt

**High Priority:**
- [ ] Complete TypeScript migration
- [ ] Comprehensive test coverage (>80%)
- [ ] Performance optimization (Core Web Vitals)
- [ ] Security audit and penetration testing

**Medium Priority:**
- [ ] Database optimization and indexing
- [ ] CDN setup for image delivery
- [ ] Monitoring and alerting system
- [ ] Backup and disaster recovery

**Low Priority:**
- [ ] Code documentation (JSDoc/TSDoc)
- [ ] Accessibility improvements (WCAG 2.1)
- [ ] Internationalization (i18n)
- [ ] Progressive Web App (PWA) features

---

*Tài liệu này được tạo vào ngày: ${new Date().toLocaleDateString('vi-VN')}*
*Phiên bản: 1.0*
