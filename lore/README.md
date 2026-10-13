# Lore — La Réserve des Grimoires

Documentation narrative du projet **La Réserve des Grimoires** : cosmologie, géographie, librairie, catalogue de livres, personnages simulés et bible canonique.

**Emplacement :** `bookstore_management/lore/` (versionné avec l’application Next.js ; consommé par le seed Prisma et, plus tard, le RAG).

Chaque sous-dossier correspond à un **chat dédié** dans le projet ChatGPT *La Réserve des Grimoires — Lore & Catalogue*. Les livrables y sont regroupés au fur et à mesure de leur production.

> **Référence applicative :** [`../../doc/cahier-des-charges.md`](../../doc/cahier-des-charges.md), [`../components/catalog/catalog-data.ts`](../components/catalog/catalog-data.ts)

---

## Organisation

| Dossier | Chat | Statut | Document de référence |
| ------- | ---- | ------ | --------------------- |
| [Cosmolige & Chronologie](./Cosmolige%20%26%20Chronologie/) | **Chat 1** — Cosmologie & Chronologie | ✅ Terminé | [Document fondateur v1.0](./Cosmolige%20%26%20Chronologie/Document%20fondateur%20v1.0%20—%20Cosmologie%20%26%20Chronologie.md) |
| [Géographie & factions](./Géographie%20%26%20factions/) | **Chat 2** — Géographie & Factions | ✅ Terminé | [Document fondateur v1.0](./Géographie%20%26%20factions/Document%20fondateur%20v1.0%20—%20Géographie%20%26%20Factions.md) |
| [La Librairie](./La%20Librairie/) | **Chat 3** — La Librairie | ✅ Terminé | [Document fondateur v1.0](./La%20Librairie/Document%20fondateur%20v1.0%20—%20La%20Librairie.md) |
| [Catalogue de Grimoires](./Catalogue%20de%20Grimoires/) | **Chat 4** — Catalogue de Grimoires | ✅ Terminé | [Document fondateur v1.1](./Catalogue%20de%20Grimoires/Document%20fondateur%20v1.1%20—%20Catalogue%20de%20Grimoires.md) |
| [Personnages & Simulation](./Personnages%20%26%20Simulation/) | **Chat 5** — Personnages & Simulation | ✅ Terminé | [Document fondateur v1.0](./Personnages%20%26%20Simulation/Document%20fondateur%20v1.0%20—%20Personnages%20%26%20Simulation.md) |
| [Bible Canonique](./Bible%20Canonique/) | **Chat 6** — Bible Canonique | ✅ Terminé | [Document fondateur v1.0](./Bible%20Canonique/Document%20fondateur%20v1.0%20—%20Bible%20Canonique.md) |

**Note :** en cas de divergence entre documents, **seule la version consolidée de chaque dossier fait foi**. Les brouillons `old/` ont été retirés (RULE-011).

---

## Chat 1 — Cosmologie & Chronologie

**Dossier :** `Cosmolige & Chronologie/`

**Objectif :** poser les fondations de l'univers médiéval-fantastique — cosmologie, système magique, calendrier, Cycles, Millénaires, Secteurs (aperçu), économie du livre, taxonomie des ouvrages.

**Livrable canonique :**

- [`Document fondateur v1.0 — Cosmologie & Chronologie.md`](./Cosmolige%20%26%20Chronologie/Document%20fondateur%20v1.0%20—%20Cosmologie%20%26%20Chronologie.md) — **document de référence unique** pour ce chat et pour tous les chats suivants.

**Points clés verrouillés :**

- Trame, Courants Invisibles, quatre Forces (Matière, Mémoire, Souffle, Voile)
- Magie ritualiste ; livres valorisés pour leur contenu documentaire
- Chronologie : Pré-Cycles → Cycle 08 ; époque actuelle : **Cycle 08 — Millénaire 4.2**
- Archives Mondiales du Secteur IV à Hillsvaire C.2 (*La Réserve des Grimoires*)
- ~70–80 % d'ouvrages communs ; raretés et catégories esquissées (à affiner au catalogue)

---

## Chat 2 — Géographie & Factions

**Dossier :** `Géographie & factions/`

**Objectif :** cartographier le continent, détailler les quatre Secteurs, ancrer Hillsvaire C.2, définir factions, routes du livre, peuples et langues.

**Livrable canonique :**

- [`Document fondateur v1.0 — Géographie & Factions.md`](./Géographie%20%26%20factions/Document%20fondateur%20v1.0%20—%20Géographie%20%26%20Factions.md) — **document de référence unique** pour la géographie et les factions.

