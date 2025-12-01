import { Difficulty, Section } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const sections: Section[] = [
    // --- SECTION CHA (Hướng dẫn chung) ---
    {
        id: 's1',
        lastEditedBy: 'u1',
        parentId: 'e1', // parent is exam
        // Hướng dẫn chung cho cả phần thi
        direction: 'PART 6: READING COMPREHENSION\n\nDirections: Read the texts that follow. A word or phrase is missing in some of the sentences. Four answer choices are given below each of the sentences. Select the best answer to complete the text. Then mark the letter (A), (B), (C), or (D) on your answer sheet.',
        difficulty: Difficulty.Intermediate,
    },

    // --- SECTION CON 1 (Bài đọc về France - ứng với q1, q2...) ---
    {
        id: 's1-1',
        lastEditedBy: 'u1',
        parentId: 's1', // nested under s1
        difficulty: Difficulty.Intermediate,
        // Nội dung bài đọc
        direction: `PASSAGE 1: FRANCE AND ITS CAPITAL

France is a country located in Western Europe, known for its history, culture, and cuisine. It is one of the world's top tourist destinations, attracting millions of visitors each year. The country is famous for its wines, cheeses, and sophisticated fashion.

The capital of France is Paris, which is often referred to as the "City of Light". Paris is home to many iconic landmarks such as the Eiffel Tower, the Louvre Museum, and the Notre-Dame Cathedral. The Seine River flows through the heart of the city, offering scenic boat tours that are popular with tourists.

Historically, Paris has been a center for art and philosophy. Many famous artists and writers have lived there, finding inspiration in the city's beauty and vibrant atmosphere.`,
    },

    // --- SECTION CON 2 (Bài đọc về Remote Work - ứng với q3, q4...) ---
    {
        id: 's1-2',
        lastEditedBy: 'u1',
        parentId: 's1', // nested under s1
        difficulty: Difficulty.Intermediate,
        // Nội dung bài đọc
        direction: `PASSAGE 2: THE RISE OF REMOTE WORK

In recent years, the concept of remote work has transformed from a rare perk into a standard operating procedure for many companies worldwide. Advances in technology, particularly in video conferencing and cloud computing, have made it possible for employees to work effectively from anywhere with an internet connection.

Proponents of remote work argue that it offers significant benefits. For employees, it provides flexibility, reduces commuting time, and allows for a better work-life balance. For employers, it can lead to reduced overhead costs associated with maintaining large office spaces.

However, remote work also presents challenges. Some employees struggle with isolation and the blurring of boundaries between professional and personal life.`,
    },

    // --- SECTION KHÁC (Dự phòng) ---
    {
        id: 's2',
        lastEditedBy: 'u2',
        parentId: 'e2', // parent is exam
        direction: 'Part 2: Listening Comprehension',
        difficulty: Difficulty.Beginner,
    },
    {
        id: 's2-1',
        lastEditedBy: 'u2',
        parentId: 's2', // nested under s2
        direction: 'Listen to the audio and answer questions 1-5.',
        difficulty: Difficulty.Beginner,
    },
];

const sectionsSlice = createGenericSlice<Section>('sections', sections);

export const {
    addItem: addSection,
    updateItem: updateSection,
    removeItem: removeSection,
    setList: setSections,
} = sectionsSlice.actions;
export default sectionsSlice.reducer;