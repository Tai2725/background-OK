# Hướng dẫn cấu hình Supabase Authentication với Google OAuth

## 1. Cấu hình Supabase Project

### Bước 1: Thiết lập Authentication Settings
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Authentication** > **Settings**
4. Trong **Site URL**, thêm: `http://localhost:3032` (cho development)
5. Trong **Redirect URLs**, thêm:
   - `http://localhost:3032/auth/callback`
   - `http://localhost:3032/dashboard`

### Bước 2: Cấu hình Email Templates
1. Vào **Authentication** > **Email Templates**
2. Chọn **Confirm signup**
3. Cập nhật template với nội dung tiếng Việt:

```html
<h2>Xác thực tài khoản của bạn</h2>
<p>Cảm ơn bạn đã đăng ký! Vui lòng nhấp vào liên kết bên dưới để xác thực tài khoản:</p>
<p><a href="{{ .ConfirmationURL }}">Xác thực tài khoản</a></p>
<p>Nếu bạn không thể nhấp vào liên kết, hãy sao chép và dán URL sau vào trình duyệt:</p>
<p>{{ .ConfirmationURL }}</p>
```

## 2. Cấu hình Google OAuth

### Bước 1: Thiết lập Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Nhấp **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Cấu hình:
   - **Authorized JavaScript origins**: `http://localhost:3032`
   - **Authorized redirect URIs**: 
     - `https://svbfdivnopohjqjwddcv.supabase.co/auth/v1/callback`
     - `http://localhost:3032/auth/callback`

### Bước 2: Cấu hình Consent Screen
1. Vào **APIs & Services** > **OAuth consent screen**
2. Chọn **External** user type
3. Điền thông tin:
   - **App name**: Product Background Generator
   - **User support email**: email của bạn
   - **Developer contact information**: email của bạn
4. Thêm scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`

### Bước 3: Cấu hình Supabase Google Provider
1. Trong Supabase Dashboard, vào **Authentication** > **Providers**
2. Tìm **Google** và bật nó
3. Nhập:
   - **Client ID**: từ Google Cloud Console
   - **Client Secret**: từ Google Cloud Console
4. Nhấp **Save**

## 3. Cập nhật Environment Variables

Trong file `.env.local`, thêm:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

## 4. Kiểm tra cấu hình

### Test Authentication Flow:
1. Truy cập `http://localhost:3032`
2. Nhấp **Đăng nhập với Google**
3. Hoàn thành OAuth flow
4. Kiểm tra user được tạo trong Supabase Dashboard

### Test Email Verification:
1. Đăng ký tài khoản mới với email/password
2. Kiểm tra email verification được gửi
3. Nhấp vào link xác thực
4. Kiểm tra user status trong Supabase

## 5. Troubleshooting

### Lỗi thường gặp:
1. **OAuth redirect mismatch**: Kiểm tra redirect URLs trong Google Console
2. **Email not sent**: Kiểm tra SMTP settings trong Supabase
3. **CORS errors**: Kiểm tra Site URL và Redirect URLs trong Supabase

### Debug tips:
- Kiểm tra Network tab trong DevTools
- Xem logs trong Supabase Dashboard
- Kiểm tra console errors trong browser

## 6. Production Deployment

Khi deploy production:
1. Cập nhật Site URL và Redirect URLs với domain thật
2. Cập nhật Google OAuth redirect URIs
3. Cấu hình custom domain (optional)
4. Thiết lập proper SMTP cho email delivery
