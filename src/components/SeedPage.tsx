'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { BlogService } from '@/lib/api/services/BlogService';
import { FlashcardService } from '@/lib/api/services/FlashcardService';
import { FlashcardListService } from '@/lib/api/services/FlashcardListService';
import { ReportService } from '@/lib/api/services/ReportService';
import { ChatRoomService } from '@/lib/api/services/ChatRoomService';
import { addBlog } from '@/components/store/blogSlice';
import { addFlashcardList } from '@/components/store/flashcardListSlice';
import { addFlashCard } from '@/components/store/flashCardSlice';
import { addChatRoom } from '@/components/store/chatRoomSlice';
import { Blog, FlashcardList, FlashCard, ChatRoom } from '@/types/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, Database, BookOpen, Layers, Flag, MessageCircle } from 'lucide-react';

type SeedResult = { label: string; status: 'pending' | 'running' | 'done' | 'error'; detail?: string };

const BLOG_SEEDS = [
    {
        title: '10 Mẹo Chinh Phục IELTS Writing Task 2',
        content: `## Giới thiệu

IELTS Writing Task 2 là phần thi khiến nhiều thí sinh lo lắng nhất. Dưới đây là **10 mẹo** giúp bạn tự tin hơn.

### 1. Phân tích đề bài kỹ lưỡng

Trước khi viết, hãy xác định rõ:
- **Dạng bài**: Opinion, Discussion, Problem-Solution, hay Advantages/Disadvantages?
- **Từ khóa chính**: Gạch chân các từ khóa quan trọng trong đề bài.

### 2. Lập dàn ý trước khi viết

Dành **5 phút** để brainstorm và lập dàn ý:

| Phần | Nội dung |
|------|----------|
| Introduction | Paraphrase đề + thesis statement |
| Body 1 | Main idea + supporting details |
| Body 2 | Main idea + supporting details |
| Conclusion | Tóm tắt + final thought |

### 3. Sử dụng từ nối đa dạng

Thay vì lặp lại *"However"*, hãy thử:
- Nevertheless
- On the other hand
- In contrast
- Conversely

### 4. Viết câu phức

> Good writers use a mix of simple, compound, and complex sentences.

Ví dụ: *"Although technology has brought numerous benefits, it has also created new challenges that society must address."*

### 5. Quản lý thời gian

- **5 phút**: Phân tích đề + lập dàn ý
- **30 phút**: Viết bài
- **5 phút**: Kiểm tra lỗi

Chúc các bạn ôn tập tốt! 🎯`,
        tags: ['ielts', 'writing', 'tips'],
    },
    {
        title: 'Phương Pháp Học Từ Vựng TOEIC Hiệu Quả',
        content: `## Tại sao từ vựng quan trọng trong TOEIC?

Bài thi TOEIC yêu cầu vốn từ vựng **thương mại và công sở**. Nắm vững từ vựng giúp bạn:

1. Đọc hiểu nhanh hơn trong Part 5-7
2. Nghe hiểu chính xác hơn trong Part 1-4
3. Tự tin xử lý các tình huống giao tiếp

### Nhóm từ vựng theo chủ đề

#### 📋 Office & Administration
- **Memorandum** (n): Bản ghi nhớ nội bộ
- **Agenda** (n): Chương trình họp
- **Deadline** (n): Hạn chót
- **Itinerary** (n): Lịch trình

#### 💼 Human Resources
- **Recruit** (v): Tuyển dụng
- **Candidate** (n): Ứng viên
- **Compensation** (n): Lương thưởng
- **Probation** (n): Thời gian thử việc

### Phương pháp ghi nhớ

\`\`\`
Quy tắc 3R:
1. Read — Đọc từ vựng trong ngữ cảnh
2. Repeat — Lặp lại nhiều lần (spaced repetition)
3. Recall — Kiểm tra lại sau 1 ngày, 3 ngày, 7 ngày
\`\`\`

### Lời khuyên

> *"Đừng học từ vựng một cách cô lập. Hãy luôn đặt chúng trong câu và tình huống cụ thể."*

Hãy tạo flashcard cho mỗi nhóm từ và ôn tập mỗi ngày nhé!`,
        tags: ['toeic', 'vocabulary', 'study-method'],
    },
    {
        title: 'Kinh Nghiệm Thi IELTS 7.5 Của Mình',
        content: `## Background

Mình là sinh viên năm 3, bắt đầu ôn IELTS từ con số **0** (chưa bao giờ thi). Sau **4 tháng** tự ôn, mình đạt được:

| Kỹ năng | Điểm |
|---------|------|
| Listening | 8.0 |
| Reading | 7.5 |
| Writing | 7.0 |
| Speaking | 7.5 |
| **Overall** | **7.5** |

## Tài liệu mình dùng

### Listening
- Cambridge IELTS 14-18
- BBC 6 Minute English (nghe mỗi ngày)

### Reading
- Cambridge IELTS (làm hết)
- Đọc báo *The Guardian*, *BBC News*

### Writing
- Sách của **Simon** (ielts-simon.com)
- Viết 2-3 bài/tuần, nhờ giáo viên chấm

### Speaking
- Nói một mình trước gương 😂
- Ghi âm và nghe lại
- Tham gia nhóm speaking online

## Bài học rút ra

1. **Consistency > Intensity**: Học đều mỗi ngày 2-3 tiếng hiệu quả hơn cày 10 tiếng cuối tuần
2. **Mock test là vua**: Làm ít nhất 1 mock test/tuần trong tháng cuối
3. **Đừng sợ sai**: Sai là cơ hội để học

Hy vọng kinh nghiệm của mình giúp ích cho các bạn! 💪`,
        tags: ['ielts', 'experience', 'student-review'],
    },
    {
        title: 'Hướng Dẫn Sử Dụng Web Học Tiếng Anh',
        content: `## Chào mừng đến với nền tảng!

Đây là hướng dẫn nhanh giúp bạn sử dụng các tính năng chính trên web.

### 🏠 Trang chủ

Trang chủ hiển thị tổng quan về hoạt động của bạn:
- Số bài thi đã làm
- Flashcard cần ôn tập
- Bài viết mới nhất

### 📝 Làm bài thi

1. Chọn **IELTS** hoặc **TOEIC** ở thanh menu
2. Dùng thanh tìm kiếm hoặc bộ lọc tag để tìm bài phù hợp
3. Nhấn vào bài thi để bắt đầu
4. Hoàn thành và xem kết quả chi tiết

### 📚 Flashcard

Hệ thống flashcard giúp bạn:
- Tạo bộ thẻ từ vựng riêng
- Chia sẻ với cộng đồng
- Ôn tập theo phương pháp *spaced repetition*

### 💬 Chat Room

Tham gia các phòng chat để:
- Trao đổi kinh nghiệm học
- Luyện tập writing
- Hỏi đáp cùng cộng đồng

### 📖 Thư viện bài viết

Đọc các bài viết hữu ích về:
- Chiến lược làm bài thi
- Kinh nghiệm học viên
- Mẹo học tiếng Anh

---

*Nếu gặp vấn đề, hãy sử dụng tính năng **Báo cáo** để gửi phản hồi cho admin.*`,
        tags: ['web-usage', 'guide'],
    },
];

