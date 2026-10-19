import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import L from 'leaflet';

// Composant MarkerClusterGroup pour des performances 60 FPS fluides avec +2000 concerts
const MarkerClusterGroup = ({ events, onSelectEvent }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 20,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="goth-cluster-badge"><span>${count}</span></div>`,
          className: 'custom-goth-cluster',
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });
      }
    });

    const markers = [];
    events.forEach((event) => {
      const venue = event._embedded?.venues?.[0];
      const lat = Number(event.latitude) || parseFloat(venue?.location?.latitude);
      const lng = Number(event.longitude) || parseFloat(venue?.location?.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const marker = L.marker([lat, lng], { icon: customGothMarker });
        marker.on('click', () => onSelectEvent(event));
        const cityLabel = event.city || venue?.city?.name || "France";
        marker.bindTooltip(
          `<div style="font-weight:600;color:#f4f4f5;">${event.name}</div><div style="font-size:10px;color:#fda4af;margin-top:2px;">📍 ${cityLabel} • ${event.date || ''}</div>`, 
          { direction: 'top', className: 'goth-map-tooltip', offset: [0, -28] }
        );
        markers.push(marker);
      }
    });

    clusterGroup.addLayers(markers);
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, events, onSelectEvent]);

  return null;
};

// Composant utilitaire pour forcer Leaflet à recalculer sa taille et verrouiller le zoom
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // 1. Verrouillage strict du minZoom à 4 et du maxZoom à 16
    map.setMinZoom(4);
    map.setMaxZoom(16);
    map.options.minZoom = 4;
    map.options.maxZoom = 16;
    
    // 2. Si le zoom actuel est trop éloigné (< 4), on recadre immédiatement
    if (map.getZoom() < 4) {
      map.setZoom(5);
    }
    
    // 3. Verrouillage des limites du globe pour empêcher la carte de flotter dans le vide
    const worldBounds = L.latLngBounds(L.latLng(-75, -180), L.latLng(82, 180));
    map.setMaxBounds(worldBounds);
    map.options.maxBounds = worldBounds;
    map.options.maxBoundsViscosity = 1.0;

    // 4. Invalidation de taille pour garantir que les tuiles occupent 100% du conteneur
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const t3 = setTimeout(() => map.invalidateSize(), 1000);
    const onResize = () => {
      map.invalidateSize();
      if (map.getZoom() < 4) map.setZoom(4);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
};

// Bouton pour recentrer rapidement la carte sur la scène principale
const ResetViewButton = () => {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', margin: '14px' }}>
      <button 
        onClick={() => map.flyTo([48.8566, 2.3522], 5, { duration: 0.8 })}
        className="bg-[#121215]/90 hover:bg-rose-950/90 text-zinc-300 hover:text-rose-100 border border-zinc-700/80 hover:border-rose-700 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-widest backdrop-blur-md shadow-xl transition-all flex items-center gap-1.5 cursor-pointer"
        title="Recentrer la carte"
      >
        <span className="text-rose-500">✦</span> Recentrer
      </button>
    </div>
  );
};

// Contrôleur pour centrer dynamiquement la carte
const MapController = ({ focusCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (focusCoords && focusCoords.lat && focusCoords.lng) {
      map.flyTo([focusCoords.lat, focusCoords.lng], focusCoords.zoom || 13, { duration: 1.0 });
    }
  }, [focusCoords, map]);
  return null;
};

// Villes populaires en France pour sélection rapide
const POPULAR_CITIES = [
  { name: "Toute la France", coords: [46.603354, 1.888334], zoom: 5 },
  { name: "Paris", coords: [48.8566, 2.3522], zoom: 11 },
  { name: "Metz", coords: [49.1193, 6.1757], zoom: 12 },
  { name: "Nancy", coords: [48.6921, 6.1844], zoom: 12 },
  { name: "Lyon", coords: [45.7640, 4.8357], zoom: 11 },
  { name: "Marseille", coords: [43.2965, 5.3698], zoom: 11 },
  { name: "Strasbourg", coords: [48.5734, 7.7521], zoom: 11 },
  { name: "Lille", coords: [50.6292, 3.0573], zoom: 11 },
  { name: "Bordeaux", coords: [44.8378, -0.5792], zoom: 11 },
  { name: "Nantes", coords: [47.2184, -1.5536], zoom: 11 },
  { name: "Toulouse", coords: [43.6047, 1.4442], zoom: 11 }
];

// Générateur de lien d'ajout à Google Calendar
const getGoogleCalendarUrl = (event) => {
  if (!event) return "#";
  const title = encodeURIComponent(event.name || "Concert Live");
  const venue = event.venue || event._embedded?.venues?.[0]?.name || "";
  const city = event.city || event._embedded?.venues?.[0]?.city?.name || "";
  const location = encodeURIComponent([venue, city, "France"].filter(Boolean).join(", "));
  const details = encodeURIComponent(
    `Concert : ${event.name}\nLieu : ${venue} (${city})\n` +
    (event.url ? `Billetterie : ${event.url}\n` : "") +
    (event.description ? `\n${event.description}` : "")
  );

  let dateStart = "";
  let dateEnd = "";
  if (event.date && event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const rawDate = event.date.replace(/-/g, "");
    const timeClean = (event.time || "20:00").replace(/:/g, "").slice(0, 4);
    dateStart = `${rawDate}T${timeClean}00Z`;
    dateEnd = `${rawDate}T235900Z`;
  } else {
    const now = new Date().toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15) + "Z";
    dateStart = now;
    dateEnd = now;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStart}/${dateEnd}&details=${details}&location=${location}`;
};

