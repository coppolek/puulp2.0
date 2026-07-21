import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, Comment } from '../types';
import { ArrowRight, CheckCircle2, ChevronLeft, BookOpen, Share2, Check, User as UserIcon, Bookmark, MessageSquare, Send, Sparkles, Volume2, Square } from 'lucide-react';
import Markdown from 'react-markdown';
import { User as AuthUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ArticleReaderProps {
  article: Article;
  allArticles: Article[];
  user: AuthUser | null;
  initialVisibleCount: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenArticle: (article: Article) => void;
  onProgressUpdate: (articleId: string, current: number, total: number) => void;
  onBack: () => void;
}

export default function ArticleReader({ article, allArticles, user, initialVisibleCount, isFavorite, onToggleFavorite, onOpenArticle, onProgressUpdate, onBack }: ArticleReaderProps) {
  // Split content by two or more newlines to allow markdown paragraphs within the same chunk
  const chunks = article.content.split(/\n\n+/).filter(c => c.trim() !== '');
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<{ [chunkIndex: number]: string }>({});
  const [activeCommentSection, setActiveCommentSection] = useState<number | null>(null);
  
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [speakingChunk, setSpeakingChunk] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = (text: string, index: number) => {
    if (speakingChunk === index) {
      window.speechSynthesis.cancel();
      setSpeakingChunk(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    
    utterance.onend = () => {
      setSpeakingChunk(null);
    };
    
    utterance.onerror = () => {
      setSpeakingChunk(null);
    };
    
    setSpeakingChunk(index);
    window.speechSynthesis.speak(utterance);
  };
  
  const progressPercentage = (visibleCount / chunks.length) * 100;
  
  const getWords = (text: string): string[] => {
    return text.toLowerCase().match(/\b\w+\b/g) || [];
  };

  const articleTitleWords = getWords(article.title);
  const articleTagWords = article.tags?.flatMap(tag => getWords(tag)) || [];

  const relatedArticles = allArticles
    .filter(a => a.id !== article.id)
    .map(a => {
      let score = 0;
      if (a.category === article.category) score += 3;
      
      const aTagWords = a.tags?.flatMap(tag => getWords(tag)) || [];
      const commonTags = aTagWords.filter(tag => articleTagWords.includes(tag));
      score += commonTags.length * 2;
      
      const titleWords = getWords(a.title);
      const commonTitleWords = titleWords.filter(word => articleTitleWords.includes(word));
      score += commonTitleWords.length;

      return { article: a, score };
    })
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(a => a.article)
    .slice(0, 5);

  useEffect(() => {
    onProgressUpdate(article.id, visibleCount, chunks.length);
  }, [visibleCount, article.id, chunks.length]);

  useEffect(() => {
    const q = query(collection(db, 'comments'), where('articleId', '==', article.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms: Comment[] = [];
      snapshot.forEach(doc => {
        comms.push({ id: doc.id, ...doc.data() } as Comment);
      });
      comms.sort((a, b) => a.createdAt - b.createdAt);
      setComments(comms);
    });
    return () => unsubscribe();
  }, [article.id]);

  const handleContinue = () => {
    setVisibleCount(prev => prev < chunks.length ? prev + 1 : prev);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setVisibleCount(prev => prev < chunks.length ? prev + 1 : prev);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setVisibleCount(prev => prev > 1 ? prev - 1 : prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chunks.length]);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('article', article.id);
    url.searchParams.set('chunk', visibleCount.toString());
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async (chunkIndex: number) => {
    if (!user || !newComment[chunkIndex]?.trim()) return;
    try {
      await addDoc(collection(db, 'comments'), {
        articleId: article.id,
        chunkIndex,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Utente anonimo',
        authorPhotoUrl: user.photoURL || '',
        content: newComment[chunkIndex].trim(),
        createdAt: Date.now()
      });
      setNewComment(prev => ({ ...prev, [chunkIndex]: '' }));
    } catch (error) {
      console.error("Errore aggiunta commento", error);
    }
  };

  const handleToggleSummary = async () => {
    if (!showSummary && !summary && !isSummarizing) {
      setIsSummarizing(true);
      setShowSummary(true);
      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: article.content }),
        });
        const data = await response.json();
        if (data.summary) {
          setSummary(data.summary);
        } else {
          setSummary("Impossibile generare il riassunto.");
        }
      } catch (error) {
        console.error("Errore generazione riassunto", error);
        setSummary("Errore di rete durante la generazione del riassunto.");
      } finally {
        setIsSummarizing(false);
      }
    } else {
      setShowSummary(!showSummary);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-2 bg-black/10 z-50">
        <div 
          className="h-full bg-[#00FF00] transition-all duration-500 ease-out" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 flex flex-col h-full min-h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onBack} 
            className="flex items-center text-black hover:text-white transition-colors text-sm font-black uppercase tracking-widest shrink-0"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Bacheca
          </button>
          <div className="h-[1px] flex-1 bg-black/20 hidden sm:block"></div>
          <span className="px-3 py-1 bg-white text-[#FF6321] text-xs font-black uppercase rounded shadow-sm shrink-0">
            {article.category}
          </span>
          <div className="h-[1px] flex-1 bg-black/20 hidden sm:block"></div>
          <span className="text-sm font-mono opacity-80 font-bold text-black uppercase shrink-0">
            Parte {String(visibleCount).padStart(2, '0')} / {String(chunks.length).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-black text-white rounded-full hover:bg-[#FF6321] transition-colors shrink-0"
            title="Aggiungi ai preferiti"
          >
            <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current text-[#00FF00]' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#00FF00] hover:text-black transition-colors shrink-0 h-8 sm:h-10"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copiato!' : 'Condividi'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white text-black p-10 sm:p-16 rounded-[40px] shadow-2xl relative mb-12 overflow-hidden">
        <div className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 w-16 h-16 sm:w-20 sm:h-20 bg-[#00FF00] rounded-full flex items-center justify-center border-4 border-[#FF6321] z-10">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
        </div>
        
        {article.imageUrl && (
          <div className="w-full h-64 sm:h-80 mb-10 -mx-10 sm:-mx-16 -mt-10 sm:-mt-16 overflow-hidden border-b-4 border-black">
            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        <h1 className={`text-4xl sm:text-5xl font-black leading-tight mb-6 font-serif italic text-[#1A1A1A] ${!article.imageUrl && 'mt-4'}`}>
          {article.title}
        </h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          {article.author && (
            <div className="flex items-center text-gray-500">
              <UserIcon className="w-5 h-5 mr-2" />
              <span className="font-bold uppercase tracking-widest text-sm">{article.author}</span>
            </div>
          )}
          <button 
            onClick={handleToggleSummary}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6321]/10 text-[#FF6321] hover:bg-[#FF6321] hover:text-white rounded-full font-black text-xs uppercase tracking-widest transition-colors w-fit border-2 border-[#FF6321]"
          >
            <Sparkles className="w-4 h-4" />
            {showSummary ? 'Nascondi Riassunto' : 'Genera Riassunto (AI)'}
          </button>
        </div>

        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 48 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 sm:p-8 bg-gray-50 border-4 border-black rounded-[24px] relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6321] via-[#00FF00] to-[#FF6321]"></div>
                <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6321]" />
                  Riassunto Generato dall'AI
                </h3>
                {isSummarizing ? (
                  <div className="flex items-center gap-3 text-gray-500 font-bold animate-pulse">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Analisi dell'articolo in corso...
                  </div>
                ) : (
                  <p className="text-lg leading-relaxed text-gray-800 font-medium">
                    {summary}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-12">
          {chunks.slice(0, visibleCount).map((chunk, index) => {
            const chunkComments = comments.filter(c => c.chunkIndex === index);
            const isCommentSectionOpen = activeCommentSection === index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index === visibleCount - 1 && index > 0 ? 0.2 : 0 }}
                className="relative"
              >
                <div className="text-xl sm:text-2xl leading-relaxed text-gray-800 prose prose-lg max-w-none prose-p:mb-6 prose-headings:font-black prose-a:text-[#FF6321] prose-a:font-bold prose-img:rounded-2xl prose-img:border-4 prose-img:border-black pr-12">
                  <Markdown>{chunk}</Markdown>
                </div>
                
                <div className="absolute top-0 right-0 flex flex-col gap-2">
                  <button
                    onClick={() => handleSpeak(chunk, index)}
                    className={`p-2 rounded-full border-2 transition-colors flex items-center justify-center ${speakingChunk === index ? 'bg-[#00FF00] text-black border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black'}`}
                    title={speakingChunk === index ? "Ferma riproduzione" : "Ascolta"}
                  >
                    {speakingChunk === index ? <Square className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setActiveCommentSection(isCommentSectionOpen ? null : index)}
                    className={`p-2 rounded-full border-2 transition-colors flex items-center justify-center relative ${isCommentSectionOpen ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black'}`}
                    title="Commenti"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {chunkComments.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#FF6321] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {chunkComments.length}
                      </span>
                    )}
                  </button>
                </div>

                {isCommentSectionOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 bg-gray-50 border-4 border-black rounded-2xl p-6 relative overflow-hidden"
                  >
                    <h4 className="font-black text-sm uppercase tracking-widest mb-6">Commenti</h4>
                    
                    <div className="space-y-6 mb-6">
                      {chunkComments.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">Nessun commento per questo paragrafo.</p>
                      ) : (
                        chunkComments.map(comment => (
                          <div key={comment.id} className="flex gap-4">
                            {comment.authorPhotoUrl ? (
                              <img src={comment.authorPhotoUrl} alt={comment.authorName} className="w-10 h-10 rounded-full border-2 border-black" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-black">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-sm">{comment.authorName}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-800 text-sm bg-white p-3 rounded-xl border-2 border-gray-200 inline-block">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {user ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment[index] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [index]: e.target.value }))}
                          placeholder="Aggiungi un commento..."
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-full focus:border-black outline-none text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(index)}
                        />
                        <button
                          onClick={() => handleAddComment(index)}
                          disabled={!newComment[index]?.trim()}
                          className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#FF6321] transition-colors disabled:opacity-50 disabled:hover:bg-black"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 font-bold uppercase text-center mt-4 border-t-2 border-gray-200 pt-4">
                        Accedi per lasciare un commento
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {visibleCount === chunks.length && relatedArticles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-black mb-6 uppercase tracking-widest text-black flex items-center">
            <span className="w-3 h-3 rounded-full bg-black mr-4"></span>
            Articoli Correlati
          </h3>
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
            {relatedArticles.map(related => (
              <div 
                key={related.id}
                onClick={() => onOpenArticle(related)}
                className="bg-white rounded-[24px] p-6 border-4 border-transparent hover:border-black shadow-xl cursor-pointer transition-all flex flex-col h-full group min-w-[280px] max-w-[320px] snap-center shrink-0"
              >
                {related.imageUrl && (
                  <div className="w-full h-32 -mx-6 -mt-6 mb-4 border-b-4 border-transparent group-hover:border-black transition-colors overflow-hidden shrink-0">
                    <img src={related.imageUrl} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                )}
                <h4 className="font-serif italic font-black text-xl mb-3 leading-tight group-hover:text-[#FF6321] transition-colors">{related.title}</h4>
                <div className="mt-auto flex flex-wrap gap-2">
                   {related.tags?.slice(0, 2).map(tag => (
                     <span key={tag} className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded text-gray-500 group-hover:text-black">#{tag}</span>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-auto flex justify-between items-center pb-12">
        <div className="flex gap-1.5 flex-wrap flex-1 mr-4">
            {chunks.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all ${idx < visibleCount ? 'bg-black w-10' : 'bg-white/40 w-4'}`}
              />
            ))}
        </div>
        
        <div className="flex shrink-0 gap-4">
          {visibleCount < chunks.length ? (
            <button
              onClick={handleContinue}
              className="px-8 py-4 sm:px-12 sm:py-6 bg-black text-[#00FF00] hover:bg-white hover:text-black border-4 border-transparent hover:border-black rounded-full font-black text-xl sm:text-2xl flex items-center gap-4 transition-all shadow-xl uppercase tracking-tight"
            >
              Continua
              <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-8 py-4 sm:px-12 sm:py-6 bg-[#00FF00] text-black border-4 border-black rounded-full font-black text-xl sm:text-2xl flex items-center shadow-xl uppercase tracking-tight"
            >
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 mr-4" />
              Concluso
            </motion.div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