**Points clés verrouillés :**

- Continent triangulaire ; Secteurs = réseaux admin/commerce/archivage (chevauchement possible)
- **Val-Simor** (Secteur I), **Port-Aster** (II), **Asterion** (III), **Hillsvaire** (IV)
- 6 quartiers de Hillsvaire dont **C.2** (Archives Mondiales / *La Réserve des Grimoires*)
- **Secteur septentrional**, **Terres Désolées du Sud**, **dynastie Hornburg** (prestige au Cycle 08)
- 6 routes du livre ; 5 factions majeures + Guilde
- **Commun Archivistique** (langue administrative) ; conflits économiques/administratifs, pas de guerre épique

---

## Chat 3 — La Librairie

**Dossier :** `La Librairie/`

**Objectif :** décrire l'établissement jouable — architecture, espaces, rayons, réserve, logistique, fournisseur unique MVP, clientèle et alignement avec la simulation applicative.

**Livrable canonique :**

- [`Document fondateur v1.0 — La Librairie.md`](./La%20Librairie/Document%20fondateur%20v1.0%20—%20La%20Librairie.md) — **document de référence unique** pour l'établissement et son fonctionnement.

**Points clés verrouillés :**

- Archives Mondiales du Secteur IV à Hillsvaire C.2 ; façade commerciale = **La Réserve des Grimoires**
- Joueur = **Grand Archiviste** ; fonds de plusieurs milliers de titres (~70–80 % communs)
- 6 espaces : rayons, réserve, comptoir, section scellée, salle de lecture, quai des convoyeurs
- 4 catégories : Histoire (40 %), Botanique (30 %), Arcane (20 %), Nécromancie (10 %)
- Flux logistique : Fournisseur → Quai → Réserve → Rayon → Client
- Fournisseur MVP : **Dépôt Central des Copistes de Port-Aster** (6 jours de délai)
- Rupture rayon vs rupture complète ; max ~10 exemplaires par titre en rayon

---

## Chat 4 — Catalogue de Grimoires

**Dossier :** `Catalogue de Grimoires/`

**Objectif :** définir le catalogue commercial de démonstration (~200 titres), les auteurs, collections, raretés, prix en Florins et les ouvrages scellés hors commerce.

**Livrable canonique :**

- [`Document fondateur v1.1 — Catalogue de Grimoires.md`](./Catalogue%20de%20Grimoires/Document%20fondateur%20v1.1%20—%20Catalogue%20de%20Grimoires.md) — **document de référence unique** pour le catalogue.
- [`catalogue/`](./Catalogue%20de%20Grimoires/catalogue/) — fiches JSON par catégorie (HIS, BOT, ARC, NEC).
- [`annexes/`](./Catalogue%20de%20Grimoires/annexes/) — auteurs, collections, ouvrages scellés, **taxonomie v1.2**.

**Points clés verrouillés :**

- Catalogue JSON dans [`catalogue/`](./Catalogue%20de%20Grimoires/catalogue/) ; taxonomie **v1.2** : **27 catégories**, **5 raretés** + scellé
- Raretés cibles : ~60 % / 23 % / 11 % / 4 % / 1–2 % (`common` → `mythic`)
- **6 ouvrages canoniques app** : Chroniques Civiles, Notes de Voyageur, Flora de l'Abîme, Anatomie Céleste, L'Oeil de l'Éclipse, Necronomicon Sim
- **4 ouvrages scellés** hors commerce (SCELL-001 à 004)
- 20 auteurs, 8 collections éditoriales ; [`annexes/taxonomie.json`](./Catalogue%20de%20Grimoires/annexes/taxonomie.json)

---

## Chat 5 — Personnages & Simulation

**Dossier :** `Personnages & Simulation/`

**Objectif :** définir les clients simulés, les personnages récurrents, les messages du journal et les scénarios narratifs alignés sur le moteur de simulation applicatif.

**Livrable canonique :**

- [`Document fondateur v1.0 — Personnages & Simulation.md`](./Personnages%20%26%20Simulation/Document%20fondateur%20v1.0%20—%20Personnages%20%26%20Simulation.md) — **document de référence unique** pour la simulation narrative.
- [`personnages/`](./Personnages%20%26%20Simulation/personnages/) — clients (CLI) et NPC (JSON).
- [`templates/`](./Personnages%20%26%20Simulation/templates/) — messages journal (JSON).
- [`scenarios/`](./Personnages%20%26%20Simulation/scenarios/) — scénarios narratifs (JSON).

