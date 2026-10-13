# Document fondateur v1.0 — Personnages & Simulation

**Version consolidée v1.0 — Canon de simulation narrative**

Période : **Cycle 08 — Millénaire 4.2**

Rédigé selon les usages de la Guilde des Archivistes de Sim

> Document de référence pour les personnages simulés, les événements narratifs et le journal quotidien de l'application.  
> S'appuie sur les [Documents fondateurs](../Cosmolige%20%26%20Chronologie/Document%20fondateur%20v1.0%20—%20Cosmologie%20%26%20Chronologie.md) (Cosmologie), [Géographie](../Géographie%20%26%20factions/Document%20fondateur%20v1.0%20—%20Géographie%20%26%20Factions.md), [La Librairie](../La%20Librairie/Document%20fondateur%20v1.0%20—%20La%20Librairie.md) et [Catalogue de Grimoires v1.1](../Catalogue%20de%20Grimoires/Document%20fondateur%20v1.1%20—%20Catalogue%20de%20Grimoires.md).  
> En cas de divergence avec d’anciens brouillons, **ce document fait foi**.

**Données structurées :**

| Fichier | Contenu |
| ------- | ------- |
| [`personnages/clients.json`](./personnages/clients.json) | 12 clients simulés (CLI-001 à CLI-012) |
| [`personnages/npc.json`](./personnages/npc.json) | 6 personnages récurrents non-clients (NPC-001 à NPC-006) |
| [`templates/journal.json`](./templates/journal.json) | 40 messages journal (PUR, STO, DEL, UNA) |
| [`scenarios/scenarios.json`](./scenarios/scenarios.json) | 10 scénarios narratifs (SCN-001 à SCN-010) |

---

## 1. Vision de la simulation narrative

### 1.1 Rôle des personnages simulés

Les personnages simulés représentent la fréquentation quotidienne de **La Réserve des Grimoires**. Ils incarnent les usages normaux d'une grande librairie archivistique — pas des héros, aventuriers ou porteurs d'intrigues épiques.

Chaque visiteur possède une raison documentaire de venir, des habitudes d'achat, des disciplines favorites et une manière identifiable de formuler ses demandes. La diversité des profils transforme une opération commerciale en activité vivante.

La **majorité des interactions** concernent des ouvrages `common`. Les ouvrages `rare` ou `legendary` restent exceptionnels en simulation.

### 1.2 Une journée simulée

Le bouton **« Simuler une journée »** représente une journée normale d'activité :

- arrivée progressive des visiteurs ;
- consultations au comptoir ;
- ventes d'ouvrages disponibles ;
- baisse naturelle du stock rayon ;
- signalements de rupture ;
- réception éventuelle d'un convoi ;
- demandes auxquelles la librairie ne peut pas répondre immédiatement.

| Situation narrative | Type d'événement app |
| ------------------- | -------------------- |
| Un étudiant achète un manuel | `CUSTOMER_PURCHASE` |
| Plusieurs visiteurs demandent le même ouvrage | baisse du stock |
| Dernier exemplaire vendu | `STOCKOUT` |
| Une caisse arrive de Port-Aster | `SUPPLIER_DELIVERY` |
| Un client cherche une référence absente | `UNAVAILABLE_REQUEST` |

Circuit logistique : **Fournisseur → Réserve → Rayons → Client** (cf. [La Librairie §5](../La%20Librairie/Document%20fondateur%20v1.0%20—%20La%20Librairie.md)).

---

## 2. Personnages clients nommés

Les **huit archétypes** définis au Chat 3 ([La Librairie §8](../La%20Librairie/Document%20fondateur%20v1.0%20—%20La%20Librairie.md)) sont incarnés par **12 personnages** nommés. Fiches complètes : [`personnages/clients.json`](./personnages/clients.json).

