# Document fondateur v1.1 — Catalogue de Grimoires

**Version consolidée v1.1 — Canon fondateur** *(taxonomie & raretés mises à jour en **v1.2** — voir §2–§3 et [`annexes/taxonomie.json`](./annexes/taxonomie.json))*

Période : **Cycle 08 — Millénaire 4.2**

Rédigé selon les usages de la Guilde des Archivistes de Sim

> Document de référence pour le catalogue commercial de *La Réserve des Grimoires*.  
> S'appuie sur les [Documents fondateurs v1.0](../Cosmolige%20%26%20Chronologie/Document%20fondateur%20v1.0%20—%20Cosmologie%20%26%20Chronologie.md) (Cosmologie), [Géographie](../Géographie%20%26%20factions/Document%20fondateur%20v1.0%20—%20Géographie%20%26%20Factions.md) et [La Librairie](../La%20Librairie/Document%20fondateur%20v1.0%20—%20La%20Librairie.md).  
> En cas de divergence avec d’anciens brouillons, **ce document fait foi**. La liste définitive des titres est dans [`catalogue/`](./catalogue/).

---

## 1. Vision du catalogue

### 1.1 Rôle dans La Réserve des Grimoires

Le Catalogue de Grimoires est le registre commercial et archivistique officiel de **La Réserve des Grimoires**, librairie des **Archives Mondiales du Secteur IV**, située à **Hillsvaire C.2**.

Il ne représente pas l'ensemble des ouvrages du monde connu : le fonds de la Guilde compte **plusieurs milliers** de titres. Le catalogue exploité par l'application en constitue un **échantillon de démonstration de 200 références exactement**, sélectionné pour la simulation quotidienne (ventes, ruptures, commandes, remises en rayon).

Le catalogue assure :

- la présentation des ouvrages vendables ;
- la valorisation en **Florins** ;
- la cohérence entre catégories, auteurs, collections et origines sectorielles ;
- l'alignement avec la clientèle simulée et le fournisseur MVP.

### 1.2 Répartition

**Échantillon :** 200 titres exactement.

**Taxonomie cible (v1.2) :** 27 catégories commerciales (voir §2) — répartition par catégorie **non figée** tant que la migration JSON n'est pas faite.

**Répartition historique Chat 4 (fichiers JSON actuels) :** 80 Histoire / 60 Botanique / 40 Arcane / 20 Nécromancie — **obsolète comme canon**, conservée uniquement comme état des fichiers.

### 1.3 Critères d'inclusion

Un ouvrage intègre le catalogue commercial uniquement s'il respecte :

1. **Certification archivistique** — examen par un archiviste ou scriptorium reconnu.
2. **Traçabilité** — auteur, scriptorium, secteur et période identifiés.
3. **Utilité commerciale** — demande réelle (étude, artisanat, administration, recherche).
4. **Sécurité documentaire** — les ouvrages dangereux ou interdits sont exclus du commerce et classés en **archives scellées** (voir §7).

### 1.4 Fournisseur et logistique

Le fournisseur exclusif du MVP est le **Dépôt Central des Copistes de Port-Aster** (Secteur II). Les convois mettent environ **6 jours** pour rejoindre Hillsvaire.

Port-Aster est un **centre d'approvisionnement**, pas le siège de la librairie.

---

## 2. Taxonomie documentaire

> **Taxonomie v1.2** — validée post-Chat 6. Remplace les 4 catégories Chat 4.  
> Source machine : [`annexes/taxonomie.json`](./annexes/taxonomie.json).  
> **Pas de sous-catégories.** La rareté est statistique, jamais imposée par la catégorie.

### 2.1 Vingt-sept catégories commerciales

