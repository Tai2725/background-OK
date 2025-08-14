# 🧪 WORKFLOW TEST GUIDE - Background Generator

## 📋 LUỒNG UX MỚI ĐÃ ĐƯỢC TỐI ỨU

### 🔄 Luồng hoàn chỉnh:
1. **Upload ảnh** → Preview hiển thị → Nút "Tiếp Tục" → "Xóa Background"
2. **Bấm "Xóa Background"** → **Ngay lập tức chuyển bước 2** → Loading animation
3. **Xử lý xong** → "Background đã được xóa thành công!" → Tab preview auto-switch
4. **Chọn style/prompt** → Nút "Tạo Background" xuất hiện
5. **Bấm "Tạo Background"** → Auto chuyển bước 4 → Loading animation đẹp
6. **Generate xong** → Tab preview auto-switch sang "Kết Quả"

## 🔧 LOGIC UPLOAD SUPABASE ĐÃ ĐƯỢC ĐƠN GIẢN HÓA

### Trước đây (phức tạp):
```javascript
// Kiểm tra URL pattern
if (url.includes('img.runware.ai') || url.includes('im.runware.ai')) {
  // Download và upload
  // Logic phức tạp với nhiều điều kiện
}
```

### Bây giờ (đơn giản):
```javascript
// Mặc định: Tất cả URL từ Runware đều upload lên Supabase
const processResult = await ImageUploadService.processRunwareResult(
  runwareResult, userId, imageId, type
);
// Tự động: download → upload → update DB → return preview URL
```

## 🧪 CÁCH TEST CHI TIẾT

### Bước 1: Mở Developer Console
```bash
# Mở F12 → Console tab
# Xem logs với prefix:
# 🔄 [SUPABASE_UPLOAD] - Bắt đầu quá trình
# 📥 [SUPABASE_UPLOAD] - Download từ Runware  
# 📤 [UPLOAD_PROCESSED] - Upload lên Supabase
# 💾 [UPDATE_RECORD] - Cập nhật database
# ✅/❌ - Kết quả từng bước
```

### Bước 2: Test Upload Flow
1. Upload ảnh sản phẩm
2. **Kiểm tra**: Nút thay thành "Xóa Background" ✅
3. **Kiểm tra**: Preview hiển thị ảnh gốc ✅

### Bước 3: Test Remove Background Flow  
1. Bấm "Xóa Background"
2. **Kiểm tra**: Ngay lập tức chuyển sang bước 2 ✅
3. **Kiểm tra**: Loading animation hiển thị ✅
4. **Xem Console**: Theo dõi logs upload Supabase
5. **Kiểm tra**: Tab preview auto-switch sang "Đã Xóa BG" ✅
6. **Kiểm tra**: Ảnh preview từ Supabase domain ✅

### Bước 4: Kiểm tra Database
```sql
-- Kiểm tra record mới nhất
SELECT 
  id, 
  mask_url, 
  mask_supabase_url, 
  status, 
  created_at 
FROM processed_images 
ORDER BY created_at DESC 
LIMIT 1;

-- Kết quả mong đợi:
-- mask_url: https://im.runware.ai/image/ws/2/ii/xxx.png
-- mask_supabase_url: https://svbfdivnopohjqjwddcv.supabase.co/storage/v1/object/public/processed-images/xxx
-- status: mask_generated
```

### Bước 5: Test Style Selection Flow
1. Chọn style hoặc nhập custom prompt
2. **Kiểm tra**: Nút "Tạo Background" xuất hiện ✅
3. Bấm "Tạo Background"
4. **Kiểm tra**: Auto chuyển sang bước 4 ✅
5. **Kiểm tra**: Loading animation đẹp mắt ✅

### Bước 6: Test Generate Background Flow
1. **Xem Console**: Theo dõi logs upload final image
2. **Kiểm tra**: Tab preview auto-switch sang "Kết Quả" ✅
3. **Kiểm tra**: Ảnh kết quả từ Supabase domain ✅

## 🔍 DEBUG LOGS MẪU

### Logs thành công:
```
🔄 [SUPABASE_UPLOAD] Starting download and upload process: {
  imageUrl: "https://im.runware.ai/image/ws/2/ii/f44944fe-6d57...",
  userId: "abc123",
  imageId: "def456", 
  type: "mask"
}

📥 [SUPABASE_UPLOAD] Downloading image from URL...

✅ [SUPABASE_UPLOAD] Image downloaded successfully: {
  size: 245760,
  type: "image/png"
}

📤 [UPLOAD_PROCESSED] Starting upload to Supabase Storage: {
  blobSize: 245760,
  blobType: "image/png",
  userId: "abc123",
  imageId: "def456",
  type: "mask"
}

📁 [UPLOAD_PROCESSED] Generated file path: {
  fileName: "mask_1692345678901.png", 
  filePath: "abc123/processed/def456/mask_1692345678901.png",
  bucket: "processed-images"
}

✅ [UPLOAD_PROCESSED] File uploaded to storage successfully: {...}

🔗 [UPLOAD_PROCESSED] Generated public URL: https://svbfdivnopohjqjwddcv.supabase.co/storage/v1/object/public/processed-images/...

💾 [UPDATE_RECORD] Updating database record: {
  imageId: "def456",
  updateData: { mask_supabase_url: "https://svbfdivnopohjqjwddcv.supabase.co/..." }
}

✅ [UPDATE_RECORD] Database record updated successfully: {...}

🎉 [SUPABASE_UPLOAD] Successfully uploaded to Supabase: {...}
```

### Logs lỗi thường gặp:
```
❌ [SUPABASE_UPLOAD] Missing parameters: {...}
❌ [SUPABASE_UPLOAD] Download failed: 404 Not Found
❌ [UPLOAD_PROCESSED] Supabase storage upload error: {...}
❌ [UPDATE_RECORD] Database update error: {...}
```

## 🚨 TROUBLESHOOTING

### Nếu `mask_supabase_url` vẫn là `null`:

1. **Kiểm tra Storage Bucket**:
   ```sql
   -- Trong Supabase Dashboard → Storage
   -- Đảm bảo bucket "processed-images" tồn tại và public
   ```

2. **Kiểm tra RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'processed_images';
   ```

3. **Kiểm tra Environment Variables**:
   ```bash
   # .env.local phải có đầy đủ:
   NEXT_PUBLIC_SUPABASE_URL=https://svbfdivnopohjqjwddcv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Test Manual Upload**:
   ```javascript
   // Test trong Console
   const testUpload = await ImageUploadService.downloadAndUploadFromRunware(
     'https://im.runware.ai/image/ws/2/ii/test.png',
     'user-id',
     'image-id', 
     'mask'
   );
   console.log(testUpload);
   ```

## 📊 KẾT QUẢ MONG ĐỢI

Sau khi fix:
- ✅ UX mượt mà: Chuyển bước ngay lập tức
- ✅ Loading animation đẹp mắt
- ✅ `mask_supabase_url` và `final_supabase_url` được lưu thành công
- ✅ Preview hiển thị ảnh từ Supabase domain
- ✅ Logs chi tiết để debug
- ✅ Code đơn giản, dễ maintain

## 🎯 READY TO TEST

Bây giờ bạn có thể test workflow mới:
1. Chạy `npm run dev`
2. Truy cập `/background-generator/generator`
3. Theo dõi Console logs
4. Kiểm tra database sau mỗi bước
