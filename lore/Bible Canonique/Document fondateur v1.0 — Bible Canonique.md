# Document fondateur v1.0 — Bible Canonique

**Version consolidée v1.0 — Synthèse, index et arbitrage canonique**

Période : **Cycle 08 — Millénaire 4.2**

Rédigé selon les usages de la Guilde des Archivistes de Sim

> Point d'entrée documentaire du projet *La Réserve des Grimoires*.  
> S'appuie sur les cinq Documents fondateurs (Cosmologie, Géographie, La Librairie, Catalogue v1.1, Personnages v1.0).  
> En cas de divergence avec d’anciens brouillons, **ce document fait foi**.  

> **Règle générale :** la Bible arbitre les relations entre documents ; elle ne réécrit pas leur contenu spécialisé.

**Données structurées :**

| Fichier | Contenu |
| ------- | ------- |
| [`index/entities.json`](./index/entities.json) | Index canonique (54 entités : lieux, factions, personnages, ouvrages, collections) |
| [`index/rules.json`](./index/rules.json) | 12 règles de maintenance du lore (RULE-001 à RULE-012) |

---

## 1. Mission de la Bible Canonique

### 1.1 Hiérarchie documentaire

| Priorité | Source | Domaine |
| -------- | ------ | ------- |
| 1 | [Cosmologie v1.0](../Cosmolige%20%26%20Chronologie/Document%20fondateur%20v1.0%20—%20Cosmologie%20%26%20Chronologie.md) | Monde, chronologie, Trame, Forces |
| 2 | [Géographie v1.0](../Géographie%20%26%20factions/Document%20fondateur%20v1.0%20—%20Géographie%20%26%20Factions.md) | Territoires, secteurs, institutions |
| 3 | [La Librairie v1.0](../La%20Librairie/Document%20fondateur%20v1.0%20—%20La%20Librairie.md) | Établissement, espaces, logistique |
| 4 | [Catalogue v1.1](../Catalogue%20de%20Grimoires/Document%20fondateur%20v1.1%20—%20Catalogue%20de%20Grimoires.md) | Livres, auteurs, collections, prix |
| 5 | [Personnages v1.0](../Personnages%20%26%20Simulation/Document%20fondateur%20v1.0%20—%20Personnages%20%26%20Simulation.md) | Simulation, clients, NPC, journal |
| 6 | **Bible v1.0** (ce document) | Synthèse, arbitrages, maintenance |

### 1.2 Ce que la Bible tranche

- Vocabulaire lore ↔ vocabulaire applicatif (raretés, catégories, IDs)
- Rôle des lieux (Hillsvaire C.2 = librairie ; Port-Aster = fournisseur)
- Collections éditoriales ≠ titres vendables
- Personnages lore vs entités simulées (staff, NPC, clients)
- Règles d'évolution future du canon

**Décisions transversales verrouillées :** catalogue MVP = 200 titres ; **27 catégories** ; **5 raretés** + scellé ; livres = savoir documentaire, pas pouvoirs intrinsèques.

### 1.3 Ce que la Bible laisse ouvert

Enrichissement post-MVP : fournisseurs secondaires, extension catalogue > 200, nouvelles factions, calibrage simulation (lots), signification de « Sim », durée exacte des Cycles.

La **boutique vivante** (employés, caméra HD-2D) est un sujet **applicatif**, spécifié dans [`doc/10-simulation-temps-reel.md`](../../../doc/10-simulation-temps-reel.md) — hors canon narratif.

### 1.4 Public cible

- **Développement** — modèle de données, Next.js/MySQL, validation des IDs
- **Lore** — maintien du canon, extensions contrôlées
- **Intégration** — point de départ avant tout ajout de contenu

---

## 2. Synthèse de l'univers

### 2.1 Cosmologie

Le monde repose sur **la Trame**, parcourue par les **Courants Invisibles**. Quatre **Forces** structurent les études : Matière, Mémoire, Souffle, Voile. La magie est ritualiste ; les grimoires sont des **supports de savoir certifié**, pas des objets de pouvoir intrinsèque.

### 2.2 Chronologie

Époque jouable : **Cycle 08 — Millénaire 4.2**. Les Cycles n'ont pas de durée fixe ; la Grande Convergence (fin Cycle 01) et la Chute du Troisième Cycle (fin Cycle 03) sont **deux événements distincts**.

### 2.3 Géographie

Quatre **Secteurs** = réseau administratif et documentaire (pas des royaumes). **Hillsvaire C.2** (Secteur IV) accueille les Archives Mondiales et *La Réserve des Grimoires*. **Port-Aster** (Secteur II) = centre logistique ; le **Dépôt Central des Copistes** en est le fournisseur MVP (~6 jours de délai).

### 2.4 La librairie

Le joueur incarne le **Grand Archiviste**. Flux : **Fournisseur → Quai → Réserve → Rayon → Client**. Staff officiel : Maître Elian Voss, Sœur Maëline.

### 2.5 Catalogue commercial

**Taxonomie v1.2** (validée) : **27 catégories** commerciales, **sans sous-catégories** ; **5 raretés** commerciales + **scellé** hors vente. Détail : [`annexes/taxonomie.json`](../Catalogue%20de%20Grimoires/annexes/taxonomie.json).

Échantillon actuel : **200 titres** (répartition historique Chat 4 encore en fichiers JSON — migration en cours). Monnaie : **Florin**.

**Proportions cibles (rareté) :** ~60 % commun / 23 % peu commun / 11 % rare / 4 % légendaire / 1–2 % mythique.

**6 ouvrages canoniques app (attributs verrouillés) :**

| ID | Titre | Catégorie (v1.2) | Rareté |
| -- | ----- | ---------------- | ------ |
| HIS-001 | Chroniques Civiles | Histoire | common |
| HIS-002 | Notes de Voyageur | Donjons & Voyages | common |
| BOT-008 | Flora de l'Abîme | Botanique & Agriculture | rare |
| ARC-033 | Anatomie Céleste | Divination & Astronomie | rare |
| ARC-040 | L'Oeil de l'Éclipse | Arcane | legendary |
| NEC-020 | Necronomicon Sim | Nécromancie | legendary |

### 2.6 Simulation

4 types d'événements : `CUSTOMER_PURCHASE`, `STOCKOUT`, `SUPPLIER_DELIVERY`, `UNAVAILABLE_REQUEST`. 12 clients (CLI-001–012) incarnent 8 archétypes ; 6 NPC ; 40 templates journal ; 10 scénarios.

---

## 3. Index master des entités

Index complet : [`index/entities.json`](./index/entities.json) (**54 entrées**).

### 3.1 Lieux et institutions (extrait)

| Nom | Type | Secteur | Source |
| --- | ---- | ------- | ------ |
| Hillsvaire C.2 | Quartier archivistique | IV | Géographie / Librairie |
| La Réserve des Grimoires | Librairie | IV | Librairie |
| Port-Aster | Ville commerciale | II | Géographie |
| Dépôt Central des Copistes | Fournisseur | II | Librairie / Catalogue |
| Quai des Convoyeurs | Réception | IV | Librairie |
| Val-Simor | Localité | I | Géographie |
| Asterion | Localité | III | Géographie |
| Secteurs I–IV | Zones administratives | I–IV | Géographie |

### 3.2 Personnages (extrait)

| Nom | Rôle | ID | Source |
| --- | ---- | -- | ------ |
| Grand Archiviste | Joueur | — | Librairie |
| Maître Elian Voss | Commis | NPC-001 | Personnages |
| Sœur Maëline | Relieuse | NPC-002 | Personnages |
| Corvin Hale | Convoyeur | NPC-003 | Personnages |
| Ilyan Meros | Représentant Dépôt Central | NPC-004 | Personnages |
| CLI-001 à CLI-012 | Clients simulés | CLI-xxx | Personnages |
| Maître Sorin Vale | Copiste indépendant (hors MVP) | — | Personnages §8 |

### 3.3 Ouvrages et collections clés

6 ouvrages app (tableau §2.5), 4 scellés (SCELL-001 à 004), 8 collections (COL-001 à 008). Les **collections ne sont jamais des titres de livres**.

---

## 4. Matrice de cohérence inter-documents

| Sujet | Statut | Note |
| ----- | ------ | ---- |
| Localisation librairie (Hillsvaire C.2) | Aligné | Port-Aster ≠ siège librairie |
| Raretés lore 5 niveaux vs app 3 niveaux | Résolu | Mapping lore → app (§9.2) |
| Catalogue 200 titres | Aligné | Chat 4 verrouillé |
| Collections vs titres | Aligné | RULE-005 |
| Staff vs NPC | Aligné | Elian/Maëline = personnel ; NPC = événementiel |
| Ilyan Meros | Résolu | Uniquement représentant Dépôt Central MVP |
| 8 archétypes vs 12 clients | Aligné | Chat 5 |
| 4 types événements | Aligné | Chat 5 |
| Fournisseur unique MVP | Aligné | Dépôt Central Port-Aster |
| Délais livraison ~6 jours | Aligné | Chats 3–4 |

