# Serveurs MCP installés

> 📋 Liste des serveurs MCP (Model Context Protocol) configurés pour ce projet

## ✅ Serveurs actifs

| Serveur | Type | Transport | Status | Documentation |
|---------|------|-----------|--------|---------------|
| **shadcn/ui** | Composants React | HTTP | ✅ Actif | [shadcn docs](https://ui.shadcn.com) |
| **Tailkits** | Templates Tailwind | HTTP | ✅ Actif | [tailkits.com](https://tailkits.com) |
| **Flowbite** | Composants Tailwind | stdio | ✅ Actif | [flowbite.com](https://flowbite.com) |
| **Storybook** | Documentation UI | stdio | ✅ Actif | [storybook.js.org](https://storybook.js.org) |
| **Figma** | Design-to-Code | HTTP | ✅ Actif | [figma.com](https://www.figma.com) |

---

## 📦 Configuration MCP

### Fichier de configuration

**Emplacement** : `~/.claude/mcp_settings.json`

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

---

## 🎯 Utilisation par catégorie

### 🧩 Composants UI (shadcn/ui)

**Quoi** : Composants React headless avec Radix UI + Tailwind CSS

**Quand l'utiliser** :
- Formulaires (Input, Select, Checkbox, etc.)
- Tables avec tri et pagination
- Modals et Dialogs
- Notifications (Toast)
- Composants de base pour l'UI

**Exemples de commandes** :
```
"Ajoute un composant Table de shadcn pour afficher les devis"
"Crée un formulaire shadcn avec validation pour ajouter un client"
"Utilise le Dialog shadcn pour confirmer la suppression"
```

**Installation** :
```bash
cd dashboard-ia
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input table dialog toast
```

---

### 🎨 Layouts et Templates (Tailkits)

**Quoi** : Templates de pages et sections Tailwind CSS prêts à l'emploi

**Quand l'utiliser** :
- Navigation (Navbar, Sidebar, Footer)
- Layouts de pages (Dashboard, Grid)
- Sections (Hero, Stats, Features)
- Structure de page complète

**Exemples de commandes** :
```
"Génère une navbar Tailkits avec menu et dropdown utilisateur"
"Crée un layout dashboard Tailkits avec statistiques"
"Ajoute une sidebar Tailkits pour la navigation"
```

---

### ⚡ Composants interactifs (Flowbite)

**Quoi** : Composants Tailwind CSS avec interactions JavaScript

**Quand l'utiliser** :
- Dropdowns et menus contextuels
- Modals et Drawers
- Tooltips et Popovers
- Badges et Alerts
- Datepickers
- Tabs et Accordions

**Exemples de commandes** :
```
"Ajoute un dropdown Flowbite pour les actions sur chaque devis"
"Crée des tabs Flowbite pour alterner entre vue liste et kanban"
"Utilise un datepicker Flowbite pour la date d'émission"
```

---

### 📖 Documentation (Storybook)

**Quoi** : Outil de développement et documentation de composants UI

**Quand l'utiliser** :
- Documenter les composants
- Tester visuellement les états
- Développer en isolation
- Créer un design system

**Exemples de commandes** :
```
"Génère les stories Storybook pour DevisEditableView"
"Crée des stories pour SignaturePad avec différents états"
"Documente les props de KanbanDevisView dans Storybook"
```

**Installation** :
```bash
cd dashboard-ia
npx storybook@latest init
npm run storybook  # Port 6006
```

---

### 🎨 Design-to-Code (Figma)

**Quoi** : Conversion de designs Figma en code React

**Quand l'utiliser** :
- Convertir des maquettes Figma en React
- Extraire le design system (couleurs, typo)
- Générer des composants pixel-perfect
- Vérifier la conformité au design

**Exemples de commandes** :
```
"Extrais le design system du fichier Figma <lien>"
"Convertis la page Devis de Figma en composant React"
"Vérifie si DevisEditableView correspond au design Figma"
```

**Prérequis** :
- Compte Figma
- Authentification Composio (configurée)
- Accès aux fichiers Figma

---

## 🚀 Commandes d'installation

### Ajout initial (déjà effectué)

```bash
# shadcn/ui
claude mcp add --transport http shadcn https://www.shadcn.io/api/mcp

# Tailkits
claude mcp add --transport http tailkits https://api.tailkits.com/mcp

# Flowbite
claude mcp add --transport stdio flowbite -- npx -y @flowbite/mcp-server

# Storybook
claude mcp add --transport stdio storybook -- npx -y @storybook/mcp-server

# Figma (via Composio)
npx @composio/mcp@latest setup "https://mcp.composio.dev/partner/composio/figma/mcp" "figma-mcp" --client claude
```

### Vérification

```bash
# Lister les serveurs configurés
cat ~/.claude/mcp_settings.json

# Les serveurs sont chargés automatiquement au démarrage de Claude Code
# Pas besoin de les démarrer manuellement
```

---

## 📚 Guides et documentation

- **[MCP_GUIDE.md](./MCP_GUIDE.md)** : Guide complet d'utilisation des composants MCP
- **[CLAUDE.md](./CLAUDE.md)** : Guide du projet avec section MCP
- **Documentation officielle** : Voir liens dans le tableau ci-dessus

---

## 🔧 Dépannage

### MCP ne répond pas

```bash
# 1. Vérifier la configuration
cat ~/.claude/mcp_settings.json

# 2. Redémarrer Claude Code
# Fermer et relancer l'application

# 3. Vérifier les logs (si disponibles)
# Logs dans ~/.claude/logs/
```

### Composant shadcn ne fonctionne pas

```bash
# 1. Vérifier l'installation du CLI
cd dashboard-ia
npx shadcn-ui@latest

# 2. Initialiser si nécessaire
npx shadcn-ui@latest init

# 3. Installer le composant manquant
npx shadcn-ui@latest add <component-name>
```

### Flowbite/Storybook ne démarre pas

```bash
# Vérifier npx fonctionne
npx -y @flowbite/mcp-server --version
npx -y @storybook/mcp-server --version

# Si erreur, mettre à jour npm
npm install -g npm@latest
```

---

## 🎯 Prochaines étapes recommandées

### 1. Installer shadcn dans le projet

```bash
cd dashboard-ia
npx shadcn-ui@latest init
```

Configurer :
- Style : Default
- Base color : Slate
- CSS variables : Yes

### 2. Installer Storybook

```bash
cd dashboard-ia
npx storybook@latest init
```

### 3. Créer les premiers composants

Commencer par les composants de base :
```
"Ajoute les composants shadcn suivants : button, input, label, select, table, dialog, toast"
```

### 4. Documenter dans Storybook

Pour chaque composant créé :
```
"Génère les stories Storybook pour le composant X"
```

---

## 📊 Matrice de décision

**Pour choisir quel MCP utiliser :**

| Besoin | MCP recommandé | Alternative |
|--------|----------------|-------------|
| Formulaire | shadcn/ui | Flowbite |
| Table de données | shadcn/ui | - |
| Layout de page | Tailkits | - |
| Navigation (navbar, sidebar) | Tailkits | Flowbite |
| Modal | shadcn/ui | Flowbite |
| Dropdown menu | Flowbite | shadcn/ui |
| Badge | Flowbite | shadcn/ui |
| Datepicker | Flowbite | shadcn/ui |
| Documentation | Storybook | - |
| Design Figma → Code | Figma MCP | Manuel |

---

*Dernière mise à jour : 2026-02-02*
