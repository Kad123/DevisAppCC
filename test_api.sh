#!/bin/bash

# Token depuis la réponse précédente
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X2ludGVncmF0aW9uQGV4YW1wbGUuY29tIiwiZXhwIjoxNzY5NTM0NDc2fQ.zvbB7v4KFL2AhLsWGjI_4vzUEGBVYrJuSHWn_QMfEqQ"

echo "=== Test GET /devis/ ==="
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/devis/ | jq '.[] | {id, client_name, description}' | head -20

echo -e "\n=== Test POST /devis/ ===" 
curl -s -X POST http://localhost:8000/devis/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @- << 'PAYLOAD'
{
  "client_name": "Intégration Test",
  "description": "Test devis via API",
  "lots": [
    {
      "numero_lot": 1,
      "nom_lot": "Lot 1",
      "lignes": [
        {
          "description": "Service 1",
          "quantite": 1,
          "prix_unitaire": 100,
          "tva_percentage": 20
        }
      ]
    }
  ]
}
PAYLOAD