---

## 5. Contradictions identifiées et résolutions

### 5.1 Raretés : cinq niveaux lore vs trois niveaux app

**Décision :** conserver 3 niveaux app. Mapping : courant / peu commun → `common` ; spécialisé / rare → `rare` ; exceptionnel / légendaire → `legendary`.

### 5.2 Onze rares catalogue vs cible 3–5 %

**Décision :** écart accepté (11/200 = 5,5 %). Pas de rééquilibrage pour le MVP.

### 5.3 Collections utilisées comme titres

**Décision :** une collection (COL-NNN) n'est jamais un livre. Simulation et index utilisent des IDs catalogue (HIS-NNN, etc.).

### 5.4 Port-Aster siège supposé de la librairie

**Décision :** La Réserve = Hillsvaire C.2 uniquement. Port-Aster = fournisseur logistique.

### 5.5 Ilyan Meros vs copistes indépendants

**Décision :** Ilyan Meros = NPC-004, représentant du Dépôt Central. Maître Sorin Vale = copiste hors MVP (provisoire).

### 5.6 Staff et NPC

**Décision :** personnel = Elian Voss + Sœur Maëline ; NPC événementiels = Corvin, Ilyan, Lysa, Renald.

### 5.7 Zones ouvertes des premiers chats

**Décision :** catalogue (Chat 4) et personnages (Chat 5) résolus ; arbitrages finaux = cette Bible.

### 5.8 `common` ≠ banal culturel

**Décision :** `common` = disponibilité commerciale. Un ouvrage peut être recherché par une communauté spécialisée tout en restant `common`.

---

## 6. Canon verrouillé global

Identifiants **CAN-001 à CAN-037** — synthèse des invariants (voir chat sources pour le détail).

| Thème | Points clés |
| ----- | ----------- |
| **Univers** | Trame, 4 Forces, Cycle 08 — M 4.2, livres = savoir |
| **Géographie** | 4 Secteurs, Hillsvaire C.2, Port-Aster fournisseur |
| **Librairie** | Grand Archiviste, Elian + Maëline, flux logistique |
| **Catalogue** | 200 titres, 27 catégories, 5 raretés + scellé, 6 ouvrages app |
| **Simulation** | 4 événements, 12 CLI, 6 NPC, titres = catalogue réel |
| **Application** | Next.js + MySQL, 1 admin, révision doc pour changements majeurs |

---

## 7. Éléments provisoires consolidés

| Élément | Origine | Bloquant MVP ? |
| ------- | ------- | -------------- |
| Calibrage événements/jour | Chat 5 | Non |
| Stocks initiaux et seuils | Chat 4 | Non |
| Fournisseurs secondaires (Sorin Vale, etc.) | Chat 5 §8 | Non |
| Pixel art / direction artistique | README | Non |
| Signification de « Sim » | Cosmologie | Non |
| Durée exacte des Cycles | Cosmologie | Non |
| Variantes d'éditions | Catalogue | Non |
| Consultation ouvrages scellés | Catalogue | Non |

---

## 8. Zones ouvertes consolidées

| Zone | Priorité | Post-MVP ? |
| ---- | -------- | ---------- |
| Équilibrage économique / prix dynamiques | Haute | Oui |
| Stocks initiaux et probabilités simulation | Haute | Oui |
| Extension catalogue > 200 titres | Moyenne | Oui |
| Fournisseurs secondaires | Moyenne | Oui |
| Nouvelles régions / factions | Basse | Oui |
| Signification historique de « Sim » | Basse | Oui |

**Retirés des zones ouvertes** (résolus) : catalogue complet, personnages nommés, collections, fournisseur MVP, localisation librairie.

---

## 9. Arbitrages revue catalogue (README)

> **Révision post-Chat 6** — taxonomie et raretés revalidées avec l'équipe (Cycle 08). Remplace les décisions initiales « 4 catégories / 3 raretés ».

### 9.1 Catégories

**Décision :** **27 catégories** commerciales, **liste plate** (pas de sous-catégories).  
**Hors vente :** Archives scellées.

