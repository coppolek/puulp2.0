import { useState, FormEvent, useRef } from 'react';
import { Article } from '../types';
import { ChevronLeft, Send, Bold, Italic, Link as LinkIcon, List, Quote, Image as ImageIcon } from 'lucide-react';

interface CreatePostProps {
  onSave: (article: Omit<Article, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function CreatePost({ onSave, onCancel }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || !content.trim()) return;
    
    const parsedTags = tags.split(',').map(t => t.trim()).filter(t => t !== '');

    onSave({ 
      title: title.trim(), 
      category: category.trim(), 
      content: content.trim(),
      author: author.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined
    });
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    const newText = before + prefix + selected + suffix + after;
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <button 
        onClick={onCancel} 
        className="flex items-center text-black hover:text-white transition-colors text-sm font-black uppercase tracking-widest mb-8"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Annulla
      </button>
      
      <h1 className="text-4xl sm:text-5xl font-black mb-10 text-black tracking-tighter uppercase">Nuovo Articolo</h1>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 sm:p-12 rounded-[40px] border-4 border-black shadow-2xl relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="sm:col-span-2">
            <label className="block text-sm font-black text-black uppercase tracking-widest mb-3">Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-4 border-gray-200 focus:border-[#FF6321] outline-none transition-all text-xl font-black text-black"
              placeholder="Es. I segreti dello spazio..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-black text-black uppercase tracking-widest mb-3">Categoria</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-4 border-gray-200 focus:border-[#FF6321] outline-none transition-all text-lg font-bold text-black"
              placeholder="es. Tech, Design, Cultura..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-black uppercase tracking-widest mb-3">Autore (Opzionale)</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-4 border-gray-200 focus:border-[#FF6321] outline-none transition-all text-lg font-bold text-black"
              placeholder="Es. Mario Rossi"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-black text-black uppercase tracking-widest mb-3">URL Immagine Copertina (Opzionale)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-4 border-gray-200 focus:border-[#FF6321] outline-none transition-all text-lg font-bold text-black"
              placeholder="https://esempio.com/immagine.jpg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-black text-black uppercase tracking-widest mb-3">Tags (Separati da virgola)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-4 border-gray-200 focus:border-[#FF6321] outline-none transition-all text-lg font-bold text-black"
              placeholder="es. innovazione, futuro, spazio"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-black text-black uppercase tracking-widest mb-3">
            Contenuto (Markdown supportato)
          </label>
          <p className="text-sm font-bold text-gray-500 mb-4">
            Vai a capo due volte (premi Invio due volte) per separare i blocchi di lettura. Ogni paragrafo vuoto creerà uno step separato per il lettore.
          </p>
          
          <div className="border-4 border-gray-200 rounded-2xl focus-within:border-[#FF6321] transition-all overflow-hidden">
            <div className="flex flex-wrap gap-1 bg-gray-50 p-2 border-b-4 border-gray-200">
              <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-black" title="Grassetto"><Bold className="w-5 h-5" /></button>
              <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-black" title="Corsivo"><Italic className="w-5 h-5" /></button>
              <div className="w-px h-6 bg-gray-300 self-center mx-1"></div>
              <button type="button" onClick={() => insertFormatting('[', '](https://)')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-black" title="Link"><LinkIcon className="w-5 h-5" /></button>
              <button type="button" onClick={() => insertFormatting('![Descrizione](https://', ')')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-black" title="Immagine"><ImageIcon className="w-5 h-5" /></button>
              <div className="w-px h-6 bg-gray-300 self-center mx-1"></div>
              <button type="button" onClick={() => insertFormatting('\n- ')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-black" title="Lista puntata"><List className="w-5 h-5" /></button>
              <button type="button" onClick={() => insertFormatting('\n> ')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-black" title="Citazione"><Quote className="w-5 h-5" /></button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-6 py-4 outline-none resize-y text-lg text-gray-800 font-medium leading-relaxed bg-white"
              placeholder="Scrivi il tuo articolo qui..."
              required
            />
          </div>
        </div>
        
        <div className="pt-6">
          <button
            type="submit"
            className="w-full flex items-center justify-center px-8 py-6 bg-black text-[#00FF00] hover:bg-white hover:text-black border-4 border-transparent hover:border-black rounded-full font-black text-2xl uppercase transition-all shadow-xl tracking-tight"
          >
            <Send className="w-8 h-8 mr-4" />
            Pubblica
          </button>
        </div>
      </form>
    </div>
  );
}
