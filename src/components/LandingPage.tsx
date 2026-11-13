'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight, BookOpen, BarChart, Headphones, MessageCircle, TrendingUp, Mic } from 'lucide-react';

// Photos (public/landing/*.webp) are from Unsplash, used under the Unsplash license (see
// src/Attributions.md). The page reads as a climb: sunrise (hero), the trail (steps), the summit (CTA).

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero: sunrise over a sea of clouds */}
      <section className="relative isolate overflow-hidden min-h-[min(calc(100svh-4rem),52rem)] flex items-end">
        <Image
          src="/landing/sunrise.webp"
          alt="Bình minh trên biển mây giữa những đỉnh núi tuyết"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[30%_60%] sm:object-[50%_40%] animate-hero-settle"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[hsl(222_47%_8%/0.85)] via-[hsl(222_47%_8%/0.35)] to-transparent"
        />
        <div className="container mx-auto px-6 max-w-6xl pb-16 md:pb-24 pt-40">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] max-w-4xl [text-wrap:balance]">
            Luyện Thi <span className="whitespace-nowrap">IELTS &amp; TOEIC,</span>{' '}
            <span className="block">Hiệu Quả Hơn Mỗi Ngày</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/85 max-w-xl leading-relaxed">
            Làm đề chuẩn format, luyện Speaking &amp; Writing, được AI chấm điểm và nhận xét ngay sau mỗi bài.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/auth?mode=register')}
              className="text-lg px-8 py-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_8px_30px_hsl(144_46%_30%/0.45)]"
            >
              Bắt Đầu Miễn Phí
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-lg font-semibold text-white border border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Dùng thử tài khoản demo
            </Link>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-16 md:py-24 bg-[#fff6dc] dark:bg-card">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-12">Bạn sẽ nhận được gì?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="md:col-span-2 bg-card rounded-3xl overflow-hidden border border-border/50 shadow-[var(--shadow-soft)] grid sm:grid-cols-5">
              <div className="relative sm:col-span-2 aspect-[16/10] sm:aspect-auto min-h-48">
                <Image
                  src="/landing/writing.webp"
                  alt="Người học đang viết bài luận bên tách cà phê"
                  fill
                  sizes="(min-width: 768px) 26vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="sm:col-span-3 p-8">
                <h3 className="text-xl font-semibold mb-2">Luyện Speaking &amp; Writing với AI</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI phân tích phát âm, ngữ pháp, từ vựng và đưa ra nhận xét chi tiết theo tiêu chuẩn IELTS. Luyện tập không giới hạn, nhận feedback tức thì.
                </p>
              </div>
            </article>

            <article className="bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)]">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Đề thi chuẩn format</h3>
              <p className="text-muted-foreground leading-relaxed">
                IELTS Academic, TOEIC Listening &amp; Reading với đề thi được biên soạn chất lượng.
              </p>
            </article>

            <article className="bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)]">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Theo dõi tiến độ</h3>
              <p className="text-muted-foreground leading-relaxed">
                Biểu đồ chi tiết, activity heatmap, phân tích điểm mạnh/yếu từng kỹ năng.
              </p>
            </article>

            <article className="md:col-span-2 bg-card rounded-3xl overflow-hidden border border-border/50 shadow-[var(--shadow-soft)] grid sm:grid-cols-5">
              <div className="sm:col-span-3 p-8 order-2 sm:order-1">
                <h3 className="text-xl font-semibold mb-2">Flashcards &amp; Học từ vựng</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tạo bộ flashcard riêng, ôn tập với spaced repetition, học cùng bạn bè và chia sẻ bộ thẻ cho nhau.
                </p>
              </div>
              <div className="relative sm:col-span-2 aspect-[16/10] sm:aspect-auto min-h-48 order-1 sm:order-2">
                <Image
                  src="/landing/study-group.webp"
                  alt="Nhóm bạn cùng ôn bài và cười đùa quanh bàn"
                  fill
                  sizes="(min-width: 768px) 26vw, 100vw"
                  className="object-cover"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Speaking spotlight */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-white">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Luyện Speaking 1-1 với AI</h2>
              <p className="text-white/85 text-lg leading-relaxed mb-8 max-w-xl">
                Luyện nói tiếng Anh mọi lúc, mọi nơi. AI phản hồi tức thì về phát âm, ngữ pháp và từ vựng, như có gia sư riêng 24/7.
              </p>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mb-10 max-w-xl">
                {[
                  { icon: Headphones, title: 'Nghe & Nói tự nhiên', desc: 'Hội thoại thực tế theo chủ đề IELTS Speaking' },
                  { icon: MessageCircle, title: 'Feedback tức thì', desc: 'Chấm phát âm, ngữ pháp, từ vựng ngay sau khi nói' },
                  { icon: TrendingUp, title: 'Theo dõi tiến bộ', desc: 'Band score qua từng buổi luyện tập' },
                  { icon: Mic, title: 'Không giới hạn', desc: 'Luyện bao nhiêu tùy thích, không cần đặt lịch' },
                ].map(item => (
                  <li key={item.title} className="flex gap-3">
                    <item.icon className="h-5 w-5 mt-0.5 shrink-0 text-white" aria-hidden />
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-white/75 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/speaking"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Khám phá ngay
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="flex-1 w-full lg:max-w-lg">
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-white/15">
                <Image
                  src="/landing/speaking.webp"
                  alt="Học viên đeo tai nghe chăm chú trước laptop"
                  fill
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: the trail */}
      <section id="how-it-works" className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-6 max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5] rounded-[2rem] overflow-hidden">
            <Image
              src="/landing/trail.webp"
              alt="Hai người leo núi trên con đường mòn hướng về dãy núi tuyết"
              fill
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover object-[60%_50%]"
            />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-primary mb-12">Bắt đầu như thế nào?</h2>
            <ol className="space-y-10">
              {[
                { num: '01', title: 'Đăng ký tài khoản miễn phí', desc: 'Chỉ cần email hoặc tài khoản Google, bắt đầu trong 30 giây.' },
                { num: '02', title: 'Chọn bài thi phù hợp', desc: 'IELTS Academic, TOEIC, hoặc bài thi luyện tập theo trình độ.' },
                { num: '03', title: 'Luyện tập & theo dõi tiến độ', desc: 'Làm bài, nhận feedback AI, xem tiến bộ qua biểu đồ chi tiết.' },
              ].map(step => (
                <li key={step.num} className="flex items-start gap-6">
                  <span className="text-4xl font-display font-bold text-secondary shrink-0 w-16" aria-hidden>
                    {step.num}
                  </span>
                  <div className="border-t border-border pt-4 flex-1">
                    <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA: the summit */}
      <section className="relative isolate overflow-hidden py-28 md:py-40">
        <Image
          src="/landing/summit.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover object-[50%_35%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[hsl(144_46%_18%/0.6)]" />
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 [text-wrap:balance]">
            Đỉnh band điểm của bạn đang chờ
          </h2>
          <p className="text-white/85 text-lg mb-10">Bài luyện đầu tiên chỉ cách bạn một lần đăng ký.</p>
          <Button
            size="lg"
            onClick={() => router.push('/auth?mode=register')}
            className="text-lg px-8 py-6 rounded-2xl bg-white text-primary hover:bg-white/90 font-bold shadow-xl"
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
                <span className="text-xl font-display font-semibold">Lingriser</span>
              </div>
              <p className="text-background/60 text-sm">Hệ thống luyện thi tiếng Anh với AI</p>
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
                <p>support@lingriser.vn</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-background/10 text-center text-sm text-background/40">
            © 2026 Lingriser. All rights reserved. Ảnh: Unsplash.
          </div>
        </div>
      </footer>
    </div>
  );
}