| # | Catégorie | Groupe |
| - | --------- | ------ |
| 1 | Arcane | Magie & occultisme |
| 2 | Rituels | Magie & occultisme |
| 3 | Invocation | Magie & occultisme |
| 4 | Illusions | Magie & occultisme |
| 5 | Destruction | Magie & occultisme |
| 6 | Malédictions | Magie & occultisme |
| 7 | Sacré | Magie & occultisme |
| 8 | Guérison | Magie & occultisme |
| 9 | Nécromancie | Magie & occultisme |
| 10 | Enchantements | Magie & occultisme |
| 11 | Divination & Astronomie | Ciel, secrets & matière |
| 12 | Alchimie | Ciel, secrets & matière |
| 13 | Minéraux & Métaux | Ciel, secrets & matière |
| 14 | Botanique & Agriculture | Nature & vivant |
| 15 | Faune & Monstres | Nature & vivant |
| 16 | Guerre | Guerre, corps & exploration |
| 17 | Armes et Armures | Guerre, corps & exploration |
| 18 | Médecine | Guerre, corps & exploration |
| 19 | Donjons & Voyages | Guerre, corps & exploration |
| 20 | Histoire | Société & métiers |
| 21 | Commerce & Droit | Société & métiers |
| 22 | Métiers | Société & métiers |
| 23 | Arts & Musique | Arts, lettres & sciences humaines |
| 24 | Langues & Sociologie | Arts, lettres & sciences humaines |
| 25 | Philosophie & Psychologie | Arts, lettres & sciences humaines |
| 26 | Romans | Arts, lettres & sciences humaines |
| 27 | Gastronomie | Table |

**Hors vente :** Archives scellées (consultation Guilde).

### 2.2 Migration depuis Chat 4 (4 catégories)

Les IDs `HIS` / `BOT` / `ARC` / `NEC` restent stables. Les fichiers `catalogue/*.json` seront reclassés progressivement. Mapping d'orientation :

| Ancienne | Destinations typiques (v1.2) |
| -------- | ---------------------------- |
| Histoire | Histoire, Donjons & Voyages, Guerre, Commerce & Droit |
| Botanique | Botanique & Agriculture, Faune & Monstres, Alchimie |
| Arcane | Arcane, Rituels, Invocation, Enchantements, Divination & Astronomie |
| Nécromancie | Nécromancie, Malédictions, Sacré |

---

## 3. Échelle de rareté et grille tarifaire

La rareté commerciale reflète la **disponibilité** et la **diffusion**, pas la puissance magique intrinsèque.

| Label FR | Clé app | Proportion cible | Fourchette (Florins) |
| -------- | ------- | ---------------- | -------------------- |
| Commun | `common` | ~60 % | 8–40 |
| Peu commun | `uncommon` | ~23 % | 40–120 |
| Rare | `rare` | ~11 % | 200–700 |
| Légendaire | `legendary` | ~4 % | 800–2500 |
| Mythique | `mythic` | ~1–2 % | 2500–10000+ |
| Scellé | `sealed` | hors vente | non commercialisable |

**Sur 200 titres (cible) :** ~120 / 46 / 22 / 8 / 2–4 (+ scellés hors échantillon commercial).

> **État des fichiers JSON :** répartition Chat 4 encore en place (187 `common` / 11 `rare` / 2 `legendary`, 4 catégories). Rééquilibrage = tâche d'intégration séparée.

---

## 4. Collections éditoriales

Huit collections structurent l'organisation éditoriale du catalogue. Le détail JSON est dans [`annexes/collections.json`](./annexes/collections.json).

| Collection | Secteur | Spécialité |
| ---------- | ------- | ---------- |
| Registres de Port-Aster | II | Histoire locale et administration |
| Herbiers du Cercle Vert | II | Botanique pratique |
| Études de la Trame | III | Théorie magique |
| Archives des Anciens Cycles | IV | Histoire ancienne |
| Guides de l'Explorateur | IV | Voyages et survie |
| Traités de la Trame Moderne | III | Théories contemporaines |
| Cartographies Célestes | IV | Astronomie et cartographie |
| Archives de la Convergence | IV | Événements majeurs (Grande Convergence) |

---

## 5. Auteurs, copistes et institutions

Vingt figures documentaires de référence ancrent le catalogue (historiens, botanistes, archivistes, chercheurs de la Trame). Le détail JSON est dans [`annexes/auteurs.json`](./annexes/auteurs.json).

**Règle canonique :** **Maître Elian Voss** est commis réceptionnaire à La Réserve (Hillsvaire C.2) ; il n'est pas auteur principal d'ouvrages arcaniques.

---

## 6. Catalogue principal

### 6.1 Tableau récapitulatif

