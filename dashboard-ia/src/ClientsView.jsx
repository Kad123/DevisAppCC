import React, { memo, useState, useCallback } from 'react';
import Toast from './Toast';
import { Plus, MoreVertical, ArrowLeft, Edit3, Trash2, Mail, Phone, MapPin, Building2, User, Calendar } from 'lucide-react';
import { authFetch } from './api/authAPI';

const ClientsView = memo(({ clients = [], onRefresh, token }) => {
  // Toast notification
  const [toast, setToast] = useState({ message: '', type: 'error' });
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    type: 'Prospect'
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleAddClient = () => {
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      code_postal: '',
      type: 'Prospect'
    });
    setIsCreatingNew(true);
  };

  const handleEditClient = (client) => {
    // Mapper les données de l'API vers le formulaire
    const formattedClient = {
      nom: client.nom_societe || client.nom_contact || '',
      email: client.email || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      ville: '',
      code_postal: '',
      type: 'Client'
    };
    setFormData(formattedClient);
    setSelectedClientId(client.id);
  };

  const handleSaveClient = async () => {
    try {
      // Mapper les données du formulaire au format attendu par l'API
      const apiData = {
        nom_societe: formData.nom,
        nom_contact: formData.nom,
        prenom_contact: formData.email?.split('@')[0] || 'Contact',
        email: formData.email || '',
        telephone: formData.telephone || null,
        adresse: formData.adresse ? `${formData.adresse}, ${formData.code_postal} ${formData.ville}` : null
      };

      const method = isCreatingNew ? 'POST' : 'PUT';
      const endpoint = isCreatingNew ? '/crm/clients/' : `/crm/clients/${selectedClientId}`;

      const response = await authFetch(`http://localhost:8000${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de la sauvegarde');
      }

      console.log('✓ Client sauvegardé');
      setSelectedClientId(null);
      setIsCreatingNew(false);
      onRefresh?.();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showToast(`Erreur: ${err.message}`, 'error');
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const response = await authFetch(`http://localhost:8000/crm/clients/${clientId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      console.log('✓ Client supprimé');
      onRefresh?.();
    } catch (err) {
      console.error('❌ Erreur:', err);
      showToast(`Erreur: ${err.message}`, 'error');
    }
    {/* Toast global */}
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast({ ...toast, message: '' })}
    />
  };

  // === VUE FICHE CLIENT ===
  if (selectedClientId && !isCreatingNew) {
    return (
      <div className="space-y-6 animate-in">
        <button
          onClick={() => setSelectedClientId(null)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black uppercase text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Retour
        </button>

        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-12 text-white flex justify-between items-start">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight mb-2">{selectedClient?.nom_societe || selectedClient?.nom_contact || 'Client'}</h2>
              <p className="text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit bg-blue-500/20 text-blue-300">
                Client
              </p>
            </div>
            <button
              onClick={() => handleEditClient(selectedClient)}
              className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-12 space-y-8">
            {/* Contact */}
            <div>
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-6">Coordonnées</h3>
              <div className="space-y-4">
                {selectedClient?.email && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                      <p className="font-bold text-slate-800">{selectedClient?.email}</p>
                    </div>
                  </div>
                )}
                {selectedClient?.telephone && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Téléphone</p>
                      <p className="font-bold text-slate-800">{selectedClient?.telephone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse */}
            {selectedClient?.adresse && (
              <div>
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-6">Adresse</h3>
                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">{selectedClient?.adresse}</p>
                    <p className="text-slate-500 text-sm">{selectedClient?.code_postal} {selectedClient?.ville}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-slate-100 pt-8 flex gap-4">
              <button
                onClick={() => handleDeleteClient(selectedClientId)}
                className="flex-1 px-6 py-3 border-2 border-red-200 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-50 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4 inline mr-2" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === VUE ÉDITION / CRÉATION ===
  if (isCreatingNew || (selectedClientId && selectedClient)) {
    return (
      <div className="space-y-6 animate-in">
        <button
          onClick={() => {
            setSelectedClientId(null);
            setIsCreatingNew(false);
          }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black uppercase text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> {isCreatingNew ? 'Annuler' : 'Retour'}
        </button>

        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 p-12 space-y-8">
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
            {isCreatingNew ? 'Nouveau Client' : `Modifier ${formData.nom}`}
          </h2>

          {/* Formulaire */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-3 block">Nom / Entreprise *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom du client"
                className="w-full px-6 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-3 block">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-6 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none font-bold"
              >
                <option>Prospect</option>
                <option>Client</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-3 block">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-6 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-3 block">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone || ''}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="w-full px-6 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none font-bold"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-black uppercase text-slate-400 mb-3 block">Adresse</label>
              <input
                type="text"
                value={formData.adresse || ''}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="123 Rue de la Paix"
                className="w-full px-6 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-3 block">Code Postal</label>
              <input
                type="text"
                value={formData.code_postal || ''}
                onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                placeholder="75000"
                className="w-full px-6 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-3 block">Ville</label>
              <input
                type="text"
                value={formData.ville || ''}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                placeholder="Paris"
                className="w-full px-6 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setSelectedClientId(null);
                setIsCreatingNew(false);
              }}
              className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveClient}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === VUE LISTE ===
  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestion Client</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Base de données prospects & clients ({clients?.length || 0})</p>
        </div>
        <button
          onClick={handleAddClient}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Ajouter Client
        </button>
      </div>

      {clients?.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-16 text-center">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-800 mb-2">Aucun client</h3>
          <p className="text-slate-500 mb-8">Commencez par ajouter vos premiers clients</p>
          <button
            onClick={handleAddClient}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" /> Ajouter un client
          </button>
        </div>
      ) : (
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
              {clients?.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td
                    onClick={() => setSelectedClientId(c.id)}
                    className="p-8"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all italic text-xs">
                        {(c.nom_societe || c.nom_contact || c.nom || 'C')?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700">{c.nom_societe || c.nom_contact || c.nom}</span>
                    </div>
                  </td>
                  <td
                    onClick={() => setSelectedClientId(c.id)}
                  >
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-600">
                      Client
                    </span>
                  </td>
                  <td
                    onClick={() => setSelectedClientId(c.id)}
                    className="text-slate-500 text-sm font-medium"
                  >
                    {c.adresse ? c.adresse.substring(0, 20) : '-'}
                  </td>
                  <td
                    onClick={() => setSelectedClientId(c.id)}
                    className="text-slate-500 text-sm font-medium"
                  >
                    {c.email}
                  </td>
                  <td className="p-8 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClient(c.id);
                      }}
                      className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

ClientsView.displayName = 'ClientsView';

export default ClientsView;
