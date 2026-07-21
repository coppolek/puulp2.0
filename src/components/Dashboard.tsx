import { useState } from 'react';
import { Article, ReadingProgress } from '../types';
import { motion } from 'motion/react';
import { FileText, Plus, Search, Clock, PlayCircle, Bookmark } from 'lucide-react';

interface DashboardProps {
  articles: Article[];
  progressMap: Record<string, ReadingProgress>;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenArticle: (article: Article) => void;
  onCreateNew: () => void;
}

export default function Dashboard({ articles, progressMap, favorites, onToggleFavorite, onOpenArticle, onCreateNew }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group unique categories
  const categories = Array.from(new Set(articles.map(a => a.category))).sort();

  const filteredArticles = articles.filter(a => {
    const query = searchQuery.toLowerCase();
    const tagMatch = a.tags ? a.tags.some(t => t.toLowerCase().includes(query)) : false;
    const matchesSearch = a.title.toLowerCase().includes(query) || a.category.toLowerCase().includes(query) || tagMatch;
    const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Identify in-progress articles
  const inProgressArticles = articles.filter(a => {
    const progress = progressMap[a.id];
    const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
    return progress && progress.currentChunk < progress.totalChunks && matchesCategory;
  }).sort((a, b) => {
    return (progressMap[b.id]?.lastReadAt || 0) - (progressMap[a.id]?.lastReadAt || 0);
  });
  
  // Identify favorite articles
  const favoriteArticles = articles.filter(a => {
    const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
    return favorites.has(a.id) && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-black mb-2">Esplora</h1>
          <p className="text-white/90 text-xl font-medium">Leggi gli articoli frammento per frammento.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-8 py-3 bg-black text-[#00FF00] rounded-full font-black text-sm uppercase tracking-widest hover:bg-white hover:text-black border-4 border-transparent hover:border-black transition-all flex items-center shadow-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Scrivi
        </button>
      </div>

      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Cerca per titolo o categoria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-16 pr-6 py-4 rounded-full border-4 border-black text-black bg-white focus:outline-none focus:ring-4 focus:ring-black/20 transition-all font-bold text-lg placeholder-gray-400 shadow-xl"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors border-2 shadow-md ${selectedCategory === null ? 'bg-black text-[#00FF00] border-black' : 'bg-white text-black border-transparent hover:border-black'}`}
        >
          Tutti
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors border-2 shadow-md ${selectedCategory === category ? 'bg-black text-[#00FF00] border-black' : 'bg-white text-black border-transparent hover:border-black'}`}
          >
            {category}
          </button>
        ))}
      </div>

      {!searchQuery && inProgressArticles.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-widest flex items-center text-black">
            <span className="w-3 h-3 rounded-full bg-black mr-4"></span>
            Continua a leggere
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inProgressArticles.slice(0, 3).map((article, i) => {
              const progress = progressMap[article.id];
              const progressPercent = (progress.currentChunk / progress.totalChunks) * 100;
              return (
                <motion.div
                  key={`continue-${article.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  onClick={() => onOpenArticle(article)}
                  className="group bg-black text-white border-4 border-black hover:border-white rounded-[40px] p-8 cursor-pointer shadow-2xl transition-all flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-white/20">
                    <div 
                      className="h-full bg-[#00FF00]" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 font-serif italic leading-tight group-hover:text-[#00FF00] transition-colors mt-2">
                    {article.title}
                  </h3>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-white/70 line-clamp-2 text-lg mb-8 flex-grow">
                    {article.content.replace(/\n/g, ' ')}
                  </p>
                  <div className="text-xs text-white font-black uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center opacity-80">
                      <Clock className="w-4 h-4 mr-2" />
                      PARTE {String(progress.currentChunk).padStart(2, '0')} / {String(progress.totalChunks).padStart(2, '0')}
                    </span>
                    <span className="text-black bg-[#00FF00] px-4 py-2 rounded-full font-bold flex items-center">
                      RIPRENDI <PlayCircle className="w-4 h-4 ml-2" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {!searchQuery && favoriteArticles.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-widest flex items-center text-black">
            <span className="w-3 h-3 rounded-full bg-white mr-4 border-2 border-black"></span>
            I Tuoi Preferiti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteArticles.map((article, i) => (
              <motion.div
                key={`fav-${article.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                onClick={() => onOpenArticle(article)}
                className="group bg-white text-black border-4 border-transparent hover:border-black rounded-[40px] p-8 cursor-pointer shadow-2xl transition-all flex flex-col h-full relative overflow-hidden"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(article.id); }}
                  className="absolute top-6 right-6 z-10 p-2 bg-white rounded-full text-black hover:bg-black hover:text-white transition-colors border-2 border-black"
                >
                  <Bookmark className="w-5 h-5 fill-current" />
                </button>
                {article.imageUrl && (
                  <div className="w-full h-40 -mx-8 -mt-8 mb-6 border-b-4 border-transparent group-hover:border-black transition-colors overflow-hidden">
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                )}
                <h3 className={`text-2xl font-black text-[#1A1A1A] mb-4 font-serif italic leading-tight group-hover:text-[#FF6321] transition-colors pr-10 ${!article.imageUrl && 'mt-2'}`}>
                  {article.title}
                </h3>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-black text-[10px] font-black uppercase tracking-widest rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-gray-700 line-clamp-3 text-lg mb-8 flex-grow">
                  {article.content.replace(/\n/g, ' ')}
                </p>
                <div className="text-xs text-black font-black uppercase tracking-widest flex items-center justify-between">
                  <span className="opacity-60">
                    {new Date(article.createdAt).toLocaleDateString('it-IT', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </span>
                  <span className="text-[#00FF00] bg-black px-4 py-2 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    LEGGI →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[40px] border-4 border-black shadow-2xl mt-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Nessun articolo</h3>
          <p className="text-gray-500 max-w-sm mx-auto font-medium text-lg">Crea il tuo primo articolo per iniziare a popolare il blog.</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[40px] border-4 border-black shadow-2xl mt-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Nessun risultato</h3>
          <p className="text-gray-500 max-w-sm mx-auto font-medium text-lg">Nessun articolo corrisponde alla tua ricerca.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {categories.filter(category => filteredArticles.some(a => a.category === category)).map(category => (
            <div key={category}>
              <h2 className="text-2xl font-black mb-8 uppercase tracking-widest flex items-center text-black">
                <span className="w-3 h-3 rounded-full bg-[#00FF00] mr-4 border-2 border-black"></span>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles
                  .filter(a => a.category === category)
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      onClick={() => onOpenArticle(article)}
                      className="group bg-white text-black border-4 border-transparent hover:border-black rounded-[40px] p-8 cursor-pointer shadow-2xl transition-all flex flex-col h-full relative overflow-hidden"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(article.id); }}
                        className="absolute top-6 right-6 z-10 p-2 bg-white rounded-full text-black hover:bg-black hover:text-white transition-colors border-2 border-black"
                      >
                        <Bookmark className={`w-5 h-5 ${favorites.has(article.id) ? 'fill-current' : ''}`} />
                      </button>
                      {article.imageUrl && (
                        <div className="w-full h-40 -mx-8 -mt-8 mb-6 border-b-4 border-transparent group-hover:border-black transition-colors overflow-hidden">
                          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <h3 className={`text-2xl font-black text-[#1A1A1A] mb-4 font-serif italic leading-tight group-hover:text-[#FF6321] transition-colors pr-10 ${!article.imageUrl && 'mt-2'}`}>
                        {article.title}
                      </h3>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {article.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-black text-[10px] font-black uppercase tracking-widest rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-gray-700 line-clamp-3 text-lg mb-8 flex-grow">
                        {article.content.replace(/\n/g, ' ')}
                      </p>
                      <div className="text-xs text-black font-black uppercase tracking-widest flex items-center justify-between">
                        <span className="opacity-60">
                          {new Date(article.createdAt).toLocaleDateString('it-IT', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </span>
                        <span className="text-[#00FF00] bg-black px-4 py-2 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          LEGGI →
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
