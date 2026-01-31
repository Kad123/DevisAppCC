import React, { memo } from 'react';
import { ArrowLeft, Eye, Trash2, FileText, DollarSign, Calendar } from 'lucide-react';
import { devisAPI } from './api/devisAPI';

const PendingDevisView = memo(({ pendingDevis, setPendingDevis, onBackToDashboard, onEditDevis, token }) => {
  const handleDeleteDevis = async (id) => {
    try {
      await devisAPI.deleteDevis(id, token);
      setPendingDevis(pendingDevis.filter(d => d.id !== id));
      console.log('✓ Devis supprimé');
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      alert(`Erreur lors de la suppression: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black uppercase text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Retour au Dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Devis en Attente</h1>
          <p className="text-slate-500 text-lg font-medium mt-2">{pendingDevis.length} devis non acceptés</p>
        </div>
        <div className="bg-orange-100 p-6 rounded-3xl">
          <FileText className="w-12 h-12 text-orange-600" />
        </div>
      </div>

      {/* Liste des devis */}
      {pendingDevis.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-100 p-8 rounded-full">
              <FileText className="w-16 h-16 text-slate-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Aucun devis en attente</h2>
          <p className="text-slate-500 text-lg">Générez de nouveaux devis pour les voir apparaître ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {pendingDevis.map(devis => (
            <div key={devis.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* En-tête du card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{devis.nom}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Montant HT</p>
                    <p className="text-3xl font-black">{devis.total_ht?.toLocaleString()} €</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">TTC ({devis.taux_tva}%)</p>
                    <p className="text-2xl font-black">{(devis.total_ht * (1 + devis.taux_tva / 100))?.toLocaleString()} €</p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-8 space-y-6">
                {/* Résumé des lots */}
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Lots ({devis.lots.length})</p>
                  <div className="space-y-2">
                    {devis.lots.map((lot, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-700">{lot.nom}</span>
                        <span className="font-black text-slate-900">{lot.total_lot_ht?.toLocaleString()} €</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Créé</p>
                        <p className="font-bold text-slate-700">{new Date(devis.id).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">TVA</p>
                        <p className="font-bold text-slate-700">{devis.taux_tva}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="bg-slate-50 p-6 flex gap-4 border-t border-slate-100">
                <button
                  onClick={() => onEditDevis(devis)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" /> Voir & Modifier
                </button>
                <button
                  onClick={() => handleDeleteDevis(devis.id)}
                  className="px-6 py-3 border-2 border-red-200 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

PendingDevisView.displayName = 'PendingDevisView';

export default PendingDevisView;