| ID | Nom | Archétype | Secteur | Pondération |
| -- | --- | --------- | ------- | ----------- |
| CLI-001 | Lorian Veyr | Apprenti mage | III | high |
| CLI-002 | Maëra Solven | Apprenti mage | III | medium |
| CLI-003 | Teren Alvior | Étudiant archivistique | IV | high |
| CLI-004 | Yselle Marovan | Étudiante archivistique | I | medium |
| CLI-005 | Calien Rhovar | Botaniste | II | high |
| CLI-006 | Nalia Verdan | Botaniste | IV | medium |
| CLI-007 | Oren Caldrys | Érudit | I | medium |
| CLI-008 | Selma Orvane | Érudit | IV | low |
| CLI-009 | Darel Voskan | Fonctionnaire Guilde | IV | high |
| CLI-010 | Elira Montess | Marchand | II | medium |
| CLI-011 | Kael Ruvian | Voyageur | IV | medium |
| CLI-012 | Arwen Lysorel | Représentant institution | IV | low |

**Règle catalogue :** les champs `typical_book_titles` ne citent que des titres présents dans [`catalogue/*.json`](../Catalogue%20de%20Grimoires/catalogue/) (pas de noms de collections seuls).

---

## 3. Personnages récurrents non-clients

Ces figures interviennent dans les événements sans être des acheteurs réguliers. Fiches : [`personnages/npc.json`](./personnages/npc.json).

| ID | Nom | Rôle | Événements |
| -- | --- | ---- | ---------- |
| NPC-001 | Maître Elian Voss | Commis réceptionnaire | `SUPPLIER_DELIVERY`, `STOCKOUT` |
| NPC-002 | Sœur Maëline | Relieuse et restauratrice | `STOCKOUT`, `SUPPLIER_DELIVERY` |
| NPC-003 | Corvin Hale | Convoyeur certifié | `SUPPLIER_DELIVERY` |
| NPC-004 | Ilyan Meros | Représentant du Dépôt Central | `SUPPLIER_DELIVERY`, `UNAVAILABLE_REQUEST` |
| NPC-005 | Archiviste Lysa Corven | Fonctionnaire Guilde | Tous (exceptionnel) |
| NPC-006 | Maître Renald Vosmere | Érudit consultant itinérant | `UNAVAILABLE_REQUEST`, `CUSTOMER_PURCHASE` |

Elian Voss et Sœur Maëline restent le personnel officiel de l'établissement (Chat 3) ; ils ne sont pas des clients simulés.

---

## 4. Mapping événements ↔ narration

| Type app | Situation narrative | Personnages | Ressenti joueur |
| -------- | ------------------- | ----------- | --------------- |
| `CUSTOMER_PURCHASE` | Un visiteur trouve un ouvrage correspondant à son besoin | Client simulé | Satisfaction d'une gestion efficace |
| `STOCKOUT` | Le dernier exemplaire quitte le rayon | Client, Grand Archiviste, Elian Voss | Nécessité d'anticiper |
| `SUPPLIER_DELIVERY` | Un convoi de Port-Aster arrive | Elian Voss, Corvin Hale, Ilyan Meros | Progression logistique |
| `UNAVAILABLE_REQUEST` | Un visiteur demande une référence absente | Client, archiviste, parfois Renald Vosmere | Recherche et arbitrage |

### Principes par type

- **CUSTOMER_PURCHASE** — transmission normale du savoir (manuel, registre, herbier, traité). Jamais présenté comme activation d'un pouvoir magique.
- **STOCKOUT** — titre apprécié, anticipation nécessaire, pas une crise majeure.
- **SUPPLIER_DELIVERY** — lien Hillsvaire ↔ Port-Aster ; Dépôt Central = fournisseur unique MVP.
- **UNAVAILABLE_REQUEST** — causes possibles : titre absent du catalogue, stock épuisé, ouvrage dans une autre archive, référence imprécise du visiteur.

---

## 5. Bibliothèque de messages journal

**40 templates** répartis sur les 4 types d'événements. Source : [`templates/journal.json`](./templates/journal.json).

