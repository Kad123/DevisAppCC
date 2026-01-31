import React, { useEffect, useState } from 'react';
import { devisAPI } from './api/devisAPI';
import { Target, FileText, CheckCircle, Clock, XCircle, TrendingUp, AlertCircle } from 'lucide-react';

const ObjectifsCommerciauxView = ({ token }) => {
  const [allDevis, setAllDevis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const devis = await devisAPI.getAllDevis(token);

      // Charger les infos client/projet pour chaque devis
      const detailed = await Promise.all(devis.map(async (d) => {
        let client = null;
        let projet = null;

        try {
          if (d.client_id) {
            client = await devisAPI.getClientById(d.client_id, token);
          }
        } catch (e) { /* ignore */ }

        try {
          if (d.projet_id) {
            projet = await devisAPI.getProjetById(d.projet_id, token);
          }
        } catch (e) { /* ignore */ }

        return {
          ...d,
          client_name: client ? `${client.prenom_contact || ''} ${client.nom_contact || ''}`.trim() || client.nom_societe : '—',
          projet_name: projet ? projet.nom : '—'
        };
      }));

      setAllDevis(detailed);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  // Statistiques par statut
  const stats = {
    total: allDevis.length,
    brouillon: allDevis.filter(d => d.statut === 'Brouillon').length,
    envoye: allDevis.filter(d => d.statut === 'Envoyé').length,
    signe: allDevis.filter(d => ['Validé', 'Accepté', 'Signé'].includes(d.statut)).length,
    refuse: allDevis.filter(d => d.statut === 'Refusé').length,
  };

  // Montants
  const montantTotal = allDevis.reduce((sum, d) => sum + (d.total_ht || 0), 0);
  const montantSigne = allDevis
    .filter(d => ['Validé', 'Accepté', 'Signé'].includes(d.statut))
    .reduce((sum, d) => sum + (d.total_ht || 0), 0);
  const tauxConversion = stats.total > 0 ? Math.round((stats.signe / stats.total) * 100) : 0;

  const getStatutStyle = (statut) => {
    switch (statut) {
      case 'Validé':
      case 'Accepté':
      case 'Signé':
        return 'bg-green-100 text-green-600';
      case 'Envoyé':
        return 'bg-blue-100 text-blue-600';
      case 'Refusé':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* En-tête */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Objectifs Commerciaux</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Suivi de l'ensemble des devis et performances
          </p>
        </div>
        <div className="bg-purple-100 p-4 rounded-2xl">
          <Target className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="bg-slate-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Total Devis</p>
          <p className="text-2xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Devis Signés</p>
          <p className="text-2xl font-black text-green-600">{stats.signe}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">En attente</p>
          <p className="text-2xl font-black text-orange-600">{stats.brouillon + stats.envoye}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Taux Conversion</p>
          <p className="text-2xl font-black text-purple-600">{tauxConversion}%</p>
        </div>
      </div>

      {/* Montants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Montant Total Devis</p>
          <p className="text-4xl font-black">{montantTotal.toLocaleString()} € <span className="text-lg text-slate-400">HT</span></p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-[2rem] text-white">
          <p className="text-green-200 text-xs font-black uppercase tracking-widest mb-2">Montant Devis Signés</p>
          <p className="text-4xl font-black">{montantSigne.toLocaleString()} € <span className="text-lg text-green-200">HT</span></p>
        </div>
      </div>

      {/* Tableau complet */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {loading && <p className="p-8 text-center text-slate-500">Chargement...</p>}
        {error && <p className="p-8 text-center text-red-600">{error}</p>}

        {!loading && allDevis.length === 0 && (
          <div className="p-16 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Aucun devis créé</p>
          </div>
        )}

        {allDevis.length > 0 && (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <tr>
                <th className="p-6">Devis</th>
                <th>Client</th>
                <th>Projet</th>
                <th>Date</th>
                <th>Statut</th>
                <th className="text-right">Total HT</th>
                <th className="text-right p-6">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allDevis.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 font-black text-slate-900">{d.nom}</td>
                  <td className="text-slate-600 font-medium">{d.client_name}</td>
                  <td className="text-slate-600 font-medium">{d.projet_name}</td>
                  <td className="text-slate-500 text-sm">
                    {d.date_emission ? new Date(d.date_emission).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatutStyle(d.statut)}`}>
                      {d.statut}
                    </span>
                  </td>
                  <td className="text-right font-black text-slate-800">{d.total_ht?.toLocaleString()} €</td>
                  <td className="p-6 text-right font-black text-slate-900">{d.total_ttc?.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ObjectifsCommerciauxView;
