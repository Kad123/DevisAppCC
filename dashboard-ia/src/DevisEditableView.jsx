import React, { memo, useState, useEffect } from 'react';
import { Trash2, Plus, Save, Edit3, Check } from 'lucide-react';

const DevisEditableView = memo(({ generatedDevis, setGeneratedDevis, onDevisSaved }) => {
  const [devis, setDevis] = useState(generatedDevis);
  const [devisSaved, setDevisSaved] = useState(generatedDevis); // Sauvegarde du dernier état accepté
  // Mode édition: true si devis vient d'être généré (pas d'ID), false si c'est un devis existant
  const [isEditing, setIsEditing] = useState(!generatedDevis?.id || generatedDevis?.id < 0);

  useEffect(() => {
    console.log('🔄 DevisEditableView reçoit devis:', generatedDevis);
    if (generatedDevis) {
      setDevis(generatedDevis);
      setDevisSaved(generatedDevis); // Sauvegarder la copie initiale
      // Pour les devis existants (avec ID positif), commencer en mode lecture
      setIsEditing(!generatedDevis.id || generatedDevis.id < 0);
    }
  }, [generatedDevis]);

  // Recalculer les totaux quand le devis change
  const recalculateTotals = (devisToUpdate) => {
    let totalHt = 0;
    const lotsUpdated = devisToUpdate.lots.map(lot => {
      const total_lot_ht = lot.lignes_poste.reduce(
        (sum, l) => sum + (Number(l.quantite) * Number(l.prix_unitaire_ht)),
        0
      );
      totalHt += total_lot_ht;
      return { ...lot, total_lot_ht };
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
    // Renuméroter les lots
    newDevis.lots = newDevis.lots.map((lot, idx) => ({ ...lot, ordre: idx + 1 }));
    setDevis(recalculateTotals(newDevis));
  };

  const handleAddLot = () => {
    const newDevis = { ...devis };
    const newOrder = (newDevis.lots[newDevis.lots.length - 1]?.ordre || 0) + 1;
    newDevis.lots.push({
      nom: 'Nouveau Lot',
      ordre: newOrder,
      lignes_poste: [
        {
          designation: 'Nouvelle prestation',
          unite: 'unité',
          quantite: 1,
          prix_unitaire_ht: 0
        }
      ]
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

  const handleSaveDevis = () => {
    setGeneratedDevis(devis);
    console.log('✓ Devis sauvegardé définitivement', devis);
    // Appeler le callback pour sauvegarder et revenir au dashboard
    if (onDevisSaved) {
      onDevisSaved(devis);
    }
  };

  const handleExitEditMode = () => {
    // Quitter le mode édition, on garde le devis en mémoire
    setDevisSaved(devis); // Sauvegarder les modifications actuelles
    setIsEditing(false);
  };

  const handleReenterEditMode = () => {
    // Revenir en mode édition (devis conserve les dernières modifications acceptées)
    setDevis(devisSaved);
    setIsEditing(true);
  };

  const handleCancelEdits = () => {
    // Annuler les modifications et revenir à la dernière version sauvegardée
    setDevis(devisSaved);
    setIsEditing(false);
  };

  if (!devis) {
    return <div className="p-12 text-center text-slate-500 text-lg">Aucun devis à afficher</div>;
  }
  
  if (!devis.lots || devis.lots.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 text-lg mb-4">Devis sans lots</p>
        <p className="text-slate-400 text-sm">{JSON.stringify(devis, null, 2).substring(0, 200)}</p>
      </div>
    );
  }

  // === VUE LECTURE SEULE ===
  if (!isEditing) {
    return (
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
        {/* En-tête lecture */}
        <div className="bg-slate-900 p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase bg-blue-600 px-3 py-1 rounded-full mb-4 inline-block tracking-[0.2em]">Devis Généré</span>
            <h3 className="text-4xl font-black uppercase tracking-tight italic">{devis.nom}</h3>
          </div>
          <div className="text-left md:text-right bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 min-w-[250px] relative z-10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total HT</p>
            <p className="text-5xl font-black text-blue-400">{devis.total_ht?.toLocaleString()} €</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-3">TTC ({devis.taux_tva}% TVA)</p>
            <p className="text-2xl font-black text-white">{(devis.total_ht * (1 + devis.taux_tva / 100))?.toLocaleString()} €</p>
          </div>
        </div>

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
              Recommencer
            </button>
            <button
              onClick={handleReenterEditMode}
              className="bg-slate-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-3 shadow-2xl shadow-slate-600/20 hover:bg-slate-700 active:scale-95 transition-all"
            >
              <Edit3 className="w-5 h-5" /> Modifier
            </button>
            <button
              onClick={handleSaveDevis}
              className="bg-green-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-3 shadow-2xl shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all"
            >
              <Check className="w-5 h-5" /> Valider
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === VUE ÉDITION ===
  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
      {/* En-tête */}
      <div className="bg-slate-900 p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
        <div className="relative z-10 flex-1">
          <span className="text-[10px] font-black uppercase bg-blue-600 px-3 py-1 rounded-full mb-4 inline-block tracking-[0.2em]">Mode Édition</span>
          <input
            type="text"
            value={devis.nom}
            onChange={(e) => setDevis({ ...devis, nom: e.target.value })}
            className="bg-transparent border-b-2 border-white text-4xl font-black uppercase tracking-tight italic w-full text-white placeholder-gray-400 outline-none"
            placeholder="Nom du devis"
          />
        </div>
        <div className="text-left md:text-right bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 min-w-[250px] relative z-10">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Estimé HT</p>
          <p className="text-5xl font-black text-blue-400">{devis.total_ht?.toLocaleString()} €</p>
        </div>
      </div>

      {/* Lots éditables */}
      <div className="p-12 space-y-16">
        {devis.lots.map((lot, lotIdx) => (
          <div key={lotIdx} className="space-y-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-200">
            {/* Nom du lot éditable */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xl">
                    {lot.ordre}
                  </span>
                  <input
                    type="text"
                    value={lot.nom}
                    onChange={(e) => handleLotNameChange(lotIdx, e.target.value)}
                    className="flex-1 font-black text-slate-800 uppercase text-sm tracking-[0.15em] bg-transparent border-b-2 border-slate-300 focus:border-blue-600 outline-none px-2 py-1"
                    placeholder="Nom du lot"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  {lot.total_lot_ht?.toLocaleString()} € HT
                </span>
                {devis.lots.length > 1 && (
                  <button
                    onClick={() => handleDeleteLot(lotIdx)}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tableau éditable des lignes de poste */}
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
                          <input
                            type="text"
                            value={ligne.designation}
                            onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'designation', e.target.value)}
                            className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none font-bold text-slate-700"
                            placeholder="Désignation"
                          />
                        </td>
                        <td className="py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ligne.quantite}
                            onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'quantite', e.target.value)}
                            className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none text-slate-700 font-bold text-center"
                          />
                        </td>
                        <td className="py-4 text-center">
                          <input
                            type="text"
                            value={ligne.unite}
                            onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'unite', e.target.value)}
                            className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none text-slate-700 font-bold text-center"
                            placeholder="unité"
                          />
                        </td>
                        <td className="py-4 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ligne.prix_unitaire_ht}
                            onChange={(e) => handleLigneChange(lotIdx, ligneIdx, 'prix_unitaire_ht', e.target.value)}
                            className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none text-right font-black text-slate-900"
                          />
                        </td>
                        <td className="py-4 text-right pr-4 font-black text-slate-900">
                          {total.toLocaleString()} €
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDeleteLigne(lotIdx, ligneIdx)}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bouton ajouter ligne */}
            <button
              onClick={() => handleAddLigne(lotIdx)}
              className="w-full mt-4 py-3 px-4 border-2 border-dashed border-slate-400 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Ajouter une prestation
            </button>
          </div>
        ))}
      </div>

      {/* Bouton ajouter lot et configuration TVA */}
      <div className="bg-slate-100 p-12 border-t border-slate-200 space-y-8">
        <button
          onClick={handleAddLot}
          className="w-full py-3 px-4 border-2 border-dashed border-slate-400 text-slate-600 font-black uppercase text-sm rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Ajouter un lot
        </button>

        {/* Configuration TVA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex flex-col">
            <label htmlFor="tva" className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              Taux TVA (%)
            </label>
            <input
              id="tva"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={devis.taux_tva}
              onChange={(e) => handleTvaChange(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-600 outline-none font-bold text-slate-800 w-24"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleCancelEdits}
              className="px-8 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
            >
              Annuler les modifications
            </button>
            <button
              onClick={handleExitEditMode}
              className="bg-slate-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.15em] flex items-center gap-3 shadow-2xl shadow-slate-600/20 hover:bg-slate-700 active:scale-95 transition-all"
            >
              <Check className="w-5 h-5" /> Terminer l'édition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

DevisEditableView.displayName = 'DevisEditableView';

export default DevisEditableView;