| Type | IDs | Quantité |
| ---- | --- | -------- |
| `CUSTOMER_PURCHASE` | PUR-001 à PUR-025 | 25 |
| `STOCKOUT` | STO-001 à STO-005 | 5 |
| `SUPPLIER_DELIVERY` | DEL-001 à DEL-005 | 5 |
| `UNAVAILABLE_REQUEST` | UNA-001 à UNA-005 | 5 |

Variables utilisées : `{client_name}`, `{book_title}`. Ton : **archivistique sobre** (Guilde des Archivistes de Sim).

Exemples :

- *« {client_name} acquiert un exemplaire de « {book_title} ». La référence rejoint son dossier d'étude personnelle. »* (PUR-001)
- *« Le stock rayon de « {book_title} » atteint zéro exemplaire. »* (STO-002)
- *« Le convoi du Dépôt Central des Copistes de Port-Aster est arrivé au Quai des Convoyeurs. »* (DEL-001)

---

## 6. Demandes spéciales et scénarios récurrents

**10 scénarios** narratifs légers. Source : [`scenarios/scenarios.json`](./scenarios/scenarios.json).

| ID | Titre | Personnage(s) | Événements probables |
| -- | ----- | ------------- | -------------------- |
| SCN-001 | Le manuel d'initiation recherché | CLI-001 | Achat, introuvable |
| SCN-002 | Le complément d'étude archivistique | CLI-003 | Achat |
| SCN-003 | L'herbier spécialisé | CLI-006 | Achat, introuvable |
| SCN-004 | La recherche historique prolongée | CLI-007 | Achat |
| SCN-005 | La commande administrative | CLI-009 | Achat, rupture |
| SCN-006 | L'achat professionnel d'un marchand | CLI-010 | Achat |
| SCN-007 | La préparation d'un voyage | CLI-011 | Achat |
| SCN-008 | L'acquisition institutionnelle | CLI-012 | Achat, livraison |
| SCN-009 | La référence introuvable | (tous archétypes) | Introuvable |
| SCN-010 | Le réapprovisionnement attendu | NPC-001 | Rupture, livraison |

---

## 7. Rythme et saisons de l'activité

Tendances narratives qualitatives — pas de calendrier code ni probabilités exactes.

| Période | Effet sur la simulation |
| ------- | ----------------------- |
| **Rentrée archivistique** | Hausse des érudits, archivistes et fonctionnaires ; demandes historiques et arcanes |
| **Saison des convois de Port-Aster** | Renouvellement du stock, réapparition d'ouvrages indisponibles, mentions logistiques au journal |
| **Période des recherches spécialisées** | Clients spécialisés, demandes rares, plus de recherches infructueuses |
| **Fin de cycle administratif** | Fonctionnaires et institutions ; ouvrages réglementaires ; sensibilité aux ruptures |
| **Saison des voyageurs** | Atlas, récits de voyage, rotation des ouvrages pratiques |

---

## 8. Fournisseurs et acteurs logistiques

### MVP (actif)

| Acteur | Rôle |
| ------ | ---- |
| **Dépôt Central des Copistes de Port-Aster** | Fournisseur unique ; ~6 jours de délai |
| **Corvin Hale** (NPC-003) | Convoyeur certifié |
| **Ilyan Meros** (NPC-004) | Représentant du Dépôt Central |

### Hors MVP (lore futur)

| Acteur | Secteur | Rôle |
| ------ | ------- | ---- |
| **Scriptorium des Hautes Archives de Lyr-Valen** | I | Copies savantes, restauration, ouvrages historiques rares |
| **Maître Sorin Vale**, copiste indépendant | II | Copies artisanales et reproductions de niche |
| **Réserve Marchande des Comptoirs d'Elenvar** | II | Commerce interrégional, collections secondaires |

---

## 9. Glossaire simulation

