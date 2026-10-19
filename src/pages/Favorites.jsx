import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

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

const Favorites = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [cleanupNotice, setCleanupNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Récupération des concerts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        if (res.data.success) {
          const todayStr = new Date().toISOString().split('T')[0];
          const rawEvents = res.data.events || [];
          const upcomingEvents = rawEvents.filter(e => {
            if (!e.date || e.date === "Date TBD" || e.date === "À venir") return true;
            return e.date >= todayStr;
          });
          setAllEvents(upcomingEvents);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des événements :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 2. Nettoyage automatique des favoris inaccessibles / qui n'existent plus
  useEffect(() => {
    if (!loading && allEvents.length > 0 && user?.favorites && user.favorites.length > 0) {
      const validIds = new Set(allEvents.map(e => String(e.id)));
      const activeFavorites = user.favorites.filter(id => validIds.has(String(id)));
      const removedCount = user.favorites.length - activeFavorites.length;

      if (removedCount > 0) {
        api.post('/users/favorites/sync', {
          activeEventIds: allEvents.map(e => String(e.id))
        }).then(res => {
          if (res.data.success && setUser) {
            setUser({ ...user, favorites: activeFavorites });
            setCleanupNotice(`${removedCount} événement(s) devenu(s) inaccessible(s) ont été retiré(s) de vos favoris.`);
          }
        }).catch(console.error);
      }
    }
  }, [loading, allEvents, user?.favorites, setUser]);

  // Filtrer les événements valides et identifier les favoris inaccessibles
  const userFavIds = (user?.favorites || []).map(id => String(id));
  const validEventIdSet = new Set(allEvents.map(e => String(e.id)));
  const favoriteEvents = allEvents.filter(evt => userFavIds.includes(String(evt.id)));
  const inaccessibleFavIds = (!loading && allEvents.length > 0)
    ? userFavIds.filter(id => !validEventIdSet.has(String(id)))
    : [];

  // Filtrage par recherche dans les favoris
  const displayedFavorites = favoriteEvents.filter((evt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (evt.name || "").toLowerCase();
    const venue = (evt.venue || evt._embedded?.venues?.[0]?.name || "").toLowerCase();
    const city = (evt.city || evt._embedded?.venues?.[0]?.city?.name || "").toLowerCase();
    return name.includes(q) || venue.includes(q) || city.includes(q);
  });

  // Retirer un favori manuellement
  const removeFavorite = async (eventId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await api.post('/users/favorites', { eventId });
      if (response.data.success) {
        const eventIdStr = String(eventId);
        const updatedFavorites = (user.favorites || []).filter(id => String(id) !== eventIdStr);
        if (setUser) {
          setUser({ ...user, favorites: updatedFavorites });
        }
        if (selectedConcert && String(selectedConcert.id) === eventIdStr) {
          setSelectedConcert(null);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du favori :", error);
    }
  };

  // Purger tous les favoris inaccessibles d'un coup
  const purgeInaccessibleFavorites = async () => {
    if (!user || inaccessibleFavIds.length === 0) return;
    try {
      const activeFavorites = userFavIds.filter(id => validEventIdSet.has(String(id)));
      const res = await api.post('/users/favorites/sync', {
        activeEventIds: allEvents.map(e => String(e.id))
      });
      if (res.data.success && setUser) {
        setUser({ ...user, favorites: activeFavorites });
        setCleanupNotice(`${inaccessibleFavIds.length} concert(s) devenu(s) inaccessible(s) ont été retiré(s) de votre compte.`);
      }
    } catch (err) {
      console.error("Erreur purge favoris :", err);
    }
  };

  // Vider tous les favoris
  const clearAllFavorites = async () => {
    if (!user || !user.favorites?.length) return;
    const confirm = window.confirm("Souhaitez-vous vraiment retirer tous vos concerts favoris ?");
    if (!confirm) return;

    try {
      const res = await api.put("/users/profile", { favorites: [] });
      if (res.data.success && setUser) {
        setUser({ ...user, favorites: [] });
      }
    } catch (err) {
      console.error("Erreur vidage favoris :", err);
    }
  };

  return (
    <div className="min-h-screen bg-night-bg font-body text-zinc-100 pb-24 md:pb-16 selection:bg-rose-950 selection:text-rose-200">
      {/* HEADER AVEC LOGO ALIGNÉ */}
      <header className="h-16 sm:h-20 border-b border-zinc-900 flex items-center justify-between px-4 sm:px-6 md:px-10 bg-night-bg/95 backdrop-blur-md sticky top-0 z-30">
        <Link
          to="/"
          className="text-xl sm:text-2xl font-title font-bold tracking-[0.2em] sm:tracking-[0.22em] uppercase hover:opacity-90 transition-opacity flex items-baseline"
        >
          <span className="text-zinc-100 font-title">DISC</span>
          <span className="text-rose-600 font-title">OVER</span>
          <span className="text-rose-500 text-xs ml-1 select-none">✦</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          <Link
            to="/"
            className="text-zinc-400 hover:text-zinc-100 transition-colors text-xs uppercase tracking-widest font-mono flex items-center gap-1.5"
          >
            <span>🗺️</span> Carte & Concerts
          </Link>
          <Link
            to="/profile"
            className="text-zinc-400 hover:text-rose-300 transition-colors text-xs uppercase tracking-widest font-mono flex items-center gap-1.5"
          >
            <span>👤</span> Mon Profil
          </Link>
        </nav>
        <Link 
          to="/"
          className="sm:hidden text-zinc-400 hover:text-zinc-100 text-xs font-mono uppercase tracking-wider flex items-center gap-1 border border-zinc-800 bg-[#121215] px-2.5 py-1.5 rounded-lg"
        >
          ← Retour
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-3.5 sm:px-4 mt-6 sm:mt-8">
        {/* BANDEAU TITRE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 border-b border-zinc-800/60 pb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-title font-bold text-zinc-100 uppercase tracking-[0.16em] sm:tracking-[0.18em] flex items-center gap-2.5 sm:gap-3">
              <span className="text-rose-600">✦</span> Mes Favoris
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Retrouvez tous les concerts enregistrés sur votre compte.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-zinc-400 font-mono bg-[#121215] px-3 py-1.5 rounded-lg border border-zinc-800">
              {favoriteEvents.length} {favoriteEvents.length > 1 ? "CONCERTS ACTIFS" : "CONCERT ACTIF"}
            </span>
            {inaccessibleFavIds.length > 0 && (
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-amber-400 font-mono bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/60">
                {inaccessibleFavIds.length} INDISPONIBLE{inaccessibleFavIds.length > 1 ? "S" : ""}
              </span>
            )}
            {(favoriteEvents.length > 0 || inaccessibleFavIds.length > 0) && (
              <button
                onClick={clearAllFavorites}
                className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/60 bg-[#121215] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="Supprimer tous les favoris"
              >
                Tout effacer
              </button>
            )}
          </div>
        </div>

        {/* NOTIFICATION DE NETTOYAGE AUTOMATIQUE */}
        {cleanupNotice && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-200 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>✦</span>
              <span>{cleanupNotice}</span>
            </div>
            <button
              onClick={() => setCleanupNotice("")}
              className="text-zinc-400 hover:text-zinc-200 ml-4 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ALERTE CONCERTS INACCESSIBLES */}
        {inaccessibleFavIds.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs sm:text-sm font-body flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-2.5">
              <span className="text-amber-400 text-base select-none">⚠️</span>
              <span>
                <strong>{inaccessibleFavIds.length} événement(s)</strong> dans vos favoris ne sont plus programmés ou ne sont plus accessibles sur l'application.
              </span>
            </div>
            <button
              onClick={purgeInaccessibleFavorites}
              className="px-4 py-2 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/80 rounded-lg font-mono text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-md"
            >
              Retirer les favoris indisponibles ({inaccessibleFavIds.length})
            </button>
          </div>
        )}

        {/* CONTENU */}
        {loading ? (
          <div className="text-center py-20 text-rose-500/80 font-title tracking-widest uppercase animate-pulse text-sm">
            Chargement de vos favoris...
          </div>
        ) : !user ? (
          <div className="py-20 text-center border border-dashed border-zinc-800/80 rounded-2xl p-8 bg-[#121215]/50">
            <p className="text-zinc-400 font-title text-sm tracking-wider uppercase mb-4">
              Veuillez vous connecter pour accéder à vos favoris.
            </p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 px-6 py-2.5 rounded-full text-xs font-title font-bold tracking-widest uppercase border border-rose-800/60 shadow-[0_0_15px_rgba(190,18,60,0.3)] transition-all"
            >
              Se Connecter
            </Link>
          </div>
        ) : favoriteEvents.length === 0 && inaccessibleFavIds.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-800/80 rounded-2xl p-8 bg-[#121215]/50">
            <p className="text-zinc-400 font-title text-sm tracking-wider uppercase mb-3">
              Aucun concert dans vos favoris pour le moment.
            </p>
            <Link
              to="/"
              className="text-rose-400 hover:text-rose-300 hover:underline text-xs tracking-widest uppercase font-mono transition-colors"
            >
              Découvrir les concerts sur la carte →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Barre de recherche dans les favoris */}
            {favoriteEvents.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="relative w-full sm:w-80">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                    ✦
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrer mes favoris (artiste, ville)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121215] text-zinc-200 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-rose-800 transition-all placeholder-zinc-500 font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <span className="text-xs font-mono text-zinc-400">
                    {displayedFavorites.length} résultat{displayedFavorites.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            {displayedFavorites.length === 0 && searchQuery ? (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-[#121215]/40">
                <p className="text-zinc-400 text-xs font-mono mb-2">
                  Aucun favori ne correspond à "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-mono uppercase tracking-wider text-rose-400 hover:underline"
                >
                  Effacer le filtre
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedFavorites.map((event) => {
                  const venue = event._embedded?.venues?.[0];
                  const venueName = event.venue || venue?.name || "Salle Principale";
                  const cityName = event.city || venue?.city?.name || "France";
                  const imgUrl = event.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80";

                  return (
                    <div
                      key={event.id}
                      className="bg-[#121215] rounded-xl overflow-hidden border border-zinc-800/80 hover:border-rose-900/60 hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(190,18,60,0.15)] transition-all duration-300 group flex flex-col relative"
                    >
                      <div className="h-44 overflow-hidden relative border-b border-zinc-800/60 bg-black cursor-pointer" onClick={() => setSelectedConcert(event)}>
                        <img 
                          src={imgUrl} 
                          alt={event.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/30 pointer-events-none"></div>

                        {/* Bouton Retirer rapide */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(event.id);
                          }}
                          className="absolute top-3 right-3 bg-black/75 backdrop-blur-md p-2 rounded-full text-rose-400 hover:text-rose-200 border border-zinc-800 hover:scale-110 transition-transform active:scale-95 shadow-md cursor-pointer"
                          title="Retirer des favoris"
                        >
                          🖤
                        </button>

                        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-zinc-300 text-[11px] font-mono tracking-wider px-3 py-1 rounded-full border border-zinc-800/80 uppercase">
                          {event.date || "Date à venir"}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 
                          className="font-title font-semibold text-lg text-zinc-100 mb-1 group-hover:text-rose-300 transition-colors tracking-wide cursor-pointer truncate"
                          onClick={() => setSelectedConcert(event)}
                          title={event.name}
                        >
                          {event.name}
                        </h3>
                        <p className="text-zinc-400 text-xs mb-5 font-body flex items-center gap-1.5">
                          <span className="text-rose-500">📍</span> {venueName} • {cityName}
                        </p>
                        <div className="mt-auto grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                          <button
                            onClick={() => setSelectedConcert(event)}
                            className="py-2.5 sm:py-2 bg-[#18181d] hover:bg-rose-950/70 border border-zinc-800 hover:border-rose-800/60 text-zinc-300 hover:text-rose-100 rounded-lg text-xs font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer text-center"
                          >
                            Détails
                          </button>
                          <a
                            href={event.url || `https://www.ticketmaster.fr/fr/recherche?keyword=${encodeURIComponent(event.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 sm:py-2 px-3 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-200 border border-rose-800/60 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 hover:shadow-[0_0_12px_rgba(190,18,60,0.35)] whitespace-nowrap text-center"
                            title="Billetterie officielle"
                          >
                            Billets ↗
                          </a>
                          <a
                            href={getGoogleCalendarUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 sm:py-2 px-2.5 bg-[#18181d] hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-1 text-center"
                            title="Ajouter à Google Agenda"
                          >
                            📅 Agenda
                          </a>
                          <button
                            onClick={() => removeFavorite(event.id)}
                            className="py-2.5 sm:py-2 px-3 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-900/70 text-rose-300 rounded-lg text-xs font-mono transition-colors cursor-pointer text-center"
                            title="Retirer des favoris"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SECTION DÉDIÉE AUX FAVORIS DEVENUS INACCESSIBLES */}
            {inaccessibleFavIds.length > 0 && (
              <div className="pt-8 border-t border-zinc-800/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-title font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                      <span className="text-amber-500">⚠️</span> Concerts non répertoriés ou indisponibles ({inaccessibleFavIds.length})
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-1">
                      Ces événements ne sont plus actifs sur la billetterie ou ne sont plus programmés.
                    </p>
                  </div>
                  <button
                    onClick={purgeInaccessibleFavorites}
                    className="text-xs font-mono uppercase tracking-wider text-rose-400 hover:text-rose-200 border border-zinc-800 hover:border-rose-900 bg-[#121215] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer w-fit"
                  >
                    Tout retirer ({inaccessibleFavIds.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inaccessibleFavIds.map((orphanId) => (
                    <div
                      key={`orphan-${orphanId}`}
                      className="bg-[#121215]/60 rounded-xl border border-zinc-800/80 p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-900/50">
                            Non disponible
                          </span>
                          <button
                            onClick={() => removeFavorite(orphanId)}
                            className="text-zinc-500 hover:text-rose-400 text-xs font-mono cursor-pointer"
                            title="Supprimer ce favori"
                          >
                            ✕ Retirer
                          </button>
                        </div>
                        <h4 className="font-title font-semibold text-zinc-300 text-sm mb-1">
                          Événement indisponible
                        </h4>
                        <p className="text-zinc-500 text-xs font-mono break-all mb-2">
                          Réf. : {orphanId}
                        </p>
                        <p className="text-zinc-400 text-xs font-body leading-relaxed">
                          Ce concert n'est plus accessible sur Ticketmaster France ou sa programmation a été annulée/terminée.
                        </p>
                      </div>

                      <button
                        onClick={() => removeFavorite(orphanId)}
                        className="mt-4 w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-300 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Retirer des favoris
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALE DE DÉTAIL DU CONCERT SÉLECTIONNÉ (BOTTOM SHEET SUR MOBILE) */}
      {selectedConcert && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setSelectedConcert(null)}
        >
          <div 
            className="bg-[#121215] w-full sm:max-w-xl max-h-[88vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-zinc-800/80 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(190,18,60,0.25)] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Poignée tactile mobile */}
            <div className="w-12 h-1 bg-zinc-700/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0"></div>

            <div className="h-44 sm:h-52 overflow-hidden relative shrink-0">
              <img 
                src={selectedConcert.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"} 
                alt={selectedConcert.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-black/40 to-transparent"></div>
              
              <button 
                onClick={() => setSelectedConcert(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/70 hover:bg-rose-950 text-zinc-300 hover:text-rose-200 w-8 h-8 rounded-full border border-zinc-800 transition-colors z-20 flex items-center justify-center text-sm font-bold"
                title="Fermer"
              >
                ✕
              </button>

              <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6">
                <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-rose-400 uppercase bg-black/70 px-2.5 py-0.5 rounded border border-rose-900/60">
                  {selectedConcert.city || selectedConcert._embedded?.venues?.[0]?.city?.name || "France"}
                </span>
                <h2 className="text-xl sm:text-2xl font-title font-bold text-zinc-100 uppercase tracking-wide mt-1.5 drop-shadow-md truncate">
                  {selectedConcert.name}
                </h2>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="bg-[#09090b] p-3 rounded-xl border border-zinc-800/80">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">
                    Date & Heure
                  </p>
                  <p className="text-xs font-mono font-semibold text-rose-400 mt-1">
                    {selectedConcert.date || "À déterminer"} • {selectedConcert.time || "20:00"}
                  </p>
                </div>
                <div className="bg-[#09090b] p-3 rounded-xl border border-zinc-800/80">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">
                    Lieu / Salle
                  </p>
                  <p className="text-xs font-medium text-zinc-200 mt-1 truncate">
                    {selectedConcert.venue || selectedConcert._embedded?.venues?.[0]?.name || "Scène principale"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
                  Description du concert
                </h4>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-body">
                  {selectedConcert.description || "Concert officiel répertorié sur la billetterie Ticketmaster France."}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={selectedConcert.url || `https://www.ticketmaster.fr/fr/recherche?keyword=${encodeURIComponent(selectedConcert.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 text-center py-3.5 px-4 rounded-xl text-xs sm:text-sm font-title font-bold tracking-[0.2em] uppercase border border-rose-800/80 shadow-[0_0_20px_rgba(190,18,60,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  Accéder à la Billetterie ↗
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => removeFavorite(selectedConcert.id)}
                    className="py-3 px-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 bg-rose-950/70 border-rose-800 text-rose-200 hover:bg-rose-900/80 cursor-pointer active:scale-98"
                  >
                    <span>🖤</span> Retirer
                  </button>

                  <a
                    href={getGoogleCalendarUrl(selectedConcert)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 bg-[#18181d] hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-98"
                    title="Ajouter à Google Agenda"
                  >
                    <span>📅</span> Agenda
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRE DE NAVIGATION INFÉRIEURE MOBILE (BOTTOM DOCK) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800/80 safe-area-bottom shadow-[0_-10px_25px_rgba(0,0,0,0.85)]">
        <div className="grid grid-cols-4 h-14">
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors active:scale-95"
          >
            <span className="text-base">🎸</span>
            <span>Concerts</span>
          </Link>

          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors active:scale-95"
          >
            <span className="text-base">🗺️</span>
            <span>Carte</span>
          </Link>

          <Link
            to="/favorites"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold transition-colors relative active:scale-95"
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

export default Favorites;
