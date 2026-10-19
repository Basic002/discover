import { Link } from "react-router-dom";

const AdminDashboard = () => {
  // Fausses données pour simuler la liste des événements
  const mockEvents = [
    {
      id: 1,
      name: "Arctic Monkeys",
      date: "12/05/2026",
      venue: "Accor Arena, Paris",
      status: "À venir",
    },
    {
      id: 2,
      name: "Justice",
      date: "23/04/2026",
      venue: "Le Zénith, Paris",
      status: "Ce soir",
    },
    {
      id: 3,
      name: "L'Impératrice",
      date: "18/06/2026",
      venue: "La Cigale, Paris",
      status: "À venir",
    },
    {
      id: 4,
      name: "Daft Punk (Tribute)",
      date: "10/01/2026",
      venue: "Olympia, Paris",
      status: "Terminé",
    },
  ];

  return (
    <div className="min-h-screen bg-night-bg font-body text-zinc-100 pb-12 selection:bg-rose-950 selection:text-rose-200">
      {/* HEADER ADMIN */}
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-6 md:px-10 bg-night-bg/95 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-xl sm:text-2xl font-title font-bold tracking-[0.22em] uppercase hover:opacity-90 transition-opacity flex items-baseline"
          >
            <span className="text-zinc-100 font-title">DISC</span>
            <span className="text-rose-600 font-title">OVER</span>
            <span className="text-rose-500 text-xs ml-1 select-none">✦</span>
          </Link>
          <span className="bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest">
            Administration
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="text-zinc-400 hover:text-zinc-100 transition-colors text-xs uppercase tracking-widest font-mono flex items-center gap-2"
          >
            ← Retour au site public
          </Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* EN-TÊTE DU DASHBOARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-zinc-800/60 pb-4">
          <h1 className="text-2xl sm:text-3xl font-title font-bold text-zinc-100 uppercase tracking-[0.18em] flex items-center gap-3">
            <span className="text-rose-600 font-serif">✦</span> Vue d'ensemble
          </h1>

          <Link
            to="/admin/event"
            className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/60 px-5 py-2.5 rounded-lg text-xs font-title font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_15px_rgba(190,18,60,0.25)] flex items-center gap-2 w-fit"
          >
            <span>+</span> Nouvel Événement
          </Link>
        </div>

        {/* CARTES DE STATISTIQUES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
              Total Événements
            </p>
            <p className="text-3xl font-mono font-bold text-zinc-100">124</p>
          </div>
          <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
              Événements Actifs
            </p>
            <p className="text-3xl font-mono font-bold text-rose-400">42</p>
          </div>
          <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
              Inscrits
            </p>
            <p className="text-3xl font-mono font-bold text-zinc-100">1,893</p>
          </div>
          <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
              Salles Partenaires
            </p>
            <p className="text-3xl font-mono font-bold text-zinc-100">18</p>
          </div>
        </div>

        {/* TABLEAU DES ÉVÉNEMENTS */}
        <div className="bg-[#121215] rounded-2xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-6 border-b border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-title font-bold text-zinc-100 uppercase tracking-wider">
              Gestion du Répertoire
            </h2>

            {/* Barre de recherche admin */}
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Filtrer..."
                className="w-full sm:w-64 bg-[#09090b] border border-zinc-800 rounded-lg pl-4 pr-10 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-rose-800/80 transition-colors placeholder-zinc-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#09090b] text-zinc-500 text-[11px] font-mono uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Nom de l'événement</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Lieu</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-body text-xs">
                {mockEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-zinc-850/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-zinc-100 font-title tracking-wide">
                      {event.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{event.date}</td>
                    <td className="px-6 py-4 text-zinc-400">{event.venue}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                          event.status === "À venir"
                            ? "bg-rose-950/40 text-rose-300 border-rose-800/50"
                            : event.status === "Ce soir"
                              ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
                              : "bg-zinc-900 text-zinc-500 border-zinc-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-3">
                      <button
                        className="text-zinc-500 hover:text-zinc-200 transition-colors"
                        title="Modifier"
                      >
                        ✎
                      </button>
                      <button
                        className="text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500 bg-[#09090b]/40">
            <span>Affichage de 1 à 4 sur 124 dates</span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-[#121215] border border-zinc-800 rounded hover:text-zinc-200 disabled:opacity-50"
                disabled
              >
                Précédent
              </button>
              <button className="px-3 py-1 bg-[#121215] border border-zinc-800 rounded hover:text-zinc-200">
                Suivant
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
