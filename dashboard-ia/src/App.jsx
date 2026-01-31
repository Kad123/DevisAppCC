import React, { useState, useEffect } from 'react';
import {
  HardHat, Wand2, FileText, Users, CheckCircle2, AlertCircle,
  Loader2, Send, Calculator, Save, RefreshCw, LayoutDashboard,
  Receipt, Map, Plus, Search, MoreVertical, LogOut, TrendingUp,
  Clock, CheckCircle, Construction, UserPlus, DollarSign, Calendar,
  ShieldCheck, Zap, BarChart3, ChevronRight, UserCog, Trash2, Edit3,
  X, Eye, EyeOff, Mail, Lock, User as UserIcon, Columns3
} from 'lucide-react';
import DevisIAView from './DevisIAView';
import DevisEditableView from './DevisEditableView';
import PendingDevisView from './PendingDevisView';
import ClientsView from './ClientsView';
import CaPrevisionnelleView from './CaPrevisionnelleView';
import ObjectifsCommerciauxView from './ObjectifsCommerciauxView';
import KanbanDevisView from './KanbanDevisView';
import { devisAPI } from './api/devisAPI';

// --- CONFIGURATION ---
const API_URL = "http://localhost:8000";
const API_KEY = ""; // Clé Gemini pour l'IA