| # | Catégorie | # | Catégorie |
| - | --------- | - | --------- |
| 1 | Arcane | 15 | Faune & Monstres |
| 2 | Rituels | 16 | Guerre |
| 3 | Invocation | 17 | Armes et Armures |
| 4 | Illusions | 18 | Médecine |
| 5 | Destruction | 19 | Donjons & Voyages |
| 6 | Malédictions | 20 | Histoire |
| 7 | Sacré | 21 | Commerce & Droit |
| 8 | Guérison | 22 | Métiers |
| 9 | Nécromancie | 23 | Arts & Musique |
| 10 | Enchantements | 24 | Langues & Sociologie |
| 11 | Divination & Astronomie | 25 | Philosophie & Psychologie |
| 12 | Alchimie | 26 | Romans |
| 13 | Minéraux & Métaux | 27 | Gastronomie |
| 14 | Botanique & Agriculture | | |

Source machine : [`annexes/taxonomie.json`](../Catalogue%20de%20Grimoires/annexes/taxonomie.json).

### 9.2 Raretés

**Décision :** **5 raretés commerciales** + **scellé** hors vente.

| Label FR | Clé app | Proportion cible | Fourchette (Florins) |
| -------- | ------- | ---------------- | -------------------- |
| Commun | `common` | ~60 % | 8–40 |
| Peu commun | `uncommon` | ~23 % | 40–120 |
| Rare | `rare` | ~11 % | 200–700 |
| Légendaire | `legendary` | ~4 % | 800–2500 |
| Mythique | `mythic` | ~1–2 % | 2500–10000+ |
| Scellé | `sealed` | hors vente | non commercialisable |

La rareté reste **statistique** (disponibilité / diffusion), jamais imposée par la catégorie.

### 9.3 Schéma JSON `books`

**Décision :** schéma minimal **sans `subcategory`** ; `category` ∈ liste des 27 ; `rarity` ∈ 5 clés commerciales (ou hors fiche pour scellés).

```json
{
"id": "HIS-001",
"title": "Chroniques Civiles",
  "description": "...",
"category": "Histoire",
"rarity": "common",
"price": 75,
  "author": "...",
  "collection": "...",
  "cote": "...",
"language": "Commun Archivistique",
  "format": "...",
"origin_sector": "I",
"copy_cycle": "Cycle 08",
"supplier_available": true,
  "lore_hook": "..."
}
```

### 9.4 Proportions catalogue (200 titres)

**Décision :** les proportions **cibles** du §9.2 remplacent l'ancien équilibre 187/11/2.  
Le fichier `catalogue/*.json` reste en **état Chat 4** jusqu'à migration dédiée (reclassement catégories + rééquilibrage raretés).

### 9.5 Auteurs ↔ titres

**Décision :** un auteur reste cohérent avec domaine, secteur et époque ; nouveaux titres réutilisent les auteurs existants quand pertinent ; personnages principaux ne deviennent pas auteurs sans justification.

---

## 10. Alignement application MVP

| Concept lore | Entité app / BDD | Statut |
| ------------ | ---------------- | ------ |
| Grimoire | `books` | Implémenté MVP |
| Code catalogue | `books.lore_code` (`HIS-001`, …) | Implémenté MVP |
| Catégorie | `categories` + `books.category_id` (27 noms taxonomie v1.2) | Seed MVP |
| Rareté | `books.rarity` (5 clés commerciales) | Implémenté MVP |
| Couverture | `books.cover_url` (URL optionnelle) | Implémenté MVP |
| Stock rayon / réserve | `books.qty_shelf`, `books.qty_reserve` | Implémenté MVP |
| Fournisseur | `suppliers` (Dépôt Central Port-Aster) | Seed MVP |
| Client simulé | config JSON runtime (pas de table MVP) | Documenté |
| Événement simulation | `simulation_events` (4 types) | Implémenté MVP |
| Journal / run | `simulation_runs`, `simulation_events` | Implémenté MVP |
| Collection éditoriale | hors BDD MVP (JSON lore) | Documenté |
| Factions / quêtes / magie active | — | Lore uniquement |

---

## 11. Règles de maintenance du lore

Règles complètes : [`index/rules.json`](./index/rules.json).

| ID | Énoncé (résumé) | Portée |
| -- | --------------- | ------ |
| RULE-001 | Un nom propre = une entité | global |
| RULE-002 | Modification canon → mise à jour doc + Bible + version | global |
| RULE-003 | Docs spécialisés propriétaires de leur domaine | global |
| RULE-004 | IDs ouvrages : HIS/BOT/ARC/NEC-NNN | catalogue |
| RULE-005 | COL-NNN ≠ titre de livre | catalogue |
| RULE-006 | Raretés app : common, uncommon, rare, legendary, mythic (+ sealed hors vente) | catalogue |
| RULE-007 | 4 types d'événements simulation | simulation |
| RULE-008 | Livres = savoir, pas pouvoir intrinsèque | univers |
| RULE-009 | Nouveau personnage : fonction, institution, ID | simulation |
| RULE-010 | Versioning v1.0 / v1.1 explicite | documentation |
| RULE-011 | Pas de brouillon `old/` comme source active | documentation |
| RULE-012 | Évolution app → vérifier alignement lore | global |

