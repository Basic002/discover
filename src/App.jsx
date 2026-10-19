import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import api from './api';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import AdminEventForm from './pages/AdminEventForm';
import NotFound from './pages/NotFound';

function App() {
  // 1. États pour gérer l'utilisateur et le temps de chargement initial
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Vérification de la session au lancement ou au rafraîchissement (F5)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/users/profile');

        if (response.data.success) {
          setUser(response.data.user || response.data.data);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          try { localStorage.removeItem('musical_app_token'); } catch (e) {}
        }
        console.log("Aucune session active. Utilisateur non connecté.");
      } finally {
        setLoading(false); // On arrête le chargement quoi qu'il arrive
      }
    };

    checkSession();
  }, []);

  // 3. Écran d'attente pendant que React interroge le serveur
  if (loading) {
    return (
      <div className="min-h-screen bg-night-bg flex flex-col items-center justify-center font-title text-center p-6 selection:bg-rose-950 selection:text-rose-200">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border border-rose-900/40 flex items-center justify-center animate-spin [animation-duration:3s]">
            <span className="text-rose-500 text-xl">✦</span>
          </div>
          <div className="absolute inset-0 rounded-full blur-xl bg-rose-600/10 pointer-events-none"></div>
        </div>
        <h1 className="text-2xl font-bold tracking-[0.25em] uppercase mb-2 inline-flex items-baseline">
          <span className="text-zinc-100 font-title">DISC</span>
          <span className="text-rose-600 font-title">OVER</span>
          <span className="text-rose-500 text-sm ml-1 select-none">✦</span>
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-body">
          Chargement de l'application...
        </p>
      </div>
    );
  }

  // Détection automatique du chemin de base (GitHub Pages ou racine)
  const basename = window.location.pathname.startsWith('/musical-app-frontend')
    ? '/musical-app-frontend'
    : '';

  // 4. Rendu de l'application
  return (
    <BrowserRouter basename={basename}>
      <main className="min-h-screen bg-night-bg text-white">
        <Routes>
          {/* Home a besoin de savoir si on est connecté pour la Navbar */}
          <Route path="/" element={<Home user={user} setUser={setUser} />} />
          
          {/* Login a besoin de setUser pour enregistrer l'utilisateur dans l'état après la connexion */}
          <Route path="/login" element={<Login setUser={setUser} />} />
          
          {/* Register avec connexion automatique ou redirection fluide */}
          <Route path="/register" element={<Register setUser={setUser} />} />
          
          {/* Favorites aura besoin de l'id de l'utilisateur pour requêter ses favoris */}
          <Route path="/favorites" element={<Favorites user={user} setUser={setUser} />} />
          
          {/* Profile a besoin d'afficher les infos (user) et de les mettre à jour/déconnecter (setUser) */}
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          
          {/* Les pages admin auront besoin de vérifier que l'utilisateur a le rôle "admin" */}
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/admin/event" element={<AdminEventForm user={user} />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;