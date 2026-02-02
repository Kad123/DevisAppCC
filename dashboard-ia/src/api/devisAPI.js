/**
 * Service API pour les appels au backend FastAPI
 */

const API_URL = "http://localhost:8000";

export const devisAPI = {
  /**
   * Créer un nouveau devis
   */
  createDevis: async (devisData, token) => {
    // S'assurer que projet_id est présent
    let devisDataToSend = { ...devisData };

    // Si pas de projet_id, essayer de récupérer le premier projet ou en créer un
    if (!devisDataToSend.projet_id) {
      try {
        // Récupérer la liste des projets
        const projetsResponse = await authFetch(`${API_URL}/crm/projets/`);

        if (projetsResponse.ok) {
          const projets = await projetsResponse.json();
          if (projets.length > 0) {
            // Utiliser le premier projet
            devisDataToSend.projet_id = projets[0].id;
          } else {
            // Si pas de projet, créer un projet par défaut
            console.warn('Aucun projet trouvé, création d\'un projet par défaut...');
            devisDataToSend.projet_id = await devisAPI.createDefaultProject(token);
          }
        } else {
          // Fallback: utiliser un projet ID par défaut
          devisDataToSend.projet_id = 1;
        }
      } catch (err) {
        console.warn('Impossible de récupérer les projets, utilisation du projet par défaut');
        devisDataToSend.projet_id = 1;
      }
    }

    const response = await authFetch(`${API_URL}/devis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(devisDataToSend)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la création du devis');
    }

    return response.json();
  },

  /**
   * Créer un projet par défaut
   */
  createDefaultProject: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/crm/clients/`);

      if (!response.ok) throw new Error('Impossible de récupérer les clients');

      const clients = await response.json();
      const clientId = clients.length > 0 ? clients[0].id : 1;

      // Créer un projet avec le premier client
      const projectResponse = await authFetch(`${API_URL}/crm/projets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: `Projet - ${new Date().toLocaleDateString()}`,
          description: 'Projet créé automatiquement',
          client_id: clientId,
          statut: 'En cours'
        })
      });

      if (!projectResponse.ok) throw new Error('Impossible de créer le projet');

      const project = await projectResponse.json();
      return project.id;
    } catch (err) {
      console.error('Erreur création projet par défaut:', err);
      throw err;
    }
  },

  /**
   * Récupérer toutes les factures
   */
  getAllFactures: async (token) => {
    const response = await fetch(`${API_URL}/factures/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération des factures');
    }

    return response.json();
  },

  /**
   * Récupérer un projet par ID
   */
  getProjetById: async (projetId, token) => {
    const response = await fetch(`${API_URL}/crm/projets/${projetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération du projet');
    }

    return response.json();
  },

  /**
   * Récupérer un client par ID
   */
  getClientById: async (clientId, token) => {
    const response = await fetch(`${API_URL}/crm/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération du client');
    }

    return response.json();
  },

  /**
   * Récupérer tous les devis de l'utilisateur
   */
  getAllDevis: async (token) => {
    const response = await fetch(`${API_URL}/devis/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération des devis');
    }

    return response.json();
  },

  /**
   * Récupérer un devis par ID
   */
  getDevisById: async (devisId, token) => {
    const response = await fetch(`${API_URL}/devis/${devisId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la récupération du devis');
    }

    return response.json();
  },

  /**
   * Mettre à jour un devis
   */
  updateDevis: async (devisId, devisData, token) => {
    const response = await fetch(`${API_URL}/devis/${devisId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(devisData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la mise à jour du devis');
    }

    return response.json();
  },

  /**
   * Mettre à jour le statut d'un devis
   */
  updateDevisStatut: async (devisId, newStatut, token) => {
    const response = await fetch(`${API_URL}/devis/${devisId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ statut: newStatut })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la mise à jour du statut');
    }

    return response.json();
  },

  /**
   * Supprimer un devis
   */
  deleteDevis: async (devisId, token) => {
    const response = await fetch(`${API_URL}/devis/${devisId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la suppression du devis');
    }

    return true;
  }
};