**Points clés verrouillés :**

- **12 clients** (CLI-001 à CLI-012) couvrant les **8 archétypes** clientèle (Chat 3)
- **6 NPC** (staff, convoyeur, représentant Dépôt Central, fonctionnaire Guilde, érudit consultant)
- **4 types d'événements** : `CUSTOMER_PURCHASE`, `STOCKOUT`, `SUPPLIER_DELIVERY`, `UNAVAILABLE_REQUEST`
- **40 templates journal** ; **10 scénarios** (SCN-001 à SCN-010)
- Titres cités alignés sur le catalogue Chat 4 ; ouvrages `common` dominants en simulation
- Spec **applicative** (horloge, employés, caméra HD-2D) : [`doc/10-simulation-temps-reel.md`](../../doc/10-simulation-temps-reel.md) — ne remplace pas ce canon narratif

---

## Chat 6 — Bible Canonique

**Dossier :** `Bible Canonique/`

**Objectif :** synthèse transversale, index master, arbitrages et règles de maintenance du lore.

**Livrable canonique :**

- [`Document fondateur v1.0 — Bible Canonique.md`](./Bible%20Canonique/Document%20fondateur%20v1.0%20—%20Bible%20Canonique.md) — **document de navigation supérieur**.
- [`index/entities.json`](./Bible%20Canonique/index/entities.json) — 54 entités (lieux, factions, personnages, ouvrages, collections).
- [`index/rules.json`](./Bible%20Canonique/index/rules.json) — 12 règles (RULE-001 à RULE-012).

**Points clés verrouillés :**

- Hiérarchie : 5 documents fondateurs > Bible pour le détail spécialisé
- **27 catégories** et **5 raretés** (+ scellé) — taxonomie v1.2
- Proportions rareté ~60 / 23 / 11 / 4 / 1–2 %
- Schéma JSON `books` sans sous-catégorie ; migration JSON catalogue en attente
- Hillsvaire C.2 = librairie ; Port-Aster = fournisseur uniquement

---

## Chats à venir (aperçu)

Ordre de travail recommandé :

1. ~~Cosmologie & Chronologie~~ ✅
2. ~~Géographie & Factions~~ ✅
3. ~~La Librairie~~ ✅
4. ~~Catalogue de Grimoires~~ ✅
5. ~~Personnages & Simulation~~ ✅
6. ~~Bible Canonique~~ ✅

La documentation lore MVP est **complète**. Intégration app en cours : schéma `books.lore_code` / `books.rarity` + seed 27 catégories / auteurs / fournisseur. Reste : import catalogue (200 titres), reclassement taxonomie v1.2, simulation UI.

---

## Revue catalogue — arbitrages (Chat 6 + révision taxonomie)

| Sujet | Décision |
| ----- | -------- |
| **Catégories** | **27** commerciales (liste plate) + Archives scellées hors vente — [`taxonomie.json`](./Catalogue%20de%20Grimoires/annexes/taxonomie.json) |
| **Raretés** | **5** (`common`, `uncommon`, `rare`, `legendary`, `mythic`) + `sealed` |
| **Proportions** | ~60 % / 23 % / 11 % / 4 % / 1–2 % |
| **Sous-catégories** | **Aucune** |
| **Schéma JSON** | Sans `subcategory` ; migration des 200 fiches = tâche ultérieure — prompts : [`prompts-migration-catalogue-v1.2.md`](./Catalogue%20de%20Grimoires/annexes/prompts-migration-catalogue-v1.2.md) |
| **Auteurs ↔ titres** | Cohérence domaine/secteur ; pas d'auteur-implicite depuis personnages |

Points encore **provisoires** : stocks initiaux, calibrage simulation, prix dynamiques, **reclassement effectif** de `catalogue/*.json`.

---

## Règles de cohérence (tous chats)

1. Un nom propre = une seule entité canonique.
2. Les livres sont d'abord des objets de savoir, pas des objets magiques intrinsèques.
3. La rareté est statistique, pas thématique.
4. Toute nouvelle règle de monde doit être explicitement identifiée.
5. En cas de conflit entre documents, le **document fondateur** du chat concerné fait foi ; la **Bible v1.0** arbitre les écarts transversaux.

---

*Dernière mise à jour : emplacement `bookstore_management/lore/` ; archives `old/` retirées ; taxonomie v1.2 verrouillée.*
