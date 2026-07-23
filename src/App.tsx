import { useState, useEffect, useRef } from 'react';
import { Article, ReadingProgress, RssFeed } from './types';
import { initialArticles } from './data';
import Dashboard from './components/Dashboard';
import ArticleReader from './components/ArticleReader';
import CreatePost from './components/CreatePost';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';
import { collection, onSnapshot, addDoc, query, orderBy, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

const ADMIN_EMAILS = ['coppolek@gmail.com'];

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reader' | 'create' | 'profile' | 'admin' | 'edit'>('dashboard');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const initialLoadDone = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>(() => {
    const saved = localStorage.getItem('flowblog_progress');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    const favQuery = query(collection(db, `users/${user.uid}/favorites`));
    const unsubscribe = onSnapshot(favQuery, (snapshot) => {
      const newFavs = new Set<string>();
      snapshot.forEach(doc => {
        newFavs.add(doc.id);
      });
      setFavorites(newFavs);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleFavorite = async (articleId: string) => {
    if (!user) {
      alert("Devi accedere per salvare i tuoi preferiti!");
      return;
    }
    try {
      const favRef = doc(db, `users/${user.uid}/favorites/${articleId}`);
      if (favorites.has(articleId)) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, { savedAt: Date.now() });
      }
    } catch (e) {
      console.error("Errore nel salvataggio preferito", e);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    localStorage.setItem('flowblog_progress', JSON.stringify(progressMap));
  }, [progressMap]);

  const handleProgressUpdate = (articleId: string, currentChunk: number, totalChunks: number) => {
    setProgressMap(prev => ({
      ...prev,
      [articleId]: {
        articleId,
        currentChunk,
        totalChunks,
        lastReadAt: Date.now()
      }
    }));
  };

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articlesData = snapshot.docs.map(doc => {
        const data = doc.data();
        let tags: string[] = [];
        if (Array.isArray(data.tags)) {
          tags = data.tags;
        } else if (typeof data.tags === 'string' && data.tags) {
          tags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
        return {
          id: doc.id,
          ...data,
          tags
        } as Article;
      });
      
      setArticles(articlesData);
      setLoading(false);

      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        const urlParams = new URLSearchParams(window.location.search);
        const sharedArticleId = urlParams.get('article');
        const sharedChunk = urlParams.get('chunk');
        
        if (sharedArticleId) {
          const article = articlesData.find(a => a.id === sharedArticleId);
          if (article) {
            setSelectedArticle(article);
            setCurrentView('reader');
            if (sharedChunk) {
              setProgressMap(prev => ({
                ...prev,
                [sharedArticleId]: {
                  articleId: sharedArticleId,
                  currentChunk: parseInt(sharedChunk, 10) || 1,
                  totalChunks: article.content.split(/\n\n+/).filter(c => c.trim() !== '').length,
                  lastReadAt: Date.now()
                }
              }));
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      }
    });

    const rssQ = query(collection(db, 'rssFeeds'));
    const unsubscribeRss = onSnapshot(rssQ, (snapshot) => {
      const feeds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RssFeed[];
      setRssFeeds(feeds);
    });

    const catQ = query(collection(db, 'categories'));
    const unsubscribeCats = onSnapshot(catQ, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setCategories(cats);
    });

    return () => {
      unsubscribe();
      unsubscribeRss();
      unsubscribeCats();
    };
  }, []);

  useEffect(() => {
    // Seed initial data if the collection is empty
    const seedData = async () => {
      const q = query(collection(db, 'articles'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        for (const article of initialArticles) {
          await addDoc(collection(db, 'articles'), {
            title: article.title,
            category: article.category,
            content: article.content,
            createdAt: article.createdAt
          });
        }
      }
    };
    seedData();
  }, []);

  const handleCreateArticle = async (newArticleData: Omit<Article, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'articles'), {
      ...newArticleData,
      createdAt: Date.now(),
    });
    setCurrentView('dashboard');
  };

  const handleUpdateArticle = async (updatedData: Omit<Article, 'id' | 'createdAt'>) => {
    if (!editingArticle) return;
    try {
      await updateDoc(doc(db, 'articles', editingArticle.id), {
        ...updatedData
      });
      setEditingArticle(null);
      setCurrentView('admin');
    } catch (e) {
      console.error("Error updating article", e);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'articles', id));
    } catch (e) {
      console.error("Error deleting article", e);
    }
  };

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    setCurrentView('reader');
  };

  const allCategoriesNames = Array.from(new Set([
    ...articles.map(a => a.category),
    ...categories.map(c => c.name)
  ])).sort();

  return (
    <div className="min-h-screen bg-[#FF6321] font-sans text-white selection:bg-[#00FF00] selection:text-black flex flex-col">
      <header className="flex justify-between items-center max-w-6xl mx-auto w-full px-4 sm:px-6 h-24 mb-4">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-3xl font-black tracking-tighter uppercase text-black hover:text-white transition-colors"
        >
          FlowBlog.
        </button>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView('profile')} className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full hover:bg-black/20 transition-colors">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full" />
                ) : (
                  <UserIcon className="w-5 h-5 text-black" />
                )}
                <span className="text-black font-bold text-sm hidden sm:block">{user.displayName || user.email}</span>
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setCurrentView('admin')} 
                  className="p-2 bg-black text-white hover:bg-white hover:text-black rounded-full transition-colors"
                  title="Pannello Amministratore"
                >
                  <Shield className="w-5 h-5" />
                </button>
              )}
              <button onClick={handleLogout} className="p-2 bg-black text-white hover:bg-white hover:text-black rounded-full transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="px-6 py-2 bg-black text-white font-black text-sm uppercase tracking-widest rounded-full hover:bg-white hover:text-black transition-colors shadow-lg">
              Accedi
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 pb-12">
        {currentView === 'dashboard' && (
          <Dashboard
            articles={articles}
            progressMap={progressMap}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenArticle={handleOpenArticle}
            onCreateNew={() => setCurrentView('create')}
          />
        )}
        {currentView === 'reader' && selectedArticle && (
          <ArticleReader
            article={selectedArticle}
            allArticles={articles}
            user={user}
            initialVisibleCount={progressMap[selectedArticle.id]?.currentChunk || 1}
            isFavorite={favorites.has(selectedArticle.id)}
            onToggleFavorite={() => toggleFavorite(selectedArticle.id)}
            onOpenArticle={handleOpenArticle}
            onProgressUpdate={handleProgressUpdate}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
        {currentView === 'create' && (
          <CreatePost
            categories={allCategoriesNames}
            onSave={handleCreateArticle}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}
        {currentView === 'profile' && user && (
          <UserProfile
            user={user}
            articles={articles}
            progressMap={progressMap}
            favorites={favorites}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
        {currentView === 'admin' && isAdmin && (
          <AdminPanel
            articles={articles}
            rssFeeds={rssFeeds}
            dbCategories={categories}
            onBack={() => setCurrentView('dashboard')}
            onEdit={(article) => {
              setEditingArticle(article);
              setCurrentView('edit');
            }}
            onDelete={handleDeleteArticle}
            onUpdateCategory={async (oldCat, newCat) => {
              const toUpdate = articles.filter(a => a.category === oldCat);
              for (const a of toUpdate) {
                await updateDoc(doc(db, 'articles', a.id), { category: newCat });
              }
              const dbCat = categories.find(c => c.name === oldCat);
              if (dbCat) {
                await updateDoc(doc(db, 'categories', dbCat.id), { name: newCat });
              }
            }}
            onDeleteCategory={async (category) => {
              const toUpdate = articles.filter(a => a.category === category);
              for (const a of toUpdate) {
                await updateDoc(doc(db, 'articles', a.id), { category: 'Generale' });
              }
              const dbCat = categories.find(c => c.name === category);
              if (dbCat) {
                await deleteDoc(doc(db, 'categories', dbCat.id));
              }
            }}
            onCreateCategory={async (name) => {
              if (!categories.some(c => c.name === name)) {
                await addDoc(collection(db, 'categories'), { name });
              }
            }}
            onDeleteDbCategory={async (id) => {
              await deleteDoc(doc(db, 'categories', id));
            }}
            onAddRssFeed={async (category, url) => {
              await addDoc(collection(db, 'rssFeeds'), {
                category,
                url,
                active: true,
                lastFetched: null
              });
            }}
            onDeleteRssFeed={async (id) => {
              await deleteDoc(doc(db, 'rssFeeds', id));
            }}
            onToggleRssFeed={async (id, active) => {
              await updateDoc(doc(db, 'rssFeeds', id), { active });
            }}
            onSyncRssFeed={async (feed) => {
              try {
                const res = await fetch('/api/parse-rss', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: feed.url })
                });
                const data = await res.json();
                if (data.feed && data.feed.items) {
                  let added = 0;
                  for (const item of data.feed.items) {
                    const exists = articles.some(a => a.title === item.title);
                    if (!exists) {
                      await addDoc(collection(db, 'articles'), {
                        title: item.title || 'Senza Titolo',
                        category: feed.category,
                        content: item.contentSnippet || item.content || item.description || '',
                        createdAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
                        author: item.creator || item.author || 'Admin',
                        imageUrl: item.extractedImageUrl || '',
                        tags: Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : [])
                      });
                      added++;
                    }
                  }
                  await updateDoc(doc(db, 'rssFeeds', feed.id), { lastFetched: Date.now() });
                  alert(`Sincronizzazione completata: ${added} nuovi articoli importati.`);
                } else {
                  alert('Errore: formato del feed RSS non valido o vuoto.');
                }
              } catch (e) {
                console.error("RSS Sync Error", e);
                alert("Errore durante la sincronizzazione del feed RSS.");
              }
            }}
          />
        )}
        {currentView === 'edit' && editingArticle && (
          <CreatePost
            categories={allCategoriesNames}
            initialArticle={editingArticle}
            onSave={handleUpdateArticle}
            onCancel={() => {
              setEditingArticle(null);
              setCurrentView('admin');
            }}
          />
        )}
      </main>
    </div>
  );
}
