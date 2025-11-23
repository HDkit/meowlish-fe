# AI English Speaking Test - Setup Guide

## Tổng quan

Hệ thống luyện tập Speaking Test IELTS với AI, hỗ trợ:
- ✅ Nhận diện giọng nói thời gian thực (Web Speech API)
- ✅ Chuyển đổi speech-to-text chính xác (Whisper API Local)
- ✅ Sinh câu hỏi thông minh theo ngữ cảnh (Gemini AI)
- ✅ Phân tích và đưa ra nhận xét chi tiết theo tiêu chuẩn IELTS
- ✅ Quản lý phiên luyện tập với auto-end và lưu lịch sử

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd EnglishPrep

# Cài đặt dependencies
npm install
```

### 2. Cấu hình Environment Variables

```bash
# Copy file cấu hình mẫu
cp .env.example .env

# Chỉnh sửa file .env với các API key của bạn
```

**Cấu hình bắt buộc:**

```env
# Gemini API Key (bắt buộc để sinh câu hỏi và feedback)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Whisper API URL (tùy chọn, nếu không có sẽ dùng Web Speech API)
REACT_APP_WHISPER_API_URL=http://localhost:8000
```

### 3. Setup Gemini API

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Copy API key vào file `.env`

### 4. Setup Whisper API Local (Tùy chọn)

Để có transcription chính xác nhất, bạn có thể setup Whisper API local:

```bash
# Cài đặt OpenAI Whisper
pip install openai-whisper

# Hoặc sử dụng faster-whisper
pip install faster-whisper

# Chạy Whisper API server (ví dụ với FastAPI)
python whisper_server.py
```

**Whisper Server Example (whisper_server.py):**

```python
from fastapi import FastAPI, File, UploadFile, Form
import whisper
import tempfile
import os

app = FastAPI()
model = whisper.load_model("base")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/v1/audio/transcriptions")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
    model_name: str = Form("base")
):
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Transcribe with Whisper
        result = model.transcribe(tmp_file_path, language=language)
        return {
            "text": result["text"],
            "language": result.get("language", language),
            "segments": result.get("segments", [])
        }
    finally:
        # Clean up temp file
        os.unlink(tmp_file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 5. Chạy ứng dụng

```bash
# Development mode
npm run dev

# Build for production
npm run build
```

## Tính năng chính

### 🎤 Speaking Session

- **Nhận diện giọng nói thời gian thực**: Web Speech API với fallback
- **Ghi âm chất lượng cao**: 44kHz, mono channel
- **Dual transcription**: Web Speech API + Whisper API cho độ chính xác cao
- **Live transcript**: Hiển thị transcript real-time khi nói

### 🤖 AI Question Generation

- **Contextual questions**: Gemini AI sinh câu hỏi theo ngữ cảnh
- **Part-specific logic**: Câu hỏi phù hợp với từng Part (1, 2, 3)
- **Fallback system**: Câu hỏi dự phòng khi API lỗi

### 📊 AI Feedback & Assessment

- **4 tiêu chí IELTS**: Fluency & Coherence, Lexical Resource, Grammar, Pronunciation
- **Chi tiết từng tiêu chí**: Điểm số, điểm mạnh, cần cải thiện, ví dụ
- **Khuyến nghị cá nhân hóa**: Lời khuyên dựa trên performance

### 💾 Session Management

- **Auto-end**: Tự động kết thúc sau 4-5 phút hoặc 10-12 câu
- **Lịch sử chi tiết**: Lưu toàn bộ conversation và feedback
- **Progress tracking**: Theo dõi tiến độ qua các session
- **Export/Import**: Xuất/nhập dữ liệu session

## Cấu trúc dự án

```
src/
├── components/
│   ├── SpeakingTest.tsx      # Main component, part selection
│   ├── SpeakingSession.tsx   # Recording & conversation
│   └── SpeakingResults.tsx   # AI feedback & results
├── services/
│   ├── audioService.ts       # Audio recording utilities
│   ├── speechRecognitionService.ts  # Web Speech API wrapper
│   ├── whisperService.ts     # Whisper API client
│   ├── geminiService.ts      # Gemini AI client
│   └── sessionStorageService.ts     # Session persistence
└── styles/
    └── globals.css
```

## API Endpoints

### Whisper API (Local)
- `GET /health` - Health check
- `POST /v1/audio/transcriptions` - Transcribe audio

### Gemini API (Google)
- `POST /v1beta/models/gemini-1.5-flash:generateContent` - Generate content

## Troubleshooting

### Lỗi microphone
- Kiểm tra quyền truy cập microphone trong browser
- Chỉ hoạt động trên HTTPS hoặc localhost

### Lỗi Whisper API
- Kiểm tra server Whisper có chạy không
- Kiểm tra URL và port trong .env
- Fallback về Web Speech API nếu Whisper lỗi

### Lỗi Gemini API
- Kiểm tra API key hợp lệ
- Kiểm tra quota và rate limit
- Fallback về static questions nếu Gemini lỗi

### Performance Issues
- Giảm sample rate audio nếu cần
- Sử dụng Whisper model nhỏ hơn (tiny, base thay vì large)
- Tối ưu session duration và question count

## License

MIT License - Xem file LICENSE để biết chi tiết.