const FLASHCARD_LIST_SEEDS = [
    {
        name: 'IELTS Academic Word List',
        description: 'Các từ vựng học thuật thường gặp trong IELTS Reading & Writing',
        isPublic: true,
        tags: ['ielts', 'academic', 'vocabulary'],
        cards: [
            { word: 'Abundant', definition: 'Dồi dào, phong phú', partOfSpeech: 'adjective', pronunciation: '/əˈbʌndənt/', examples: ['Natural resources are abundant in this region.', 'There is abundant evidence to support the theory.'], notes: 'Synonym: plentiful, copious' },
            { word: 'Controversial', definition: 'Gây tranh cãi', partOfSpeech: 'adjective', pronunciation: '/ˌkɒntrəˈvɜːʃəl/', examples: ['The new policy remains highly controversial.', 'He made a controversial decision to close the factory.'], notes: 'Noun form: controversy' },
            { word: 'Deteriorate', definition: 'Xấu đi, suy giảm', partOfSpeech: 'verb', pronunciation: '/dɪˈtɪəriəreɪt/', examples: ['Air quality has deteriorated over the years.', 'His health began to deteriorate rapidly.'], notes: 'Noun form: deterioration' },
            { word: 'Fluctuate', definition: 'Dao động, biến đổi', partOfSpeech: 'verb', pronunciation: '/ˈflʌktʃueɪt/', examples: ['Prices tend to fluctuate throughout the year.', 'Her mood fluctuates depending on the weather.'], notes: 'Useful for IELTS Writing Task 1 (describing graphs)' },
            { word: 'Predominantly', definition: 'Chủ yếu, phần lớn', partOfSpeech: 'adverb', pronunciation: '/prɪˈdɒmɪnəntli/', examples: ['The population is predominantly urban.', 'This area is predominantly agricultural.'], notes: 'Adjective form: predominant' },
        ],
    },
    {
        name: 'TOEIC Business Vocabulary',
        description: 'Từ vựng thương mại và công sở cho bài thi TOEIC',
        isPublic: true,
        tags: ['toeic', 'business', 'vocabulary'],
        cards: [
            { word: 'Invoice', definition: 'Hoá đơn', partOfSpeech: 'noun', pronunciation: '/ˈɪnvɔɪs/', examples: ['Please send the invoice to the accounting department.', 'The invoice is due within 30 days.'], notes: 'Thường gặp trong Part 5-7' },
            { word: 'Allocate', definition: 'Phân bổ, cấp phát', partOfSpeech: 'verb', pronunciation: '/ˈæləkeɪt/', examples: ['The company allocated more funds for marketing.', 'Resources must be allocated efficiently.'], notes: 'Noun form: allocation' },
            { word: 'Expedite', definition: 'Đẩy nhanh tiến độ', partOfSpeech: 'verb', pronunciation: '/ˈekspɪdaɪt/', examples: ['We need to expedite the shipping process.', 'Can you expedite the approval of this document?'], notes: 'Formal alternative to "speed up"' },
            { word: 'Compliance', definition: 'Sự tuân thủ', partOfSpeech: 'noun', pronunciation: '/kəmˈplaɪəns/', examples: ['The company must ensure compliance with regulations.', 'Non-compliance may result in penalties.'], notes: 'Verb form: comply (with)' },
        ],
    },
];

