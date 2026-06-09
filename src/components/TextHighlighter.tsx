import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Trash2, Underline, Strikethrough, Plus, X, Languages } from 'lucide-react';
import { RootState } from './store/main/store';
import { TagType } from '../types/client';
import type { FlashcardList } from '../types/client';
import { useToast } from '@/components/ui/use-toast';
import { FlashcardService } from '@/lib/api/services/FlashcardService';
import { FlashcardListService } from '@/lib/api/services/FlashcardListService';
import { extractApiErrorMessage } from '@/lib/api-response';

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
  highlightEnabled?: boolean;
  className?: string;
  onTranslate?: (text: string) => Promise<string | null>;
};

type FlashcardFormData = {
  word: string;
  definition: string;
  notes: string;
  listTitle: string;
  listDescription: string;
  selectedListId: string;
  createNewList: boolean;
};

function mapFlashcardList(list: any): FlashcardList {
  return {
    id: list.id,
    authorId: list.authorId,
    name: list.name,
    description: list.description || undefined,
    isPublic: !!list.isPublic,
    tags: list.tags ?? [],
    createdAt: new Date(list.createdAt).getTime(),
  };
}

function normalizeTagName(tag: string) {
  return tag.trim().toLowerCase();
}

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
  const { toast } = useToast();
  const [loadingLists, setLoadingLists] = useState(false);
  const [apiFlashcardLists, setApiFlashcardLists] = useState<FlashcardList[]>(flashcardLists);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const tags = useSelector((state: RootState) => state.tags.list);
  const flashcardTags = tags.filter((t) => t.tagType === TagType.Flashcard || t.tagType === TagType.Question);
  const suggestedTags = flashcardTags
    .filter((tag) => {
      const q = normalizeTagName(tagInput);
      if (!q) return true;
      return normalizeTagName(tag.name).includes(q);
    })
    .filter((tag) => !selectedTags.some((t) => normalizeTagName(t) === normalizeTagName(tag.name)))
    .slice(0, 8);

  const [formData, setFormData] = useState<FlashcardFormData>({
    word: '',
    definition: '',
    notes: '',
    listTitle: '',
    listDescription: '',
    selectedListId: '',
    createNewList: false
  });

  // Load dữ liệu khi mở form
  useEffect(() => {
    if (!isOpen) return;
    setFormData(prev => ({
      ...prev,
      word: initialWord,
    }));
    setSelectedTags([]);
    setTagInput('');
  }, [isOpen, initialWord]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      ...prev,
      selectedListId: prev.selectedListId || apiFlashcardLists[0]?.id || '',
    }));
  }, [isOpen, apiFlashcardLists]);

  useEffect(() => {
    setApiFlashcardLists(flashcardLists);
  }, [flashcardLists]);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    let cancelled = false;
    setLoadingLists(true);
    FlashcardListService.listFlashCardLists(currentUser.id, undefined, 1, 200)
      .then((res: any) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        setApiFlashcardLists((data.lists ?? []).map(mapFlashcardList));
      })
      .catch((err) => {
        console.error('[TextHighlighter] fetch lists error:', err);
        toast({ title: 'Không tải được danh sách flashcard', description: extractApiErrorMessage(err), variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoadingLists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUser?.id, toast]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { word, definition, notes, listTitle, listDescription, selectedListId, createNewList } = formData;

    if (!currentUser || !word.trim()) {
      toast({ title: 'Vui lòng nhập từ mới!', variant: 'destructive' });
      return;
    }

    let listId = selectedListId;

    // 1. Xử lý tạo List mới
    if (createNewList && listTitle.trim()) {
      try {
        const rawList = await FlashcardListService.createFlashCardList({
          name: listTitle.trim(),
          description: listDescription.trim() || undefined,
          isPublic: false,
          tags: [],
        });
        const createdList = mapFlashcardList((rawList as any)?.data ?? rawList);
        setApiFlashcardLists((prev) => [createdList, ...prev.filter((l) => l.id !== createdList.id)]);
        listId = createdList.id;
      } catch (err) {
        toast({ title: 'Tạo list flashcard thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
        return;
      }
    } 
    // 2. Nếu không có list thì chỉ báo lỗi, không tự tạo list ngầm
    else if (!listId) {
      toast({ title: 'Vui lòng chọn hoặc tạo list flashcard', variant: 'destructive' });
      return;
    }

    try {
      await FlashcardService.createFlashCard({
        word: word.trim(),
        definition: definition.trim(),
        notes: notes.trim() || undefined,
        examples: [],
        tags: selectedTags,
        listId,
      });
      onSaveSuccess(word);

      setFormData({
        word: '',
        definition: '',
        notes: '',
        listTitle: '',
        listDescription: '',
        selectedListId: listId,
        createNewList: false,
      });
      setSelectedTags([]);
      setTagInput('');

      onClose();
    } catch (err) {
      toast({ title: 'Tạo flashcard thất bại', description: extractApiErrorMessage(err), variant: 'destructive' });
    }
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
                  className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                  placeholder="Nhập tiêu đề cho list từ"
                />
                <textarea
                  value={formData.listDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, listDescription: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none bg-white"
                  rows={2}
                  placeholder="Nhập mô tả cho list từ"
                ></textarea>
              </div>
            ) : (
              <select
                value={formData.selectedListId}
                onChange={(e) => setFormData(prev => ({ ...prev, selectedListId: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white text-gray-700"
              >
                 {loadingLists && <option value="">(Đang tải danh sách...)</option>}
                 {!loadingLists && apiFlashcardLists.length === 0 && <option value="">(Chưa có danh sách nào)</option>}
                 {apiFlashcardLists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Từ mới */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-gray-800">Từ mới</label>
              <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded uppercase">mới</span>
            </div>
            <input
              type="text"
              value={formData.word}
              onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none text-gray-900 shadow-sm"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none min-h-[100px] resize-y text-base shadow-sm"
              placeholder="Nhập định nghĩa"
            ></textarea>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800">Ghi chú</label>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">note</span>
            </div>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-base shadow-sm"
              placeholder="Ví dụ minh hoạ, mẹo nhớ, ngữ cảnh sử dụng..."
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800">Tags</label>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">gợi ý</span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 px-2.5 py-1 text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                      className="ml-0.5 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const value = tagInput.trim();
                      if (value && !selectedTags.some((t) => normalizeTagName(t) === normalizeTagName(value))) {
                        setSelectedTags((prev) => [...prev, value]);
                      }
                      setTagInput('');
                    }
                    if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
                      setSelectedTags((prev) => prev.slice(0, -1));
                    }
                  }}
                  placeholder={selectedTags.length > 0 ? '' : 'Nhập tag rồi chọn gợi ý...'}
                  className="min-w-[180px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  Gợi ý tag
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {suggestedTags.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-gray-500">Không có tag phù hợp</div>
                  ) : (
                    suggestedTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setSelectedTags((prev) => [...prev, tag.name]);
                            setTagInput('');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-primary/5 transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium text-gray-800">{tag.name}</span>
                          <span className="text-[11px] text-gray-400">{tag.tagType}</span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer - Chỉ có nút Lưu */}
        <div className="px-6 py-4 flex justify-end pb-6">
          <button
            type="submit"
            className="px-8 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none shadow transition-all"
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
export function TextHighlighter({ text, onNewWord, highlightEnabled, onTranslate, className }: TextHighlighterProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('yellow');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  
  // State for editing existing highlights
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Flashcard State
  const [showFlashcardForm, setShowFlashcardForm] = useState(false);
  const [wordForForm, setWordForForm] = useState('');

  // Translate State
  const [translationText, setTranslationText] = useState<string | null>(null);
  const [translatingSelection, setTranslatingSelection] = useState(false);
  
  const textRef = useRef<HTMLDivElement>(null);

  // Redux Data
  const currentUser = useSelector((state: RootState) => state.currUser.current);
  const flashcardLists = useSelector((state: RootState) => {
    const lists = state.flashcardLists?.list || [];
    return currentUser ? lists.filter(list => list.authorId === currentUser.id) : [];
  });

  // --- HIGHLIGHT HANDLERS ---
  const handleMouseUp = () => {
    setTranslationText(null);
    if (highlightEnabled === false) {
      return;
    }

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
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    
    setSelectedRange(range);
    setIsEditMode(false);
    setEditingHighlight(null);
    setShowToolbar(true);
  };

  // Handler for clicking on existing highlight
  const handleHighlightClick = (e: MouseEvent, highlight: Highlight) => {
    // Don't show toolbar if highlight mode is disabled
    if (highlightEnabled === false) {
      return;
    }
    
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setToolbarPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    
    setEditingHighlight(highlight);
    setIsEditMode(true);
    setShowToolbar(true);
    
    // Clear any text selection
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
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

  // Remove highlight by ID (for edit mode)
  const removeHighlightById = (highlightId: string) => {
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setShowToolbar(false);
    setEditingHighlight(null);
    setIsEditMode(false);
  };

  // Update highlight color (for edit mode)
  const updateHighlightColor = (highlightId: string, newColor: string) => {
    setHighlights(prev => prev.map(h => 
      h.id === highlightId ? { ...h, color: newColor } : h
    ));
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

  // --- TRANSLATE HANDLER ---
  const handleTranslateSelection = async () => {
    if (!onTranslate) return;
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    if (!selectedText) return;
    setTranslatingSelection(true);
    try {
      const result = await onTranslate(selectedText);
      if (result) {
        setTranslationText(result);
      }
    } catch (err) {
      console.error('Translate error:', err);
    } finally {
      setTranslatingSelection(false);
    }
    setShowToolbar(false);
  };

  // Close toolbar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.highlight-toolbar') && 
          !target.classList.contains('highlight') &&
          !textRef.current?.contains(target)) {
        setShowToolbar(false);
        setIsEditMode(false);
        setEditingHighlight(null);
      }
    };

    if (showToolbar) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showToolbar]);

  // --- EFFECT: RENDER HIGHLIGHTS ---
  useEffect(() => {
    if (!textRef.current) return;
    const container = textRef.current;
    container.innerHTML = text;

    highlights.forEach((highlight) => {
      const { id, text: hlText, color, underline, strikethrough, matchIndex } = highlight;
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
            const interactiveClasses = highlightEnabled !== false ? 'cursor-pointer hover:opacity-80' : '';
            highlightSpan.className = `highlight ${backgroundClass} ${underline ? 'underline' : ''} ${strikethrough ? 'line-through' : ''} ${interactiveClasses} transition-opacity`.trim();
            highlightSpan.textContent = hlText;
            highlightSpan.setAttribute('data-highlight-id', id);
            
            // Add click handler to show toolbar
            highlightSpan.onclick = (e) => handleHighlightClick(e, highlight);

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
  }, [highlights, text, highlightEnabled]);

  // --- RENDER ---
  return (
    <div className={`relative group ${className || ''}`}>
      <div
        ref={textRef}
        className="whitespace-pre-wrap text-justify selection:bg-primary/20 selection:text-primary"
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          // Only close toolbar if no text is selected and not clicking on highlight or toolbar
          const selection = window.getSelection();
          const hasSelection = selection && selection.toString().trim() !== '';
          const target = e.target as HTMLElement;
          
          if (!hasSelection && !target.classList.contains('highlight') && !target.closest('.highlight-toolbar')) {
            setShowToolbar(false);
            setIsEditMode(false);
            setEditingHighlight(null);
          }
        }}
      />

      {/* Toolbar */}
      {showToolbar && (
        <div
          className="fixed z-50 flex items-center gap-1 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 animate-in fade-in zoom-in duration-200 highlight-toolbar"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
          onMouseDown={(e) => e.preventDefault()} 
        >
          {/* Delete button */}
          <button 
            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
            onClick={() => {
              if (isEditMode && editingHighlight) {
                removeHighlightById(editingHighlight.id);
              } else {
                removeSelectedHighlight();
              }
            }}
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
                className={`w-6 h-6 rounded-full border border-gray-200 transition-all hover:scale-110 ${c.class} ${
                  (isEditMode && editingHighlight?.color === c.class) || 
                  (!isEditMode && selectedColor === c.class) 
                    ? 'ring-2 ring-primary ring-offset-1' 
                    : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!isEditMode) setSelectedColor(c.class);
                }}
                onClick={() => {
                  if (isEditMode && editingHighlight) {
                    updateHighlightColor(editingHighlight.id, c.class);
                    setShowToolbar(false);
                    setIsEditMode(false);
                    setEditingHighlight(null);
                  } else {
                    setSelectedColor(c.class);
                    addHighlight(false, false, true, false);
                  }
                }}
                title={isEditMode ? `Đổi màu thành ${c.name}` : c.name}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Underline button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-gray-100" 
            onClick={() => {
              if (isEditMode && editingHighlight) {
                setHighlights(prev => prev.map(h => 
                  h.id === editingHighlight.id ? { ...h, underline: !h.underline } : h
                ));
                setShowToolbar(false);
                setIsEditMode(false);
                setEditingHighlight(null);
              } else {
                addHighlight(true, false, true, true);
              }
            }} 
            title="Gạch chân"
          >
            <Underline size={16} />
          </Button>

          {/* Strikethrough button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-gray-100" 
            onClick={() => {
              if (isEditMode && editingHighlight) {
                setHighlights(prev => prev.map(h => 
                  h.id === editingHighlight.id ? { ...h, strikethrough: !h.strikethrough } : h
                ));
                setShowToolbar(false);
                setIsEditMode(false);
                setEditingHighlight(null);
              } else {
                addHighlight(false, true, true, true);
              }
            }} 
            title="Gạch ngang"
          >
            <Strikethrough size={16} />
          </Button>

          {/* Add to flashcard button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" 
            onClick={() => {
              if (isEditMode && editingHighlight) {
                setWordForForm(editingHighlight.text);
                setShowFlashcardForm(true);
                setShowToolbar(false);
                setIsEditMode(false);
                setEditingHighlight(null);
              } else {
                handleCreateFlashcard();
              }
            }} 
            title="Tạo Flashcard"
          >
            <Plus size={18} />
          </Button>

          {onTranslate && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  if (isEditMode && editingHighlight) {
                    setTranslationText(null);
                    setWordForForm(editingHighlight.text);
                    if (onTranslate) onTranslate(editingHighlight.text).then(r => { if (r) setTranslationText(r); });
                    setShowToolbar(false);
                    setIsEditMode(false);
                    setEditingHighlight(null);
                  } else {
                    handleTranslateSelection();
                  }
                }}
                title="Dịch"
              >
                {translatingSelection ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                ) : (
                  <Languages size={16} />
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Translation result popup */}
      {translationText && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-sm animate-in fade-in duration-200 max-w-xs"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y + 10,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Languages size={12} className="text-blue-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-blue-500">Dịch</span>
            </div>
            <button
              onClick={() => setTranslationText(null)}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-slate-100 transition-colors"
            >
              <X size={12} className="text-slate-400" />
            </button>
          </div>
          <div className="text-slate-700 text-sm leading-relaxed">{translationText}</div>
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
