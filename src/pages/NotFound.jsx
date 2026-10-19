import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-night-bg font-body text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-rose-950 selection:text-rose-200">
      {/* Halo brumeux écarlate en arrière-plan */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-950/20 rounded-full blur-[140px] pointer-events-none"></div>

      {/* 404 Stylisé Emo-Gothique */}
      <div className="relative z-10 mb-6 flex items-center justify-center gap-2">
        <span className="text-7xl sm:text-9xl font-title font-black text-zinc-200 drop-shadow-[0_0_35px_rgba(0,0,0,0.9)]">
          4
        </span>
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 border-rose-800/80 bg-[#121215] flex items-center justify-center relative shadow-[0_0_25px_rgba(190,18,60,0.3)]">
          <span className="text-rose-500 text-2xl sm:text-4xl leading-none select-none">✦</span>
        </div>
        <span className="text-7xl sm:text-9xl font-title font-black text-zinc-200 drop-shadow-[0_0_35px_rgba(0,0,0,0.9)]">
          4
        </span>
      </div>

      {/* Contenu textuel */}
      <div className="text-center z-10 mb-8 max-w-md">
        <h2 className="text-2xl sm:text-3xl font-title font-bold mb-2 text-zinc-100 uppercase tracking-widest">
          Page Introuvable
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed">
          Le concert ou la page que vous recherchez n'existe pas ou n'est plus disponible sur la plateforme.
        </p>
      </div>

      {/* Bouton de retour */}
      <Link
        to="/"
        className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/60 px-8 py-3 rounded-full text-xs font-title font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(190,18,60,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] z-10 flex items-center gap-2"
      >
        <span>←</span> Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFound;
