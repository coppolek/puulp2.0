import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Article, ReadingProgress } from '../types';
import { Book, CheckCircle, Hash, ChevronLeft, User as UserIcon, Target, Edit2, Save, X } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface UserProfileProps {
  user: User;
  articles: Article[];
  progressMap: Record<string, ReadingProgress>;
  favorites: Set<string>;
  onBack: () => void;
}

interface ReadingGoal {
  type: 'daily' | 'weekly';
  count: number;
}

export default function UserProfile({ user, articles, progressMap, favorites, onBack }: UserProfileProps) {
  const [goal, setGoal] = useState<ReadingGoal>({ type: 'weekly', count: 3 });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalType, setTempGoalType] = useState<'daily' | 'weekly'>('weekly');
  const [tempGoalCount, setTempGoalCount] = useState(3);
  const [loadingGoal, setLoadingGoal] = useState(true);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const goalRef = doc(db, `users/${user.uid}/profile/readingGoal`);
        const goalSnap = await getDoc(goalRef);
        if (goalSnap.exists()) {
          setGoal(goalSnap.data() as ReadingGoal);
          setTempGoalType(goalSnap.data().type);
          setTempGoalCount(goalSnap.data().count);
        }
      } catch (error) {
        console.error("Error fetching reading goal", error);
      } finally {
        setLoadingGoal(false);
      }
    };
    fetchGoal();
  }, [user.uid]);

  const saveGoal = async () => {
    try {
      const newGoal: ReadingGoal = { type: tempGoalType, count: tempGoalCount };
      const goalRef = doc(db, `users/${user.uid}/profile/readingGoal`);
      await setDoc(goalRef, newGoal);
      setGoal(newGoal);
      setIsEditingGoal(false);
    } catch (error) {
      console.error("Error saving reading goal", error);
    }
  };

  const articlesStarted = Object.values(progressMap).filter(p => p.currentChunk > 1 || p.currentChunk === p.totalChunks);
  const articlesFinished = Object.values(progressMap).filter(p => p.currentChunk === p.totalChunks);
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const currentDayOfWeek = now.getDay();
  const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday).getTime();

  let completedForGoal = 0;
  if (goal.type === 'daily') {
    completedForGoal = articlesFinished.filter(p => p.lastReadAt >= startOfDay).length;
  } else {
    completedForGoal = articlesFinished.filter(p => p.lastReadAt >= startOfWeek).length;
  }

  const goalProgressPercentage = Math.min(100, Math.round((completedForGoal / goal.count) * 100));

  // Calculate total words read
  let totalWordsRead = 0;
  Object.values(progressMap).forEach(progress => {
    const article = articles.find(a => a.id === progress.articleId);
    if (article) {
      const chunks = article.content.split(/\n\n+/).filter(c => c.trim() !== '');
      for (let i = 0; i < progress.currentChunk && i < chunks.length; i++) {
        totalWordsRead += chunks[i].split(/\s+/).filter(w => w.length > 0).length;
      }
    }
  });

  // Calculate favorite categories based on reading progress and favorites
  const categoryCounts: Record<string, number> = {};
  
  // Give points for reading progress
  Object.values(progressMap).forEach(progress => {
    const article = articles.find(a => a.id === progress.articleId);
    if (article) {
      const points = progress.currentChunk === progress.totalChunks ? 2 : 1;
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + points;
    }
  });

  // Give points for favorites
  Array.from(favorites).forEach(articleId => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 3;
    }
  });

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 mb-10"
      >
        <ChevronLeft className="w-5 h-5" />
        Torna alla Home
      </button>

      <div className="bg-white rounded-[40px] p-8 sm:p-12 border-4 border-black shadow-2xl relative overflow-hidden mb-12">
        <div className="flex flex-col sm:flex-row items-center gap-8 text-black relative z-10">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-32 h-32 rounded-full border-4 border-black" />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-black flex items-center justify-center">
              <UserIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-black mb-2 font-serif italic">{user.displayName || 'Utente'}</h1>
            <p className="text-gray-500 font-bold tracking-widest uppercase">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 text-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#FF6321] text-white rounded-full border-4 border-black flex items-center justify-center shrink-0">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest">Obiettivo di Lettura</h2>
              <p className="text-gray-500 font-bold">Completa {goal.count} articoli {goal.type === 'daily' ? 'al giorno' : 'alla settimana'}</p>
            </div>
          </div>
          
          {!isEditingGoal ? (
            <button 
              onClick={() => {
                setTempGoalType(goal.type);
                setTempGoalCount(goal.count);
                setIsEditingGoal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full font-black text-sm uppercase tracking-widest hover:bg-black hover:text-[#00FF00] transition-colors border-2 border-transparent hover:border-black"
            >
              <Edit2 className="w-4 h-4" />
              Modifica
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-full border-2 border-black">
              <select 
                value={tempGoalType} 
                onChange={e => setTempGoalType(e.target.value as 'daily' | 'weekly')}
                className="bg-white border-2 border-black rounded-full px-3 py-1 font-bold text-sm outline-none"
              >
                <option value="daily">Giornaliero</option>
                <option value="weekly">Settimanale</option>
              </select>
              <input 
                type="number" 
                min="1" 
                max="50"
                value={tempGoalCount}
                onChange={e => setTempGoalCount(parseInt(e.target.value) || 1)}
                className="w-16 bg-white border-2 border-black rounded-full px-3 py-1 font-bold text-sm outline-none text-center"
              />
              <button onClick={saveGoal} className="p-2 bg-[#00FF00] rounded-full border-2 border-black hover:bg-black hover:text-[#00FF00] transition-colors">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setIsEditingGoal(false)} className="p-2 bg-red-500 text-white rounded-full border-2 border-black hover:bg-black transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative pt-4">
          <div className="flex justify-between items-end mb-2">
            <span className="font-black text-4xl">{completedForGoal} <span className="text-xl text-gray-400">/ {goal.count}</span></span>
            <span className="font-black text-[#FF6321]">{goalProgressPercentage}%</span>
          </div>
          <div className="h-6 w-full bg-gray-100 rounded-full border-2 border-black overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-[#00FF00] border-r-2 border-black transition-all duration-1000 ease-out"
              style={{ width: `${goalProgressPercentage}%` }}
            ></div>
          </div>
          {goalProgressPercentage >= 100 && (
            <p className="mt-4 font-bold text-[#00FF00] uppercase tracking-widest flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Obiettivo raggiunto! Ottimo lavoro.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-[24px] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
          <div className="w-12 h-12 bg-[#00FF00] rounded-full border-2 border-black flex items-center justify-center mb-6">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Articoli Finiti</h3>
          <p className="text-5xl font-black">{articlesFinished.length}</p>
          <p className="text-sm font-bold text-gray-400 mt-2">su {articlesStarted.length} iniziati</p>
        </div>

        <div className="bg-white rounded-[24px] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
          <div className="w-12 h-12 bg-[#FF6321] text-white rounded-full border-2 border-black flex items-center justify-center mb-6">
            <Book className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Parole Lette</h3>
          <p className="text-5xl font-black">{totalWordsRead.toLocaleString('it-IT')}</p>
          <p className="text-sm font-bold text-gray-400 mt-2">stima approssimativa</p>
        </div>

        <div className="bg-white rounded-[24px] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black lg:col-span-1 md:col-span-2">
          <div className="w-12 h-12 bg-black text-white rounded-full border-2 border-black flex items-center justify-center mb-6">
            <Hash className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Categorie Preferite</h3>
          {topCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topCategories.map(cat => (
                <span key={cat} className="px-4 py-2 bg-gray-100 text-black border-2 border-black rounded-full font-black text-sm uppercase tracking-widest">
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 font-bold italic text-sm">Non hai ancora letto abbastanza articoli per definire le categorie preferite.</p>
          )}
        </div>
      </div>
    </div>
  );
}