const App = () => {
  // Gestion de l'état global
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'register'
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedDevis, setGeneratedDevis] = useState(null);
  const [pendingDevis, setPendingDevis] = useState([]); // Devis en attente (sauvegardés mais pas acceptés)
  const [selectedDevisForEditing, setSelectedDevisForEditing] = useState(null); // Devis en cours d'édition
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // État pour les utilisateurs
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', role: 'artisan' });

  // Données de démonstration
  const [clients, setClients] = useState([
    { id: 1, nom: "Jean Durand", type: "Client", email: "jean@gmail.com", telephone: "06 12 34 56 78", ville: "Paris" },
    { id: 2, nom: "Mairie de Lyon", type: "Prospect", email: "contact@lyon.fr", telephone: "04 72 00 00 00", ville: "Lyon" },
    { id: 3, nom: "Sarl BatiPlus", type: "Client", email: "admin@batiplus.fr", telephone: "01 45 89 66 33", ville: "Nantes" }
  ]);

  const [chantiers, setChantiers] = useState([
    { id: 1, nom: "Rénovation Loft", client: "Jean Durand", avancement: 75, debut: "12/12/2025", fin: "15/02/2026", statut: "En cours" },
    { id: 2, nom: "Toiture École", client: "Mairie de Lyon", avancement: 10, debut: "05/01/2026", fin: "30/03/2026", statut: "Démarrage" },
    { id: 3, nom: "Extension Villa", client: "Sarl BatiPlus", avancement: 100, debut: "10/10/2025", fin: "02/01/2026", statut: "Terminé" }
  ]);

  // État pour basculer entre la vue grille et la vue calendrier
  const [chantiersViewMode, setChantiersViewMode] = useState('grid'); // 'grid' ou 'calendar'
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 0, 1)); // Janvier 2026

  // État pour les stats des devis signés (KPI Dashboard)
  const [devisSignesStats, setDevisSignesStats] = useState({ count: 0, totalHT: 0 });

  // Clé de rafraîchissement pour forcer le rechargement des vues après mise à jour d'un devis
  const [devisRefreshKey, setDevisRefreshKey] = useState(0);
  const triggerDevisRefresh = () => setDevisRefreshKey(prev => prev + 1);

  const [factures, setFactures] = useState([
    { id: "FAC-2026-001", client: "Jean Durand", montant: 4500, date: "02/01/2026", statut: "Payée" },
    { id: "FAC-2026-002", client: "Mairie de Lyon", montant: 8200, date: "05/01/2026", statut: "Attente" },
    { id: "FAC-2026-003", client: "Sarl BatiPlus", montant: 1250, date: "06/01/2026", statut: "Retard" }
  ]);

  // --- API HELPERS ---
  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, credentials: 'include' });

    // Si token expiré ou invalide, essayer de rafraîchir avec le refresh token
    if (response.status === 401) {
      try {
        const r = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          localStorage.setItem('token', data.access_token);
          setToken(data.access_token);
          // retry original request with new token
          const newHeaders = { ...headers, Authorization: `Bearer ${data.access_token}` };
          response = await fetch(`${API_URL}${endpoint}`, { ...options, headers: newHeaders, credentials: 'include' });
        } else {
          handleLogout();
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
      } catch (err) {
        handleLogout();
        throw err;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur serveur' }));
      throw new Error(error.detail || 'Erreur API');
    }

    if (response.status === 204) return null;
    return response.json();
  };

  // --- EFFECTS ---
  // Charger les devis depuis l'API au montage et quand le token change
  useEffect(() => {
    if (token) {
      loadDevisFromAPI();
    }
  }, [token]);

  // Rafraîchissement silencieux périodique : renouvelle le access token toutes les 25 minutes
  useEffect(() => {
    if (!token) return;

    const doSilentRefresh = async () => {
      try {
        const r = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });

        if (r.ok) {
          const data = await r.json();
          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
          }
        } else {
          // si refresh invalide, déconnecter l'utilisateur
          handleLogout();
        }
      } catch (err) {
        console.error('Silent refresh échoué', err);
        handleLogout();
      }
    };

    // 25 minutes
    // On planifie un interval fallback et on schedule aussi un refresh anticipé basé sur le token expiry
    const intervalMs = 25 * 60 * 1000;
    const id = setInterval(doSilentRefresh, intervalMs);

    // Planification anticipée via l'exp claim
    const scheduleFromToken = (tok) => {
      try {
        const parts = tok.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp) return null;
        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        // rafraîchir 5 minutes avant expiration
        const fiveMin = 5 * 60 * 1000;
        const msUntilRefresh = expiresAt - now - fiveMin;
        if (msUntilRefresh <= 0) {
          doSilentRefresh();
          return null;
        }
        const to = setTimeout(doSilentRefresh, msUntilRefresh);
        return to;
      } catch (e) {
        return null;
      }
    };

    let scheduledId = null;
    try { scheduledId = scheduleFromToken(token); } catch(e) { /* ignore */ }

    // Exécuter immédiatement une fois pour prolonger la session dès la connexion
    doSilentRefresh();

    return () => clearInterval(id);
  }, [token]);

  // Sauvegarder les devis dans l'API quand ils changent
  useEffect(() => {
    // Ne pas sauvegarder automatiquement à chaque changement
    // La sauvegarde se fait lors des actions spécifiques (create, update, delete)
  }, [pendingDevis]);

  const loadDevisFromAPI = async () => {
    try {
      const devis = await devisAPI.getAllDevis(token);
      setPendingDevis(devis);

      // Calculer les stats des devis signés pour le KPI
      const signed = devis.filter(d =>
        d.statut === 'Validé' || d.statut === 'Accepté' || d.statut === 'Signé'
      );
      const totalHT = signed.reduce((sum, d) => sum + (d.total_ht || 0), 0);
      setDevisSignesStats({ count: signed.length, totalHT });
    } catch (err) {
      console.error('Erreur chargement devis:', err);
      // Fallback: garder les devis existants
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchClients(); // Charger les clients
    }
  }, [token]);

  useEffect(() => {
    if (token && currentPage === 'users') {
      fetchUsers();
    }
  }, [token, currentPage]);

  // --- AUTH FUNCTIONS ---
  const fetchCurrentUser = async () => {
    try {
      const userData = await apiCall('/auth/users/me');
      setUser(userData);
    } catch (err) {
      console.error('Session expirée', err);
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const response = await fetch(`${API_URL}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username: email, password }),
          credentials: 'include'
        });

      if (!response.ok) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const fullName = formData.get('full_name');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName || 'Utilisateur',
          role: 'artisan'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de l\'inscription');
      }

      // Après inscription, se connecter automatiquement
      const loginResponse = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
        credentials: 'include'
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // appeler l'API pour révoquer le refresh token côté serveur (cookie envoyé automatiquement)
    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // --- USER MANAGEMENT FUNCTIONS ---
  const fetchUsers = async () => {
    try {
      const data = await apiCall('/auth/users/');
      setUsers(data);
    } catch (err) {
      console.error('Erreur chargement utilisateurs', err);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await apiCall('/crm/clients/');
      setClients(data);
      console.log('✓ Clients chargés:', data.length);
    } catch (err) {
      console.error('Erreur chargement clients', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userForm)
      });
      setShowUserModal(false);
      setUserForm({ email: '', password: '', full_name: '', role: 'artisan' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = { ...userForm };
      if (!updateData.password) delete updateData.password;

      await apiCall(`/auth/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ email: '', password: '', full_name: '', role: 'artisan' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await apiCall(`/auth/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleUserActive = async (userId) => {
    try {
      await apiCall(`/auth/users/${userId}/toggle-active`, { method: 'PATCH' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setUserForm({
      email: userToEdit.email,
      full_name: userToEdit.full_name || '',
      role: userToEdit.role,
      password: ''
    });
    setShowUserModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUserForm({ email: '', password: '', full_name: '', role: 'artisan' });
    setShowUserModal(true);
  };

  // --- LOGIQUE IA (DEVIS) ---
  const generateMockDevis = (promptText) => {
    // Simulation d'une génération IA avec données réalistes basées sur le prompt
    return {
      nom: promptText.substring(0, 40) + (promptText.length > 40 ? "..." : ""),
      taux_tva: 20.0,
      lots: [
        {
          nom: "Préparation et Démolition",
          ordre: 1,
          lignes_poste: [
            { designation: "Dépose anciens revêtements", unite: "m²", quantite: 25, prix_unitaire_ht: 12 },
            { designation: "Évacuation décombres", unite: "forfait", quantite: 1, prix_unitaire_ht: 450 },
            { designation: "Nettoyage et préparation surface", unite: "m²", quantite: 25, prix_unitaire_ht: 8 }
          ]
        },
        {
          nom: "Travaux Principaux",
          ordre: 2,
          lignes_poste: [
            { designation: "Installation matériaux (fournitures)", unite: "m²", quantite: 25, prix_unitaire_ht: 85 },
            { designation: "Main d'œuvre installation", unite: "h", quantite: 16, prix_unitaire_ht: 65 },
            { designation: "Finitions et retouches", unite: "forfait", quantite: 1, prix_unitaire_ht: 320 }
          ]
        },
        {
          nom: "Finitions et Contrôle",
          ordre: 3,
          lignes_poste: [
            { designation: "Peinture/Revêtement final", unite: "m²", quantite: 25, prix_unitaire_ht: 22 },
            { designation: "Mise en norme et vérifications", unite: "forfait", quantite: 1, prix_unitaire_ht: 280 },
            { designation: "Nettoyage final du chantier", unite: "forfait", quantite: 1, prix_unitaire_ht: 150 }
          ]
        }
      ]
    };
  };

  const handleGenerateIA = async (promptText) => {
    if (!promptText || !promptText.trim()) return;
    
    setIsGenerating(true);
    
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Mode test : génère des données mockées
      const parsed = generateMockDevis(promptText);

      let totalHt = 0;
      parsed.lots.forEach(lot => {
        lot.total_lot_ht = lot.lignes_poste.reduce((sum, l) => sum + (l.quantite * l.prix_unitaire_ht), 0);
        totalHt += lot.total_lot_ht;
      });
      parsed.total_ht = totalHt;
      setGeneratedDevis(parsed);
      console.log("✓ Devis généré (test mockés)", parsed);
    } catch (err) {
      console.error("❌ Erreur génération:", err.message);
      alert(`Erreur lors de la génération : ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- VUES ---

  const LoginView = () => (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-100">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-white relative z-10 shadow-2xl">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/30">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <span className="font-black text-2xl uppercase tracking-tighter text-slate-900 italic">BTP Manager</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {authMode === 'login' ? 'Content de vous revoir !' : 'Créez votre compte'}
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              {authMode === 'login' 
                ? 'Gérez vos chantiers et vos devis IA en toute simplicité.'
                : 'Rejoignez la plateforme BTP Manager dès maintenant'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-6">
            {authMode === 'register' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nom Complet</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:ring-0 focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold"
                  placeholder="Jean Dupont"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Professionnel</label>
              <input
                type="email"
                name="email"
                required
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:ring-0 focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold"
                placeholder="marc@btp-expert.fr"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mot de passe</label>
              <input
                type="password"
                name="password"
                required
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:ring-0 focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-[0.15em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                {authMode === 'login' ? <>Se Connecter <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></> : <>S\'inscrire <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
              </>}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-slate-500 text-sm">
              {authMode === 'login' 
                ? 'Pas encore de compte ? '
                : 'Vous avez déjà un compte ? '}
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setError(null);
                }}
                className="text-blue-600 font-black hover:text-blue-700 transition-colors"
              >
                {authMode === 'login' ? 'S\'inscrire' : 'Se connecter'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-[1.2] bg-slate-900 relative items-center justify-center overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] -mr-64 -mt-64 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10 max-w-xl px-16">
          <div className="inline-flex items-center gap-3 bg-blue-600/10 border border-blue-600/20 px-5 py-2.5 rounded-full mb-10 backdrop-blur-md">
            <Zap className="w-5 h-5 text-blue-500" />
            <span className="text-blue-400 text-xs font-black uppercase tracking-[0.2em]">Assistant Devis IA v3.0</span>
          </div>

          <h2 className="text-5xl font-black text-white mb-8 leading-[1.1] uppercase italic tracking-tighter">
            L'intelligence <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">Artificielle</span> au service du terrain
          </h2>

          <div className="grid grid-cols-1 gap-6 mt-16">
            {[
              { icon: ShieldCheck, title: "Sécurisation Totale", desc: "Données chiffrées de bout en bout." },
              { icon: BarChart3, title: "Rentabilité Maîtrisée", desc: "Analyse automatique de vos marges." },
              { icon: Wand2, title: "Rapidité d'Exécution", desc: "Un devis complexe en 45 secondes." }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 p-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl hover:bg-white/10 transition-all cursor-default group">
                <div className="bg-blue-600/20 p-4 rounded-2xl h-fit group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-white font-black uppercase text-sm tracking-wider mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- USER MODAL ---
  const UserModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">
              {editingUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {editingUser ? 'Modifiez les informations' : 'Créez un nouveau compte'}
            </p>
          </div>
          <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Nom complet</label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                required
                className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold"
                placeholder="Jean Dupont"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                required
                className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold"
                placeholder="jean@entreprise.fr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Mot de passe {editingUser && '(laisser vide pour ne pas modifier)'}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                required={!editingUser}
                className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Rôle</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({...userForm, role: e.target.value})}
              className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold"
            >
              <option value="artisan">Artisan</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingUser ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // --- USERS VIEW ---
  const UsersView = () => (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestion des Utilisateurs</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
        >
          <UserPlus className="w-5 h-5" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total", val: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Actifs", val: users.filter(u => u.is_active).length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
          { label: "Admins", val: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-100" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className={`${stat.bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-800">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
            <tr>
              <th className="p-6">Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Inscription</th>
              <th className="text-right p-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${u.is_active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {u.full_name?.substring(0,2).toUpperCase() || 'U'}
                    </div>
                    <span className="font-bold text-slate-700">{u.full_name || 'Sans nom'}</span>
                  </div>
                </td>
                <td className="text-slate-500 text-sm font-medium">{u.email}</td>
                <td>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                    u.role === 'gestionnaire' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleUserActive(u.id)}
                    disabled={u.id === user?.id}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      u.is_active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                    } ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {u.is_active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="text-slate-400 text-xs font-bold">
                  {new Date(u.date_creation).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-2 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.id === user?.id}
                      className={`p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all ${u.id === user?.id ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- AUTRES VUES (Dashboard, CRM, etc.) ---
  const DashboardView = () => (
    <div className="space-y-8 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
          { label: "CA Prévisionnel", val: devisSignesStats.totalHT > 0 ? `${devisSignesStats.totalHT.toLocaleString()} €` : "0 €", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100", onClick: () => setCurrentPage('ca') },
          { label: "Devis Signés", val: devisSignesStats.count, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100", onClick: () => setCurrentPage('ca') },
          { label: "Chantiers Actifs", val: chantiers.filter(c => c.statut !== "Terminé").length, icon: Construction, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Devis en attente", val: pendingDevis.filter(d => d.statut === 'Brouillon').length, icon: Clock, color: "text-orange-600", bg: "bg-orange-100", onClick: () => setCurrentPage('pending-devis') },
          { label: "Utilisateurs", val: users.length || "—", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={stat.onClick}
            className={`bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow ${stat.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className={`${stat.bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-5`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-800">{stat.val}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-lg mb-8 flex items-center gap-3 uppercase tracking-tight text-slate-800">
            <Map className="w-5 h-5 text-blue-600" /> Progression Opérationnelle
          </h3>
          <div className="space-y-8">
            {chantiers.map(c => (
              <div key={c.id} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-black text-slate-700 text-sm uppercase tracking-wide">{c.nom}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{c.client}</p>
                  </div>
                  <span className="text-blue-600 font-black text-sm">{c.avancement}%</span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${c.avancement}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-lg mb-8 flex items-center gap-3 uppercase tracking-tight text-slate-800">
             <Receipt className="w-5 h-5 text-green-600" /> Flux Financier
          </h3>
          <div className="space-y-4">
            {factures.slice(0, 3).map(f => (
              <div key={f.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${f.statut === 'Payée' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <div>
                    <p className="text-sm font-black text-slate-700">{f.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{f.client}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-900">{f.montant.toLocaleString()} €</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg mt-1 inline-block ${f.statut === 'Payée' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {f.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ClientsViewWrapper = () => (
    <ClientsView 
      clients={clients}
      onRefresh={fetchClients} // Recharger les clients
      token={token}
    />
  );

  const DevisIAViewWrapper = () => (
    <DevisIAView
      isGenerating={isGenerating}
      generatedDevis={generatedDevis}
      setGeneratedDevis={setGeneratedDevis}
      handleGenerateIA={handleGenerateIA}
      token={token}
      onStatusChange={triggerDevisRefresh}
      onDevisSaved={async (devis) => {
        try {
          // Créer le devis dans la base de données
          const createdDevis = await devisAPI.createDevis(devis, token);
          // Ajouter le devis à la liste avec l'ID du serveur
          setPendingDevis([...pendingDevis, createdDevis]);
          setGeneratedDevis(null);
          setCurrentPage('dashboard');
          console.log('✓ Devis créé et sauvegardé en BDD', createdDevis);
        } catch (err) {
          console.error('❌ Erreur sauvegarde devis:', err);
          alert(`Erreur lors de la sauvegarde: ${err.message}`);
        }
      }}
    />
  );

  const EditSelectedDevisWrapper = () => {
    if (!selectedDevisForEditing) {
      console.warn('⚠️ Pas de devis sélectionné pour édition');
      return <div className="p-12 text-center text-slate-500">Aucun devis sélectionné</div>;
    }
    
    console.log('📋 Devis sélectionné pour édition:', selectedDevisForEditing);
    
    return (
      <div>
        <button
          onClick={() => setCurrentPage('pending-devis')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black uppercase text-sm mb-6 transition-colors"
        >
          ← Retour à la liste
        </button>
        <DevisEditableView
          generatedDevis={selectedDevisForEditing}
          setGeneratedDevis={setSelectedDevisForEditing}
          token={token}
          onStatusChange={triggerDevisRefresh}
          onDevisSaved={async (devis) => {
            try {
              // Mettre à jour le devis dans la base de données
              const updatedDevis = await devisAPI.updateDevis(devis.id, devis, token);
              // Mettre à jour le devis dans la liste
              setPendingDevis(pendingDevis.map(d => d.id === updatedDevis.id ? updatedDevis : d));
              setSelectedDevisForEditing(null);
              setCurrentPage('pending-devis');
              console.log('✓ Devis mis à jour en BDD', updatedDevis);
            } catch (err) {
              console.error('❌ Erreur mise à jour devis:', err);
              alert(`Erreur lors de la mise à jour: ${err.message}`);
            }
          }}
        />
      </div>
    );
  };

  const FacturesView = () => (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Trésorerie & Factures</h2>
        <div className="flex gap-4">
          <button className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-green-700 shadow-xl shadow-green-600/20 transition-all">
            <Plus className="w-5 h-5" /> Créer une facture
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex items-center gap-6 shadow-sm">
          <div className="bg-orange-100 p-5 rounded-[1.5rem] text-orange-600"><Clock className="w-8 h-8" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Restant à percevoir</p><p className="text-3xl font-black text-slate-800">12 700 €</p></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex items-center gap-6 shadow-sm">
          <div className="bg-red-50 p-5 rounded-[1.5rem] text-red-600"><AlertCircle className="w-8 h-8" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Paiements en retard</p><p className="text-3xl font-black text-red-600">1 250 €</p></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex items-center gap-6 shadow-sm">
          <div className="bg-green-100 p-5 rounded-[1.5rem] text-green-600"><DollarSign className="w-8 h-8" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Encaissé ce mois</p><p className="text-3xl font-black text-green-600">28 400 €</p></div>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
            <tr>
              <th className="p-8">N° de Facture</th>
              <th>Client / Projet</th>
              <th>Émission</th>
              <th>Montant TTC</th>
              <th>État</th>
              <th className="text-right p-8">Fichier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {factures.map(f => (
              <tr key={f.id} className="hover:bg-slate-50 transition-all group">
                <td className="p-8 font-black text-slate-900 text-sm italic">{f.id}</td>
                <td className="font-bold text-slate-700">{f.client}</td>
                <td className="text-slate-400 text-xs font-bold">{f.date}</td>
                <td className="font-black text-slate-900 text-base">{f.montant.toLocaleString()} €</td>
                <td>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${f.statut === 'Payée' ? 'bg-green-100 text-green-600' : f.statut === 'Retard' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {f.statut}
                  </span>
                </td>
                <td className="p-8 text-right">
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-black transition-all">PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ChantiersView = () => {
    // Fonction pour parser une date au format "JJ/MM/YYYY"
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    };

    // Fonction pour obtenir les chantiers d'une date spécifique
    const getChantiersByDate = (date) => {
      return chantiers.filter(c => {
        const debut = parseDate(c.debut);
        const fin = parseDate(c.fin);
        return date >= debut && date <= fin;
      });
    };

    // Fonction pour générer les jours du mois
    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      return { daysInMonth, startingDayOfWeek, year, month };
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(calendarMonth);
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    // Générer les cellules du calendrier
    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(new Date(year, month, day));
    }

    return (
      <div className="space-y-6 animate-in">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Suivi des Projets</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Vue d'ensemble de la production</p>
          </div>
          <button 
            onClick={() => setChantiersViewMode(chantiersViewMode === 'grid' ? 'calendar' : 'grid')}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/10"
          >
            <Calendar className="w-5 h-5" /> 
            {chantiersViewMode === 'grid' ? 'Vue Calendrier' : 'Vue Grille'}
          </button>
        </div>

        {chantiersViewMode === 'grid' ? (
          // VUE GRILLE (originale)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {chantiers.map(c => (
              <div key={c.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 rounded-2xl ${c.statut === 'Terminé' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} transition-colors`}>
                    <Construction className="w-8 h-8" />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider ${c.statut === 'Terminé' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {c.statut}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{c.nom}</h3>
                <p className="text-xs text-slate-400 font-bold mb-8 uppercase tracking-widest border-l-2 border-slate-200 pl-3">Client : {c.client}</p>
                <div className="space-y-5">
                  <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Avancement</span>
                    <span className="text-blue-600">{c.avancement}%</span>
                  </div>
                  <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                    <div className={`h-full transition-all duration-1000 ${c.avancement === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${c.avancement}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                     <div>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Début</p>
                       <p className="text-sm font-black text-slate-700">{c.debut}</p>
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Livraison</p>
                       <p className="text-sm font-black text-slate-700">{c.fin}</p>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // VUE CALENDRIER
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
            {/* En-tête du calendrier */}
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {monthNames[month]} {year}
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                  className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <button
                  onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                  className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center font-black text-slate-400 text-xs uppercase tracking-widest py-3">
                  {day}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, idx) => {
                const chantiersOfDay = date ? getChantiersByDate(date) : [];
                const isToday = date && date.toDateString() === new Date().toDateString();
                const isCurrentMonth = date && date.getMonth() === month;

                return (
                  <div
                    key={idx}
                    className={`min-h-24 p-2 rounded-xl border-2 transition-all ${
                      !date
                        ? 'border-slate-50 bg-slate-50'
                        : isToday
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                    } ${!isCurrentMonth && date ? 'opacity-30' : ''}`}
                  >
                    {date && (
                      <>
                        <p className={`text-xs font-black mb-2 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                          {date.getDate()}
                        </p>
                        <div className="space-y-1">
                          {chantiersOfDay.slice(0, 2).map(c => (
                            <div
                              key={c.id}
                              className={`text-[10px] font-bold px-2 py-1 rounded text-white truncate ${
                                c.statut === 'Terminé'
                                  ? 'bg-green-600'
                                  : c.statut === 'En cours'
                                  ? 'bg-blue-600'
                                  : 'bg-orange-600'
                              }`}
                              title={c.nom}
                            >
                              {c.nom}
                            </div>
                          ))}
                          {chantiersOfDay.length > 2 && (
                            <div className="text-[9px] text-slate-400 font-bold px-2">
                              +{chantiersOfDay.length - 2} plus
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- RENDER FINAL ---
  if (!token || !user) return <LoginView />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-blue-100">
      {showUserModal && <UserModal />}

      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shrink-0 z-50 shadow-[10px_0_30px_rgba(0,0,0,0.1)]">
        <div className="p-10 flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/30">
            <HardHat className="w-7 h-7" />
          </div>
          <span className="font-black text-2xl uppercase tracking-tighter italic">BTP Pro</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-3">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'clients', label: 'Gestion des clients', icon: Users },
            { id: 'ca', label: "CA prévisionnelle", icon: BarChart3 },
            { id: 'objectifs', label: 'Objectifs Commerciaux', icon: TrendingUp },
            { id: 'kanban', label: 'Pipeline Devis', icon: Columns3 },
            { id: 'ia-generator', label: 'Devis IA Manager', icon: Wand2 },
            { id: 'factures', label: 'Facturation', icon: Receipt },
            { id: 'chantiers', label: 'Suivi Chantiers', icon: Construction },
            { id: 'users', label: 'Utilisateurs', icon: UserCog },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all font-black uppercase text-[11px] tracking-[0.2em] ${currentPage === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 translate-x-1' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
            >
              <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-white' : 'text-slate-600'}`} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto">
          <div className="bg-slate-800/50 backdrop-blur-md p-5 rounded-[2rem] flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black shrink-0 text-white shadow-lg">
                {user.full_name?.substring(0,2).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-black uppercase text-white truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-2"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-12 py-8 flex justify-between items-center z-10 shrink-0 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
            {currentPage === 'dashboard' && 'Tableau de bord activité'}
            {currentPage === 'clients' && 'Base de données CRM'}
            {currentPage === 'ca' && 'CA prévisionnelle'}
            {currentPage === 'objectifs' && 'Objectifs Commerciaux'}
            {currentPage === 'kanban' && 'Pipeline Devis'}
            {currentPage === 'ia-generator' && 'Intelligence Artificielle'}
            {currentPage === 'pending-devis' && 'Devis en attente'}
            {currentPage === 'editing-devis' && 'Modification Devis'}
            {currentPage === 'factures' && 'Suivi de trésorerie'}
            {currentPage === 'chantiers' && 'Production & Chantiers'}
            {currentPage === 'users' && 'Administration des comptes'}
          </h1>
          <div className="flex items-center gap-6">
            <div className="relative group hidden xl:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
              <input className="bg-slate-50 border-2 border-slate-50 pl-12 pr-6 py-3 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white w-72 transition-all" placeholder="Recherche globale..." />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && <DashboardView />}
            {currentPage === 'clients' && <ClientsViewWrapper />}
            {currentPage === 'ia-generator' && <DevisIAViewWrapper />}
            {currentPage === 'ca' && (
              <CaPrevisionnelleView
                token={token}
                refreshKey={devisRefreshKey}
                onEditDevis={(devis) => {
                  setGeneratedDevis(devis);
                  setCurrentPage('editing-devis');
                }}
              />
            )}
            {currentPage === 'objectifs' && (
              <ObjectifsCommerciauxView
                token={token}
                refreshKey={devisRefreshKey}
                onEditDevis={(devis) => {
                  setGeneratedDevis(devis);
                  setCurrentPage('editing-devis');
                }}
              />
            )}
            {currentPage === 'kanban' && (
              <KanbanDevisView
                token={token}
                refreshKey={devisRefreshKey}
                onStatusChange={triggerDevisRefresh}
                onEditDevis={(devis) => {
                  setGeneratedDevis(devis);
                  setCurrentPage('editing-devis');
                }}
              />
            )}
            {currentPage === 'editing-devis' && (
              <>
                {!selectedDevisForEditing && (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                    <p className="text-slate-500 text-lg">Aucun devis sélectionné</p>
                    <button 
                      onClick={() => setCurrentPage('pending-devis')}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Retour
                    </button>
                  </div>
                )}
                {selectedDevisForEditing && <EditSelectedDevisWrapper />}
              </>
            )}
            {currentPage === 'pending-devis' && <PendingDevisView 
              pendingDevis={pendingDevis} 
              setPendingDevis={setPendingDevis} 
              onBackToDashboard={() => setCurrentPage('dashboard')}
              onEditDevis={(devis) => {
                setSelectedDevisForEditing(devis);
                setCurrentPage('editing-devis');
              }}
              token={token}
            />}
            {currentPage === 'factures' && <FacturesView />}
            {currentPage === 'chantiers' && <ChantiersView />}
            {currentPage === 'users' && <UsersView />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
