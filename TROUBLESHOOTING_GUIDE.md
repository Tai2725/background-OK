# 🔧 Background Generator - Hướng Dẫn Khắc Phục Lỗi

## 📋 Mục Lục
- [🚨 Lỗi Thường Gặp](#-lỗi-thường-gặp)
- [🔐 Lỗi Xác Thực](#-lỗi-xác-thực)
- [📤 Lỗi Upload Ảnh](#-lỗi-upload-ảnh)
- [🎨 Lỗi Xử Lý AI](#-lỗi-xử-lý-ai)
- [🌐 Lỗi Kết Nối](#-lỗi-kết-nối)
- [⚡ Lỗi Hiệu Suất](#-lỗi-hiệu-suất)
- [🛠️ Cách Debug](#️-cách-debug)

---

## 🚨 Lỗi Thường Gặp

### ❌ "Bạn cần đăng nhập để sử dụng tính năng này"
**Nguyên nhân:** Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập
**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Xóa cache trình duyệt
3. Kiểm tra kết nối internet

```javascript
// Console log: ❌ [OPERATION] AUTH_ERROR
```

### ❌ "Không có ảnh gốc để xử lý"
**Nguyên nhân:** Chưa upload ảnh hoặc ảnh upload bị lỗi
**Giải pháp:**
1. Upload lại ảnh ở bước 1
2. Đảm bảo ảnh có định dạng hợp lệ (JPG, PNG, WEBP)
3. Kiểm tra kích thước ảnh < 20MB

### ❌ "Không có mask image để xử lý"
**Nguyên nhân:** Bước xóa background chưa hoàn thành
**Giải pháp:**
1. Quay lại bước 2 và thực hiện "Xóa Background"
2. Đợi quá trình xử lý hoàn tất
3. Kiểm tra ảnh gốc có chất lượng tốt không

### ❌ "Vui lòng chọn style hoặc nhập prompt"
**Nguyên nhân:** Chưa chọn style background hoặc nhập custom prompt
**Giải pháp:**
1. Chọn một style có sẵn từ danh sách
2. Hoặc nhập custom prompt (tối thiểu 10 ký tự)
3. Đảm bảo prompt bằng tiếng Anh

---

## 🔐 Lỗi Xác Thực

### ❌ "Không có quyền truy cập - Kiểm tra API key"
**Console:** `❌ [OPERATION] API_ERROR_401`
**Nguyên nhân:** API key không hợp lệ hoặc hết hạn
**Giải pháp:**
1. Liên hệ admin để kiểm tra API key
2. Đăng nhập lại tài khoản
3. Kiểm tra cấu hình server

### ❌ "Bị từ chối truy cập - Tài khoản có thể bị giới hạn"
**Console:** `❌ [OPERATION] API_ERROR_403`
**Nguyên nhân:** Tài khoản bị giới hạn hoặc không có quyền
**Giải pháp:**
1. Kiểm tra trạng thái tài khoản
2. Liên hệ support để mở khóa
3. Nâng cấp gói dịch vụ nếu cần

---

## 📤 Lỗi Upload Ảnh

### ❌ "File phải là hình ảnh"
**Nguyên nhân:** File upload không phải định dạng ảnh
**Giải pháp:**
1. Chỉ upload file: `.jpg`, `.jpeg`, `.png`, `.webp`
2. Kiểm tra extension file
3. Đổi tên file nếu cần

### ❌ "File không được vượt quá 20MB"
**Nguyên nhân:** Ảnh quá lớn
**Giải pháp:**
1. Nén ảnh trước khi upload
2. Giảm resolution ảnh
3. Sử dụng format PNG thay vì JPG cho ảnh có nhiều chi tiết

### ❌ "Lỗi upload: [chi tiết lỗi]"
**Nguyên nhân:** Lỗi kết nối hoặc server storage
**Giải pháp:**
1. Thử upload lại
2. Kiểm tra kết nối internet
3. Thử ảnh khác để test

---

## 🎨 Lỗi Xử Lý AI

### ❌ "Yêu cầu không hợp lệ - Kiểm tra lại tham số đầu vào"
**Console:** `❌ [OPERATION] API_ERROR_400`
**Nguyên nhân:** Tham số gửi lên AI không đúng format
**Giải pháp:**
1. Kiểm tra ảnh input có hợp lệ không
2. Thử prompt khác (ngắn gọn hơn)
3. Reset workflow và thử lại từ đầu

### ❌ "Quá nhiều yêu cầu - Vui lòng thử lại sau"
**Console:** `❌ [OPERATION] API_ERROR_429`
**Nguyên nhân:** Đã vượt quá giới hạn request
**Giải pháp:**
1. Đợi 1-2 phút rồi thử lại
2. Tránh spam nút "Tạo Background"
3. Kiểm tra quota tài khoản

### ❌ "Lỗi server - Vui lòng thử lại sau"
**Console:** `❌ [OPERATION] SERVER_ERROR`
**Nguyên nhân:** Lỗi từ phía AI service
**Giải pháp:**
1. Đợi 5-10 phút rồi thử lại
2. Thử với ảnh khác
3. Liên hệ support nếu lỗi kéo dài

---

## 🌐 Lỗi Kết Nối

### ❌ "API endpoint không tồn tại"
**Console:** `❌ [OPERATION] API_ERROR_404`
**Nguyên nhân:** Lỗi cấu hình server
**Giải pháp:**
1. Refresh trang web
2. Xóa cache trình duyệt
3. Liên hệ admin kiểm tra server

### ❌ "Network Error" hoặc "Failed to fetch"
**Nguyên nhân:** Mất kết nối internet hoặc server down
**Giải pháp:**
1. Kiểm tra kết nối internet
2. Thử refresh trang
3. Đợi và thử lại sau

---

## ⚡ Lỗi Hiệu Suất

### ⚠️ Xử lý quá chậm (>30 giây)
**Nguyên nhân:** Ảnh quá lớn hoặc server quá tải
**Giải pháp:**
1. Giảm kích thước ảnh xuống < 2048x2048
2. Thử vào lúc khác trong ngày
3. Sử dụng ảnh có độ phức tạp thấp hơn

### ⚠️ "Processing timeout"
**Nguyên nhân:** Request bị timeout
**Giải pháp:**
1. Thử lại với ảnh nhỏ hơn
2. Đơn giản hóa prompt
3. Kiểm tra kết nối internet ổn định

---

## 🛠️ Cách Debug

### 📊 Kiểm Tra Console Logs
1. Mở Developer Tools (F12)
2. Vào tab "Console"
3. Tìm logs có format: `[OPERATION]`
4. Copy error message để tra cứu

### 🔍 Các Log Patterns Quan Trọng
```javascript
// Request bắt đầu
🔧 [INPAINTING] Request initiated: {...}

// Response từ server  
📡 [INPAINTING] Response: 200 OK (1250ms)

// Thành công
✅ [INPAINTING] Success: {...}

// Lỗi API
❌ [INPAINTING] API_ERROR_400: {...}

// Lỗi cuối cùng
❌ [INPAINTING] FINAL_ERROR: {...}
```

### 📝 Thông Tin Cần Thu Thập Khi Báo Lỗi
1. **Error message** chính xác từ console
2. **Thời gian** xảy ra lỗi
3. **Kích thước và định dạng** ảnh input
4. **Prompt** đã sử dụng (nếu có)
5. **Trình duyệt** và version
6. **Steps** đã thực hiện trước khi lỗi

### 🔄 Quy Trình Debug Cơ Bản
1. **Reproduce lỗi**: Thử lại để confirm lỗi
2. **Check console**: Xem error logs chi tiết
3. **Try alternatives**: Thử ảnh/prompt khác
4. **Reset workflow**: Bấm "Tạo Mới" và thử lại
5. **Report**: Báo lỗi với đầy đủ thông tin

---

## 🎯 Lỗi Theo Từng Bước Workflow

### Bước 1: Upload Ảnh
| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-------------|-----------|
| "File phải là hình ảnh" | Sai định dạng | Upload JPG/PNG/WEBP |
| "File quá lớn" | > 20MB | Nén ảnh hoặc giảm resolution |
| "Upload failed" | Lỗi network | Kiểm tra internet, thử lại |

### Bước 2: Xóa Background
| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-------------|-----------|
| "Không có hình ảnh để xử lý" | Chưa upload | Quay lại bước 1 |
| "Processing failed" | Ảnh quá phức tạp | Thử ảnh đơn giản hơn |
| "Timeout" | Ảnh quá lớn | Giảm kích thước ảnh |

### Bước 3: Chọn Style
| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-------------|-----------|
| "Prompt quá ngắn" | < 10 ký tự | Viết prompt chi tiết hơn |
| "Prompt quá dài" | > 500 ký tự | Rút gọn prompt |
| "Invalid characters" | Ký tự đặc biệt | Chỉ dùng chữ và số |

### Bước 4: Tạo Background
| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-------------|-----------|
| "Missing mask image" | Bước 2 chưa xong | Thực hiện lại bước 2 |
| "Invalid prompt" | Prompt không phù hợp | Thử prompt khác |
| "Generation failed" | Lỗi AI service | Đợi và thử lại |

---

## 🔍 Quick Search - Tìm Lỗi Nhanh

### Tìm theo Error Code
- **400**: [Yêu cầu không hợp lệ](#-yêu-cầu-không-hợp-lệ---kiểm-tra-lại-tham-số-đầu-vào)
- **401**: [Không có quyền truy cập](#-không-có-quyền-truy-cập---kiểm-tra-api-key)
- **403**: [Bị từ chối truy cập](#-bị-từ-chối-truy-cập---tài-khoản-có-thể-bị-giới-hạn)
- **404**: [API endpoint không tồn tại](#-api-endpoint-không-tồn-tại)
- **429**: [Quá nhiều yêu cầu](#-quá-nhiều-yêu-cầu---vui-lòng-thử-lại-sau)
- **500+**: [Lỗi server](#-lỗi-server---vui-lòng-thử-lại-sau)

### Tìm theo Từ Khóa
- **"đăng nhập"**: [Lỗi xác thực](#-lỗi-xác-thực)
- **"upload"**: [Lỗi upload ảnh](#-lỗi-upload-ảnh)
- **"timeout"**: [Lỗi hiệu suất](#-lỗi-hiệu-suất)
- **"network"**: [Lỗi kết nối](#-lỗi-kết-nối)
- **"prompt"**: [Bước 3: Chọn Style](#bước-3-chọn-style)

---

## 📊 Error Statistics & Patterns

### Lỗi Phổ Biến Nhất (Top 5)
1. **Chưa đăng nhập** (35%)
2. **File quá lớn** (20%)
3. **Prompt không hợp lệ** (15%)
4. **Timeout xử lý** (12%)
5. **Lỗi kết nối** (10%)

### Thời Gian Xử Lý Bình Thường
- **Upload ảnh**: 2-5 giây
- **Xóa background**: 10-20 giây
- **Tạo background**: 15-30 giây
- **Tổng workflow**: 30-60 giây

### Browser Compatibility
| Trình Duyệt | Hỗ Trợ | Ghi Chú |
|-------------|---------|---------|
| Chrome 90+ | ✅ Full | Recommended |
| Firefox 88+ | ✅ Full | Good |
| Safari 14+ | ⚠️ Limited | Some issues |
| Edge 90+ | ✅ Full | Good |
| Mobile | ⚠️ Limited | Basic features |

---

## 🚀 Performance Tips

### Để Có Kết Quả Tốt Nhất:
1. **Ảnh input**: 1024x1024 - 2048x2048 pixels
2. **Format**: PNG cho ảnh có background phức tạp
3. **Prompt**: 20-100 từ, mô tả rõ ràng
4. **Thời gian**: Tránh giờ cao điểm (9-11h, 14-16h)

### Tối Ưu Hóa Workflow:
1. Chuẩn bị ảnh trước khi bắt đầu
2. Viết prompt trước khi đến bước 3
3. Không spam click các nút
4. Đợi mỗi bước hoàn thành trước khi tiếp tục

---

## 📞 Liên Hệ Hỗ Trợ

### Trước Khi Liên Hệ:
1. ✅ Đã thử các giải pháp trong guide này
2. ✅ Đã clear cache và thử lại
3. ✅ Đã thử với ảnh/prompt khác
4. ✅ Đã check console logs

### Thông Tin Cần Cung Cấp:
- **Error message** chính xác từ console
- **Screenshots** của UI và console
- **File ảnh** gây lỗi (nếu có thể)
- **Prompt** đã sử dụng
- **Trình duyệt** và version
- **Thời gian** xảy ra lỗi
- **Steps** chi tiết để reproduce

### Kênh Hỗ Trợ:
- 📧 **Email**: support@backgroundgenerator.com
- 💬 **Chat**: Góc phải màn hình
- 📱 **Hotline**: 1900-xxxx (8h-17h)
- 🎫 **Ticket**: Tạo ticket trong hệ thống

---

*📅 Cập nhật lần cuối: 2024-01-15*
*🔄 Version: 2.0*
