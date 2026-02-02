from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.devis import (
    Devis,
    DevisCreate,
    DevisUpdate,
    LotDevis,
    LignePoste,
    Facture,
)
from app.models.crm import Projet

# --- Statut de Facture ---
FACTURE_STATUTS = ("Brouillon", "Validée", "Avoir")


def get_next_facture_number(db: Session) -> str:
    """Génère un numéro de facture séquentiel global, inaltérable."""
    # Recherche le dernier numéro existant (ordre lexicographique)
    last = db.query(Facture).order_by(Facture.id.desc()).first()
    if last and last.numero_facture:
        try:
            # Format attendu : FAC-YYYYMMDD-XXX
            prefix, num = last.numero_facture.rsplit("-", 1)
            next_num = int(num) + 1
            return f"{prefix}-{next_num:03d}"
        except Exception:
            pass
    # Premier numéro du jour
    today = datetime.now()
    return f"FAC-{today.strftime('%Y%m%d')}-001"


# --- Fonctions de Calcul ---


def calculate_ligne_total(ligne: LignePoste) -> float:
    """Calcule le total HT d'une ligne de poste (Quantité * Prix Unitaire)."""
    return round(ligne.quantite * ligne.prix_unitaire_ht, 2)


def calculate_lot_total(lot: LotDevis, lignes: List[LignePoste]) -> float:
    """Calcule le total HT d'un lot en additionnant les totaux de ses lignes."""
    total_ht = sum(ligne.total_ligne_ht for ligne in lignes)
    lot.total_lot_ht = round(total_ht, 2)
    return lot.total_lot_ht


def calculate_devis_totals(devis: Devis, lots: List[LotDevis]) -> tuple[float, float]:
    """Calcule le total HT et TTC du devis."""
    total_ht = sum(lot.total_lot_ht for lot in lots)
    taux_tva = devis.taux_tva / 100.0
    total_ttc = total_ht * (1 + taux_tva)

    devis.total_ht = round(total_ht, 2)
    devis.total_ttc = round(total_ttc, 2)

    return devis.total_ht, devis.total_ttc


# --- Opération CRUD de Devis ---


def create_full_devis(db: Session, devis_data: DevisCreate, user_id: int) -> Devis:
    """
    Crée un Devis complet, y compris les Lots et les Lignes de Poste,
    et effectue tous les calculs.
    """
    # 1. Validation de l'existence des entités parentes
    projet = db.query(Projet).get(devis_data.projet_id)
    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé."
        )

    # 2. Création de l'objet Devis de base (sans les totaux finaux)
    db_devis = Devis(
        projet_id=devis_data.projet_id,
        client_id=projet.client_id,  # Hérite du client du projet
        user_id=user_id,
        nom=devis_data.nom,
        taux_tva=devis_data.taux_tva,
        validite_jours=devis_data.validite_jours,
        statut="Brouillon",
    )
    # L'objet Devis est ajouté, mais pas encore commit
    db.add(db_devis)
    db.flush()

    lots_crees: List[LotDevis] = []

    # 3. Création des Lots et des Lignes de Poste
    for lot_data in devis_data.lots:
        db_lot = LotDevis(devis_id=db_devis.id, nom=lot_data.nom, ordre=lot_data.ordre)
        db.add(db_lot)
        db.flush()

        lignes_creees: List[LignePoste] = []

        for ligne_data in lot_data.lignes_poste:
            # Crée la ligne à partir des données Pydantic
            db_ligne = LignePoste(**ligne_data.model_dump(), lot_id=db_lot.id)

            # Calcul du total HT de la ligne
            db_ligne.total_ligne_ht = calculate_ligne_total(db_ligne)

            db.add(db_ligne)
            lignes_creees.append(db_ligne)

        # Calcul du total HT du Lot
        calculate_lot_total(db_lot, lignes_creees)
        lots_crees.append(db_lot)

    # 4. Calcul des Totaux du Devis
    calculate_devis_totals(db_devis, lots_crees)

    db.commit()
    db.refresh(db_devis)
    return db_devis


def get_devis_by_id(db: Session, devis_id: int) -> Devis | None:
    """Récupère un devis complet par son ID."""
    return db.query(Devis).filter(Devis.id == devis_id).first()


def get_all_devis(
    db: Session, skip: int = 0, limit: int = 100, statut: Optional[str] = None
):
    """Récupère la liste des devis avec filtre optionnel sur le statut."""
    query = db.query(Devis)
    if statut:
        query = query.filter(Devis.statut == statut)
    return query.offset(skip).limit(limit).all()


