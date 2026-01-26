import httpx
import json
from fastapi import HTTPException, status
from app.models.devis import DevisCreate

# Configuration de l'API Gemini
# Note : La clé API sera injectée par l'environnement d'exécution.
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"
API_KEY = "" # Laisser vide, injecté au runtime

async def generate_devis_from_prompt(prompt: str) -> dict:
    """
    Utilise l'IA Gemini pour transformer une description textuelle en structure de devis JSON.
    """
    
    system_instruction = """
    Tu es un expert en chiffrage de travaux pour le bâtiment (BTP).
    Ton rôle est de transformer une description de travaux en un objet JSON structuré pour un devis.
    
    Le JSON doit strictement suivre cette structure :
    {
        "projet_id": 0,
        "nom": "Titre du devis",
        "taux_tva": 20.0,
        "validite_jours": 30,
        "lots": [
            {
                "nom": "Nom du Lot (ex: Maçonnerie)",
                "ordre": 1,
                "lignes_poste": [
                    {
                        "designation": "Description précise du poste",
                        "unite": "m2, ml, kg, forfait, ou U",
                        "quantite": 10.5,
                        "prix_unitaire_ht": 45.0
                    }
                ]
            }
        ]
    }
    
    Règles : 
    1. Ne renvoie QUE le JSON, aucun texte avant ou après.
    2. Estime des prix réalistes du marché français si non précisés.
    3. Segmente bien les travaux par Lots (Plomberie, Electricité, Finitions, etc.).
    """

    payload = {
        "contents": [{
            "parts": [{
                "text": f"Génère un devis détaillé pour : {prompt}"
            }]
        }],
        "systemInstruction": {
            "parts": [{
                "text": system_instruction
            }]
        },
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    # Implémentation de la requête avec retry (backoff exponentiel simplifié)
    async with httpx.AsyncClient() as client:
        for i in range(5): # Tentative jusqu'à 5 fois
            try:
                response = await client.post(
                    f"{GEMINI_API_URL}?key={API_KEY}",
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    text_response = result['candidates'][0]['content']['parts'][0]['text']
                    return json.loads(text_response)
                
            except Exception as e:
                if i == 4: # Dernier essai échoué
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"L'IA est temporairement indisponible : {str(e)}"
                    )
                import asyncio
                await asyncio.sleep(2**i) # Pause exponentielle : 1s, 2s, 4s, 8s...
    
    raise HTTPException(status_code=500, detail="Erreur inconnue lors de l'appel à l'IA.")