| Catégorie | Nombre | Common | Rare | Legendary |
| --------- | ------ | ------ | ---- | --------- |
| Histoire | 80 | 79 | 1 | 0 |
| Botanique | 60 | 57 | 3 | 0 |
| Arcane | 40 | 33 | 6 | 1 |
| Nécromancie | 20 | 18 | 1 | 1 |
| **Total** | **200** | **187** | **11** | **2** |

### 6.2 Ouvrages canoniques application

Ces six titres sont verrouillés pour l'application (`catalog-data.ts`) :

| id | Titre | Catégorie (v1.2) | Rareté | Prix |
| -- | ----- | ---------------- | ------ | ---- |
| HIS-001 | Chroniques Civiles | Histoire | common | 75 |
| HIS-002 | Notes de Voyageur | Donjons & Voyages | common | 50 |
| BOT-008 | Flora de l'Abîme | Botanique & Agriculture | rare | 450 |
| ARC-033 | Anatomie Céleste | Divination & Astronomie | rare | 620 |
| ARC-040 | L'Oeil de l'Éclipse | Arcane | legendary | 1250 |
| NEC-020 | Necronomicon Sim | Nécromancie | legendary | 2800 |

**Seuls ouvrages `legendary` commerciaux :** ARC-040 et NEC-020.

### 6.3 Fichiers JSON du catalogue

| Fichier | Contenu |
| ------- | ------- |
| [`catalogue/histoire.json`](./catalogue/histoire.json) | HIS-001 → HIS-080 |
| [`catalogue/botanique.json`](./catalogue/botanique.json) | BOT-001 → BOT-060 |
| [`catalogue/arcane.json`](./catalogue/arcane.json) | ARC-001 → ARC-040 |
| [`catalogue/necromancie.json`](./catalogue/necromancie.json) | NEC-001 → NEC-020 |

**Migration v1.2 :** prompts ChatGPT prêts dans [`annexes/prompts-migration-catalogue-v1.2.md`](./annexes/prompts-migration-catalogue-v1.2.md) (reclassement + catégories manquantes).

Schéma d'une fiche ouvrage :

```json
{
  "id": "HIS-001",
  "title": "Chroniques Civiles",
  "description": "...",
  "price": 75,
  "rarity": "common",
  "category": "Histoire",
  "subcategory": "Chroniques civiles",
  "author": "Aldren Vey",
  "collection": "Registres de Port-Aster",
  "cote": "HIS-CHR-001",
  "language": "Commun Archivistique",
  "format": "registre",
  "origin_sector": "I",
  "copy_cycle": "Cycle 08",
  "supplier_available": true,
  "lore_hook": "..."
}
```

---

## 7. Ouvrages scellés (hors commerce)

Les ouvrages scellés ne font **pas** partie des 200 titres commerciaux. Ils sont conservés sous autorisation de la Guilde, sans prix ni rareté applicative.

Fiches : [`annexes/ouvrages-scelles.json`](./annexes/ouvrages-scelles.json) (4 références : SCELL-001 à SCELL-004).

---

## 8. Glossaire du catalogue

Archives Mondiales

Institution de référence du Secteur IV chargée de la conservation, du catalogage et de la diffusion des savoirs. La Réserve des Grimoires en est la branche commerciale.

La Réserve des Grimoires

Librairie officielle située à **Hillsvaire C.2**, quartier archivistique du Secteur IV.

Hillsvaire

Pôle de diffusion archivistique du Secteur IV ; siège des Archives Mondiales et de La Réserve des Grimoires.

Port-Aster

Ville majeure du **Secteur II** ; centre commercial et plateforme du **Dépôt Central des Copistes**. Fournisseur de la Réserve, pas son emplacement.

Dépôt Central des Copistes de Port-Aster

Fournisseur exclusif MVP ; délai moyen vers Hillsvaire : ~6 jours.

Catalogue commercial

Échantillon public de **200 ouvrages** vendables, distinct du fonds total (milliers de titres).

Cote archivistique

Identifiant unique de classement (ex. `HIS-CHR-001`).

Exemplaire certifié

Copie authentifiée selon les normes de la Guilde.

Fonds courant

Part majoritaire du catalogue : ouvrages `common` destinés à la diffusion régulière.

Florin

Monnaie officielle des échanges commerciaux.

Ouvrage scellé

Document hors commerce, consultation restreinte ; intérêt patrimonial, historique ou scientifique.

