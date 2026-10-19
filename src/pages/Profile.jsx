import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const PRESET_AVATARS = [
  { id: "note", label: "Note de Musique", icon: "🎵" },
  { id: "guitar", label: "Guitare Électrique", icon: "🎸" },
  { id: "headphones", label: "Casque Audio", icon: "🎧" },
  { id: "lightning", label: "Éclair", icon: "⚡" },
  { id: "heart", label: "Cœur Noir", icon: "🖤" },
  { id: "moon", label: "Croissant de Lune", icon: "🌙" },
  { id: "mic", label: "Micro", icon: "🎤" },
  { id: "piano", label: "Clavier", icon: "🎹" }
];

const Profile = ({ user: appUser, setUser: setAppUser }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(appUser || null);
  const [loading, setLoading] = useState(!appUser);
  const [activeTab, setActiveTab] = useState("info"); // 'info', 'avatar', 'password', 'stats'

  // Formulaire Profil
  const [editName, setEditName] = useState(appUser?.name || "");
  const [editEmail, setEditEmail] = useState(appUser?.email || "");
  const [selectedAvatar, setSelectedAvatar] = useState(appUser?.avatar || "");
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    appUser?.avatar && appUser.avatar.startsWith("http") ? appUser.avatar : ""
  );

  // Formulaire Mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // États de feedback
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronisation initiale et au rafraîchissement
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        if (response.data.success) {
          const userData = response.data.user || response.data.data;
          setUser(userData);
          if (setAppUser) setAppUser(userData);
          setEditName(userData.name || "");
          setEditEmail(userData.email || "");
          setSelectedAvatar(userData.avatar || "");
          if (userData.avatar && userData.avatar.startsWith("http")) {
            setCustomAvatarUrl(userData.avatar);
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, setAppUser]);

  const handleLogout = async () => {
    const confirm = window.confirm("Souhaitez-vous vous déconnecter ?");
    if (!confirm) return;
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    } finally {
      try { localStorage.removeItem("musical_app_token"); } catch (e) {}
      if (setAppUser) setAppUser(null);
      navigate("/");
    }
  };

  // Mise à jour Nom & Email
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      const response = await api.put("/users/profile", {
        name: editName,
        email: editEmail
      });

      if (response.data.success) {
        const updated = response.data.user || response.data.data;
        setUser(updated);
        if (setAppUser) setAppUser(updated);
        setStatusMessage({ type: "success", text: "Informations mises à jour avec succès !" });
      } else {
        setStatusMessage({ type: "error", text: response.data.message || "Erreur de mise à jour." });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Erreur lors de la communication avec le serveur."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mise à jour Avatar / Photo de profil
  const handleSaveAvatar = async (avatarValue) => {
    setStatusMessage({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      const response = await api.put("/users/profile", {
        avatar: avatarValue
      });

      if (response.data.success) {
        const updated = response.data.user || response.data.data;
        setUser(updated);
        setSelectedAvatar(avatarValue);
        if (setAppUser) setAppUser(updated);
        setStatusMessage({ type: "success", text: "Photo de profil enregistrée avec succès !" });
      } else {
        setStatusMessage({ type: "error", text: response.data.message || "Erreur lors du changement d'avatar." });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Erreur lors du changement d'avatar."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Téléversement d'image depuis l'appareil avec redimensionnement automatique
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP)." });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "L'image ne doit pas dépasser 8 Mo." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);

        handleSaveAvatar(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Mise à jour Mot de passe
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (newPassword.length < 6) {
      setStatusMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: "error", text: "La confirmation ne correspond pas au nouveau mot de passe." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put("/users/password", {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        setStatusMessage({ type: "success", text: "Mot de passe modifié avec succès !" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatusMessage({ type: "error", text: response.data.message || "Le mot de passe actuel est incorrect." });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Erreur lors de la modification du mot de passe."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppression du compte
  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      "Êtes-vous sûr ? Tapez 'SUPPRIMER' pour confirmer la suppression définitive de votre compte."
    );
    if (confirmation !== "SUPPRIMER") return;

    try {
      const res = await api.delete("/users/profile");
      if (res.data.success) {
        try { localStorage.removeItem("musical_app_token"); } catch (e) {}
        alert("Votre compte a été supprimé.");
        if (setAppUser) setAppUser(null);
        navigate("/");
      }
    } catch (err) {
      alert("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-bg text-zinc-100 selection:bg-rose-950 selection:text-rose-200">
        <div className="text-sm font-title uppercase tracking-[0.25em] animate-pulse text-rose-500/80 flex items-center gap-2">
          <span>✦</span> Chargement du profil...
        </div>
      </div>
    );
  }

  // Rendu de l'avatar visuel
  const renderAvatarVisual = (avatarValue, sizeClasses = "w-28 h-28 text-4xl") => {
    if (avatarValue && (avatarValue.startsWith("http://") || avatarValue.startsWith("https://") || avatarValue.startsWith("data:image/"))) {
      return (
        <img
          src={avatarValue}
          alt="Avatar"
          className={`${sizeClasses} rounded-full object-cover border-2 border-rose-800/80 shadow-[0_0_25px_rgba(225,29,72,0.35)]`}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      );
    }

    if (avatarValue && avatarValue.length <= 4) {
      return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-rose-950 via-[#121215] to-[#1a1a24] border-2 border-rose-700/70 flex items-center justify-center shadow-[0_0_25px_rgba(190,18,60,0.35)] select-none`}>
          <span>{avatarValue}</span>
        </div>
      );
    }

    // Défaut : première lettre du nom
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "✦";
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-rose-950 via-[#121215] to-rose-950 border-2 border-rose-800/80 flex items-center justify-center font-title font-bold text-rose-200 shadow-[0_0_25px_rgba(190,18,60,0.35)] select-none`}>
        {initial}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-night-bg font-body text-zinc-100 pb-28 md:pb-16 relative selection:bg-rose-950 selection:text-rose-200">
      {/* HEADER RESPONSIVE */}
      <header className="h-16 sm:h-20 border-b border-zinc-900 flex items-center justify-between px-4 sm:px-6 md:px-10 bg-night-bg/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Retour à l'accueil"
          >
            <span className="text-lg">←</span>
          </Link>
          <Link
            to="/"
            className="text-lg sm:text-2xl font-title font-bold tracking-[0.22em] uppercase hover:opacity-90 transition-opacity flex items-baseline"
          >
            <span className="text-zinc-100 font-title">DISC</span>
            <span className="text-rose-600 font-title">OVER</span>
            <span className="text-rose-500 text-xs ml-1 select-none">✦</span>
          </Link>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            to="/"
            className="hidden sm:flex text-zinc-400 hover:text-zinc-100 transition-colors text-xs uppercase tracking-widest font-mono items-center gap-1.5"
          >
            <span>🗺️</span> Carte & Concerts
          </Link>
          <Link
            to="/favorites"
            className="text-zinc-400 hover:text-rose-300 transition-colors text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 bg-[#18181d] sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg border border-zinc-800 sm:border-0"
          >
            <span>🖤</span>
            <span className="hidden sm:inline">Favoris</span>
            <span className="text-rose-400 font-bold">({user?.favorites?.length || 0})</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-rose-400 transition-colors text-xs uppercase tracking-widest font-mono flex items-center gap-1 p-1.5 rounded-lg border border-zinc-800 hover:border-rose-900"
            title="Se déconnecter"
          >
            <span className="text-sm">🚪</span>
            <span className="hidden sm:inline text-[11px]">Déconnexion</span>
          </button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-3.5 sm:px-4 mt-5 sm:mt-8">
        {/* TITRE DE PAGE */}
        <div className="flex items-center justify-between mb-5 sm:mb-8 border-b border-zinc-800/60 pb-3 sm:pb-4">
          <h1 className="text-xl sm:text-3xl font-title font-bold text-zinc-100 uppercase tracking-[0.16em] sm:tracking-[0.18em] flex items-center gap-2 sm:gap-3">
            <span className="text-rose-600">✦</span> Mon Profil
          </h1>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 font-mono">
            {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
          </span>
        </div>

        {/* FEEDBACK TOAST / BANNER */}
        {statusMessage.text && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs sm:text-sm font-mono flex items-center justify-between transition-all ${
              statusMessage.type === "success"
                ? "bg-rose-950/40 border-rose-800/80 text-rose-200 shadow-[0_0_20px_rgba(190,18,60,0.2)]"
                : "bg-red-950/40 border-red-800/80 text-red-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>{statusMessage.type === "success" ? "✦" : "⚠️"}</span>
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage({ type: "", text: "" })}
              className="text-zinc-400 hover:text-zinc-200 ml-4 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLONNE GAUCHE : CARTE IDENTITÉ UTILISATEUR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121215] rounded-2xl border border-zinc-800/80 p-6 flex flex-col items-center text-center shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-rose-950/40 via-transparent to-transparent pointer-events-none"></div>

              {/* Avatar avec cercle lumineux */}
              <div className="relative mb-4 mt-2">
                {renderAvatarVisual(user?.avatar, "w-24 h-24 text-4xl")}
                <button
                  onClick={() => setActiveTab("avatar")}
                  className="absolute -bottom-1 -right-1 bg-[#18181d] hover:bg-rose-950 text-zinc-300 hover:text-rose-100 p-2 rounded-full border border-zinc-700/80 hover:border-rose-700 shadow-lg text-xs transition-colors cursor-pointer"
                  title="Changer l'avatar"
                >
                  ✏️
                </button>
              </div>

              <h2 className="text-xl font-bold font-title tracking-wider text-zinc-100 mb-1">
                {user?.name || "Utilisateur"}
              </h2>
              <p className="text-zinc-400 text-xs font-mono mb-4 break-all">{user?.email}</p>

              {/* Badges d'état */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <span className="bg-rose-950/60 text-rose-300 border border-rose-800/60 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Compte Vérifié
                </span>
                {user?.role === "admin" && (
                  <span className="bg-amber-950/60 text-amber-300 border border-amber-800/60 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest">
                    Administrateur
                  </span>
                )}
              </div>

              {/* Raccourcis navigation interne profil */}
              <div className="w-full grid grid-cols-2 lg:grid-cols-1 gap-2 pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`py-2.5 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider text-left transition-all flex items-center justify-between border cursor-pointer ${
                    activeTab === "info"
                      ? "bg-rose-950/60 border-rose-800 text-rose-200 font-semibold"
                      : "bg-[#18181d] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <span className="truncate">👤 Infos</span>
                  <span className="hidden lg:inline">→</span>
                </button>

                <button
                  onClick={() => setActiveTab("avatar")}
                  className={`py-2.5 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider text-left transition-all flex items-center justify-between border cursor-pointer ${
                    activeTab === "avatar"
                      ? "bg-rose-950/60 border-rose-800 text-rose-200 font-semibold"
                      : "bg-[#18181d] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <span className="truncate">🎨 Avatar</span>
                  <span className="hidden lg:inline">→</span>
                </button>

                <button
                  onClick={() => setActiveTab("password")}
                  className={`py-2.5 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider text-left transition-all flex items-center justify-between border cursor-pointer ${
                    activeTab === "password"
                      ? "bg-rose-950/60 border-rose-800 text-rose-200 font-semibold"
                      : "bg-[#18181d] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <span className="truncate">🔒 Sécurité</span>
                  <span className="hidden lg:inline">→</span>
                </button>

                <button
                  onClick={() => setActiveTab("stats")}
                  className={`py-2.5 px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider text-left transition-all flex items-center justify-between border cursor-pointer ${
                    activeTab === "stats"
                      ? "bg-rose-950/60 border-rose-800 text-rose-200 font-semibold"
                      : "bg-[#18181d] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <span className="truncate">📊 Stats</span>
                  <span className="hidden lg:inline">→</span>
                </button>
              </div>

              {/* Bouton Déconnexion */}
              <button
                onClick={handleLogout}
                className="w-full mt-6 bg-transparent hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/80 text-zinc-400 hover:text-rose-300 transition-all py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Se Déconnecter
              </button>
            </div>
          </div>

          {/* COLONNE DROITE : CONTENU DE L'ONGLET ACTIF */}
          <div className="lg:col-span-2">
            {/* ONGLET 1 : INFORMATIONS DU COMPTE */}
            {activeTab === "info" && (
              <div className="bg-[#121215] rounded-2xl border border-zinc-800/80 p-5 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
                <div className="border-b border-zinc-800/80 pb-4 mb-6">
                  <h3 className="text-lg font-title font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <span className="text-rose-500">✦</span> Informations Personnelles
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Gérez votre nom d'utilisateur et votre adresse email.
                  </p>
                </div>

                <form onSubmit={handleUpdateInfo} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800 focus:ring-1 focus:ring-rose-900/40 transition-all font-body"
                      placeholder="Votre nom"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800 focus:ring-1 focus:ring-rose-900/40 transition-all font-body"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-title font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/60 shadow-[0_0_15px_rgba(190,18,60,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.45)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Enregistrement..." : "Sauvegarder les modifications"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ONGLET 2 : PHOTO DE PROFIL & AVATARS */}
            {activeTab === "avatar" && (
              <div className="bg-[#121215] rounded-2xl border border-zinc-800/80 p-5 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
                <div className="border-b border-zinc-800/80 pb-4 mb-6">
                  <h3 className="text-lg font-title font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <span className="text-rose-500">✦</span> Photo de Profil & Avatar
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Sélectionnez une icône ou renseignez l'URL d'une photo de profil.
                  </p>
                </div>

                {/* Galerie des avatars */}
                <div className="mb-8">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 font-mono">
                    1. Choisir une icône
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(av.icon);
                          setCustomAvatarUrl("");
                          handleSaveAvatar(av.icon);
                        }}
                        className={`p-2.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                          selectedAvatar === av.icon
                            ? "bg-rose-950/70 border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.4)] scale-105"
                            : "bg-[#09090b] border-zinc-800 hover:border-zinc-700 hover:bg-[#18181d]"
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl select-none">{av.icon}</span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 truncate max-w-full">
                          {av.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entrée pour URL d'image personnalisée */}
                <div className="border-t border-zinc-800/80 pt-6">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                    2. Ou renseigner l'URL d'une image personnalisée
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://exemple.com/photo.jpg"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAvatarUrl.trim()) {
                          handleSaveAvatar(customAvatarUrl.trim());
                        }
                      }}
                      disabled={!customAvatarUrl.trim() || isSubmitting}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-title font-bold uppercase tracking-widest bg-[#18181d] hover:bg-rose-950 text-zinc-200 hover:text-rose-100 border border-zinc-700 hover:border-rose-700 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>

                {/* 3. Téléversement de fichier local */}
                <div className="border-t border-zinc-800/80 pt-6">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                    3. Ou importer une photo depuis votre appareil
                  </label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-rose-700/80 rounded-xl bg-[#09090b] cursor-pointer group transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <span className="text-2xl mb-1 text-zinc-500 group-hover:text-rose-400 transition-colors">
                      📷
                    </span>
                    <span className="text-xs font-mono text-zinc-300 group-hover:text-zinc-100 uppercase tracking-wider text-center">
                      Cliquez pour choisir une photo
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1 text-center">
                      JPG, PNG, WEBP • Redimensionnée et optimisée automatiquement
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ONGLET 3 : SÉCURITÉ & MOT DE PASSE */}
            {activeTab === "password" && (
              <div className="bg-[#121215] rounded-2xl border border-zinc-800/80 p-5 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
                <div className="border-b border-zinc-800/80 pb-4 mb-6">
                  <h3 className="text-lg font-title font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <span className="text-rose-500">✦</span> Sécurité & Mot de Passe
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Mettez à jour votre mot de passe pour sécuriser l'accès à votre compte.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800 focus:ring-1 focus:ring-rose-900/40 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                      Nouveau mot de passe (min. 6 caractères)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800 focus:ring-1 focus:ring-rose-900/40 transition-all"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-800 focus:ring-1 focus:ring-rose-900/40 transition-all"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>

                  {newPassword && confirmPassword && (
                    <div className="text-xs font-mono">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-400">✓ Les mots de passe concordent.</span>
                      ) : (
                        <span className="text-rose-400">✕ Les mots de passe ne correspondent pas.</span>
                      )}
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || newPassword !== confirmPassword || newPassword.length < 6}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-title font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 hover:from-rose-900 hover:to-rose-800 text-rose-100 border border-rose-800/60 shadow-[0_0_15px_rgba(190,18,60,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.45)] transition-all cursor-pointer disabled:opacity-40"
                    >
                      {isSubmitting ? "Modification..." : "Modifier mon mot de passe"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ONGLET 4 : STATISTIQUES & ACTIONS SENSIBLES */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <div className="bg-[#121215] rounded-2xl border border-zinc-800/80 p-5 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
                  <h3 className="text-lg font-title font-bold uppercase tracking-wider text-zinc-100 mb-6 flex items-center gap-2">
                    <span className="text-rose-500">✦</span> Statistiques du Compte
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-[#09090b] rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                      <div>
                        <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
                          Concerts Favoris
                        </p>
                        <p className="text-3xl font-bold font-mono text-rose-400 mt-2">
                          {user?.favorites?.length || 0}
                        </p>
                      </div>
                      <Link
                        to="/favorites"
                        className="mt-4 text-xs font-mono uppercase tracking-wider text-rose-400 hover:text-rose-200 flex items-center gap-1.5"
                      >
                        Consulter mes favoris ↗
                      </Link>
                    </div>

                    <div className="p-5 bg-[#09090b] rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                      <div>
                        <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
                          Statut du Compte
                        </p>
                        <p className="text-sm font-title font-bold text-zinc-200 mt-2 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Compte Actif
                        </p>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 mt-4">
                        Inscrit depuis le {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "Récent"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ZONE DE DANGER */}
                <div className="bg-[#121215] rounded-2xl border border-rose-950/60 p-5 sm:p-6 shadow-lg">
                  <h4 className="text-sm font-title font-bold uppercase tracking-widest text-rose-400 mb-2">
                    Zone de danger
                  </h4>
                  <p className="text-xs text-zinc-400 mb-4 font-body leading-relaxed">
                    La suppression de votre compte effacera définitivement vos favoris et vos données de session.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-rose-950/40 text-rose-400 hover:text-rose-200 border border-rose-900/60 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Supprimer mon compte définitivement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* BARRE DE NAVIGATION FLOTTANTE SUR MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0f]/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2 safe-area-bottom shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 py-1 px-3 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="text-lg">🎸</span>
            <span className="text-[10px] font-mono uppercase tracking-wider">Concerts</span>
          </Link>
          <Link
            to="/?tab=map"
            className="flex flex-col items-center gap-1 py-1 px-3 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="text-lg">🗺️</span>
            <span className="text-[10px] font-mono uppercase tracking-wider">Carte</span>
          </Link>
          <Link
            to="/favorites"
            className="flex flex-col items-center gap-1 py-1 px-3 text-zinc-400 hover:text-rose-300 transition-colors relative"
          >
            <span className="text-lg">🖤</span>
            <span className="text-[10px] font-mono uppercase tracking-wider">Favoris</span>
            {user?.favorites?.length > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono shadow-sm">
                {user.favorites.length}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center gap-1 py-1 px-3 text-rose-400 font-bold transition-colors"
          >
            <span className="text-lg">👤</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300">Profil</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