const REPORT_SEEDS = [
    { type: 'bug', title: 'Lỗi hiển thị đề thi trên điện thoại', description: 'Khi mở bài thi IELTS Reading trên màn hình nhỏ (iPhone SE), phần passage bị tràn ra ngoài và không scroll được. Đã thử refresh trang nhưng vẫn bị.\n\nTrình duyệt: Safari iOS 17.', targetType: 'exam' },
    { type: 'content', title: 'Đáp án câu hỏi #3 bài Reading bị sai', description: 'Trong bài "Global Warming Effects", câu hỏi số 3 (True/False/Not Given), đáp án đúng phải là **False** nhưng hệ thống chấm là **True**.\n\nTham khảo đoạn văn thứ 2, dòng 5-7.', targetType: 'exam' },
    { type: 'behavior', title: 'Người dùng spam trong chat room', description: 'User có tên "xyzabc" liên tục gửi tin nhắn quảng cáo trong phòng "IELTS Discussion". Đã diễn ra trong khoảng 30 phút.\n\nMong admin xử lý để đảm bảo không gian học tập.', targetType: 'chat_room' },
];

const CHATROOM_SEEDS = [
    { name: 'IELTS Discussion' },
    { name: 'TOEIC Study Group' },
    { name: 'General English' },
];