---

## 12. Arborescence des fichiers de référence

```
bookstore_management/lore/
├── README.md                          — Navigation et statut des chats
├── Cosmolige & Chronologie/
│   └── Document fondateur v1.0 — Cosmologie & Chronologie.md
├── Géographie & factions/
│   └── Document fondateur v1.0 — Géographie & Factions.md
├── La Librairie/
│   └── Document fondateur v1.0 — La Librairie.md
├── Catalogue de Grimoires/
│   ├── Document fondateur v1.1 — Catalogue de Grimoires.md
│   ├── catalogue/                     — fiches JSON par catégorie (taxonomie v1.2)
│   └── annexes/                       — auteurs, collections, scellés, taxonomie.json
├── Personnages & Simulation/
│   ├── Document fondateur v1.0 — Personnages & Simulation.md
│   ├── personnages/                   — clients.json, npc.json
│   ├── templates/                     — journal.json
│   └── scenarios/                     — scenarios.json
└── Bible Canonique/
    ├── Document fondateur v1.0 — Bible Canonique.md   ← ce document
    └── index/
        ├── entities.json
        └── rules.json
```

En cas de divergence : **document fondateur du chat concerné** fait foi. Les brouillons historiques ne sont jamais sources actives (RULE-011).

---

## 13. Glossaire master

| Terme | Définition | Source |
| ----- | ---------- | ------ |
| Trame | Réalité fondamentale unique du monde | Cosmologie |
| Courants Invisibles | Phénomènes traversant la Trame | Cosmologie |
| Cycle / Millénaire | Repères chronologiques (Cycle 08 — M 4.2) | Cosmologie |
| Force | Matière, Mémoire, Souffle, Voile | Cosmologie |
| Secteur | Division administrative archivistique | Géographie |
| Archives Mondiales | Réseau institutionnel de conservation | Géographie |
| Guilde des Archivistes de Sim | Institution professionnelle | Cosmologie |
| Grimoire | Ouvrage documentaire certifié | Catalogue |
| Collection | Regroupement éditorial (COL-NNN) | Catalogue |
| Rareté | Niveau de disponibilité commerciale | Catalogue |
| Florin | Monnaie commerciale | Catalogue |
| Rayon / Réserve | Vente publique / stock interne | Librairie |
| Grand Archiviste | Personnage joueur | Librairie |
| Client simulé / NPC | Visiteur achetant / figure événementielle | Personnages |
| Journal de simulation | Trace narrative des événements | Personnages |
| Convoi | Transport Port-Aster → Hillsvaire | Personnages |
| Canon verrouillé | Invariant non modifiable sans révision | Bible |
| Élément provisoire | Défini mais non bloquant MVP | Bible |
| Zone ouverte | Sujet à trancher post-MVP | Bible |
| Document fondateur | Référence authoritative par chat | Bible |

---

## Récapitulatif

### Canon verrouillé (Bible)

- Bible = navigation supérieure ; 5 fondateurs = autorité par domaine
- Hillsvaire C.2 = librairie ; Port-Aster = fournisseur
- 200 titres, **27 catégories**, **5 raretés** + scellé, 6 ouvrages app verrouillés
- Taxonomie : [`annexes/taxonomie.json`](../Catalogue%20de%20Grimoires/annexes/taxonomie.json)
- Collections ≠ titres ; schéma JSON `books` sans sous-catégorie

### Décisions d'arbitrage (§9)

1. **27 catégories** commerciales (liste plate, pas de sous-catégories) + Archives scellées hors vente  
2. **5 raretés** (`common` … `mythic`) + `sealed` ; proportions ~60 / 23 / 11 / 4 / 1–2 %  
3. Schéma JSON `books` sans `subcategory`  
4. Migration des 200 titres JSON = tâche ultérieure  
5. Règles auteurs ↔ titres  

### Travail post-Bible (hors scope lore)

Implémentation Next.js/MySQL, calibrage simulation, stocks initiaux, équilibrage économique, extension catalogue, vue boutique HD-2D ([`doc/10-simulation-temps-reel.md`](../../../doc/10-simulation-temps-reel.md)).

---

*Fin du Document fondateur v1.0 — Bible Canonique.*
