import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import SignaturePad from './SignaturePad';
import Toast from './Toast';
import { Trash2, Plus, Save, Edit3, Check, Send, XCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { devisAPI } from './api/devisAPI';
import FavorisLibrary from './FavorisLibrary';
import emailjs from '@emailjs/browser';

const WORKFLOW_STATUTS = [
  { id: 'Brouillon', label: 'Brouillon', color: 'slate', icon: FileText, next: 'Envoyé' },
  { id: 'Envoyé', label: 'Envoyé', color: 'blue', icon: Send, next: 'Validé', canRefuse: true },
  { id: 'Validé', label: 'Accepté', color: 'green', icon: Check, next: null },
  { id: 'Refusé', label: 'Refusé', color: 'red', icon: XCircle, next: null },
];

const DevisEditableView = memo(({ generatedDevis, setGeneratedDevis, onDevisSaved, token, onStatusChange }) => {
  // Config EmailJS (à personnaliser avec vos identifiants EmailJS)
  const EMAILJS_SERVICE_ID = 'service_xxxxx';
  const EMAILJS_TEMPLATE_ID = 'template_xxxxx';
  const EMAILJS_USER_ID = 'user_xxxxx';

  const [sendingMail, setSendingMail] = useState(false);
  const [mailSent, setMailSent] = useState(false);

  // Signature
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);

  // Toast notification
  const [toast, setToast] = useState({ message: '', type: 'error' });
  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  // Recherche prédictive favoris
  const [favorisSuggestions, setFavorisSuggestions] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [searchActiveLot, setSearchActiveLot] = useState(null);
  const searchTimeout = useRef();

  // Fonction d'envoi d'email
  const handleSendMail = async () => {
    setSendingMail(true);
    setMailSent(false);
    try {
      // Construire le contenu du mail (adapter selon vos besoins)
      const templateParams = {
        to_email: devis.client_email || 'destinataire@example.com',
        from_name: 'Mon Entreprise BTP',
        subject: `Votre devis : ${devis.nom}`,
        message: `Bonjour,\n\nVeuillez trouver ci-joint votre devis : ${devis.nom} pour un montant de ${devis.total_ht?.toLocaleString()} € HT.\n\nMerci de votre confiance.`,
        devis_details: JSON.stringify(devis, null, 2),
      };
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_USER_ID);
      setMailSent(true);
    } catch (err) {
      showToast('Erreur lors de l\'envoi du mail : ' + (err?.text || err?.message || err), 'error');
    } finally {
      setSendingMail(false);
    }
  };
  const [devis, setDevis] = useState(generatedDevis);
  const [devisSaved, setDevisSaved] = useState(generatedDevis);
  // Verrouillage édition si statut accepté
  const isLocked = devis?.statut === 'Validé' || devis?.statut === 'Accepté';
  const [isEditing, setIsEditing] = useState(!generatedDevis?.id || generatedDevis?.id < 0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (generatedDevis) {
      setDevis(generatedDevis);
      setDevisSaved(generatedDevis);
      setIsEditing(!generatedDevis.id || generatedDevis.id < 0);
    }
  }, [generatedDevis]);

  // Si le devis est accepté, forcer la vue lecture seule
  useEffect(() => {
    if (isLocked && isEditing) setIsEditing(false);
  }, [isLocked, isEditing]);

  // Ajout des coûts et calcul de marge
  const recalculateTotals = (devisToUpdate) => {
    let totalHt = 0;
    const lotsUpdated = devisToUpdate.lots.map(lot => {
      const total_lot_ht = lot.lignes_poste.reduce(
        (sum, l) => sum + (Number(l.quantite) * Number(l.prix_unitaire_ht)),
        0
      );
      // Coûts par lot (matériaux + main d'œuvre)
      const cout_materiaux = Number(lot.cout_materiaux) || 0;
      const cout_mo = Number(lot.cout_mo) || 0;
      const marge_brute = total_lot_ht - (cout_materiaux + cout_mo);
      // Marge nette = brute (ici, pas de charges supp. mais extensible)
      totalHt += total_lot_ht;
      return { ...lot, total_lot_ht, cout_materiaux, cout_mo, marge_brute, marge_nette: marge_brute };
    });
    return { ...devisToUpdate, lots: lotsUpdated, total_ht: totalHt };
  };

  const handleLigneChange = (lotIdx, ligneIdx, field, value) => {
    const newDevis = { ...devis };
    newDevis.lots[lotIdx].lignes_poste[ligneIdx] = {
      ...newDevis.lots[lotIdx].lignes_poste[ligneIdx],
      [field]: field === 'designation' || field === 'unite' ? value : Number(value) || 0
    };
    setDevis(recalculateTotals(newDevis));
  };

  const handleDeleteLigne = (lotIdx, ligneIdx) => {
    const newDevis = { ...devis };
    newDevis.lots[lotIdx].lignes_poste.splice(ligneIdx, 1);
    setDevis(recalculateTotals(newDevis));
  };

  const handleAddLigne = (lotIdx) => {
    const newDevis = { ...devis };
    newDevis.lots[lotIdx].lignes_poste.push({
      designation: 'Nouvelle prestation',
      unite: 'unité',
      quantite: 1,
      prix_unitaire_ht: 0
    });
    setDevis(recalculateTotals(newDevis));
  };

  const handleDeleteLot = (lotIdx) => {
    const newDevis = { ...devis };
    newDevis.lots.splice(lotIdx, 1);
    newDevis.lots = newDevis.lots.map((lot, idx) => ({ ...lot, ordre: idx + 1 }));
    setDevis(recalculateTotals(newDevis));
  };

  const handleAddLot = () => {
    const newDevis = { ...devis };
    const newOrder = (newDevis.lots[newDevis.lots.length - 1]?.ordre || 0) + 1;
    newDevis.lots.push({
      nom: 'Nouveau Lot',
      ordre: newOrder,
      lignes_poste: [{ designation: 'Nouvelle prestation', unite: 'unité', quantite: 1, prix_unitaire_ht: 0 }]
    });
    setDevis(recalculateTotals(newDevis));
  };

  const handleLotNameChange = (lotIdx, value) => {
    const newDevis = { ...devis };
    newDevis.lots[lotIdx].nom = value;
    setDevis(newDevis);
  };

  const handleTvaChange = (value) => {
    setDevis({ ...devis, taux_tva: Number(value) || 0 });
  };

  // Enregistrement du devis via API
  const handleSaveDevis = async () => {
    try {
      // Appel API POST pour persister le devis
      const response = await fetch('http://localhost:8000/api/v1/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(devis)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de la création du devis');
      }
      const savedDevis = await response.json();
      setGeneratedDevis(savedDevis);
      if (onDevisSaved) onDevisSaved(savedDevis);
    } catch (err) {
      showToast('Erreur lors de la sauvegarde du devis : ' + (err?.message || err), 'error');
    }
  };

  const handleExitEditMode = () => {
    setDevisSaved(devis);
    setIsEditing(false);
  };

  const handleReenterEditMode = () => {
    setDevis(devisSaved);
    setIsEditing(true);
  };

  const handleCancelEdits = () => {
    setDevis(devisSaved);
    setIsEditing(false);
  };

  // === WORKFLOW FUNCTIONS ===
  const getCurrentStatut = () => WORKFLOW_STATUTS.find(s => s.id === devis.statut) || WORKFLOW_STATUTS[0];

  const handleChangeStatut = async (newStatut) => {
    if (!devis.id || !token) return;

    setUpdatingStatus(true);
    try {
      await devisAPI.updateDevisStatut(devis.id, newStatut, token);
      const updatedDevis = { ...devis, statut: newStatut };
      setDevis(updatedDevis);
      setDevisSaved(updatedDevis);
      setGeneratedDevis(updatedDevis);
      // Notifier le parent pour rafraîchir les vues (ObjectifsCommerciauxView, etc.)
      onStatusChange?.();
    } catch (err) {
      console.error('Erreur changement statut:', err);
      showToast('Erreur lors du changement de statut', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Gestion de la signature
  const handleSignatureSave = async (dataUrl) => {
    setSigning(true);
    try {
      // Envoi au backend (endpoint à créer)
      const response = await fetch(`http://localhost:8000/devis/${devis.id}/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ signature: dataUrl })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Erreur lors de l\'enregistrement de la signature');
      }
      // Changer le statut en 'Accepté' et verrouiller
      await devisAPI.updateDevisStatut(devis.id, 'Accepté', token);
      setDevis({ ...devis, statut: 'Accepté' });
      setShowSignature(false);
      showToast('Signature enregistrée et devis accepté !', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la signature', 'error');
    } finally {
      setSigning(false);
    }
  };

  const handleFavorisSearch = async (value, lotIdx) => {
    setSearchValue(value);
    setSearchActiveLot(lotIdx);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value) {
      setFavorisSuggestions([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await devisAPI.searchFavoris(value, token);
        setFavorisSuggestions(results);
      } catch (e) {
        setFavorisSuggestions([]);
      }
    }, 200);
  };

  const handleSelectFavori = (favori, lotIdx) => {
    // Ajoute la ligne pré-remplie dans le lot
    const newDevis = { ...devis };
    newDevis.lots[lotIdx].lignes_poste.push({
      designation: favori.designation,
      quantite: 1,
      unite: 'unité',
      prix_unitaire_ht: favori.prix
    });
    setDevis(recalculateTotals(newDevis));
    setFavorisSuggestions([]);
    setSearchValue('');
    setSearchActiveLot(null);
  };

  const handleAddFavori = async (ligne) => {
    try {
      await devisAPI.addFavori({ designation: ligne.designation, prix: ligne.prix_unitaire_ht }, token);
      showToast('Ajouté à la bibliothèque de favoris !', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
    {/* Toast global */}
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast({ ...toast, message: '' })}
    />
  };

  const getStatutColor = (color) => {
    const colors = {
      slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' },
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
    };
    return colors[color] || colors.slate;
  };

  if (!devis) {
    return <div className="p-12 text-center text-slate-500 text-lg">Aucun devis à afficher</div>;
  }

  if (!devis.lots || devis.lots.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 text-lg mb-4">Devis sans lots</p>
      </div>
    );
  }

  const currentStatut = getCurrentStatut();
  const statutColors = getStatutColor(currentStatut.color);
  const StatutIcon = currentStatut.icon;

  // === VUE LECTURE SEULE ===
  if (!isEditing) {
    return (
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
        {/* En-tête lecture */}
        <div className="bg-slate-900 p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
          <div className="relative z-10">
            {/* Badge statut */}
            <div className={`inline-flex items-center gap-2 ${statutColors.bg} ${statutColors.text} px-4 py-2 rounded-full mb-4`}>
              <StatutIcon className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">{currentStatut.label}</span>
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tight italic">{devis.nom}</h3>
          </div>
          <div className="text-left md:text-right bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 min-w-[250px] relative z-10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total HT</p>
            <p className="text-5xl font-black text-blue-400">{devis.total_ht?.toLocaleString()} €</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-3">TTC ({devis.taux_tva}% TVA)</p>
            <p className="text-2xl font-black text-white">{(devis.total_ht * (1 + devis.taux_tva / 100))?.toLocaleString()} €</p>
          </div>
        </div>

        {/* Workflow Actions */}
        {devis.id > 0 && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Workflow Statut</p>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Afficher le workflow complet */}
              {WORKFLOW_STATUTS.filter(s => s.id !== 'Refusé').map((s, i) => {
                const sColors = getStatutColor(s.color);
                const Icon = s.icon;
                const isActive = s.id === devis.statut;
                const isPast = WORKFLOW_STATUTS.findIndex(ws => ws.id === devis.statut) > i;

                return (
                  <React.Fragment key={s.id}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                      isActive
                        ? `${sColors.bg} ${sColors.border} ${sColors.text} ring-2 ring-offset-2 ring-${s.color}-400`
                        : isPast
                          ? 'bg-green-50 border-green-200 text-green-600'
                          : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-black uppercase">{s.label}</span>
                      {isPast && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                    {i < WORKFLOW_STATUTS.filter(ws => ws.id !== 'Refusé').length - 1 && (
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Boutons d'action */}
            {(currentStatut.next || currentStatut.canRefuse) && (
              <div className="flex gap-3 mt-6">
                {currentStatut.next && (
                  <>
                    <button
                      onClick={() => handleChangeStatut(currentStatut.next)}
                      disabled={updatingStatus}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          Passer en "{WORKFLOW_STATUTS.find(s => s.id === currentStatut.next)?.label}"
                        </>
                      )}
                    </button>
                    {/* Si l'action disponible est 'Envoyé', proposer l'envoi par mail */}
                    {currentStatut.next === 'Envoyé' && (
                      <button
                        onClick={handleSendMail}
                        disabled={sendingMail}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
                      >
                        {sendingMail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sendingMail ? 'Envoi...' : 'Envoyer par mail'}
                      </button>
                    )}
                    {mailSent && (
                      <span className="text-green-600 font-bold ml-2">Mail envoyé !</span>
                    )}
                  </>
                )}
                {currentStatut.canRefuse && (
                  <button
                    onClick={() => handleChangeStatut('Refusé')}
                    disabled={updatingStatus}
                    className="flex items-center gap-2 bg-red-100 text-red-600 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-red-200 active:scale-95 transition-all border-2 border-red-200 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Marquer comme Refusé
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lots en lecture seule */}
        <div className="p-12 space-y-16">
          {devis.lots.map((lot, lotIdx) => (
            <div key={lotIdx} className="space-y-6">
              <div className="flex justify-between items-center border-b-2 border-slate-50 pb-4">
                <h4 className="font-black text-slate-800 uppercase text-sm tracking-[0.15em] flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs shadow-xl">{lot.ordre}</span> {lot.nom}
                </h4>
                <span className="text-sm font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{lot.total_lot_ht?.toLocaleString()} € HT</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-left font-black uppercase text-[10px] tracking-[0.2em]">
                      <th className="pb-6 px-4">Prestation</th>
                      <th className="pb-6 text-center w-32">Quantité</th>
                      <th className="pb-6 text-right w-32">Prix U. HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lot.lignes_poste.map((ligne, i) => {
                      const total = Number(ligne.quantite) * Number(ligne.prix_unitaire_ht);
                      return (
                        <tr key={i} className="group hover:bg-blue-50/50 transition-all">
                          <td className="py-5 px-4 font-bold text-slate-700 text-base">{ligne.designation}</td>
                          <td className="py-5 text-center text-slate-500 font-bold bg-slate-50/50 group-hover:bg-white rounded-xl mx-2">
                            {ligne.quantite} <span className="text-[10px] uppercase opacity-50 ml-1">{ligne.unite}</span>
                          </td>
                          <td className="py-5 text-right font-black text-slate-900 text-base">{total.toLocaleString()} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer avec boutons */}
        <div className="bg-slate-50 p-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">TVA</span>
              <span className="text-lg font-black text-slate-800">{devis.taux_tva}%</span>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Validité</span>
              <span className="text-lg font-black text-slate-800">30 Jours</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setGeneratedDevis(null)}
              className="px-8 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-white transition-all"
            >
              Fermer
            </button>
            <button
              onClick={handleReenterEditMode}
              className={`bg-slate-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-3 shadow-2xl shadow-slate-600/20 hover:bg-slate-700 active:scale-95 transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLocked}
              title={isLocked ? 'Ce devis est accepté et ne peut plus être modifié.' : ''}
            >
              <Edit3 className="w-5 h-5" /> Modifier
            </button>
            {!devis.id && (
              <button
                onClick={handleSaveDevis}
                className="bg-green-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-3 shadow-2xl shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all"
              >
                <Check className="w-5 h-5" /> Enregistrer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === VUE ÉDITION ===
  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
        <div className="relative z-10 flex-1">
          <span className="text-[10px] font-black uppercase bg-blue-600 px-3 py-1 rounded-full mb-4 inline-block tracking-[0.2em]">Mode Édition</span>
          <input
            type="text"
            value={devis.nom}
            onChange={(e) => setDevis({ ...devis, nom: e.target.value })}
            className="bg-transparent border-b-2 border-white text-4xl font-black uppercase tracking-tight italic w-full text-white placeholder-gray-400 outline-none"
            placeholder="Nom du devis"
            disabled={isLocked}
            readOnly={isLocked}
          />
        </div>
        <div className="text-left md:text-right bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 min-w-[250px] relative z-10">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Estimé HT</p>
          <p className="text-5xl font-black text-blue-400">{devis.total_ht?.toLocaleString()} €</p>
        </div>
      </div>

      <div className="p-12 space-y-16">
        {devis.lots.map((lot, lotIdx) => (
          <div key={lotIdx} className="space-y-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-200">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xl">{lot.ordre}</span>
                  <input
                    type="text"
                    value={lot.nom}
                    onChange={(e) => handleLotNameChange(lotIdx, e.target.value)}
                    className="flex-1 font-black text-slate-800 uppercase text-sm tracking-[0.15em] bg-transparent border-b-2 border-slate-300 focus:border-blue-600 outline-none px-2 py-1"
                    placeholder="Nom du lot"
                    disabled={isLocked}
                    readOnly={isLocked}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className="text-sm font-black text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">{lot.total_lot_ht?.toLocaleString()} € HT</span>
                {/* Saisie des coûts */}
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lot.cout_materiaux || ''}
                    onChange={e => {
                      const newDevis = { ...devis };
                      newDevis.lots[lotIdx].cout_materiaux = e.target.value;
                      setDevis(recalculateTotals(newDevis));
                    }}
                    placeholder="Coût matériaux (€)"
                    className="w-28 px-2 py-1 border border-slate-200 rounded text-xs text-slate-700"
                    disabled={isLocked}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lot.cout_mo || ''}
                    onChange={e => {
                      const newDevis = { ...devis };
                      newDevis.lots[lotIdx].cout_mo = e.target.value;
                      setDevis(recalculateTotals(newDevis));
                    }}
                    placeholder="Coût M.O. (€)"
                    className="w-28 px-2 py-1 border border-slate-200 rounded text-xs text-slate-700"
                    disabled={isLocked}
                  />
                </div>
                {/* Affichage marge */}
                <span className="text-xs font-bold text-green-700">Marge brute : {typeof lot.marge_brute === 'number' ? lot.marge_brute.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'} €</span>
                <span className="text-xs font-bold text-blue-700">Marge nette : {typeof lot.marge_nette === 'number' ? lot.marge_nette.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'} €</span>
                {devis.lots.length > 1 && (
                  <button onClick={() => handleDeleteLot(lotIdx)} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-600 text-left font-black uppercase text-[10px] tracking-[0.2em] border-b-2 border-slate-300">
                    <th className="pb-4 px-4">Prestation</th>
                    <th className="pb-4 text-center w-24">Quantité</th>
                    <th className="pb-4 text-center w-20">Unité</th>
                    <th className="pb-4 text-right w-32">Prix U. HT</th>
                    <th className="pb-4 text-right w-32">Total</th>
                    <th className="pb-4 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lot.lignes_poste.map((ligne, ligneIdx) => {
                    const total = Number(ligne.quantite) * Number(ligne.prix_unitaire_ht);
                    return (
                      <tr key={ligneIdx} className="hover:bg-white transition-all">
                        <td className="py-4 px-4">
                          <input type="text" value={ligne.designation} onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'designation', e.target.value)} className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none font-bold text-slate-700" />
                        </td>
                        <td className="py-4 text-center">
                          <input type="number" min="0" step="0.01" value={ligne.quantite} onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'quantite', e.target.value)} className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none text-slate-700 font-bold text-center" />
                        </td>
                        <td className="py-4 text-center">
                          <input type="text" value={ligne.unite} onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'unite', e.target.value)} className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none text-slate-700 font-bold text-center" />
                        </td>
                        <td className="py-4 text-right">
                          <input type="number" min="0" step="0.01" value={ligne.prix_unitaire_ht} onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'prix_unitaire_ht', e.target.value)} className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none text-right font-black text-slate-900" />
                        </td>
                        <td className="py-4 text-right pr-4 font-black text-slate-900">{total.toLocaleString()} €</td>
                        <td className="py-4 text-center flex gap-1 justify-center">
                          <button onClick={() => handleDeleteLigne(lotIdx, ligneIdx)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAddFavori(ligne)} title="Ajouter aux favoris" className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all">
                            ★
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="w-full mt-4 flex flex-col gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une prestation type (favoris)"
                  value={searchActiveLot === lotIdx ? searchValue : ''}
                  onChange={e => handleFavorisSearch(e.target.value, lotIdx)}
                  className="w-full px-3 py-2 border-2 border-dashed border-yellow-400 rounded-xl focus:border-yellow-600 outline-none"
                />
                {favorisSuggestions.length > 0 && searchActiveLot === lotIdx && (
                  <ul className="absolute z-10 left-0 right-0 bg-white border border-yellow-300 rounded shadow mt-1 max-h-48 overflow-y-auto">
                    {favorisSuggestions.map(f => (
                      <li
                        key={f.id}
                        className="px-4 py-2 hover:bg-yellow-100 cursor-pointer"
                        onClick={() => handleSelectFavori(f, lotIdx)}
                      >
                        {f.designation} - {f.prix}€
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={() => handleAddLigne(lotIdx)} className="w-full py-3 px-4 border-2 border-dashed border-slate-400 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Ajouter une prestation
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-100 p-12 border-t border-slate-200 space-y-8">
        <button onClick={handleAddLot} className="w-full py-3 px-4 border-2 border-dashed border-slate-400 text-slate-600 font-black uppercase text-sm rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Ajouter un lot
        </button>

        {/* Récapitulatif global marge */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Marge brute totale</span>
            <span className="text-lg font-black text-green-700">
              {devis.lots.reduce((sum, lot) => sum + (typeof lot.marge_brute === 'number' ? lot.marge_brute : 0), 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} €
            </span>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Marge nette totale</span>
            <span className="text-lg font-black text-blue-700">
              {devis.lots.reduce((sum, lot) => sum + (typeof lot.marge_nette === 'number' ? lot.marge_nette : 0), 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} €
            </span>
          </div>
          <div className="flex flex-col">
            <label htmlFor="tva" className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Taux TVA (%)</label>
            <input id="tva" type="number" min="0" max="100" step="0.1" value={devis.taux_tva} onChange={(e) => handleTvaChange(e.target.value)} className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none font-bold text-slate-800 w-24" />
          </div>
          <div className="flex gap-4 items-center">
                        {/* Bouton Signer le devis */}
                        {devis.id && devis.statut !== 'Accepté' && (
                          <button
                            type="button"
                            className="bg-green-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-2 shadow-2xl shadow-green-600/20 hover:bg-green-800 active:scale-95 transition-all"
                            onClick={() => setShowSignature(true)}
                            disabled={signing}
                          >
                            <Check className="w-5 h-5" /> Signer le devis
                          </button>
                        )}
                  {/* Modal Signature */}
                  {showSignature && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 min-w-[350px]">
                        <h2 className="text-xl font-black text-slate-800 mb-2">Signature du devis</h2>
                        <SignaturePad onSave={handleSignatureSave} />
                        <div className="flex gap-4 mt-4">
                          <button onClick={() => setShowSignature(false)} className="px-6 py-2 bg-slate-200 rounded font-bold">Annuler</button>
                        </div>
                        {signing && <span className="text-blue-600 font-bold">Enregistrement...</span>}
                      </div>
                    </div>
                  )}
            <button onClick={handleCancelEdits} className="px-8 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button onClick={handleExitEditMode} className="bg-slate-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-3 shadow-2xl shadow-slate-600/20 hover:bg-slate-700 active:scale-95 transition-all">
              <Check className="w-5 h-5" /> Terminer
            </button>
            {/* Bouton PDF Marge (confidentiel) - visible seulement pour l'artisan/admin */}
            {token && devis?.id && (
              <button
                type="button"
                className="bg-orange-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-2 shadow-2xl shadow-orange-600/20 hover:bg-orange-700 active:scale-95 transition-all"
                onClick={async () => {
                  try {
                    await devisAPI.exportMarginPdf(devis.id, token);
                  } catch (err) {
                    showToast(err.message || 'Erreur lors du téléchargement du PDF de marge', 'error');
                  }
                }}
                title="Télécharger l'analyse de marge (usage interne, confidentiel)"
              >
                <FileText className="w-5 h-5" /> PDF Marge (Confidentiel)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DevisEditableView.displayName = 'DevisEditableView';

export default DevisEditableView;