export function SeedPage() {
    const dispatch = useAppDispatch();
    const currUser = useAppSelector((state) => state.currUser.current);
    const [results, setResults] = useState<SeedResult[]>([]);
    const [seeding, setSeeding] = useState(false);
    const [done, setDone] = useState(false);

    const updateResult = (index: number, update: Partial<SeedResult>) => {
        setResults((prev) => prev.map((r, i) => (i === index ? { ...r, ...update } : r)));
    };

    const handleSeed = async () => {
        if (!currUser) return;
        setSeeding(true);
        setDone(false);

        const initial: SeedResult[] = [
            { label: 'Blogs', status: 'pending' },
            { label: 'Flashcard Lists & Cards', status: 'pending' },
            { label: 'Reports', status: 'pending' },
            { label: 'Chat Rooms', status: 'pending' },
        ];
        setResults(initial);

        // 1. Blogs
        updateResult(0, { status: 'running' });
        try {
            let created = 0;
            for (const seed of BLOG_SEEDS) {
                const res = await BlogService.createBlog({
                    title: seed.title,
                    content: seed.content,
                    authorId: currUser.id,
                    tags: seed.tags,
                });
                const blog: Blog = {
                    id: res.id,
                    authorId: res.authorId,
                    title: res.title,
                    content: res.content,
                    tags: res.tags ?? [],
                    createdAt: new Date(res.createdAt).getTime(),
                    updatedAt: res.updatedAt ? new Date(res.updatedAt).getTime() : undefined,
                };
                dispatch(addBlog(blog));
                created++;
            }
            updateResult(0, { status: 'done', detail: `${created} blogs created` });
        } catch (err) {
            updateResult(0, { status: 'error', detail: String(err) });
        }

        // 2. Flashcard Lists + Cards
        updateResult(1, { status: 'running' });
        try {
            let listCount = 0;
            let cardCount = 0;
            for (const listSeed of FLASHCARD_LIST_SEEDS) {
                const listRes = await FlashcardListService.createFlashCardList({
                    name: listSeed.name,
                    description: listSeed.description,
                    authorId: currUser.id,
                    isPublic: listSeed.isPublic,
                    tags: listSeed.tags,
                });
                const fcList: FlashcardList = {
                    id: listRes.id,
                    authorId: listRes.authorId,
                    name: listRes.name,
                    description: listRes.description,
                    isPublic: listRes.isPublic,
                    tags: listRes.tags ?? [],
                    createdAt: new Date(listRes.createdAt).getTime(),
                    updatedAt: listRes.updatedAt ? new Date(listRes.updatedAt).getTime() : undefined,
                };
                dispatch(addFlashcardList(fcList));
                listCount++;

                for (const cardSeed of listSeed.cards) {
                    const cardRes = await FlashcardService.createFlashCard({
                        word: cardSeed.word,
                        definition: cardSeed.definition,
                        partOfSpeech: cardSeed.partOfSpeech,
                        pronunciation: cardSeed.pronunciation,
                        examples: cardSeed.examples,
                        notes: cardSeed.notes,
                        authorId: currUser.id,
                        tags: listSeed.tags,
                        listId: listRes.id,
                    });
                    const fc: FlashCard = {
                        id: cardRes.id,
                        word: cardRes.word,
                        definition: cardRes.definition,
                        image: cardRes.image,
                        partOfSpeech: cardRes.partOfSpeech,
                        pronunciation: cardRes.pronunciation,
                        examples: cardRes.examples ?? [],
                        notes: cardRes.notes,
                        authorId: cardRes.authorId,
                        tags: cardRes.tags ?? [],
                        listId: listRes.id,
                        createdAt: new Date(cardRes.createdAt).getTime(),
                        updatedAt: cardRes.updatedAt ? new Date(cardRes.updatedAt).getTime() : undefined,
                    };
                    dispatch(addFlashCard(fc));
                    cardCount++;
                }
            }
            updateResult(1, { status: 'done', detail: `${listCount} lists, ${cardCount} cards created` });
        } catch (err) {
            updateResult(1, { status: 'error', detail: String(err) });
        }

        // 3. Reports
        updateResult(2, { status: 'running' });
        try {
            let created = 0;
            for (const seed of REPORT_SEEDS) {
                await ReportService.createReport({
                    reportedBy: currUser.id,
                    type: seed.type,
                    title: seed.title,
                    description: seed.description,
                    targetType: seed.targetType,
                });
                created++;
            }
            updateResult(2, { status: 'done', detail: `${created} reports created` });
        } catch (err) {
            updateResult(2, { status: 'error', detail: String(err) });
        }

        // 4. Chat Rooms
        updateResult(3, { status: 'running' });
        try {
            let created = 0;
            for (const seed of CHATROOM_SEEDS) {
                const res = await ChatRoomService.createRoom({ name: seed.name });
                const room: ChatRoom = {
                    id: res.id,
                    name: res.name,
                    scheduledLiveUrl: res.scheduledLiveUrl,
                    scheduledDate: res.scheduledDate ? new Date(res.scheduledDate).getTime() : undefined,
                };
                dispatch(addChatRoom(room));
                created++;
            }
            updateResult(3, { status: 'done', detail: `${created} rooms created` });
        } catch (err) {
            updateResult(3, { status: 'error', detail: String(err) });
        }

        setSeeding(false);
        setDone(true);
    };

    if (!currUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-96 border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-red-600">Chưa đăng nhập</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500 text-sm">Bạn cần đăng nhập để sử dụng trang seed dữ liệu.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const icons: Record<string, React.ReactNode> = {
        Blogs: <BookOpen className="h-5 w-5" />,
        'Flashcard Lists & Cards': <Layers className="h-5 w-5" />,
        Reports: <Flag className="h-5 w-5" />,
        'Chat Rooms': <MessageCircle className="h-5 w-5" />,
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="relative overflow-hidden bg-primary text-white">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative px-6 py-8 max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6" />
                        Seed Data
                    </h1>
                    <p className="text-primary-foreground/80 mt-1 text-sm">
                        Tạo dữ liệu mẫu cho blogs, flashcards, reports và chat rooms
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <Card className="border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Dữ liệu sẽ được tạo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                                    <BookOpen className="h-4 w-4" /> Blogs
                                </div>
                                <p className="text-2xl font-bold text-blue-900 mt-1">{BLOG_SEEDS.length}</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                                    <Layers className="h-4 w-4" /> Flashcard Lists
                                </div>
                                <p className="text-2xl font-bold text-purple-900 mt-1">{FLASHCARD_LIST_SEEDS.length}</p>
                                <p className="text-xs text-purple-600 mt-0.5">
                                    {FLASHCARD_LIST_SEEDS.reduce((sum, l) => sum + l.cards.length, 0)} cards total
                                </p>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                                    <Flag className="h-4 w-4" /> Reports
                                </div>
                                <p className="text-2xl font-bold text-amber-900 mt-1">{REPORT_SEEDS.length}</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                                    <MessageCircle className="h-4 w-4" /> Chat Rooms
                                </div>
                                <p className="text-2xl font-bold text-green-900 mt-1">{CHATROOM_SEEDS.length}</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleSeed}
                            disabled={seeding}
                            className="w-full mt-4 h-12 text-base font-semibold"
                        >
                            {seeding ? (
                                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Đang tạo dữ liệu...</>
                            ) : done ? (
                                <><CheckCircle2 className="h-5 w-5 mr-2" />Tạo lại dữ liệu</>
                            ) : (
                                <><Database className="h-5 w-5 mr-2" />Bắt đầu Seed</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {results.length > 0 && (
                    <Card className="border-0 shadow-xl mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Tiến trình</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {results.map((r, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                                        r.status === 'done'
                                            ? 'bg-green-50 border-green-200'
                                            : r.status === 'error'
                                              ? 'bg-red-50 border-red-200'
                                              : r.status === 'running'
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <div className="shrink-0">
                                        {r.status === 'running' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                                        {r.status === 'done' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                        {r.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                                        {r.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                                    </div>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {icons[r.label]}
                                        <span className="font-semibold text-sm">{r.label}</span>
                                    </div>
                                    {r.detail && (
                                        <Badge
                                            variant="outline"
                                            className={
                                                r.status === 'done'
                                                    ? 'text-green-700 border-green-300'
                                                    : 'text-red-700 border-red-300'
                                            }
                                        >
                                            {r.detail}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