// Pin de carte moderne sur mesure
const customGothMarker = L.divIcon({
  className: 'custom-goth-pin',
  html: `
    <div style="position: relative; width: 28px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <svg width="28" height="34" viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.85)) drop-shadow(0 0 6px rgba(225, 29, 72, 0.85));">
        <path d="M15 0C6.716 0 0 6.716 0 15C0 26 15 36 15 36C15 36 30 26 30 15C30 6.716 23.284 0 15 0Z" fill="#09090b" stroke="#e11d48" stroke-width="2"/>
        <circle cx="15" cy="14" r="5" fill="#be123c"/>
        <circle cx="15" cy="14" r="2.2" fill="#ffffff" opacity="0.85"/>
      </svg>
    </div>
  `,
  iconSize: [28, 34],
  iconAnchor: [14, 34],
  popupAnchor: [0, -32]
});

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("Toute la France");
  const [sortBy, setSortBy] = useState("date-asc");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'events', 'map'
  const [mapFocusCoords, setMapFocusCoords] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 12;

  // États responsive mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Système de toast de feedback moderne
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        if (response.data.success) {
          const todayStr = new Date().toISOString().split('T')[0];
          const rawEvents = response.data.events || [];
          const eventsList = rawEvents.filter(e => {
            if (!e.date || e.date === "Date TBD" || e.date === "À venir") return true;
            return e.date >= todayStr;
          });
          setEvents(eventsList);

          // Nettoyage automatique des favoris orphelins (qui n'existent plus)
          if (user?.favorites?.length > 0 && eventsList.length > 0) {
            const validIds = new Set(eventsList.map(e => String(e.id)));
            const activeFavorites = user.favorites.filter(id => validIds.has(String(id)));
            if (activeFavorites.length !== user.favorites.length) {
              try {
                const syncRes = await api.post('/users/favorites/sync', {
                  activeEventIds: eventsList.map(e => String(e.id))
                });
                if (syncRes.data.success && setUser) {
                  setUser({ ...user, favorites: activeFavorites });
                }
              } catch (syncErr) {
                console.warn("Synchronisation favoris :", syncErr);
              }
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des événements :", error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const handleLogout = async () => {
    const isConfirmed = window.confirm("Souhaitez-vous vous déconnecter ?");
    if (isConfirmed) {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
      } finally {
        try { localStorage.removeItem('musical_app_token'); } catch (e) {}
        setUser(null); 
        navigate('/'); 
      }
    }
  };

  const toggleFavorite = async (eventId) => {
    if (!user) {
      showToast("Connectez-vous pour ajouter un concert à vos favoris.", "error");
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    
    try {
      const response = await api.post('/users/favorites', { eventId });

      if (response.data.success) {
        const currentFavorites = user.favorites || [];
        const eventIdStr = String(eventId);
        const isAlreadyFavorite = currentFavorites.some(id => String(id) === eventIdStr);
        
        const updatedFavorites = isAlreadyFavorite
          ? currentFavorites.filter(id => String(id) !== eventIdStr)
          : [...currentFavorites, eventIdStr];

        setUser({ ...user, favorites: updatedFavorites });
        showToast(
          isAlreadyFavorite 
            ? "Concert retiré de vos favoris." 
            : "🖤 Concert enregistré dans vos favoris !",
          isAlreadyFavorite ? "info" : "success"
        );
      } else {
        showToast(response.data.message || "Erreur lors de la mise à jour des favoris.", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion au serveur.", "error");
    }
  };

  // Centrer et visualiser un concert sur la carte
  const handleViewOnMap = (event) => {
    const venue = event._embedded?.venues?.[0];
    const lat = Number(event.latitude) || parseFloat(venue?.location?.latitude);
    const lng = Number(event.longitude) || parseFloat(venue?.location?.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapFocusCoords({ lat, lng, zoom: 14 });
      if (activeTab === 'events') {
        setActiveTab('all');
      }
      window.scrollTo({ top: 100, behavior: 'smooth' });
      setSelectedEvent(event);
      showToast(`Positionné sur ${event.name}`, "info");
    }
  };

  // Filtrage multi-critères (Recherche texte + Ville + Tri intelligent)
  const filteredEvents = events.filter((event) => {
    // Filtre de ville
    if (selectedCity && selectedCity !== "Toute la France") {
      const cityName = (event.city || event._embedded?.venues?.[0]?.city?.name || "").toLowerCase();
      if (!cityName.includes(selectedCity.toLowerCase())) return false;
    }
    // Filtre textuel
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const eventName = (event.name || event.title || "").toLowerCase();
    const venueName = (event.venue || event._embedded?.venues?.[0]?.name || "").toLowerCase();
    const cityName = (event.city || event._embedded?.venues?.[0]?.city?.name || "").toLowerCase();
    const dateStr = (event.date || "").toLowerCase();
    return eventName.includes(term) || venueName.includes(term) || cityName.includes(term) || dateStr.includes(term);
  }).sort((a, b) => {
    if (sortBy === "date-asc") {
      const da = a.date || "9999-99-99";
      const db = b.date || "9999-99-99";
      return da.localeCompare(db);
    }
    if (sortBy === "date-desc") {
      const da = a.date || "0000-00-00";
      const db = b.date || "0000-00-00";
      return db.localeCompare(da);
    }
    if (sortBy === "name-asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "name-desc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    if (sortBy === "city-asc") {
      const ca = a.city || a._embedded?.venues?.[0]?.city?.name || "";
      const cb = b.city || b._embedded?.venues?.[0]?.city?.name || "";
      return ca.localeCompare(cb);
    }
    return 0;
  });

  // Calculs de pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / eventsPerPage));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  // Réinitialiser la page à 1 lors d'une nouvelle recherche ou changement d'onglet
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCity, sortBy, activeTab]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getPaginationNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const centerFrance = [46.603354, 1.888334];

  return (
    <div className="h-screen w-full flex flex-col bg-night-bg font-body text-zinc-100 overflow-hidden selection:bg-rose-950 selection:text-rose-200">
      {/* HEADER ÉMO GOTHIQUE & RESPONSIVE */}
      <header className="border-b border-zinc-900 bg-night-bg/95 backdrop-blur-md relative z-30 shrink-0">
        <div className="h-16 sm:h-20 flex items-center justify-between px-3.5 sm:px-8 max-w-7xl mx-auto w-full">
          {/* LOGO */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="text-xl sm:text-2xl font-title font-bold tracking-[0.2em] sm:tracking-[0.22em] uppercase hover:opacity-90 transition-opacity flex items-baseline">
              <span className="text-zinc-100 font-title">DISC</span>
              <span className="text-rose-600 font-title">OVER</span>
              <span className="text-rose-500 text-xs ml-1 select-none">✦</span>
            </Link>
          </div>

          {/* BARRE DE RECHERCHE EN DIRECT (TOUJOURS VISIBLE, AUCUN BOUTON REQUIS) */}
          <div className="flex-1 max-w-lg mx-2 sm:mx-8">
            <div className="relative w-full">
              <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs select-none">
                ✦
              </span>
              <input 
                type="text" 
                placeholder="Rechercher groupe, salle, ville..." 
                className="w-full bg-[#121215] text-zinc-100 border border-zinc-800 rounded-full pl-7 sm:pl-9 pr-7 sm:pr-10 py-1.5 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all placeholder-zinc-500 font-body"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs p-1 cursor-pointer"
                  title="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* BOUTON MENU BURGER (MOBILE) */}
          <div className="flex items-center md:hidden flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center w-9 h-9 cursor-pointer ${
                mobileMenuOpen 
                  ? "bg-rose-950/70 border-rose-700 text-rose-200" 
                  : "bg-[#121215] border-zinc-800 text-zinc-300 hover:text-rose-300"
              }`}
              title="Menu de navigation"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <span className="text-sm font-bold">✕</span>
              ) : (
                <span className="text-sm leading-none">☰</span>
              )}
            </button>
          </div>

          {/* NAVIGATION UTILISATEUR DESKTOP */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5 flex-shrink-0">
            <button 
              onClick={() => {
                setActiveTab("events");
                setTimeout(() => {
                  document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === "events" ? "text-rose-400 font-semibold" : "text-zinc-400 hover:text-rose-300"
              }`}
            >
              <span className="text-rose-500">✦</span> Événements ({filteredEvents.length})
            </button>

            {user ? (
              <>
                <Link to="/favorites" className="text-zinc-400 hover:text-rose-300 text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors whitespace-nowrap flex items-center gap-1">
                  <span>🖤</span> Favoris ({user.favorites?.length || 0})
                </Link>
                <Link to="/profile" className="text-zinc-400 hover:text-rose-300 text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors whitespace-nowrap flex items-center gap-1.5">
                  {user.avatar && user.avatar.length <= 4 ? (
                    <span className="text-sm select-none">{user.avatar}</span>
                  ) : user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("data:")) ? (
                    <img src={user.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-rose-800" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-rose-950 text-[10px] flex items-center justify-center font-bold text-rose-300 border border-rose-800 select-none">
                      {user.name ? user.name.charAt(0).toUpperCase() : "✦"}
                    </span>
                  )}
                  <span>Profil</span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="bg-transparent hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/80 text-zinc-400 hover:text-rose-300 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-zinc-400 hover:text-zinc-100 text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors whitespace-nowrap">
                  Connexion
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/60 hover:border-rose-600 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(190,18,60,0.25)] hover:shadow-[0_0_22px_rgba(225,29,72,0.45)] whitespace-nowrap"
                >
                  Rejoindre
                </Link>
              </>
            )}
          </div>
        </div>

        {/* MENU DÉROULANT BURGER SUR MOBILE (TOUS LES MENUS VISIBLES SANS AUCUN DÉFILEMENT) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 top-16 sm:top-20">
            {/* Backdrop sombre */}
            <div 
              className="fixed inset-0 bg-black/75 backdrop-blur-sm top-16 sm:top-20 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu compact sans défilement */}
            <div className="relative bg-[#0e0e12]/98 border-b border-zinc-800/90 shadow-[0_25px_50px_rgba(0,0,0,0.95)] px-4 py-3.5 z-10 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profil ou Connexion compact */}
              {user ? (
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {user.avatar && user.avatar.length <= 4 ? (
                      <span className="text-xl select-none">{user.avatar}</span>
                    ) : user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("data:")) ? (
                      <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-rose-800 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rose-950 text-rose-300 flex items-center justify-center font-title font-bold text-xs border border-rose-800 shrink-0 select-none">
                        {user.name ? user.name.charAt(0).toUpperCase() : "✦"}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-100 truncate leading-tight">{user.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate font-mono leading-tight">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-full shrink-0">
                    Connecté
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-zinc-800/80">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center rounded-xl bg-[#18181d] border border-zinc-800 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center rounded-xl bg-gradient-to-r from-rose-950 to-rose-900 border border-rose-800/80 text-xs font-mono font-bold uppercase tracking-wider text-rose-100 shadow-[0_0_12px_rgba(190,18,60,0.3)] transition-all"
                  >
                    Rejoindre ✦
                  </Link>
                </div>
              )}

              {/* Grille de navigation : TOUS les menus sont visibles d'un coup */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs uppercase tracking-wider">
                <button
                  onClick={() => {
                    setActiveTab("events");
                    setMobileMenuOpen(false);
                    setTimeout(() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#141418] hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate"><span>🎸</span> Concerts</span>
                  <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded-md border border-rose-900/60 font-mono shrink-0">
                    {filteredEvents.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("map");
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#141418] hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>🗺️</span> Carte
                </button>

                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-[#141418] hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-200 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2 truncate"><span>🖤</span> Favoris</span>
                  <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded-md border border-rose-900/60 font-mono shrink-0">
                    {user?.favorites?.length || 0}
                  </span>
                </Link>

                {user ? (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl bg-[#141418] hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-200 flex items-center gap-2 transition-colors"
                  >
                    <span>👤</span> Profil
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab("all");
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#141418] hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>✦</span> Vue Tout
                  </button>
                )}

                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="col-span-2 py-2 px-3 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/60 text-amber-300 flex items-center gap-2 transition-colors"
                  >
                    <span>⚙️</span> Panneau d'administration
                  </Link>
                )}

                {user && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="col-span-2 py-2 px-3 rounded-xl border border-zinc-800 hover:border-rose-900/80 text-rose-400 hover:bg-rose-950/30 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>🚪</span> Se Déconnecter
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ZONE PRINCIPALE SCROLLABLE */}
      <main className="flex-1 overflow-y-auto bg-night-bg p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">

        {/* SÉLECTEUR D'ONGLETS SOBRE & RESPONSIVE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-3 gap-2.5 sm:gap-3">
          <div className="w-full sm:w-auto grid grid-cols-3 p-1 bg-[#121215] border border-zinc-800/80 rounded-xl sm:flex sm:bg-transparent sm:border-0 sm:p-0 gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeTab === 'all'
                  ? 'bg-rose-950/80 border-rose-800 text-rose-200 shadow-[0_0_15px_rgba(190,18,60,0.3)] font-semibold'
                  : 'border-transparent sm:border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span>✦</span> <span className="hidden sm:inline">Carte & Concerts</span><span className="sm:hidden font-medium">Tout</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('events');
                setTimeout(() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className={`py-2 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeTab === 'events'
                  ? 'bg-rose-950/80 border-rose-800 text-rose-200 shadow-[0_0_15px_rgba(190,18,60,0.3)] font-semibold'
                  : 'border-transparent sm:border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span>🎸</span> <span className="hidden sm:inline">Concerts ({filteredEvents.length})</span><span className="sm:hidden font-medium">Concerts</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`py-2 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeTab === 'map'
                  ? 'bg-rose-950/80 border-rose-800 text-rose-200 shadow-[0_0_15px_rgba(190,18,60,0.3)] font-semibold'
                  : 'border-transparent sm:border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span>🗺️</span> <span className="hidden sm:inline">Carte Seule</span><span className="sm:hidden font-medium">Carte</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] sm:text-xs text-zinc-400">
                <span className="text-zinc-200 font-semibold">{filteredEvents.length}</span> concerts
              </span>
            </div>
            {selectedCity !== "Toute la France" && (
              <span className="text-[10px] bg-rose-950/50 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-full font-mono">
                📍 {selectedCity}
              </span>
            )}
          </div>
        </div>

        {/* BARRE DE SÉLECTION RAPIDE DES VILLES */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar py-1 touch-pan-x -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          {POPULAR_CITIES.map((city) => {
            const isSelected = selectedCity === city.name;
            return (
              <button
                key={city.name}
                onClick={() => {
                  setSelectedCity(city.name);
                  if (city.coords) {
                    setMapFocusCoords({ lat: city.coords[0], lng: city.coords[1], zoom: city.zoom });
                  }
                }}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-rose-950 text-rose-200 border-rose-700 shadow-[0_0_12px_rgba(190,18,60,0.35)] font-semibold scale-105"
                    : "bg-[#121215] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {city.name === "Toute la France" ? "🇫🇷 " : "📍 "}
                {city.name}
              </button>
            );
          })}
        </div>

        {/* CARTE LEAFLET NOCTURNE & ÉLÉGANTE */}
        {activeTab !== 'events' && (
          <div className={`w-full ${activeTab === 'map' ? 'h-[72vh] sm:h-[75vh] min-h-[420px] sm:min-h-[550px]' : 'h-[36vh] sm:h-[50vh] min-h-[260px] sm:min-h-[420px] max-h-[620px]'} shrink-0 bg-[#121215] rounded-2xl border border-zinc-800/80 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.85)] z-10 transition-all duration-300`}>
          <MapContainer 
            key="goth-dark-map-v2"
            center={[48.8566, 2.3522]} 
            zoom={5} 
            minZoom={4}
            maxZoom={16}
            maxBounds={[[-75, -180], [82, 180]]}
            maxBoundsViscosity={1.0}
            worldCopyJump={false}
            scrollWheelZoom={true} 
            zoomControl={true}
            doubleClickZoom={true}
            className="w-full h-full z-0"
            style={{ height: "100%", width: "100%", minHeight: "420px" }}
          >
            <MapResizer />
            <ResetViewButton />
            <MapController focusCoords={mapFocusCoords} />
            {/* 1. Fond de carte sombre Esri Dark Gray Base */}
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              className="goth-dark-tiles"
              noWrap={true}
              bounds={[[-75, -180], [82, 180]]}
              maxZoom={16}
              minZoom={4}
            />
            {/* 2. Toponymes et frontières fines en surcouche */}
            <TileLayer
              url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              className="goth-labels-tiles"
              noWrap={true}
              bounds={[[-75, -180], [82, 180]]}
              maxZoom={16}
              minZoom={4}
            />
            {/* 3. Clusters de concerts haute performance 60 FPS */}
            <MarkerClusterGroup 
              events={filteredEvents} 
              onSelectEvent={setSelectedEvent} 
            />
          </MapContainer>
        </div>
        )}

        {/* LISTE DES CONCERTS EN BAS */}
        {activeTab !== 'map' && (
        <div id="events-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-zinc-800/60 pb-3 gap-3">
            <h2 className="text-xl sm:text-2xl font-title font-bold tracking-[0.18em] uppercase flex items-center gap-2.5 text-zinc-100">
              <span className="text-rose-600 font-serif text-base">✦</span>
              <span>
                {searchTerm 
                  ? `Résultats pour "${searchTerm}"` 
                  : selectedCity !== "Toute la France"
                    ? `Concerts à ${selectedCity}`
                    : "Concerts & Événements"
                }
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Menu de tri */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 hidden sm:inline">
                  Trier :
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#121215] border border-zinc-800 text-zinc-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-800 cursor-pointer"
                >
                  <option value="date-asc">Date (plus proches)</option>
                  <option value="date-desc">Date (plus lointains)</option>
                  <option value="name-asc">Artiste (A-Z)</option>
                  <option value="name-desc">Artiste (Z-A)</option>
                  <option value="city-asc">Ville (A-Z)</option>
                </select>
              </div>

              <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                {filteredEvents.length} {filteredEvents.length > 1 ? "CONCERTS" : "CONCERT"}
              </span>

              {(searchTerm || selectedCity !== "Toute la France") && (
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCity("Toute la France");
                    setMapFocusCoords({ lat: 46.603354, lng: 1.888334, zoom: 5 });
                  }}
                  className="text-xs text-rose-400 hover:underline uppercase tracking-wider font-mono cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {loadingEvents ? (
            <div className="text-center py-16 text-rose-500/80 font-title tracking-widest uppercase animate-pulse text-sm">
              Chargement des concerts en cours...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-body text-sm border border-dashed border-zinc-800/80 rounded-2xl p-8 bg-[#121215]/50">
              <p className="mb-3">Aucun concert ne correspond à votre recherche "{searchTerm}".</p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs font-mono uppercase tracking-widest text-rose-400 hover:text-rose-300 underline"
              >
                Afficher tous les concerts →
              </button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
              {paginatedEvents.map((event) => {
                const isFav = user?.favorites?.some(id => String(id) === String(event.id));
                const venueName = event.venue || event._embedded?.venues?.[0]?.name || "Scène Principale";
                const cityName = event.city || event._embedded?.venues?.[0]?.city?.name || "France";
                const imgUrl = event.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80";

                return (
                  <div 
                    key={event.id} 
                    className="bg-[#121215] rounded-xl overflow-hidden border border-zinc-800/80 hover:border-rose-900/60 hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(190,18,60,0.15)] transition-all duration-300 group flex flex-col relative"
                  >
                    {/* Bouton favori direct */}
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        toggleFavorite(event.id); 
                      }}
                      className="absolute top-3 left-3 z-10 bg-black/75 backdrop-blur-md p-2 rounded-full hover:scale-110 transition-transform border border-zinc-800 text-xs shadow-md"
                      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      {isFav ? '🖤' : '🤍'}
                    </button>

                    {/* Image avec léger voile sombre et zoom */}
                    <div 
                      className="h-48 overflow-hidden relative shrink-0 bg-black cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <img 
                        src={imgUrl} 
                        alt={event.name} 
                        className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-90 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/30 pointer-events-none"></div>
                      <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-zinc-300 border border-zinc-800/80">
                        {event.date || "Date à venir"}
                      </div>
                    </div>

                    {/* Contenu textuel */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 
                        className="font-title font-semibold text-base text-zinc-100 mb-1 truncate group-hover:text-rose-300 transition-colors tracking-wide cursor-pointer" 
                        title={event.name}
                        onClick={() => setSelectedEvent(event)}
                      >
                        {event.name}
                      </h3>
                      <p className="text-zinc-400 text-xs flex items-center gap-1.5 mb-auto font-body">
                        <span className="text-rose-500">📍</span> {venueName} • {cityName}
                      </p>
                      
                      <div className="mt-4 grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2">
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="py-2.5 sm:py-2 px-1 sm:px-3 bg-[#18181d] hover:bg-rose-950/80 text-zinc-300 hover:text-rose-100 border border-zinc-800 hover:border-rose-800/60 rounded-lg text-[11px] sm:text-xs font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center text-center"
                        >
                          Détails
                        </button>
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 sm:py-2 px-1 sm:px-3 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-200 border border-rose-800/60 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 hover:shadow-[0_0_12px_rgba(190,18,60,0.35)] whitespace-nowrap text-center"
                          title="Accéder directement à la billetterie officielle"
                        >
                          Billets ↗
                        </a>
                        <button 
                          onClick={() => handleViewOnMap(event)}
                          className="py-2.5 sm:py-2 px-1 sm:px-2.5 bg-[#18181d] hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-200 rounded-lg text-[11px] sm:text-xs font-mono transition-colors cursor-pointer flex items-center justify-center gap-1 text-center"
                          title="Voir la salle sur la carte"
                        >
                          📍 Carte
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONTRÔLES DE PAGINATION GOTHIQUE & RESPONSIVE */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-6 sm:pb-12 border-t border-zinc-800/80">
                <p className="text-xs font-mono text-zinc-400 text-center sm:text-left">
                  Affichage <span className="text-rose-400 font-semibold">{(currentPage - 1) * eventsPerPage + 1}</span> à <span className="text-rose-400 font-semibold">{Math.min(currentPage * eventsPerPage, filteredEvents.length)}</span> sur <span className="text-zinc-200 font-semibold">{filteredEvents.length}</span> • <span className="text-zinc-500">Page {currentPage} / {totalPages}</span>
                </p>

                {/* Mobile : Pagination compacte sans dépassement d'écran */}
                <div className="flex sm:hidden items-center justify-between w-full gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed bg-[#121215] text-zinc-300 active:scale-95 text-center"
                  >
                    ← Préc.
                  </button>
                  <span className="px-3.5 py-2.5 rounded-xl text-xs font-mono bg-rose-950/60 border border-rose-900/60 text-rose-200 font-bold whitespace-nowrap">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed bg-[#121215] text-zinc-300 active:scale-95 text-center"
                  >
                    Suiv. →
                  </button>
                </div>

                {/* Desktop & Tablettes : Numéros de page complets */}
                <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5">
                  {/* Précédent */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed bg-[#121215] text-zinc-300 hover:text-rose-200 hover:border-rose-900 cursor-pointer"
                  >
                    ← Préc.
                  </button>

                  {/* Numéros de page */}
                  {getPaginationNumbers().map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-zinc-600 font-mono text-xs select-none">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`min-w-9 h-9 px-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center justify-center cursor-pointer border ${
                          currentPage === p
                            ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 text-rose-100 border-rose-700 shadow-[0_0_15px_rgba(190,18,60,0.4)] font-bold scale-105'
                            : 'bg-[#121215] border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ))}

                  {/* Suivant */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed bg-[#121215] text-zinc-300 hover:text-rose-200 hover:border-rose-900 cursor-pointer"
                  >
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
        )}
        
      </main>

      {/* MODALE FLOTTANTE DE DÉTAILS DU CONCERT (BOTTOM SHEET SUR MOBILE) */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-[#121215] w-full sm:max-w-xl max-h-[88vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-zinc-800/80 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(190,18,60,0.25)] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Poignée tactile de fermeture sur mobile */}
            <div className="w-12 h-1 bg-zinc-700/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0"></div>

            {/* Header avec Image */}
            <div className="h-44 sm:h-52 overflow-hidden relative shrink-0">
              <img 
                src={selectedEvent.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"} 
                alt={selectedEvent.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-black/40 to-transparent"></div>
              
              {/* Bouton Fermer */}
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/70 hover:bg-rose-950 text-zinc-300 hover:text-rose-200 w-8 h-8 rounded-full border border-zinc-800 transition-colors z-20 flex items-center justify-center text-sm font-bold"
                title="Fermer"
              >
                ✕
              </button>

              <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6">
                <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-rose-400 uppercase bg-black/75 px-2 py-0.5 rounded border border-rose-900/60">
                  {selectedEvent.city || selectedEvent._embedded?.venues?.[0]?.city?.name || "En Tournée"}
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-title font-bold text-zinc-100 uppercase tracking-wide mt-1.5 drop-shadow-md truncate">
                  {selectedEvent.name}
                </h2>
              </div>
            </div>

            {/* Corps de la modale scrollable */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="bg-[#09090b] p-3 rounded-xl border border-zinc-800/80">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">
                    Date & Heure
                  </p>
                  <p className="text-xs font-mono font-semibold text-rose-400 mt-1">
                    {selectedEvent.date || "À déterminer"} • {selectedEvent.time || "20:00"}
                  </p>
                </div>
                <div className="bg-[#09090b] p-3 rounded-xl border border-zinc-800/80">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">
                    Scène / Lieu
                  </p>
                  <p className="text-xs font-medium text-zinc-200 mt-1 truncate">
                    {selectedEvent.venue || selectedEvent._embedded?.venues?.[0]?.name || "Scène principale"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
                  Description du concert
                </h4>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-body">
                  {selectedEvent.description || "Concert officiel en direct."}
                </p>
              </div>

              {/* Boutons d'action adaptés tactile */}
              <div className="space-y-2 pt-2 pb-2">
                <a
                  href={selectedEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 text-center py-3.5 px-4 rounded-xl text-xs sm:text-sm font-title font-bold tracking-[0.2em] uppercase border border-rose-800/80 shadow-[0_0_20px_rgba(190,18,60,0.35)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  Accéder à la Billetterie ↗
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleFavorite(selectedEvent.id)}
                    className={`py-3 px-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                      user?.favorites?.some(id => String(id) === String(selectedEvent.id))
                        ? 'bg-rose-950/70 border-rose-800 text-rose-200 hover:bg-rose-900/80 shadow-[0_0_15px_rgba(190,18,60,0.3)]'
                        : 'bg-[#18181d] border-zinc-800 text-zinc-300 hover:border-rose-800 hover:text-rose-200'
                    }`}
                  >
                    {user?.favorites?.some(id => String(id) === String(selectedEvent.id)) ? (
                      <><span>🖤</span> Retirer favori</>
                    ) : (
                      <><span>🤍</span> Ajouter favori</>
                    )}
                  </button>

                  <a
                    href={getGoogleCalendarUrl(selectedEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 bg-[#18181d] hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-98"
                    title="Ajouter à Google Agenda"
                  >
                    <span>📅</span> Google Agenda
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION FLOTTANTE (AU-DESSUS DE LA DOCK MOBILE) */}
      {toast.show && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 transition-all duration-300 transform translate-y-0 max-w-md mx-auto sm:mx-0">
          <div
            className={`px-4 py-3 rounded-xl border shadow-[0_15px_35px_rgba(0,0,0,0.95)] flex items-center justify-between gap-3 backdrop-blur-md text-xs sm:text-sm font-mono ${
              toast.type === "success"
                ? "bg-[#121215]/95 border-emerald-800/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                : toast.type === "info"
                ? "bg-[#121215]/95 border-rose-800/80 text-rose-200 shadow-[0_0_20px_rgba(225,29,72,0.2)]"
                : "bg-[#121215]/95 border-red-800/80 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>
                {toast.type === "success" ? "✓" : toast.type === "info" ? "✦" : "⚠️"}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="text-zinc-500 hover:text-zinc-200 ml-2 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* BARRE DE NAVIGATION INFÉRIEURE MOBILE (BOTTOM DOCK) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800/80 safe-area-bottom shadow-[0_-10px_25px_rgba(0,0,0,0.85)]">
        <div className="grid grid-cols-4 h-14">
          <button
            onClick={() => {
              setActiveTab(activeTab === 'events' ? 'all' : 'events');
              document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer active:scale-95 ${
              activeTab === 'events' ? 'text-rose-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">🎸</span>
            <span>Concerts</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('map');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer active:scale-95 ${
              activeTab === 'map' ? 'text-rose-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">🗺️</span>
            <span>Carte</span>
          </button>

          <Link
            to="/favorites"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-rose-300 transition-colors relative active:scale-95"
          >
            <span className="text-base relative">
              🖤
              {user?.favorites?.length > 0 && (
                <span className="absolute -top-1 -right-2.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {user.favorites.length}
                </span>
              )}
            </span>
            <span>Favoris</span>
          </Link>

          <Link
            to={user ? "/profile" : "/login"}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors active:scale-95"
          >
            {user?.avatar && user.avatar.length <= 4 ? (
              <span className="text-base">{user.avatar}</span>
            ) : user?.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("data:")) ? (
              <img src={user.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-rose-800" />
            ) : (
              <span className="text-base">👤</span>
            )}
            <span>{user ? "Profil" : "Compte"}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Home;