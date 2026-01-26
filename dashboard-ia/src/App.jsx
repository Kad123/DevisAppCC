import React, { useState, useEffect } from 'react';
import { 
  HardHat, Wand2, FileText, Users, CheckCircle2, AlertCircle, 
  Loader2, Send, Calculator, Save, RefreshCw, LayoutDashboard, 
  Receipt, Map, Plus, Search, MoreVertical, LogOut, TrendingUp,
  Clock, CheckCircle, Construction, UserPlus, DollarSign, Calendar,
  ShieldCheck, Zap, BarChart3, ChevronRight
} from 'lucide-react';

// --- CONFIGURATION ---
const API_KEY = ""; // Insérez votre clé Gemini ici

const App = () => {
  // Gestion de l'état global
  const [user, setUser] = useState(null); 
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedDevis, setGeneratedDevis] = useState(null);
  
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

  const [factures, setFactures] = useState([
    { id: "FAC-2026-001", client: "Jean Durand", montant: 4500, date: "02/01/2026", statut: "Payée" },
    { id: "FAC-2026-002", client: "Mairie de Lyon", montant: 8200, date: "05/01/2026", statut: "Attente" },
    { id: "FAC-2026-003", client: "Sarl BatiPlus", montant: 1250, date: "06/01/2026", statut: "Retard" }
  ]);

  // --- LOGIQUE DE CONNEXION ---
  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: "Marc Lepic", role: "Artisan Gérant" });
  };

  // --- LOGIQUE IA (DEVIS) ---
  const handleGenerateIA = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const systemPrompt = `Expert BTP. JSON format: { "nom": "", "taux_tva": 10.0, "lots": [ { "nom": "", "ordre": 1, "lignes_poste": [ { "designation": "", "unite": "", "quantite": 1, "prix_unitaire_ht": 0 } ] } ] }`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Devis détaillé pour : ${prompt}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const result = await response.json();
      const parsed = JSON.parse(result.candidates[0].content.parts[0].text);
      
      let totalHt = 0;
      parsed.lots.forEach(lot => {
        lot.total_lot_ht = lot.lignes_poste.reduce((sum, l) => sum + (l.quantite * l.prix_unitaire_ht), 0);
        totalHt += lot.total_lot_ht;
      });
      parsed.total_ht = totalHt;
      setGeneratedDevis(parsed);
    } catch (err) {
      console.error("Erreur IA", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- VUES ---

  const LoginView = () => (
    <div className="min-h-screen flex bg-white font-sans selection:bg-blue-100">
      {/* Panneau Gauche : Formulaire */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-white relative z-10 shadow-2xl">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/30">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <span className="font-black text-2xl uppercase tracking-tighter text-slate-900 italic">BTP Manager</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Content de vous revoir !</h2>
            <p className="text-slate-500 font-medium text-lg">Gérez vos chantiers et vos devis IA en toute simplicité.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Professionnel</label>
              <input 
                type="email" 
                required 
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:ring-0 focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold" 
                placeholder="marc@btp-expert.fr" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Mot de passe</label>
                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Oublié ?</a>
              </div>
              <input 
                type="password" 
                required 
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:ring-0 focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-semibold" 
                placeholder="••••••••" 
              />
            </div>
            
            <div className="flex items-center gap-3 py-1">
              <input type="checkbox" id="remember" className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-600 transition-all cursor-pointer" />
              <label htmlFor="remember" className="text-sm font-bold text-slate-600 cursor-pointer select-none">Mémoriser ma session</label>
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-[0.15em] hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              Se Connecter <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 flex justify-center">
            <p className="text-sm text-slate-500 font-medium">
              Pas encore client ? <a href="#" className="text-blue-600 font-black hover:underline ml-1 uppercase text-xs tracking-wider">Demander une démo</a>
            </p>
          </div>
        </div>
      </div>

      {/* Panneau Droit : Visuel SaaS Premium */}
      <div className="hidden lg:flex flex-[1.2] bg-slate-900 relative items-center justify-center overflow-hidden">
        {/* Effets de lumière */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] -mr-64 -mt-64 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        
        {/* Grille technique */}
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
              { icon: ShieldCheck, title: "Sécurisation Totale", desc: "Données chiffrées de bout en bout pour vos clients." },
              { icon: BarChart3, title: "Rentabilité Maîtrisée", desc: "Analyse automatique de vos marges sur chaque chantier." },
              { icon: Wand2, title: "Rapidité d'Exécution", desc: "Un devis complexe généré en moins de 45 secondes." }
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

      {/* Styles globaux injectés pour la police Inter et les animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .animate-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  // --- RESTE DU CODE (Dashboard, CRM, IA...) ---
  const DashboardView = () => (
    <div className="space-y-8 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "CA Prévisionnel", val: "45 200 €", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
          { label: "Chantiers Actifs", val: chantiers.filter(c => c.statut !== "Terminé").length, icon: Construction, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Devis en attente", val: "5", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
          { label: "Clients", val: clients.length, icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
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
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)]" style={{ width: `${c.avancement}%` }}></div>
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
              <div key={f.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
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

  const ClientsView = () => (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestion CRM</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Base de données prospects & clients</p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
          <UserPlus className="w-5 h-5" /> Ajouter
        </button>
      </div>
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
            <tr>
              <th className="p-8">Identité / Entreprise</th>
              <th>Statut</th>
              <th>Localisation</th>
              <th>Contact</th>
              <th className="text-right p-8">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all italic text-xs">
                      {c.nom.substring(0,2).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-700">{c.nom}</span>
                  </div>
                </td>
                <td>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${c.type === 'Client' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {c.type}
                  </span>
                </td>
                <td className="text-slate-500 text-sm font-medium">{c.ville}</td>
                <td className="text-slate-500 text-sm font-medium">{c.telephone}</td>
                <td className="p-8 text-right">
                  <button className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 transition-all"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const DevisIAView = () => (
    <div className="space-y-8 animate-in">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <Wand2 className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Assistant de Chiffrage IA</h2>
          <p className="text-slate-500 text-lg font-medium mb-10 max-w-2xl">Décrivez le projet en langage naturel. L'intelligence artificielle segmente les lots et applique les tarifs du marché.</p>
          <div className="relative group">
            <textarea 
              className="w-full h-48 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] outline-none focus:border-blue-600 focus:bg-white text-slate-700 text-lg font-medium resize-none transition-all shadow-inner"
              placeholder="Ex: Rénovation d'un studio de 20m2 à Nantes : dépose cuisine, pose parquet chêne, peinture satinée et mise aux normes électriques."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button 
              onClick={handleGenerateIA}
              disabled={isGenerating || !prompt}
              className="absolute bottom-8 right-8 bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-sm tracking-widest flex items-center gap-4 hover:bg-blue-700 shadow-2xl shadow-blue-600/40 disabled:bg-slate-200 transition-all active:scale-95"
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              {isGenerating ? 'Analyse Métier...' : 'Chiffrer le Projet'}
            </button>
          </div>
        </div>
      </div>

      {generatedDevis && (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in">
           <div className="bg-slate-900 p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
              <div className="absolute top-0 right-0 p-12 opacity-[0.05]">
                <Calculator className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase bg-blue-600 px-3 py-1 rounded-full mb-4 inline-block tracking-[0.2em] shadow-lg shadow-blue-600/30">Estimation Automatisée</span>
                <h3 className="text-4xl font-black uppercase tracking-tight italic">{generatedDevis.nom}</h3>
              </div>
              <div className="text-left md:text-right bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 min-w-[250px] relative z-10">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Estimé HT</p>
                <p className="text-5xl font-black text-blue-400">{generatedDevis.total_ht?.toLocaleString()} €</p>
              </div>
           </div>
           <div className="p-12 space-y-16">
              {generatedDevis.lots.map((lot, idx) => (
                <div key={idx} className="space-y-6">
                  <div className="flex justify-between items-center border-b-2 border-slate-50 pb-4">
                    <h4 className="font-black text-slate-800 uppercase text-sm tracking-[0.15em] flex items-center gap-4">
                       <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs shadow-xl">{lot.ordre}</span> {lot.nom}
                    </h4>
                    <span className="text-sm font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{lot.total_lot_ht?.toLocaleString()} € HT</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-slate-400 text-left font-black uppercase text-[10px] tracking-[0.2em]"><th className="pb-6 px-4">Prestation</th><th className="pb-6 text-center w-32">Quantité</th><th className="pb-6 text-right w-32">Prix U. HT</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {lot.lignes_poste.map((ligne, i) => (
                          <tr key={i} className="group hover:bg-blue-50/50 transition-all">
                            <td className="py-5 px-4 font-bold text-slate-700 text-base">{ligne.designation}</td>
                            <td className="py-5 text-center text-slate-500 font-bold bg-slate-50/50 group-hover:bg-white rounded-xl mx-2">{ligne.quantite} <span className="text-[10px] uppercase opacity-50 ml-1">{ligne.unite}</span></td>
                            <td className="py-5 text-right font-black text-slate-900 text-base">{ligne.prix_unitaire_ht} €</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
           </div>
           <div className="bg-slate-50 p-10 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100">
              <div className="flex items-center gap-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">TVA Appliquée</span>
                  <span className="text-lg font-black text-slate-800">{generatedDevis.taux_tva}%</span>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Validité</span>
                  <span className="text-lg font-black text-slate-800">30 Jours</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setGeneratedDevis(null)} className="px-8 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-white transition-all">Recommencer</button>
                <button className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                  <Save className="w-5 h-5" /> Transformer en Projet
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  const FacturesView = () => (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Trésorerie & Factures</h2>
        <div className="flex gap-4">
          <button className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Historique</button>
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

  const ChantiersView = () => (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Suivi des Projets</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Vue d'ensemble de la production</p>
        </div>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/10">
          <Calendar className="w-5 h-5" /> Vue Calendrier
        </button>
      </div>
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
    </div>
  );

  // --- RENDER FINAL ---
  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-blue-100">
      {/* Sidebar de navigation */}
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
            { id: 'clients', label: 'Fichier CRM', icon: Users },
            { id: 'ia-generator', label: 'Devis IA Manager', icon: Wand2 },
            { id: 'factures', label: 'Facturation', icon: Receipt },
            { id: 'chantiers', label: 'Suivi Chantiers', icon: Construction },
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
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black shrink-0 text-white shadow-lg">ML</div>
              <div className="truncate">
                <p className="text-xs font-black uppercase text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button onClick={() => setUser(null)} className="text-slate-500 hover:text-red-400 transition-colors p-2"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </aside>

      {/* Contenu de la page */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-12 py-8 flex justify-between items-center z-10 shrink-0 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
            {currentPage === 'dashboard' && 'Tableau de bord activité'}
            {currentPage === 'clients' && 'Base de données CRM'}
            {currentPage === 'ia-generator' && 'Intelligence Artificielle'}
            {currentPage === 'factures' && 'Suivi de trésorerie'}
            {currentPage === 'chantiers' && 'Production & Chantiers'}
          </h1>
          <div className="flex items-center gap-6">
            <div className="relative group hidden xl:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
              <input className="bg-slate-50 border-2 border-slate-50 pl-12 pr-6 py-3 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white w-72 transition-all" placeholder="Recherche globale..." />
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border-2 border-blue-100 cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-600/10">
              <Plus className="w-6 h-6" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && <DashboardView />}
            {currentPage === 'clients' && <ClientsView />}
            {currentPage === 'ia-generator' && <DevisIAView />}
            {currentPage === 'factures' && <FacturesView />}
            {currentPage === 'chantiers' && <ChantiersView />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;