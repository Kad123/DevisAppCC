import React, { useEffect, useState } from 'react';
import { devisAPI } from './api/devisAPI';
import { TrendingUp, FileCheck, Calendar, DollarSign } from 'lucide-react';

const CaPrevisionnelleView = ({ token }) => {
  const [devisSigned, setDevisSigned] = useState([]);
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
      const allDevis = await devisAPI.getAllDevis(token);

      // Filtrer uniquement les devis signés (Validé ou Accepté)
      const signed = allDevis.filter(d =>
        d.statut === 'Validé' || d.statut === 'Accepté' || d.statut === 'Signé'
      );

      // Charger les infos client/projet pour chaque devis
      const detailed = await Promise.all(signed.map(async (devis) => {
        let client = null;
        let projet = null;

        try {
          if (devis.client_id) {
            client = await devisAPI.getClientById(devis.client_id, token);
          }
        } catch (e) { /* ignore */ }

        try {
          if (devis.projet_id) {
            projet = await devisAPI.getProjetById(devis.projet_id, token);
          }
        } catch (e) { /* ignore */ }

        return {
          ...devis,
          client_name: client ? `${client.prenom_contact || ''} ${client.nom_contact || ''}`.trim() || client.nom_societe : '—',
          projet_name: projet ? projet.nom : '—'
        };
      }));

      setDevisSigned(detailed);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur chargement CA prévisionnelle');
    } finally {
      setLoading(false);
    }
  };

  // Calcul du total CA
  const totalHT = devisSigned.reduce((sum, d) => sum + (d.total_ht || 0), 0);
  const totalTTC = devisSigned.reduce((sum, d) => sum + (d.total_ttc || 0), 0);

  return (
    <div className="space-y-6 animate-in">
      {/* En-tête */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">CA Prévisionnelle</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Devis signés en attente de facturation
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-2xl">
          <TrendingUp className="w-8 h-8 text-green-600" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <FileCheck className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Devis signés</p>
          <p className="text-2xl font-black text-slate-800">{devisSigned.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Total HT</p>
          <p className="text-2xl font-black text-green-600">{totalHT.toLocaleString()} €</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">Total TTC</p>
          <p className="text-2xl font-black text-purple-600">{totalTTC.toLocaleString()} €</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {loading && <p className="p-8 text-center text-slate-500">Chargement...</p>}
        {error && <p className="p-8 text-center text-red-600">{error}</p>}

        {!loading && devisSigned.length === 0 && (
          <div className="p-16 text-center">
            <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Aucun devis signé pour le moment</p>
            <p className="text-slate-400 text-sm mt-2">Les devis avec statut "Validé" ou "Accepté" apparaîtront ici</p>
          </div>
        )}

        {devisSigned.length > 0 && (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <tr>
                <th className="p-6">Devis</th>
                <th>Client</th>
                <th>Projet</th>
                <th>Date signature</th>
                <th>Statut</th>
                <th className="text-right">Total HT</th>
                <th className="text-right p-6">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devisSigned.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 font-black text-slate-900">{d.nom}</td>
                  <td className="text-slate-600 font-medium">{d.client_name}</td>
                  <td className="text-slate-600 font-medium">{d.projet_name}</td>
                  <td className="text-slate-500 text-sm">
                    {d.date_emission ? new Date(d.date_emission).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-600">
                      {d.statut}
                    </span>
                  </td>
                  <td className="text-right font-black text-slate-800">{d.total_ht?.toLocaleString()} €</td>
                  <td className="p-6 text-right font-black text-slate-900">{d.total_ttc?.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white">
              <tr>
                <td colSpan="5" className="p-6 font-black uppercase tracking-wider">Total CA Prévisionnelle</td>
                <td className="text-right font-black text-xl">{totalHT.toLocaleString()} €</td>
                <td className="p-6 text-right font-black text-xl text-green-400">{totalTTC.toLocaleString()} €</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default CaPrevisionnelleView;
