import React, { memo, useState } from 'react';
import { Loader2, Send, Save } from 'lucide-react';
import { Wand2 } from 'lucide-react';
import DevisEditableView from './DevisEditableView';

// Composant mémorisé pour le textarea avec son propre state
const TextareaInput = memo(({ localPrompt, setLocalPrompt }) => (
  <textarea
    className="w-full h-48 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] outline-none focus:border-blue-600 focus:bg-white text-slate-700 text-lg font-medium resize-none shadow-inner"
    placeholder="Ex: Rénovation d'un studio de 20m2 à Nantes : dépose cuisine, pose parquet chêne, peinture satinée et mise aux normes électriques."
    value={localPrompt}
    onChange={(e) => setLocalPrompt(e.target.value)}
  />
));

TextareaInput.displayName = 'TextareaInput';

const DevisIAView = memo(({
  isGenerating,
  generatedDevis,
  setGeneratedDevis,
  handleGenerateIA: handleGenerateIAFromParent,
  onDevisSaved,
  token,
  onStatusChange,
}) => {
  // State LOCAL du textarea - complètement isolé du parent
  const [localPrompt, setLocalPrompt] = useState('');

  const handleGenerateIA = () => {
    if (localPrompt.trim()) {
      handleGenerateIAFromParent(localPrompt);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <Wand2 className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Assistant de Chiffrage IA</h2>
          <p className="text-slate-500 text-lg font-medium mb-10 max-w-2xl">Décrivez le projet en langage naturel. L'intelligence artificielle segmente les lots et applique les tarifs du marché.</p>
          <div style={{ position: 'relative' }}>
            <TextareaInput localPrompt={localPrompt} setLocalPrompt={setLocalPrompt} />
            <button
              onClick={handleGenerateIA}
              disabled={isGenerating || !localPrompt.trim()}
              style={{ position: 'absolute', bottom: '32px', right: '32px' }}
              className="bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-sm tracking-widest flex items-center gap-4 hover:bg-blue-700 shadow-2xl shadow-blue-600/40 disabled:bg-slate-200 active:scale-95"
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              {isGenerating ? 'Analyse Métier...' : 'Chiffrer le Projet'}
            </button>
          </div>
        </div>
      </div>

      {generatedDevis && (
        <DevisEditableView
          generatedDevis={generatedDevis}
          setGeneratedDevis={setGeneratedDevis}
          onDevisSaved={onDevisSaved}
          token={token}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
});

DevisIAView.displayName = 'DevisIAView';

export default DevisIAView;
