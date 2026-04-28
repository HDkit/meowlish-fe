'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ArrowRight, Mic, BookOpen, BarChart, Brain } from 'lucide-react';

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-24 md:py-32 lg:py-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 animate-blob-morph pointer-events-none" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
            Luyện Thi <span className="text-primary">IELTS &amp; TOEIC</span>
            <br />
            Hiệu Quả Hơn Mỗi Ngày
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Hệ thống luyện thi tiếng Anh với AI chấm điểm tự động, luyện Speaking &amp; Writing thông minh.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth?mode=register')}
              className="text-lg px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-[var(--shadow-heavy)] hover:shadow-[0_8px_30px_hsl(144_46%_55%/0.4)] hover:-translate-y-1"
            >
              Bắt Đầu Miễn Phí
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-muted-foreground hover:text-primary transition-colors text-lg font-medium"
            >
              Tìm hiểu thêm ↓
            </button>
          </div>
        </div>
      </section>

      {/* What You Get — Bento Grid */}
      <section className="py-16 md:py-24 bg-[#fff6dc] dark:bg-card">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-12">
            Bạn sẽ nhận được gì?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large card — spans 2 columns */}
            <div className="md:col-span-2 bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Luyện Speaking &amp; Writing với AI</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI phân tích phát âm, ngữ pháp, từ vựng và đưa ra nhận xét chi tiết theo tiêu chuẩn IELTS. Luyện tập không giới hạn, nhận feedback tức thì.
              </p>
            </div>

            {/* Small card */}
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Đề thi chuẩn format</h3>
              <p className="text-muted-foreground leading-relaxed">
                IELTS Academic, TOEIC Listening &amp; Reading với đề thi được biên soạn chất lượng.
              </p>
            </div>

            {/* Small card */}
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Theo dõi tiến độ</h3>
              <p className="text-muted-foreground leading-relaxed">
                Biểu đồ chi tiết, activity heatmap, phân tích điểm mạnh/yếu từng kỹ năng.
              </p>
            </div>

            {/* Large card — spans 2 columns */}
            <div className="md:col-span-2 bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flashcards &amp; Học từ vựng</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tạo bộ flashcard riêng, ôn tập với spaced repetition. Ghi nhớ từ vựng hiệu quả hơn gấp 3 lần so với phương pháp truyền thống.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-16">
            Bắt đầu như thế nào?
          </h2>
          <div className="space-y-12">
            {[
              { num: '01', title: 'Đăng ký tài khoản miễn phí', desc: 'Chỉ cần email hoặc tài khoản Google, bắt đầu trong 30 giây.' },
              { num: '02', title: 'Chọn bài thi phù hợp', desc: 'IELTS Academic, TOEIC, hoặc bài thi luyện tập theo trình độ.' },
              { num: '03', title: 'Luyện tập & theo dõi tiến độ', desc: 'Làm bài, nhận feedback AI, xem tiến bộ qua biểu đồ chi tiết.' },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-6">
                <span className="text-4xl font-display font-bold text-primary/30 shrink-0 w-16">
                  {step.num}
                </span>
                <div className="border-t border-border pt-4 flex-1">
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-8">
            Bắt Đầu Ngay Hôm Nay
          </h2>
          <Button
            size="lg"
            onClick={() => router.push('/auth?mode=register')}
            className="text-lg px-8 py-4 rounded-2xl bg-white text-primary font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Tạo Tài Khoản Miễn Phí
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-display font-semibold">EnglishPrep</span>
              </div>
              <p className="text-background/60 text-sm">
                Hệ thống luyện thi tiếng Anh với AI
              </p>
            </div>
            <div className="flex gap-12 text-sm text-background/60">
              <div className="space-y-2">
                <p className="text-background font-medium">Sản phẩm</p>
                <p>Luyện thi IELTS</p>
                <p>Luyện thi TOEIC</p>
                <p>AI Speaking</p>
              </div>
              <div className="space-y-2">
                <p className="text-background font-medium">Liên hệ</p>
                <p>support@englishprep.vn</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-background/10 text-center text-sm text-background/40">
            © 2026 EnglishPrep. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
