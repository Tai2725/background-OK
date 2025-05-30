# Background Generator V2 - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

Background Generator V2 là phiên bản tối ưu hóa của trang tạo background, được thiết kế theo yêu cầu:

- **Single-page workflow**: Không cần chuyển step, tất cả thực hiện trên 1 trang
- **React Hook Form**: Quản lý state tối ưu theo chuẩn dự án
- **Tự động xử lý**: Upload → Xóa background → Tạo background tự động khi bấm Generate
- **UI/UX tối ưu**: Layout compact, tránh scroll nhiều
- **Chuẩn Next.js & Material-UI**: Sử dụng cú pháp mới nhất

## 🚀 Truy Cập

```
URL: http://localhost:3000/background-generator/v2
```

## 📋 Tính Năng Chính

### 1. Upload Hình Ảnh
- Drag & drop hoặc click để chọn file
- Hỗ trợ: JPG, PNG, WebP (tối đa 10MB)
- Preview ngay lập tức
- Validation tự động

### 2. Chọn Style Background
- **Style có sẵn**: 12+ style được thiết kế sẵn với UI hiện đại
- **Custom prompt**: Tự viết prompt chi tiết với editor tối ưu
- **Tăng cường prompt**: Nút "✨ Tăng Cường Prompt" tự động thêm từ khóa chất lượng
- **Gợi ý nhanh**: 6 prompt mẫu với màu sắc phân biệt
- **Preview prompt**: Xem trước nội dung prompt sẽ được sử dụng
- **Mẹo viết prompt**: Hướng dẫn chi tiết để tối ưu kết quả

### 3. Tạo Background Tự Động
- Bấm 1 nút "Tạo Background" → tự động xử lý toàn bộ
- Progress bar hiển thị tiến độ
- Không cần chuyển step thủ công

### 4. Xem Kết Quả
- Tab view: Ảnh gốc → Đã xóa BG → Kết quả cuối
- Download từng ảnh
- Thông tin chi tiết

## 🎨 Cấu Trúc Components

### 1. BackgroundGeneratorForm (Main)
```jsx
// Form chính với React Hook Form + Zod validation
<Form methods={methods} onSubmit={onSubmit}>
  <Grid container spacing={3}>
    <Grid item xs={12} lg={6}>
      {/* Left Panel - Input & Controls */}
    </Grid>
    <Grid item xs={12} lg={6}>
      {/* Right Panel - Image Preview */}
    </Grid>
  </Grid>
</Form>
```

### 2. ImagePreviewPanel
- Tab-based image display
- Auto-switch tabs based on progress
- Download functionality
- Image info display

### 3. StyleSelectionPanel
- Accordion-based layout
- Category filtering
- Compact style grid (12 styles max)
- Custom prompt with suggestions

### 4. GenerationControls
- Processing status with progress
- Action buttons
- Step-by-step guide
- Tips for best results

## 🔧 Schema Validation

```javascript
export const BackgroundGeneratorSchema = zod.object({
  image: zod.instanceof(File, { message: 'Vui lòng chọn hình ảnh!' }),
  selectedStyle: zod.object({
    id: zod.string(),
    name: zod.string(),
    prompt: zod.string(),
    category: zod.string(),
  }).nullable(),
  customPrompt: zod.string().optional(),
}).refine(
  (data) => data.selectedStyle || (data.customPrompt && data.customPrompt.trim().length >= 10),
  {
    message: 'Vui lòng chọn style hoặc nhập custom prompt (ít nhất 10 ký tự)',
    path: ['customPrompt'],
  }
);
```

## 🔄 Workflow Tự Động

```javascript
const onSubmit = handleSubmit(async (data) => {
  // Step 1: Upload to Supabase (20%)
  const uploadResult = await ImageUploadService.uploadOriginalImage(data.image, user.id);

  // Step 2: Remove background (50%)
  const removeResult = await RunwareService.removeBackground(uploadResult.data.url);

  // Step 3: Generate background (80%)
  const generateResult = await RunwareService.generateBackground(removeResult.data.imageURL, {
    prompt: enhancedPrompt,
    // ... optimized parameters
  });

  // Step 4: Complete (100%)
  // Update database and display result
});
```

## 🎯 Ưu Điểm So Với V1

### V1 (Step-based)
- ❌ Phải chuyển step thủ công
- ❌ Nhiều button navigation
- ❌ Dễ bị scroll nhiều
- ❌ State management phức tạp
- ❌ UI đơn giản, ít màu sắc

### V2 (Single-page + Modern UI)
- ✅ Tự động xử lý toàn bộ workflow
- ✅ UI hiện đại với gradient, shadow, animation
- ✅ Màu sắc làm điểm nhấn (primary, secondary, info, warning, success)
- ✅ React Hook Form chuẩn dự án
- ✅ Validation mạnh mẽ với Zod
- ✅ Progress tracking với animation
- ✅ Tính năng tăng cường prompt tự động
- ✅ Compact layout tối ưu không gian
- ✅ Responsive design hoàn hảo

## 📱 Responsive Design

- **Desktop (lg+)**: 2 cột (Input | Preview)
- **Tablet (md)**: 2 cột thu nhỏ
- **Mobile (xs-sm)**: 1 cột stack

## 🔗 Navigation

Đã thêm vào navigation menu:
```
Background Generator
├── Dashboard
├── Generator (V1)
├── Generator V2 ⭐ NEW
├── Gallery
└── Settings
```

## 🚀 Cách Sử Dụng

1. **Truy cập**: `/background-generator/v2`
2. **Upload**: Kéo thả hoặc click chọn hình ảnh
3. **Chọn Style**: Chọn style có sẵn hoặc viết custom prompt
4. **Generate**: Bấm "Tạo Background" và chờ kết quả
5. **Download**: Tải xuống ảnh từ tab "Kết Quả"

## 🎨 Customization

### Thêm Style Mới
```javascript
// Trong src/lib/runware.js
export const BACKGROUND_STYLES = [
  {
    id: 'new-style',
    name: 'Tên Style Mới',
    description: 'Mô tả style',
    prompt: 'prompt chi tiết...',
    category: 'studio', // hoặc category mới
  },
  // ...
];
```

### Tùy Chỉnh Layout
```javascript
// Trong background-generator-form.jsx
<Grid container spacing={3}>
  <Grid item xs={12} lg={6}> {/* Thay đổi breakpoint */}
    {/* Left panel */}
  </Grid>
  <Grid item xs={12} lg={6}>
    {/* Right panel */}
  </Grid>
</Grid>
```

## 🔧 Technical Details

- **Form Management**: React Hook Form với Zod validation
- **State Management**: Local state với useState hooks
- **API Integration**: ImageUploadService + RunwareService
- **UI Framework**: Material-UI v6 với cú pháp mới nhất
- **File Upload**: Field.Upload component từ dự án
- **Progress Tracking**: Linear progress với percentage

## 📝 Notes

- Tương thích 100% với API hiện có
- Không thay đổi backend logic
- Có thể chạy song song với V1
- Dễ dàng migrate từ V1 sang V2