def update_devis(db: Session, devis_id: int, devis_data: DevisUpdate) -> Devis:
    """Met à jour un devis existant (sans modifier les lots)."""
    db_devis = db.query(Devis).filter(Devis.id == devis_id).first()
    if not db_devis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé."
        )

    update_data = devis_data.model_dump(exclude_unset=True)

    # Si le taux TVA change, recalculer le TTC
    if "taux_tva" in update_data:
        db_devis.taux_tva = update_data["taux_tva"]
        taux = db_devis.taux_tva / 100.0
        db_devis.total_ttc = round(db_devis.total_ht * (1 + taux), 2)

    for field, value in update_data.items():
        setattr(db_devis, field, value)

    db.commit()
    db.refresh(db_devis)
    return db_devis


def delete_devis(db: Session, devis_id: int) -> bool:
    """Supprime un devis et ses lots/lignes (cascade)."""
    db_devis = db.query(Devis).filter(Devis.id == devis_id).first()
    if not db_devis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé."
        )

    db.delete(db_devis)
    db.commit()
    return True


# --- Opérations CRUD Factures ---


def generate_facture_number(db: Session) -> str:
    """Génère un numéro de facture unique au format FAC-YYYYMMDD-XXX."""
    today = datetime.now()
    prefix = f"FAC-{today.strftime('%Y%m%d')}"

    # Compte les factures du jour pour incrémenter
    count = db.query(Facture).filter(Facture.numero_facture.like(f"{prefix}%")).count()

    return f"{prefix}-{count + 1:03d}"


def create_facture(db: Session, devis_id: int) -> Facture:
    """Génère une facture depuis un devis validé."""
    db_devis = db.query(Devis).filter(Devis.id == devis_id).first()
    if not db_devis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Devis non trouvé."
        )

    if db_devis.statut not in ["Validé", "Accepté"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le devis doit être validé ou accepté pour générer une facture.",
        )

    # Vérifier qu'aucune facture validée n'existe déjà pour ce devis
    existing = (
        db.query(Facture)
        .filter(Facture.devis_id == devis_id, Facture.statut == "Validée")
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Une facture validée existe déjà pour ce devis."
        )

    numero = get_next_facture_number(db)
    db_facture = Facture(
        devis_id=devis_id,
        numero_facture=numero,
        total_ht=db_devis.total_ht,
        total_ttc=db_devis.total_ttc,
        statut="Validée",
    )
    db.add(db_facture)
    db.commit()
    db.refresh(db_facture)
    return db_facture


def update_facture(db: Session, facture_id: int, data: dict) -> Facture:
    """Interdit la modification d'une facture validée (hors création d'un avoir)."""
    db_facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not db_facture:
        raise HTTPException(status_code=404, detail="Facture non trouvée.")
    if db_facture.statut == "Validée":
        raise HTTPException(
            status_code=403,
            detail="Facture validée inaltérable. Créez un avoir pour toute correction.",
        )
    for k, v in data.items():
        setattr(db_facture, k, v)
    db.commit()
    db.refresh(db_facture)
    return db_facture


def create_avoir(
    db: Session, facture_id: int, motif: str = "Avoir sur facture"
) -> Facture:
    """Génère un avoir (facture d'annulation) lié à une facture validée."""
    db_facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not db_facture or db_facture.statut != "Validée":
        raise HTTPException(status_code=404, detail="Facture validée non trouvée.")
    numero_avoir = get_next_facture_number(db).replace("FAC", "AVOIR")
    avoir = Facture(
        devis_id=db_facture.devis_id,
        numero_facture=numero_avoir,
        total_ht=-db_facture.total_ht,
        total_ttc=-db_facture.total_ttc,
        date_emission=datetime.now(),
        statut="Avoir",
        mention_franchise_tva=db_facture.mention_franchise_tva,
    )
    db.add(avoir)
    db.commit()
    db.refresh(avoir)
    return avoir


def get_all_factures(db: Session, skip: int = 0, limit: int = 100):
    """Récupère la liste des factures avec pagination."""
    return db.query(Facture).offset(skip).limit(limit).all()


def get_facture_by_id(db: Session, facture_id: int) -> Facture | None:
    """Récupère une facture par son ID."""
    return db.query(Facture).filter(Facture.id == facture_id).first()


def get_factures_by_devis(db: Session, devis_id: int):
    """Récupère toutes les factures liées à un devis."""
    return db.query(Facture).filter(Facture.devis_id == devis_id).all()