| Terme | Définition |
| ----- | ---------- |
| **Événement simulé** | Action générée par la simulation (achat, rupture, livraison, demande introuvable) |
| **Journal** | Registre narratif des événements importants de la librairie |
| **Client simulé** | Personnage avec profil, préférences et comportement d'achat cohérents |
| **Demande introuvable** | Client cherche un ouvrage absent ou indisponible |
| **Convoi** | Transport Port-Aster → Hillsvaire C.2 |
| **Alerte stock** | Signal qu'un ouvrage atteint un niveau faible ou zéro en rayon |
| **Rayon** | Espace de vente par catégorie (Histoire, Botanique, Arcane, Nécromancie) |
| **Réserve** | Stock non exposé en rayon |
| **Pondération** | Fréquence relative d'apparition (`high`, `medium`, `low`) |
| **Scénario narratif** | Combinaison prédéfinie d'événements et de personnages |
| **Archétype client** | Profil comportemental (8 types, Chat 3) |
| **Catalogue canonique** | 200 titres du [Chat 4](../Catalogue%20de%20Grimoires/Document%20fondateur%20v1.1%20—%20Catalogue%20de%20Grimoires.md) |

---

## 10. Principes de cohérence pour le Chat 6

1. Personnages : archétype, profession et comportements narratifs alignés.
2. Titres cités : exclusivement du catalogue `catalogue/*.json`.
3. Ouvrages rares : narrativement exceptionnels, pas des achats ordinaires fréquents.
4. Quatre types d'événements app uniquement : `CUSTOMER_PURCHASE`, `STOCKOUT`, `SUPPLIER_DELIVERY`, `UNAVAILABLE_REQUEST`.
5. Journal : ton d'archive de Guilde, sobre et immersif.
6. Fournisseur MVP : Dépôt Central de Port-Aster ; hiérarchie logistique respectée.
7. Clients : préférences compatibles avec leurs domaines (4 catégories app).
8. Demandes introuvable : plausibles, sans créer de nouveaux canons non validés.
9. Scénarios : personnages et ouvrages déjà définis uniquement.
10. Évolutions futures : distinguer canon verrouillé et contenu provisoire.

---

## 11. Zones ouvertes

Les points **narratifs** suivants restent à affiner dans la **Bible canonique** (calibrage d'ambiance, saisons, titres rares) :

- Nombre moyen d'événements par journée simulée (Mode 1 / lots)
- Fréquence relative des 4 types d'événements
- Poids exact des archétypes et des clients nommés (runtime)
- Fournisseurs secondaires (§8 hors MVP)
- Règles d'accès aux ouvrages rares en simulation
- Harmonisation titres ↔ collections ↔ catégories
- Éditions multiples d'un même ouvrage
- Événements saisonniers en simulation longue durée

**Côté application** (hors canon narratif, 2026-09-05), la génération des visiteurs, les employés, la file de tâches et la visualisation sont spécifiés dans [`doc/10-simulation-temps-reel.md`](../../../doc/10-simulation-temps-reel.md) :

- Visiteurs : 12 clients nommés + foule anonyme (8 archétypes)
- Employés recrutables, stats, salaires (`wage`)
- Vue caméra HD-2D, assets maison, boutique qui continue hors page Simulation

---

## Récapitulatif

### Canon verrouillé

- La Réserve des Grimoires = **Hillsvaire C.2**, Archives Mondiales Secteur IV
- Joueur = **Grand Archiviste** ; staff = Elian Voss, Sœur Maëline
- **12 clients** + **6 NPC** ; **8 archétypes** Chat 3 couverts
- **4 types d'événements** ; **40 messages journal** ; **10 scénarios**
- Fournisseur MVP = **Dépôt Central des Copistes de Port-Aster**
- Ouvrages `common` dominent ; livres = savoir documentaire, pas pouvoirs intrinsèques
- Titres de simulation alignés sur le **catalogue Chat 4**

### Éléments provisoires

- Calibrage N événements/jour et probabilités (lots)
- Pondération réelle en runtime des 12 CLI-\*
- Fournisseurs secondaires
- Staff lore (Elian / Maëline) : employés seed vs NPC visuels — L1 dans `doc/10`

### Prochain document — Chat 6 : Bible Canonique

Index global, fusion des documents fondateurs, résolution des contradictions restantes.

---

*Fin du Document fondateur v1.0 — Personnages & Simulation.*
