import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const Register = ({ setUser }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem("musical_app_token", response.data.token);
        }
        if (response.data.user && setUser) {
          setUser(response.data.user);
          navigate("/profile");
        } else {
          navigate("/login");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-night-bg font-body p-4 relative selection:bg-rose-950 selection:text-rose-200">
      {/* Bouton retour */}
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-mono p-2"
      >
        <span>←</span> Accueil
      </Link>

      {/* Titre Logo */}
      <div className="text-center mb-6 mt-12 sm:mt-0">
        <Link to="/" className="text-2xl sm:text-3xl font-title font-bold tracking-[0.22em] uppercase hover:opacity-90 transition-opacity inline-flex items-baseline">
          <span className="text-zinc-100 font-title">DISC</span>
          <span className="text-rose-600 font-title">OVER</span>
          <span className="text-rose-500 text-sm ml-1 select-none">✦</span>
        </Link>
      </div>

      {/* Carte Inscription */}
      <div className="w-full max-w-md bg-[#121215]/95 backdrop-blur-xl rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(190,18,60,0.1)] p-5 sm:p-8 border border-zinc-800/80">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-title font-bold text-zinc-100 mb-1.5 tracking-wide uppercase">
            Créer un Compte
          </h1>
          <p className="text-zinc-400 text-xs tracking-wider font-light">
            Rejoignez notre communauté et gardez trace de vos dates live.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 rounded-lg text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
              Pseudonyme
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all placeholder-zinc-600 font-body"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all placeholder-zinc-600 font-body"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800/80 focus:ring-1 focus:ring-rose-900/40 transition-all placeholder-zinc-600 font-body"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/60 hover:border-rose-600 font-title font-bold tracking-[0.2em] uppercase py-3.5 sm:py-3 rounded-xl text-xs mt-6 transition-all shadow-[0_0_15px_rgba(190,18,60,0.25)] hover:shadow-[0_0_25px_rgba(225,29,72,0.45)] cursor-pointer"
          >
            Créer mon compte
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800/60 text-center text-zinc-400 text-xs">
          Déjà un compte ?{" "}
          <Link
            to="/login"
            className="text-rose-400 hover:text-rose-300 hover:underline font-medium transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