Section scellée

Salle sécurisée de La Réserve ; moins de 1 % du fonds total.

La Trame

Réalité matérielle unique parcourue par les Courants Invisibles ; objet d'étude des ouvrages arcaniques.

Secteur

Réseau administratif et documentaire (I à IV), pas un État.

Collection éditoriale

Regroupement d'ouvrages partageant éditeur, origine ou spécialité.

Scriptorium

Atelier de copie et de certification des manuscrits.

Copiste

Artisan de reproduction fidèle des textes.

Remise en rayon

Transfert d'exemplaires de la réserve vers les rayons publics.

---

## 9. Principes de cohérence pour les chats suivants

1. Le catalogue commercial contient **exactement 200 ouvrages** (80 / 60 / 40 / 20).
2. Les livres valent pour leur **contenu documentaire**, pas pour un enchantement intrinsèque.
3. La rareté est **commerciale et statistique** ; seuls **2** titres sont `legendary` (ARC-040, NEC-020).
4. Les **6 ouvrages canoniques app** ne sont pas modifiés sans révision explicite.
5. La Réserve est à **Hillsvaire C.2** ; le fournisseur MVP est **Port-Aster** (Dépôt Central).
6. Les ouvrages scellés sont **hors** des 200 titres et **sans prix**.
7. Un auteur doit rester cohérent avec son domaine et son secteur.
8. **Maître Elian Voss** n'est pas auteur d'ouvrages arcaniques majeurs.
9. Les catégories ont une **fonction documentaire** précise (l'Histoire n'est pas de la magie active).
10. Toute extension future passe par le **Chat 5** (personnages, événements) ou la Bible canonique.

---

## 10. Zones ouvertes

Éléments volontairement ajustables sans remettre en cause le canon :

- prix exacts et équilibrage économique de la simulation ;
- stocks initiaux (`qty_reserve`, `qty_shelf`) ;
- délais logistiques fins ;
- sous-catégories mineures et variantes d'édition ;
- fournisseurs secondaires hors MVP ;
- personnages clients nommés et dialogues (Chat 5) ;
- événements narratifs liés à certains titres ;
- extension du catalogue au-delà de 200 titres (hors échantillon MVP).

---

## Récapitulatif

### Canon verrouillé

- **La Réserve des Grimoires** — librairie des Archives Mondiales du Secteur IV, **Hillsvaire C.2**.
- **Fournisseur MVP** — Dépôt Central des Copistes de Port-Aster (~6 jours).
- **Catalogue commercial** — 200 titres ; **27 catégories** (taxonomie v1.2) ; pas de sous-catégories.
- **Raretés** — `common`, `uncommon`, `rare`, `legendary`, `mythic` (+ `sealed` hors vente) ; cibles ~60 / 23 / 11 / 4 / 1–2 %.
- **6 ouvrages canoniques app** — HIS-001, HIS-002, BOT-008, ARC-033, ARC-040, NEC-020 (IDs verrouillés ; catégories v1.2 dans `taxonomie.json`).
- **2 legendary commerciaux** — L'Oeil de l'Éclipse, Necronomicon Sim *(jusqu'à rééquilibrage éventuel avec `mythic`)*.
- **4 ouvrages scellés** — hors commerce (SCELL-001 à 004).
- **20 auteurs** et **8 collections** documentés en annexes JSON.
- Monnaie : **Florin** ; époque : **Cycle 08 — Millénaire 4.2**.
- **Migration JSON** — `catalogue/*.json` encore au schéma Chat 4 (4 catégories, 3 raretés) jusqu'à tâche dédiée.

### Éléments provisoires

- Ajustement des prix selon la simulation.
- Stocks initiaux et seuils d'alerte.
- Fournisseurs secondaires et institutions de Hillsvaire non détaillées.
- Procédures fines de consultation des scellés.

### Prochain document fondateur — Chat 5 (Personnages & Simulation)

- Clients nommés et profils d'acheteurs ;
- Dialogues types et demandes spéciales ;
- Événements narratifs du journal de simulation ;
- Fournisseurs secondaires hors MVP ;
- Interactions quotidiennes dans La Réserve.

---

*Document fondateur v1.1 — Catalogue de Grimoires. Fiches : `catalogue/*.json`.*
