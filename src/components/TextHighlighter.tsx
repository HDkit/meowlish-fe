import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from './ui/button';
import { Trash2, Underline, Strikethrough, Plus, X, ChevronDown } from 'lucide-react';
import { addFlashCard } from './store/flashCardSlice';
import { addFlashcardList } from './store/flashcardListSlice';
import { RootState } from './store/main/store';
import type { FlashCard, FlashcardList } from '../types/client';

// --- TYPES ---
type Highlight = {
  id: string;
  text: string;
  color: string;
  underline: boolean;
  strikethrough: boolean;
  matchIndex: number;
};

type TextHighlighterProps = {
  text: string;
  onNewWord?: (word: string) => void;
};

type FlashcardFormData = {
  word: string;
  definition: string;
  listTitle: string;
  listDescription: string;
  selectedListId: string;
  createNewList: boolean;
};

// --- CONSTANTS ---
const HIGHLIGHT_COLORS = [
  { name: 'blue', class: 'bg-blue-200' },
  { name: 'pink', class: 'bg-pink-200' },
  { name: 'green', class: 'bg-green-200' },
  { name: 'yellow', class: 'bg-yellow-200' },
];

// --- COMPONENT MODAL FORM (Giống thiết kế Study4) ---
const FlashcardFormModal = ({
  isOpen,
  onClose,
  initialWord,
  currentUser,
  flashcardLists,
  onSaveSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  initialWord: string;
  currentUser: any;
  flashcardLists: FlashcardList[];
  onSaveSuccess: (word: string) => void;
}) => {
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState<FlashcardFormData>({
    word: '',
    definition: '',
    listTitle: '',
    listDescription: '',
    selectedListId: '',
    createNewList: false
  });

  // Load dữ liệu khi mở form
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        word: initialWord,
        // Nếu có list thì chọn cái đầu tiên mặc định
        selectedListId: flashcardLists.length > 0 ? flashcardLists[0].id : ''
      }));
    }
  }, [isOpen, initialWord, flashcardLists]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { word, definition, listTitle, listDescription, selectedListId, createNewList } = formData;

    if (!currentUser || !word.trim()) {
      alert('Vui lòng nhập từ mới!');
      return;
    }

    let listId = selectedListId;

    // 1. Xử lý tạo List mới
    if (createNewList && listTitle.trim()) {
      const newListId = `fl-${Date.now()}`;
      const newFlashcardList: FlashcardList = {
        id: newListId,
        userId: currentUser.id,
        name: listTitle.trim(),
        description: listDescription.trim() || undefined,
        createdAt: Date.now(),
      };
      dispatch(addFlashcardList(newFlashcardList));
      listId = newListId;
    } 
    // 2. Xử lý trường hợp chưa có list nào và không tạo mới
    else if (!listId) {
      const defaultListId = `fl-${Date.now()}`;
      dispatch(addFlashcardList({
         id: defaultListId,
         userId: currentUser.id,
         name: "My Flashcards",
         createdAt: Date.now()
      }));
      listId = defaultListId;
    }

    // 3. Tạo Flashcard
    const newFlashcard: FlashCard = {
      id: `f-${Date.now()}`,
      userId: currentUser.id,
      listId: listId,
      content: word.trim(),
      notes: definition.trim(),
      tagId: 'default',
    };

    dispatch(addFlashCard(newFlashcard));
    onSaveSuccess(word);
    
    // Reset form
    setFormData({
      word: '',
      definition: '',
      listTitle: '',
      listDescription: '',
      selectedListId: '',
      createNewList: false
    });
    
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
      {/* Overlay đen mờ */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Form Container */}
      <form 
        onSubmit={handleSubmit}
        className="relative bg-white rounded-xl shadow-2xl w-[650px] max-w-[95vw] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Tạo flashcard</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body (Scrollable) */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* 1. List từ */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-bold text-gray-800">List từ</label>
              <button 
                type="button"
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center gap-1 font-medium transition-all"
                onClick={() => setFormData(prev => ({ ...prev, createNewList: !prev.createNewList }))}
              >
                <Plus size={12} /> {formData.createNewList ? 'Chọn có sẵn' : 'Tạo mới'}
              </button>
            </div>
            
            {formData.createNewList ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-500 font-medium">Tạo list từ mới</p>
                <input
                  type="text"
                  value={formData.listTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, listTitle: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  placeholder="Nhập tiêu đề cho list từ"
                />
                <textarea
                  value={formData.listDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, listDescription: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white"
                  rows={2}
                  placeholder="Nhập mô tả cho list từ"
                ></textarea>
              </div>
            ) : (
              <select
                value={formData.selectedListId}
                onChange={(e) => setFormData(prev => ({ ...prev, selectedListId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
              >
                {flashcardLists.length === 0 && <option value="">(Chưa có danh sách nào)</option>}
                {flashcardLists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Từ mới */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-gray-800">Từ mới</label>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded uppercase">mới</span>
            </div>
            <input
              type="text"
              value={formData.word}
              onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 shadow-sm"
              placeholder="Nhập từ mới"
            />
          </div>

          {/* 3. Định nghĩa */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-gray-800">Định nghĩa</label>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">nghĩa</span>
            </div>
            <textarea
              value={formData.definition}
              onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px] resize-y text-base shadow-sm"
              placeholder="Nhập định nghĩa"
            ></textarea>
          </div>

          {/* Expand options */}
          <div className="pt-2">
            <button type="button" className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1 transition-colors">
              Thêm phiên âm, ví dụ, ảnh, ghi chú ... 
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
        
        {/* Footer - Chỉ có nút Lưu */}
        <div className="px-6 py-4 flex justify-end pb-6">
          <button
            type="submit"
            className="px-8 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none shadow transition-all"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

// --- MAIN COMPONENT ---
export function TextHighlighter({ text, onNewWord }: TextHighlighterProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('yellow');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  
  // Flashcard State
  const [showFlashcardForm, setShowFlashcardForm] = useState(false);
  const [wordForForm, setWordForForm] = useState('');
  
  const textRef = useRef<HTMLDivElement>(null);

  // Redux Data
  const currentUser = useSelector((state: RootState) => state.currUser.current);
  const flashcardLists = useSelector((state: RootState) => {
    const lists = state.flashcardLists?.list || [];
    return currentUser ? lists.filter(list => list.userId === currentUser.id) : [];
  });

  // --- HIGHLIGHT HANDLERS ---
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      setShowToolbar(false);
      return;
    }

    if (textRef.current && !textRef.current.contains(selection.anchorNode)) {
      setShowToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setToolbarPosition({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 10,
    });
    
    setSelectedRange(range);
    setShowToolbar(true);
  };

  const addHighlight = (underline = false, strikethrough = false, replaceExisting = true, decorationOnly = false) => {
    if (!selectedRange || !textRef.current) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';

    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(textRef.current);
    preSelectionRange.setEnd(selectedRange.startContainer, selectedRange.startOffset);
    const preSelectionText = preSelectionRange.toString();
    
    let matchIndex = 0;
    let pos = preSelectionText.indexOf(selectedText);
    while (pos !== -1) {
      matchIndex++;
      pos = preSelectionText.indexOf(selectedText, pos + 1);
    }

    const newHighlight: Highlight = {
      id: `hl-${Date.now()}`,
      text: selectedText,
      color: decorationOnly ? '' : selectedColor,
      underline,
      strikethrough,
      matchIndex: matchIndex,
    };

    setHighlights((prev) => {
      if (replaceExisting) {
        const filtered = prev.filter(h => !(h.text === selectedText && h.matchIndex === matchIndex));
        return [...filtered, newHighlight];
      } else {
        return [...prev, newHighlight];
      }
    });

    if (onNewWord) onNewWord(selectedText);
    if (selection) selection.removeAllRanges();
    setShowToolbar(false);
  };

  const removeSelectedHighlight = () => {
    if (!selectedRange || !textRef.current) return;
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    if (!selectedText) return;

    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(textRef.current);
    preSelectionRange.setEnd(selectedRange.startContainer, selectedRange.startOffset);
    const preSelectionText = preSelectionRange.toString();
    
    let matchIndex = 0;
    let pos = preSelectionText.indexOf(selectedText);
    while (pos !== -1) {
      matchIndex++;
      pos = preSelectionText.indexOf(selectedText, pos + 1);
    }

    setHighlights(prev => prev.filter(h => !(h.text === selectedText && h.matchIndex === matchIndex)));
    if (selection) selection.removeAllRanges();
    setShowToolbar(false);
  };

  // --- FLASHCARD HANDLERS ---
  const handleCreateFlashcard = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    if (selectedText) {
      setWordForForm(selectedText);
      setShowFlashcardForm(true);
      setShowToolbar(false);
    }
  };

  const handleSaveSuccess = (word: string) => {
    if (onNewWord) onNewWord(word);
  };

  // --- EFFECT: RENDER HIGHLIGHTS ---
  useEffect(() => {
    if (!textRef.current) return;
    const container = textRef.current;
    container.innerHTML = text;

    highlights.forEach(({ id, text: hlText, color, underline, strikethrough, matchIndex }) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      let currentNode: Node | null;
      let currentMatch = 0;

      while ((currentNode = walker.nextNode())) {
        const nodeValue = currentNode.nodeValue || '';
        let searchPos = 0;

        while (true) {
          const index = nodeValue.indexOf(hlText, searchPos);
          if (index === -1) break;

          if (currentMatch === matchIndex) {
            const afterText = nodeValue.substring(index + hlText.length);
            const highlightSpan = document.createElement('span');
            const backgroundClass = color ? color : '';
            highlightSpan.className = `highlight ${backgroundClass} ${underline ? 'underline' : ''} ${strikethrough ? 'line-through' : ''} cursor-pointer hover:opacity-80`.trim();
            highlightSpan.textContent = hlText;
            highlightSpan.onclick = (e) => e.stopPropagation();

            const parent = currentNode.parentNode;
            if (parent) {
              currentNode.nodeValue = nodeValue.substring(0, index);
              parent.insertBefore(highlightSpan, currentNode.nextSibling);
              if (afterText) {
                const afterNode = document.createTextNode(afterText);
                parent.insertBefore(afterNode, highlightSpan.nextSibling);
              }
            }
            return; 
          }
          currentMatch++;
          searchPos = index + 1;
        }
      }
    });
  }, [highlights, text]);

  // --- RENDER ---
  return (
    <div className="relative group">
      <div
        ref={textRef}
        className="whitespace-pre-wrap text-justify leading-relaxed selection:bg-blue-100 selection:text-blue-900"
        onMouseUp={handleMouseUp}
      />

      {/* Toolbar */}
      {showToolbar && (
        <div
          className="fixed z-50 flex items-center gap-1 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 animate-in fade-in zoom-in duration-200 highlight-toolbar"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y,
            transform: 'translateY(-100%)',
          }}
          onMouseDown={(e) => e.preventDefault()} 
        >
          <button 
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
            onClick={removeSelectedHighlight}
            title="Xóa highlight"
          >
            <Trash2 size={16} />
          </button>
          
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Color Palette */}
          <div className="flex gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.name}
                className={`w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110 ${c.class} ${selectedColor === c.class ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelectedColor(c.class);
                }}
                onClick={() => {
                  setSelectedColor(c.class);
                  addHighlight(false, false, true, false); 
                }}
                title={c.name}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={() => addHighlight(true, false, true, true)} title="Gạch chân">
            <Underline size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={() => addHighlight(false, true, true, true)} title="Gạch ngang">
            <Strikethrough size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleCreateFlashcard} title="Tạo Flashcard">
            <Plus size={18} />
          </Button>
        </div>
      )}

      {/* Modal - Render riêng biệt */}
      <FlashcardFormModal 
        isOpen={showFlashcardForm}
        onClose={() => setShowFlashcardForm(false)}
        initialWord={wordForForm}
        currentUser={currentUser}
        flashcardLists={flashcardLists}
        onSaveSuccess={handleSaveSuccess}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          .highlight { padding: 2px 0; border-radius: 2px; }
          .bg-blue-200 { background-color: #bfdbfe; }
          .bg-pink-200 { background-color: #fbcfe8; }
          .bg-green-200 { background-color: #bbf7d0; }
          .bg-yellow-200 { background-color: #fef08a; }
          .underline { text-decoration: underline; text-underline-offset: 2px; }
          .line-through { text-decoration: line-through !important; }
        `
      }} />
    </div>
  );
}