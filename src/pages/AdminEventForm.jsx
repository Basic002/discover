import { useState } from "react";
import { Link } from "react-router-dom";

const AdminEventForm = () => {
  // ÉTATS POUR L'IMAGE (PREVIEW ET FICHIER)
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // 1. Quand le fichier entre dans la zone de dépôt
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // 2. Quand le fichier quitte la zone de dépôt
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // 3. Quand le fichier est lâché dans la zone de dépôt
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Gestionnaire pour le champ input classique
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-night-bg font-body text-zinc-100 pb-12 relative selection:bg-rose-950 selection:text-rose-200">
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
            to="/admin"
            className="text-zinc-400 hover:text-zinc-100 transition-colors text-xs uppercase tracking-widest font-mono flex items-center gap-2"
          >
            ← Retour au Dashboard
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="mb-8 border-b border-zinc-800/60 pb-4">
          <h1 className="text-2xl sm:text-3xl font-title font-bold text-zinc-100 uppercase tracking-[0.18em] mb-2 flex items-center gap-3">
            <span className="text-rose-600 font-serif">✦</span> Ajouter un Événement
          </h1>
          <p className="text-zinc-400 text-xs tracking-wide">
            Renseignez les détails ci-dessous pour ajouter une nouvelle date de concert sur la carte.
          </p>
        </div>

        {/* CARTE DU FORMULAIRE */}
        <div className="bg-[#121215] rounded-2xl border border-zinc-800/80 shadow-[0_15px_40px_rgba(0,0,0,0.8)] p-6 md:p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* GRILLE 2 COLONNES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Visuel du concert / Affiche *
                </label>

                {/* La zone de dépôt (Drag & Drop Zone) */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative w-full h-48 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 text-center group cursor-pointer overflow-hidden ${
                    isDragging
                      ? "border-rose-600 bg-rose-950/20 shadow-[0_0_20px_rgba(225,29,72,0.25)]"
                      : "border-zinc-800 bg-[#09090b] hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {!imagePreview ? (
                    <>
                      <div className="text-zinc-500 text-2xl mb-2 group-hover:text-rose-400 transition-colors">
                        🖼️
                      </div>
                      <p className="text-zinc-400 font-medium text-xs tracking-wider uppercase font-mono">
                        Glissez une affiche ici <span className="text-zinc-600">(PNG, JPG, WEBP)</span>
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-1 font-mono">
                        ou cliquez pour parcourir les fichiers
                      </p>
                    </>
                  ) : (
                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setImagePreview(null)}
                        className="absolute top-3 right-3 p-1.5 bg-black/80 rounded-full text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors z-20"
                        title="Supprimer l'image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Nom de l'artiste */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Artiste ou Nom du Concert *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Deftones, The Cure, Justice..."
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all placeholder-zinc-600"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Date de l'événement *
                </label>
                <input
                  type="date"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all [color-scheme:dark]"
                />
              </div>

              {/* Heure */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Heure des portes
                </label>
                <input
                  type="time"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all [color-scheme:dark]"
                />
              </div>

              {/* Salle / Lieu */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Lieu / Salle de concert *
                </label>
                <input
                  type="text"
                  placeholder="Ex: L'Élysée Montmartre, Paris"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all placeholder-zinc-600"
                />
              </div>

              {/* Coordonnées GPS */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Latitude GPS
                </label>
                <input
                  type="text"
                  placeholder="48.8833"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 transition-all placeholder-zinc-600 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Longitude GPS
                </label>
                <input
                  type="text"
                  placeholder="2.3432"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 transition-all placeholder-zinc-600 font-mono text-xs"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description & Genre musical
                </label>
                <textarea
                  rows="4"
                  placeholder="Rock, électro, pop, premières parties, informations pratiques..."
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 transition-all placeholder-zinc-600 resize-none"
                ></textarea>
              </div>
            </div>

            {/* BOUTONS D'ACTION */}
            <div className="pt-6 mt-6 border-t border-zinc-800/80 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Link
                to="/admin"
                className="px-6 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                className="px-8 py-2.5 rounded-lg text-xs font-title font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/60 transition-all shadow-[0_0_15px_rgba(190,18,60,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.45)]"
              >
                Publier l'événement
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminEventForm;
