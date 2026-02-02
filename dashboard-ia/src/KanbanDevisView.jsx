import React, { useEffect, useState, useCallback } from 'react';
import Toast from './Toast';
import { devisAPI } from './api/devisAPI';
import {
  FileText, Send, CheckCircle, XCircle, GripVertical,
  Eye, ArrowRight, Loader2, RefreshCw
} from 'lucide-react';

const STATUTS = [
  { id: 'Brouillon', label: 'Brouillon', color: 'slate', icon: FileText },
  { id: 'Envoyé', label: 'Envoyé', color: 'blue', icon: Send },
  { id: 'Validé', label: 'Validé / Signé', color: 'green', icon: CheckCircle, includes: ['Validé', 'Accepté', 'Signé'] },
  { id: 'Refusé', label: 'Refusé', color: 'red', icon: XCircle },
];

const KanbanDevisView = ({ token, onEditDevis, refreshKey, onStatusChange }) => {
  // Toast notification
  const [toast, setToast] = useState({ message: '', type: 'error' });
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  const [allDevis, setAllDevis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [draggedDevis, setDraggedDevis] = useState(null);

  useEffect(() => {
    if (token) loadData();
  }, [token, refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const devis = await devisAPI.getAllDevis(token);
      setAllDevis(devis);
    } catch (err) {
      console.error('Erreur chargement devis:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDevisByStatut = (statutConfig) => {
    if (statutConfig.includes) {
      return allDevis.filter(d => statutConfig.includes.includes(d.statut));
    }
    return allDevis.filter(d => d.statut === statutConfig.id);
  };

  const handleDragStart = (e, devis) => {
    setDraggedDevis(devis);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatut) => {
    e.preventDefault();
    if (!draggedDevis || draggedDevis.statut === newStatut) {
      setDraggedDevis(null);
      return;
    }

    setUpdating(draggedDevis.id);
    try {
      await devisAPI.updateDevisStatut(draggedDevis.id, newStatut, token);
      // Mettre à jour localement
      setAllDevis(prev => prev.map(d =>
        d.id === draggedDevis.id ? { ...d, statut: newStatut } : d
      ));
      // Notifier le parent pour rafraîchir les autres vues
      onStatusChange?.();
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      showToast('Erreur lors du changement de statut', 'error');
    } finally {
      setUpdating(null);
      setDraggedDevis(null);
    }
    {/* Toast global */}
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast({ ...toast, message: '' })}
    />
  };

  const getColorClasses = (color) => {
    const colors = {
      slate: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600', header: 'bg-slate-200' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600', header: 'bg-blue-100' },
      green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600', header: 'bg-green-100' },
      red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600', header: 'bg-red-100' },
    };
    return colors[color] || colors.slate;
  };

  return (
    <div className="space-y-6 animate-in">
      {/* En-tête */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Pipeline Devis</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Glissez-déposez les devis pour changer leur statut
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-slate-100 p-3 rounded-2xl hover:bg-slate-200 transition-all"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUTS.map(statutConfig => {
          const devisInColumn = getDevisByStatut(statutConfig);
          const colorClasses = getColorClasses(statutConfig.color);
          const Icon = statutConfig.icon;

          return (
            <div
              key={statutConfig.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, statutConfig.id)}
              className={`rounded-[2rem] border-2 ${colorClasses.border} ${colorClasses.bg} min-h-[500px] flex flex-col transition-all ${
                draggedDevis ? 'ring-2 ring-offset-2 ring-blue-400' : ''
              }`}
            >
              {/* Header colonne */}
              <div className={`${colorClasses.header} p-4 rounded-t-[1.8rem] border-b ${colorClasses.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                    <span className={`font-black uppercase text-sm tracking-wider ${colorClasses.text}`}>
                      {statutConfig.label}
                    </span>
                  </div>
                  <span className={`${colorClasses.text} bg-white px-3 py-1 rounded-full text-xs font-black`}>
                    {devisInColumn.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : devisInColumn.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Aucun devis
                  </div>
                ) : (
                  devisInColumn.map(devis => (
                    <div
                      key={devis.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, devis)}
                      className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                        updating === devis.id ? 'opacity-50' : ''
                      } ${draggedDevis?.id === devis.id ? 'opacity-50 scale-95' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{devis.nom}</h4>
                          <p className="text-slate-500 text-xs mt-1">
                            {devis.total_ht?.toLocaleString()} € HT
                          </p>
                          {devis.date_emission && (
                            <p className="text-slate-400 text-[10px] mt-1">
                              {new Date(devis.date_emission).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        {updating === devis.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <button
                            onClick={() => onEditDevis?.(devis)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende workflow */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Workflow recommandé</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {STATUTS.map((s, i) => {
            const colorClasses = getColorClasses(s.color);
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${colorClasses.bg} ${colorClasses.border} border`}>
                  <Icon className={`w-4 h-4 ${colorClasses.text}`} />
                  <span className={`text-sm font-bold ${colorClasses.text}`}>{s.label}</span>
                </div>
                {i < STATUTS.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-300" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KanbanDevisView;
