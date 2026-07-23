import React, { useState } from 'react';
import { Article, RssFeed } from '../types';
import { ChevronLeft, Edit2, Trash2, Tag, FileText, Check, X, Rss, Play, Pause, Plus } from 'lucide-react';

interface AdminPanelProps {
  articles: Article[];
  rssFeeds: RssFeed[];
  dbCategories: {id: string, name: string}[];
  onBack: () => void;
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (oldCat: string, newCat: string) => void;
  onDeleteCategory: (category: string) => void;
  onCreateCategory: (name: string) => void;
  onDeleteDbCategory: (id: string) => void;
  onAddRssFeed: (category: string, url: string) => void;
  onDeleteRssFeed: (id: string) => void;
  onToggleRssFeed: (id: string, active: boolean) => void;
  onSyncRssFeed: (feed: RssFeed) => void;
}

export default function AdminPanel({
  articles,
  rssFeeds,
  dbCategories,
  onBack,
  onEdit,
  onDelete,
  onUpdateCategory,
  onDeleteCategory,
  onCreateCategory,
  onDeleteDbCategory,
  onAddRssFeed,
  onDeleteRssFeed,
  onToggleRssFeed,
  onSyncRssFeed
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'articles' | 'categories' | 'rss'>('articles');
  
  const articleCategories = Array.from(new Set(articles.map(a => a.category)));
  const dbCategoryNames = dbCategories.map(c => c.name);
  const categories = Array.from(new Set([...articleCategories, ...dbCategoryNames])).sort();
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [newRssCategory, setNewRssCategory] = useState(categories[0] || '');

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <button 
        onClick={onBack} 
        className="flex items-center text-black hover:text-white transition-colors text-sm font-black uppercase tracking-widest mb-8"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Dashboard
      </button>

      <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-black mb-8">
        Pannello Amministratore
      </h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
            activeTab === 'articles' 
              ? 'bg-black text-[#00FF00]' 
              : 'bg-white text-black hover:bg-black/10'
          }`}
        >
          <FileText className="w-5 h-5 mr-2" />
          Articoli
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
            activeTab === 'categories' 
              ? 'bg-black text-[#00FF00]' 
              : 'bg-white text-black hover:bg-black/10'
          }`}
        >
          <Tag className="w-5 h-5 mr-2" />
          Categorie
        </button>
        <button
          onClick={() => setActiveTab('rss')}
          className={`flex items-center px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
            activeTab === 'rss' 
              ? 'bg-black text-[#00FF00]' 
              : 'bg-white text-black hover:bg-black/10'
          }`}
        >
          <Rss className="w-5 h-5 mr-2" />
          Feed RSS
        </button>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-black">
        {activeTab === 'articles' && (
          <div className="space-y-4">
            {articles.length === 0 ? (
              <p className="text-gray-500 font-bold">Nessun articolo trovato.</p>
            ) : (
              articles.map(article => (
                <div key={article.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-4 border-gray-100 rounded-3xl hover:border-black transition-colors gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-black truncate">{article.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onEdit(article)}
                      className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition-colors"
                      title="Modifica"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(article.id)}
                      className="p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-3xl border-4 border-gray-100 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value)}
                placeholder="Nuova Categoria..."
                className="flex-1 px-4 py-3 border-2 border-black rounded-xl text-black font-bold outline-none focus:ring-2 focus:ring-[#FF6321]"
              />
              <button
                onClick={() => {
                  if (newCustomCategory.trim()) {
                    onCreateCategory(newCustomCategory.trim());
                    setNewCustomCategory('');
                  }
                }}
                className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#FF6321] transition-colors flex items-center justify-center whitespace-nowrap"
              >
                <Plus className="w-5 h-5 mr-2" />
                Aggiungi
              </button>
            </div>
            
            <div className="space-y-4">
              {categories.length === 0 ? (
                <p className="text-gray-500 font-bold">Nessuna categoria trovata.</p>
              ) : (
              categories.map(category => (
                <div key={category} className="flex items-center justify-between p-6 border-4 border-gray-100 rounded-3xl hover:border-black transition-colors">
                  {editingCategory === category ? (
                    <div className="flex items-center gap-4 flex-1 mr-4">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-black rounded-xl text-black font-bold outline-none focus:ring-2 focus:ring-[#FF6321]"
                      />
                      <button
                        onClick={() => {
                          if (newCategoryName.trim() && newCategoryName.trim() !== category) {
                            onUpdateCategory(category, newCategoryName.trim());
                          }
                          setEditingCategory(null);
                        }}
                        className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-xl transition-colors"
                        title="Salva"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                        title="Annulla"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-black">{category}</h3>
                        <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">
                          {articles.filter(a => a.category === category).length} Articoli
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setNewCategoryName(category);
                          }}
                          className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition-colors"
                          title="Rinomina"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDeleteCategory(category)}
                          className="p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            </div>
          </div>
        )}

        {activeTab === 'rss' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-3xl border-4 border-gray-100 flex flex-col sm:flex-row gap-4">
              <input
                type="url"
                value={newRssUrl}
                onChange={(e) => setNewRssUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="flex-1 px-4 py-3 border-2 border-black rounded-xl text-black font-bold outline-none focus:ring-2 focus:ring-[#FF6321]"
              />
              <select
                value={newRssCategory}
                onChange={(e) => setNewRssCategory(e.target.value)}
                className="px-4 py-3 border-2 border-black rounded-xl text-black font-bold outline-none focus:ring-2 focus:ring-[#FF6321] bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (newRssUrl.trim() && newRssCategory) {
                    onAddRssFeed(newRssCategory, newRssUrl.trim());
                    setNewRssUrl('');
                  }
                }}
                className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#FF6321] transition-colors flex items-center justify-center whitespace-nowrap"
              >
                <Plus className="w-5 h-5 mr-2" />
                Aggiungi Feed
              </button>
            </div>

            <div className="space-y-4">
              {rssFeeds.length === 0 ? (
                <p className="text-gray-500 font-bold">Nessun feed RSS configurato.</p>
              ) : (
                rssFeeds.map(feed => (
                  <div key={feed.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-4 border-gray-100 rounded-3xl hover:border-black transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-black truncate">{feed.url}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
                        <span className="bg-gray-200 px-2 py-1 rounded-md text-black">{feed.category}</span>
                        <span>•</span>
                        <span className={feed.active ? 'text-green-500' : 'text-red-500'}>
                          {feed.active ? 'Attivo' : 'Inattivo'}
                        </span>
                        {feed.lastFetched && (
                          <>
                            <span>•</span>
                            <span>Ultimo sync: {new Date(feed.lastFetched).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleRssFeed(feed.id, !feed.active)}
                        className={`p-3 rounded-xl transition-colors ${
                          feed.active 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={feed.active ? "Disattiva" : "Attiva"}
                      >
                        {feed.active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => onSyncRssFeed(feed)}
                        className="px-4 py-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition-colors font-bold text-sm uppercase tracking-widest"
                      >
                        Sync Ora
                      </button>
                      <button
                        onClick={() => onDeleteRssFeed(feed.id)}
                        className="p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
