# 🔧 Hướng dẫn thiết lập API Keys

## 📋 Tổng quan

Project này sử dụng 2 API chính để tạo trải nghiệm AI tốt nhất:

- **ElevenLabs API**: Cho Text-to-Speech chất lượng cao (AI examiner voice)
- **Google Gemini API**: Cho AI tạo câu hỏi thông minh

## 🚀 Cách thiết lập

### 1. ElevenLabs API (Tùy chọn - để có giọng nói AI tự nhiên)

1. **Đăng ký tài khoản**: https://elevenlabs.io/
2. **Lấy API Key**: 
   - Vào Settings → API Keys
   - Copy API key
3. **Cập nhật file .env**:
   ```env
   VITE_ELEVENLABS_API_KEY=your_actual_api_key_here
   ```

**💰 Chi phí**: 
- Free tier: 10,000 ký tự/tháng
- Paid plans từ $5/tháng

### 2. Google Gemini API (Tùy chọn - để AI tạo câu hỏi)

1. **Lấy API Key**: https://makersuite.google.com/app/apikey
2. **Cập nhật file .env**:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

**💰 Chi phí**: 
- Free tier: rất hào phóng cho testing
- Pay-per-use sau đó

## 🔄 Fallback System

**Nếu không có API keys, app vẫn hoạt động được với:**

### ElevenLabs không có → Browser TTS
- Sử dụng `window.speechSynthesis` của trình duyệt
- Giọng nói đơn giản hơn nhưng vẫn rõ ràng
- Hoàn toàn miễn phí

### Gemini không có → Static Questions
- Sử dụng bộ câu hỏi có sẳn trong code
- Vẫn đủ cho việc luyện tập cơ bản

## ⚙️ Khởi động app

```bash
# 1. Cài đặt dependencies
npm install

# 2. Cấu hình .env file (optional)
# Edit .env và thêm API keys nếu có

# 3. Chạy development server
npm run dev

# 4. Mở http://localhost:5173
```

## 🎯 Trải nghiệm theo cấu hình

| Cấu hình | TTS | AI Questions | Chất lượng |
|----------|-----|--------------|------------|
| Không API | Browser TTS | Static | ⭐⭐⭐ |
| Chỉ ElevenLabs | ElevenLabs | Static | ⭐⭐⭐⭐ |
| Chỉ Gemini | Browser TTS | AI Dynamic | ⭐⭐⭐⭐ |
| Full APIs | ElevenLabs | AI Dynamic | ⭐⭐⭐⭐⭐ |

## 🐛 Troubleshooting

### ElevenLabs 401 Error
```
GET https://api.elevenlabs.io/v1/user 401 (Unauthorized)
```
**Giải pháp**: 
- Kiểm tra API key có đúng không
- Đảm bảo account ElevenLabs còn credit
- Thử tạo API key mới

### Browser TTS không hoạt động
**Giải pháp**:
- Đảm bảo trình duyệt hỗ trợ Web Speech API
- Thử trên Chrome/Edge thay vì Firefox
- Kiểm tra cài đặt âm thanh hệ thống

### Microphone không hoạt động
**Giải pháp**:
- Cho phép truy cập microphone khi browser hỏi
- Kiểm tra cài đặt privacy của browser
- Đảm bảo microphone không bị app khác sử dụng

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Console log trong browser (F12)
2. Network tab để xem API calls
3. File .env có đúng format không

**Tips**: App được thiết kế để hoạt động tốt ngay cả không có API keys!