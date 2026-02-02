# Guide d'utilisation des serveurs MCP

> 📘 Guide complet pour utiliser les composants UI via les serveurs MCP installés

## 📋 Table des matières

- [Serveurs installés](#serveurs-installés)
- [shadcn/ui - Composants React](#shadcnui---composants-react)
- [Tailkits - Layouts et templates](#tailkits---layouts-et-templates)
- [Flowbite - Composants interactifs](#flowbite---composants-interactifs)
- [Storybook - Documentation](#storybook---documentation)
- [Figma - Design-to-Code](#figma---design-to-code)
- [Exemples pratiques pour le projet BTP](#exemples-pratiques-pour-le-projet-btp)
- [Bonnes pratiques](#bonnes-pratiques)

---

## 🎯 Serveurs installés

### Configuration actuelle

```json
{
  "mcpServers": {
    "shadcn": {
      "transport": "http",
      "url": "https://www.shadcn.io/api/mcp"
    },
    "tailkits": {
      "transport": "http",
      "url": "https://api.tailkits.com/mcp"
    },
    "flowbite": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@flowbite/mcp-server"]
    },
    "storybook": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@storybook/mcp-server"]
    },
    "figma-mcp": {
      "transport": "http",
      "url": "https://mcp.composio.dev/partner/composio/figma/mcp"
    }
  }
}
```

### Vérification de l'installation

```bash
# Vérifier la configuration MCP
cat ~/.claude/mcp_settings.json

# Les serveurs sont automatiquement chargés au démarrage de Claude Code
# Pas besoin de les démarrer manuellement
```

---

## 🧩 shadcn/ui - Composants React

### Description

shadcn/ui fournit des composants React **headless** (non stylés par défaut) construits avec **Radix UI** et stylés avec **Tailwind CSS**. Parfait pour votre stack React + Tailwind.

### Composants disponibles

#### Formulaires
- **Input** : Champs de texte
- **Textarea** : Zones de texte multilignes
- **Select** : Listes déroulantes
- **Checkbox** : Cases à cocher
- **Radio Group** : Boutons radio
- **Switch** : Interrupteurs
- **Label** : Étiquettes de formulaire
- **Form** : Gestion de formulaires avec validation

#### Affichage de données
- **Table** : Tables avec tri, pagination, filtres
- **Card** : Cartes pour grouper du contenu
- **Badge** : Badges pour statuts
- **Avatar** : Photos de profil
- **Separator** : Séparateurs visuels

#### Feedback utilisateur
- **Dialog** : Modals et dialogues
- **Alert Dialog** : Confirmations
- **Toast** : Notifications temporaires
- **Alert** : Alertes permanentes
- **Progress** : Barres de progression
- **Skeleton** : Placeholders de chargement

#### Navigation
- **Tabs** : Onglets
- **Dropdown Menu** : Menus déroulants
- **Breadcrumb** : Fil d'Ariane
- **Pagination** : Navigation pages

#### Sélection de dates
- **Calendar** : Calendrier
- **Date Picker** : Sélecteur de date
- **Date Range Picker** : Sélection de plages

### Comment demander un composant shadcn

#### Syntaxe de base
```
"Ajoute un composant <NOM> de shadcn pour <USAGE>"
```

#### Exemples pour votre projet BTP

##### 1. Formulaire de création de devis
```
"Crée un formulaire shadcn pour créer un devis avec les champs :
- Nom du devis (Input)
- Client (Select)
- Date d'émission (DatePicker)
- Taux TVA (Input number)
- Validité en jours (Input number)
Ajoute la validation avec react-hook-form"
```

**Résultat attendu** :
```jsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"

export function DevisForm() {
  const { register, handleSubmit } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nom">Nom du devis</Label>
        <Input id="nom" {...register("nom", { required: true })} />
      </div>
      {/* ... autres champs */}
      <Button type="submit">Créer le devis</Button>
    </form>
  )
}
```

##### 2. Table des factures avec tri
```
"Ajoute un composant Table de shadcn pour afficher les factures avec :
- Colonnes : Numéro, Date, Client, Montant HT, Montant TTC, Statut
- Tri par colonne
- Pagination (10 par page)
- Badge coloré pour le statut (Brouillon=gris, Validée=vert, Avoir=orange)"
```

##### 3. Modal de confirmation
```
"Crée un AlertDialog shadcn pour confirmer la suppression d'un devis
avec titre 'Supprimer le devis', description et boutons Annuler/Supprimer"
```

##### 4. Toast de notification
```
"Utilise le Toast shadcn pour afficher une notification de succès après
la création d'un devis avec message 'Devis créé avec succès' et durée 3s"
```

### Installation d'un composant shadcn

Quand je génère un composant shadcn, il faut l'installer dans votre projet :

```bash
cd dashboard-ia

# Installer le CLI shadcn (une fois)
npx shadcn-ui@latest init

# Installer un composant spécifique
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog

# Ou installer plusieurs composants
npx shadcn-ui@latest add button input select table dialog toast
```

Les composants seront créés dans `dashboard-ia/src/components/ui/`.

---

## 🎨 Tailkits - Layouts et templates

### Description

Tailkits fournit des **templates de pages complètes** et des **sections UI** construits avec Tailwind CSS. Idéal pour créer rapidement des layouts professionnels.

### Templates disponibles

#### Navigation
- **Navbar** : Barres de navigation responsives
- **Sidebar** : Menus latéraux
- **Breadcrumbs** : Fils d'Ariane
- **Footer** : Pieds de page

#### Layouts
- **Dashboard** : Layouts de tableau de bord
- **Grid Layouts** : Grilles responsives
- **Container Layouts** : Conteneurs centrés
- **Split Layouts** : Layouts en colonnes

#### Sections
- **Hero** : Bannières d'accueil
- **Features** : Sections de fonctionnalités
- **Stats** : Statistiques
- **Pricing** : Tableaux de prix
- **CTA** : Call-to-action

### Comment demander un template Tailkits

#### Exemples pour votre projet BTP

##### 1. Navbar principale
```
"Génère une navbar Tailkits responsive avec :
- Logo 'BTP Manager' à gauche
- Menu : Tableau de bord, Devis, Clients, Factures, Chantiers
- Dropdown utilisateur à droite avec avatar et menu Se déconnecter
- Menu burger pour mobile"
```

##### 2. Sidebar de navigation
```
"Crée une sidebar Tailkits pour le dashboard avec :
- Sections : Devis (icône FileText), Clients (icône Users), Factures (icône Receipt)
- Sous-menu Devis : Nouveau, En attente, Validés, Kanban
- Indicateur de page active
- Collapse pour mobile"
```

##### 3. Layout dashboard
```
"Génère un layout dashboard Tailkits avec :
- Header avec titre de page et bouton d'action principal
- Grid 3 colonnes pour statistiques : CA mensuel, Devis en attente, Factures impayées
- Section principale pour le contenu
- Responsive (mobile : 1 colonne, tablette : 2 colonnes, desktop : 3 colonnes)"
```

##### 4. Page de statistiques
```
"Crée une section Stats Tailkits affichant :
- Chiffre d'affaires prévisionnel (€, variation +12%)
- Nombre de devis en cours (badge bleu)
- Taux de conversion (pourcentage, graphique mini)
- 4 colonnes desktop, 2 colonnes tablette, 1 colonne mobile"
```

---

## ⚡ Flowbite - Composants interactifs

### Description

Flowbite fournit des composants **Tailwind CSS avec JavaScript** pour les interactions. Tous les composants sont compatibles React.

### Composants disponibles

#### Actions
- **Button** : Boutons avec variantes
- **Dropdown** : Menus déroulants
- **Modal** : Modals
- **Drawer** : Panneaux latéraux coulissants
- **Tooltip** : Infobulles
- **Popover** : Popovers

#### Affichage
- **Accordion** : Accordéons
- **Tabs** : Onglets
- **Badge** : Badges
- **Alert** : Alertes
- **Progress** : Barres de progression
- **Spinner** : Indicateurs de chargement

#### Formulaires
- **Input** : Champs de texte avec icônes
- **Datepicker** : Sélecteur de date
- **File Upload** : Upload de fichiers
- **Toggle** : Interrupteurs
- **Range** : Curseurs

#### Navigation
- **Navbar** : Navigation
- **Sidebar** : Menu latéral
- **Breadcrumb** : Fil d'Ariane
- **Pagination** : Pagination

### Comment demander un composant Flowbite

#### Exemples pour votre projet BTP

##### 1. Dropdown d'actions sur devis
```
"Ajoute un dropdown Flowbite pour les actions sur chaque ligne de devis :
- Icône : 3 points verticaux
- Menu : Voir, Modifier, Dupliquer, Générer facture, Supprimer
- Icônes Lucide pour chaque action
- Séparateur avant Supprimer
- Option Supprimer en rouge"
```

##### 2. Tabs pour vues devis
```
"Crée des tabs Flowbite pour alterner entre :
- Vue Liste (icône List)
- Vue Kanban (icône Columns)
- Vue Calendrier (icône Calendar)
Tab active en bleu, changement de vue sans rechargement"
```

##### 3. Modal d'ajout de ligne de devis
```
"Génère un modal Flowbite pour ajouter une ligne de poste au devis :
- Titre : Ajouter une ligne
- Formulaire : Désignation, Unité, Quantité, Prix unitaire HT
- Footer : Boutons Annuler et Ajouter
- Calcul automatique du total"
```

##### 4. Badges de statut
```
"Utilise les badges Flowbite pour afficher le statut des devis :
- Brouillon : badge gris
- Envoyé : badge bleu
- Accepté : badge vert
- Refusé : badge rouge
- Facturé : badge violet
Taille sm, arrondi"
```

##### 5. Datepicker pour date d'émission
```
"Ajoute un datepicker Flowbite pour la date d'émission du devis :
- Format français (JJ/MM/AAAA)
- Langue française
- Date par défaut : aujourd'hui
- Icône calendrier à droite du champ"
```

---

## 📖 Storybook - Documentation

### Description

Storybook permet de **développer et documenter les composants UI en isolation**. Utile pour tester visuellement les composants sans lancer toute l'application.

### Installation dans le projet

```bash
cd dashboard-ia

# Initialiser Storybook
npx storybook@latest init

# Lancer Storybook (port 6006)
npm run storybook

# Build Storybook pour production
npm run build-storybook
```

### Comment demander des stories

#### Exemples pour votre projet BTP

##### 1. Stories pour DevisEditableView
```
"Génère les stories Storybook pour le composant DevisEditableView avec :
- Default : devis brouillon avec 2 lots
- WithSignature : devis avec signature validée
- Loading : état de chargement
- Empty : devis vide (nouveau)
- ReadOnly : mode lecture seule
Utilise des données mockées réalistes"
```

**Résultat attendu** :
```jsx
// DevisEditableView.stories.jsx
import DevisEditableView from './DevisEditableView'

export default {
  title: 'Views/DevisEditableView',
  component: DevisEditableView,
}

export const Default = {
  args: {
    devis: {
      id: 1,
      nom: "Rénovation appartement",
      statut: "Brouillon",
      lots: [/* ... */]
    }
  }
}

export const WithSignature = {
  args: {
    devis: {
      /* ... */
      signature_path: "/signatures/devis-1.png"
    }
  }
}
```

##### 2. Stories pour SignaturePad
```
"Crée les stories pour SignaturePad :
- Empty : canvas vide prêt pour signature
- Drawing : en cours de signature
- Completed : signature terminée
- Validated : signature validée avec timestamp
Actions : clear, save, validate"
```

##### 3. Stories pour KanbanDevisView
```
"Génère les stories pour KanbanDevisView avec :
- Default : 3 colonnes (Brouillon, Envoyé, Accepté) avec 2-3 devis chacune
- Empty : colonnes vides
- DragAndDrop : démonstration du drag and drop
- Mobile : vue mobile responsive
Mock les fonctions de callback"
```

### Structure recommandée

```
dashboard-ia/src/
├── DevisEditableView.jsx
├── DevisEditableView.stories.jsx
├── SignaturePad.jsx
├── SignaturePad.stories.jsx
├── KanbanDevisView.jsx
├── KanbanDevisView.stories.jsx
└── components/
    └── ui/
        ├── Button.jsx
        └── Button.stories.jsx
```

---

## 🎨 Figma - Design-to-Code

### Description

Le serveur MCP Figma via Composio permet de **convertir des designs Figma en code React** et d'extraire les spécifications de design.

### Prérequis

1. **Compte Figma** avec accès aux fichiers de design
2. **Authentification Composio** (configurée lors de `npx @composio/mcp@latest setup`)
3. **Lien du fichier Figma** à convertir

### Comment utiliser Figma MCP

#### 1. Extraire le design system

```
"Extrais le design system du fichier Figma <lien> :
- Palette de couleurs (primary, secondary, accent, neutrals)
- Typographie (font families, sizes, weights)
- Espacements (spacing scale)
- Border radius
- Shadows
Génère le fichier tailwind.config.js correspondant"
```

**Résultat attendu** :
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        // ... extraites depuis Figma
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // ... depuis Figma
      },
      spacing: {
        // ... scale depuis Figma
      }
    }
  }
}
```

#### 2. Convertir une page en composant

```
"Convertis la page 'Liste des devis' du fichier Figma <lien> en composant React :
- Utilise shadcn/ui pour les composants
- Génère les styles Tailwind
- Crée les composants nécessaires
- Ajoute les props TypeScript
- Mock les données"
```

#### 3. Générer un composant spécifique

```
"Génère le composant React pour la 'Card Devis' du fichier Figma <lien> :
- Frame : Components/DevisCard
- Conserve les dimensions exactes
- Utilise Tailwind pour les styles
- Ajoute les props : devis (object), onEdit, onDelete
- Responsive : version mobile si disponible dans Figma"
```

#### 4. Vérifier la conformité au design

```
"Compare mon composant DevisEditableView avec le design Figma <lien> :
- Vérifie les couleurs
- Vérifie les espacements
- Vérifie la typographie
- Vérifie les dimensions
- Liste les différences
- Génère le code corrigé si nécessaire"
```

### Workflow Design-to-Code complet

```mermaid
Figma Design → Extract Specs → Generate React → Add Logic → Test in Storybook → Production
```

1. **Designer crée dans Figma** : Maquettes, composants, design system
2. **Extraction** : "Extrais le design system et les composants de Figma"
3. **Génération** : Composants React avec Tailwind
4. **Logique** : Ajout de la logique métier (API calls, state)
5. **Stories** : Documentation Storybook
6. **Production** : Intégration dans l'app

---

## 💼 Exemples pratiques pour le projet BTP

### Scénario 1 : Créer la page Liste des Devis

#### Étape 1 : Layout avec Tailkits
```
"Génère un layout Tailkits pour la page Liste des Devis :
- Header avec titre 'Mes Devis' et bouton 'Nouveau devis' (primary)
- Tabs pour filtrer : Tous, Brouillon, Envoyés, Acceptés, Refusés
- Section principale pour la table
- Responsive"
```

#### Étape 2 : Table avec shadcn
```
"Ajoute une Table shadcn pour afficher les devis :
- Colonnes : Numéro, Client, Projet, Date, Montant TTC, Statut, Actions
- Tri par date (décroissant par défaut)
- Pagination (20 par page)
- Filtre par statut (via les tabs)
- Actions : Voir, Modifier, Supprimer"
```

#### Étape 3 : Actions avec Flowbite
```
"Ajoute un Dropdown Flowbite dans la colonne Actions :
- Icône : MoreVertical de Lucide
- Menu : Voir détails, Modifier, Dupliquer, Générer facture, Exporter PDF, Supprimer
- Icônes pour chaque action
- Supprimer en rouge avec séparateur avant"
```

#### Étape 4 : Badges de statut avec Flowbite
```
"Utilise des Badges Flowbite pour la colonne Statut :
- Brouillon : gris
- Envoyé : bleu
- Accepté : vert
- Refusé : rouge
- Facturé : violet
Taille sm, police medium"
```

#### Étape 5 : Stories Storybook
```
"Génère les stories pour la page Liste des Devis :
- Default : 10 devis variés
- Empty : aucun devis (message d'invitation)
- Loading : skeleton loading
- Filtered : filtré par statut 'Accepté'
Mock les données et callbacks"
```

### Scénario 2 : Créer le formulaire d'ajout de Client

#### Étape 1 : Modal avec Flowbite
```
"Crée un Modal Flowbite pour ajouter un client :
- Titre : Nouveau client
- Taille : large (lg)
- Footer : Annuler et Créer
- Fermeture sur backdrop et ESC"
```

#### Étape 2 : Formulaire avec shadcn
```
"Dans le modal, ajoute un formulaire shadcn avec validation react-hook-form :
Champs :
- Nom de l'entreprise* (Input)
- SIRET (Input, format FR)
- Adresse* (Textarea, 2 lignes)
- Code postal* (Input, 5 chiffres)
- Ville* (Input)
- Téléphone* (Input, format FR)
- Email (Input email)
- Contact principal (Input)

Validation :
- Champs * obligatoires
- Email valide si renseigné
- SIRET : 14 chiffres
- Code postal : 5 chiffres
- Téléphone : format français

Messages d'erreur en rouge sous chaque champ"
```

#### Étape 3 : Toast de confirmation
```
"Après création réussie, affiche un Toast shadcn :
- Message : 'Client créé avec succès'
- Type : success (vert)
- Durée : 3 secondes
- Position : top-right
- Action : 'Voir le client' (lien optionnel)"
```

### Scénario 3 : Dashboard avec statistiques

#### Étape 1 : Layout avec Tailkits
```
"Génère un layout dashboard Tailkits :
- Header : Titre 'Tableau de bord' + filtres période (ce mois, ce trimestre, cette année)
- Grid 4 colonnes responsive (mobile: 1, tablette: 2, desktop: 4)
- Section graphiques en dessous"
```

#### Étape 2 : Cards de statistiques
```
"Crée 4 Cards shadcn pour les KPI :
1. CA prévisionnel
   - Valeur : 145 000 €
   - Variation : +12% vs mois dernier (vert)
   - Icône : TrendingUp

2. Devis en attente
   - Valeur : 23
   - Variation : -3 vs mois dernier (orange)
   - Icône : FileText

3. Taux de conversion
   - Valeur : 68%
   - Variation : +5% vs mois dernier (vert)
   - Icône : Target

4. Factures impayées
   - Valeur : 12 450 €
   - Nombre : 5 factures
   - Icône : AlertCircle (rouge)

Design : fond blanc, border, shadow-sm, padding 6, hover:shadow-md"
```

#### Étape 3 : Graphiques
```
"Ajoute une section Charts :
- Graphique ligne : Évolution CA sur 12 mois
- Graphique donut : Répartition devis par statut
- Utilise recharts ou une lib de graphiques compatible React
- Responsive : 2 colonnes desktop, 1 colonne mobile"
```

### Scénario 4 : Vue Kanban des Devis

#### Étape 1 : Layout Kanban
```
"Crée une vue Kanban pour les devis avec @dnd-kit :
- 4 colonnes : Brouillon, Envoyé, Accepté, Facturé
- Header de colonne : Nom + count + icône
- Couleurs : gris, bleu, vert, violet
- Drag and drop entre colonnes
- Hauteur fixe avec scroll vertical par colonne"
```

#### Étape 2 : Card de devis
```
"Génère une Card pour chaque devis dans le Kanban :
- Numéro du devis (petit, gris)
- Nom du projet (titre, font-medium)
- Client (texte secondaire)
- Montant TTC (grand, font-bold)
- Date (petit, gris)
- Avatar du commercial
- Icône drag handle
- Hover : shadow-lg, cursor-grab
- Active (dragging) : opacity-50, rotate-2"
```

#### Étape 3 : Actions rapides
```
"Ajoute un menu contexte (clic droit) sur chaque card Kanban :
- Voir détails
- Modifier
- Changer de statut (submenu)
- Générer facture (si Accepté)
- Supprimer
Utilise un Dropdown Flowbite déclenché par clic droit"
```

---

## ✅ Bonnes pratiques

### 1. Choisir le bon MCP

```
📊 Composant de données (table, form) → shadcn/ui
🎨 Layout de page, navigation → Tailkits
⚡ Interactions (dropdown, modal) → Flowbite
📖 Documentation composants → Storybook
🎨 Design existant → Figma MCP
```

### 2. Combiner les MCP

Les MCP peuvent (et doivent) être combinés :

```jsx
// Layout Tailkits + Composants shadcn + Interactions Flowbite
<TailkitsLayout>
  <TailkitsSidebar />
  <main>
    <ShadcnTable data={devis}>
      <FlowbiteDropdown actions={actions} />
    </ShadcnTable>
  </main>
</TailkitsLayout>
```

### 3. Demander des composants précis

❌ **Vague** : "Ajoute un formulaire"
✅ **Précis** : "Crée un formulaire shadcn avec Input (nom), Select (statut), DatePicker (date), validation react-hook-form, et bouton submit bleu"

### 4. Toujours spécifier le contexte BTP

❌ **Générique** : "Crée une table"
✅ **Contexte** : "Crée une table shadcn pour afficher les devis avec colonnes numéro, client, montant TTC, statut avec badge, actions dropdown"

### 5. Demander du code compatible avec votre stack

```
"Génère un composant shadcn compatible avec :
- React (hooks, pas de classes)
- Tailwind CSS (utilise les classes existantes)
- Lucide React pour les icônes
- react-hook-form pour la validation"
```

### 6. Documenter avec Storybook

Pour chaque composant important, demander :
```
"Génère les stories Storybook pour ce composant avec :
- État par défaut
- États d'erreur
- États de chargement
- Variantes de props
Mock les données et callbacks"
```

### 7. Vérifier la cohérence visuelle

Si vous avez un design Figma :
```
"Compare ce composant avec le design Figma <lien> et ajuste :
- Les couleurs
- Les espacements
- La typographie
- Les dimensions"
```

---

## 🎯 Checklist d'utilisation MCP

### Avant de demander un composant

- [ ] Vérifier si le composant existe déjà dans le projet
- [ ] Choisir le MCP approprié (shadcn/Tailkits/Flowbite)
- [ ] Définir les props nécessaires
- [ ] Lister les états possibles (default, loading, error, empty)

### Lors de la demande

- [ ] Spécifier le contexte BTP
- [ ] Décrire précisément le besoin
- [ ] Indiquer les contraintes (responsive, accessible, etc.)
- [ ] Mentionner les dépendances (react-hook-form, etc.)

### Après génération

- [ ] Installer les dépendances si nécessaire (shadcn CLI)
- [ ] Tester le composant visuellement
- [ ] Ajouter la logique métier (API calls, state)
- [ ] Créer les stories Storybook
- [ ] Documenter les props
- [ ] Tester la responsivité
- [ ] Commit avec message descriptif

---

## 📞 Aide et support

### Commandes utiles

```bash
# Vérifier les MCP installés
cat ~/.claude/mcp_settings.json

# Installer un composant shadcn
cd dashboard-ia && npx shadcn-ui@latest add <component>

# Lancer Storybook
cd dashboard-ia && npm run storybook

# Lister les composants shadcn disponibles
npx shadcn-ui@latest
```

### Ressources

- **shadcn/ui** : https://ui.shadcn.com
- **Tailkits** : https://tailkits.com
- **Flowbite** : https://flowbite.com
- **Storybook** : https://storybook.js.org
- **Figma** : https://www.figma.com

### En cas de problème

1. **MCP ne répond pas** : Redémarrer Claude Code
2. **Composant ne s'affiche pas** : Vérifier les imports et les dépendances
3. **Styles incorrects** : Vérifier Tailwind config et classes
4. **TypeScript errors** : Ajouter les types manquants

---

*Guide maintenu par Claude Code - Dernière mise à jour : 2026-02-02*
