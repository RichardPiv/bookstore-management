# Prompts ChatGPT — Migration catalogue v1.2

**Objectif :** migrer les fiches existantes (4 fichiers JSON, 4 catégories, 3 raretés) vers la taxonomie **v1.2** (27 catégories, 5 raretés commerciales), puis **étoffer** chaque catégorie selon sa diversité possible.

**Références canon :**

- [`taxonomie.json`](./taxonomie.json) (source de vérité)
- [`auteurs.json`](./auteurs.json)
- [`collections.json`](./collections.json)
- [`../catalogue/histoire.json`](../catalogue/histoire.json), [`botanique.json`](../catalogue/botanique.json), [`arcane.json`](../catalogue/arcane.json), [`necromancie.json`](../catalogue/necromancie.json)
- Document fondateur Catalogue §2–§3

**Volume cible (souple) :**

- **Plus de contrainte « exactement 200 titres ».**
- **Moyenne indicative : ~25 livres par catégorie** × 27 ≈ **~675 titres** d’ordre de grandeur.
- Certaines catégories peuvent en avoir **beaucoup plus**, d’autres **moins**, selon la diversité réaliste du thème (ex. Histoire / Arcane / Romans plus fournis ; Gastronomie / Illusions plus serrés).
- Minimum conseillé : **≥ 10** titres par catégorie (sauf justification explicite).

---

## Règles non négociables

1. **Volume flexible** — viser ~25 livres / catégorie en moyenne ; pas de plafond fixe à 200. Répartir selon la richesse thématique de chaque catégorie.
2. **Pas de `subcategory`** dans le JSON final.
3. `category` ∈ liste des 27 noms exacts (orthographe stricte).
4. `rarity` ∈ `common` | `uncommon` | `rare` | `legendary` | `mythic` uniquement (jamais `sealed`).
5. Rareté = **disponibilité**, pas puissance magique.
6. Proportions de rareté **globales** (sur le catalogue entier, pas par catégorie) :
   - ~60 % common
   - ~23 % uncommon
   - ~11 % rare
   - ~4 % legendary
   - ~1–2 % mythic
7. Prix en Florins dans les fourchettes de `taxonomie.json` selon la rareté.
8. **IDs stables** pour les titres existants (`HIS-xxx`, `BOT-xxx`, `ARC-xxx`, `NEC-xxx`) — ne pas renommer les IDs.
9. Ouvrages canoniques app (ne pas changer id / title / rarity / category cible) :

| id | title | category | rarity |
| ---- | ----- | -------- | ------ |
| HIS-001 | Chroniques Civiles | Histoire | common |
| HIS-002 | Notes de Voyageur | Donjons & Voyages | common |
| BOT-008 | Flora de l'Abîme | Botanique & Agriculture | rare |
| ARC-033 | Anatomie Céleste | Divination & Astronomie | rare |
| ARC-040 | L'Oeil de l'Éclipse | Arcane | legendary |
| NEC-020 | Necronomicon Sim | Nécromancie | legendary |

10. Livres = savoir documentaire, **pas** pouvoir intrinsèque.
11. Réutiliser les auteurs de `auteurs.json` quand pertinent ; ne pas inventer « Maître Elian Voss » comme auteur principal d’ouvrages.
12. Ton : médiéval-fantastique archivistique, français soigné, pas de meta / jeu vidéo.
13. **Suites / tomes autorisés** — un ouvrage peut faire partie d’une série (tome 1, 2, 3…).
    - Chaque tome = **une fiche distincte** avec son propre `id`.
    - Même `author` (sauf anthologie justifiée), même `category` en général.
    - Titre clair : ex. `"Chroniques des Frontières — Tome II"` ou champ dédié `series` + `volume`.
    - Les tomes d’une suite partagent le même nom de série ; la rareté / le prix peuvent varier (tome introuvable, etc.).
    - Ne pas confondre **série / suite** (tomes d’une œuvre) et **`collection`** (étiquette éditoriale COL, ex. « Registres de Port-Aster »).

### Schéma JSON cible (une fiche)

```json
{
  "id": "HIS-001",
  "title": "…",
  "description": "…",
  "price": 75,
  "rarity": "common",
  "category": "Histoire",
  "author": "…",
  "collection": "…",
  "series": null,
  "volume": null,
  "cote": "…",
  "language": "…",
  "format": "…",
  "origin_sector": "I|II|III|IV",
  "copy_cycle": "Cycle 0X",
  "supplier_available": true,
  "lore_hook": "…"
}
```

Champs optionnels pour les suites :

| Champ | Type | Usage |
| ----- | ---- | ----- |
| `series` | string \| null | Nom de la suite (ex. `"Chroniques des Frontières"`) ; `null` si ouvrage autonome |
| `volume` | number \| null | Numéro de tome (1, 2, 3…) ; `null` si autonome |

Si `series` est renseigné, `volume` l’est aussi (et inversement). Le `title` peut encore mentionner le tome pour la lisibilité UI.
### 27 catégories autorisées

Arcane, Rituels, Invocation, Illusions, Destruction, Malédictions, Sacré, Guérison, Nécromancie, Enchantements, Divination & Astronomie, Alchimie, Minéraux & Métaux, Botanique & Agriculture, Faune & Monstres, Guerre, Armes et Armures, Médecine, Donjons & Voyages, Histoire, Commerce & Droit, Métiers, Arts & Musique, Langues & Sociologie, Philosophie & Psychologie, Romans, Gastronomie

### Mapping legacy (aide au reclassement)

| Ancienne catégorie | Cibles v1.2 possibles |
| ------------------ | --------------------- |
| Histoire | Histoire, Donjons & Voyages, Commerce & Droit, Guerre |
| Botanique | Botanique & Agriculture, Faune & Monstres, Alchimie |
| Arcane | Arcane, Rituels, Invocation, Enchantements, Divination & Astronomie |
| Nécromancie | Nécromancie, Malédictions, Sacré |

### Catégories souvent absentes / à renforcer

Illusions, Destruction, Guérison, Minéraux & Métaux, Médecine, Armes et Armures, Métiers, Arts & Musique, Langues & Sociologie, Philosophie & Psychologie, Romans, Gastronomie  
(+ rééquilibrer Invocation, Rituels, Enchantements, Faune & Monstres, Guerre, Commerce & Droit, Donjons & Voyages, etc.)

### Guide de volume par catégorie (indicatif, pas figé)

| Profil | Exemples | Ordre de grandeur |
| ------ | -------- | ----------------- |
| Très riche | Histoire, Arcane, Botanique & Agriculture, Romans, Guerre, Donjons & Voyages | ~30–50+ |
| Standard | Rituels, Enchantements, Médecine, Métiers, Commerce & Droit, Faune & Monstres… | ~20–30 |
| Plus étroit | Illusions, Gastronomie, Minéraux & Métaux, Langues & Sociologie… | ~10–20 |

Ajuster librement si la diversité du thème le justifie ; documenter les écarts forts dans le plan (Prompt 3).

### Fourchettes de prix (Florins)

| Rareté | Prix min–max |
| ------ | ------------ |
| common | 8–40 |
| uncommon | 40–120 |
| rare | 200–700 |
| legendary | 800–2500 |
| mythic | 2500–10000 |

---

## Prompt 0 — Contexte système (premier message / Custom Instructions)

```
Tu es archiviste de la Guilde pour La Réserve des Grimoires (Hillsvaire C.2).
Tu migres et étoffes le catalogue commercial JSON vers la taxonomie v1.2.
Tu réponds uniquement en JSON valide (tableau d'objets), sans markdown autour, sauf si je demande un rapport.
Tu respectes strictement les 27 catégories, 5 raretés, proportions globales de rareté, IDs stables et ouvrages canoniques.
Volume : pas de limite à 200 titres — viser ~25 livres par catégorie en moyenne, avec plus ou moins selon la diversité thématique de chaque catégorie.
Les suites (tome 1, 2, 3…) sont autorisées : une fiche par tome, champs series + volume, distincts de collection éditoriale.
```

---

## Prompt 1 — Audit (pas de réécriture)

```
Voici le brief taxonomie v1.2 [coller la section « Règles non négociables » + 27 catégories + mapping + guide de volume + fourchettes].
Voici un fichier JSON du catalogue actuel [coller histoire.json | botanique.json | arcane.json | necromancie.json].

Fais un rapport markdown (pas JSON) :
1. Comptage par category et rarity actuelles
2. Liste des fiches dont la catégorie v1.1 doit changer (avec catégorie cible proposée)
3. Liste des raretés à corriger (prix hors fourchette, ou seulement common|rare|legendary → ajouter uncommon/mythic)
4. Catégories v1.2 absentes ou sous-représentées vs moyenne ~25 / catégorie
5. Conflits avec les 6 ouvrages canoniques

Ne réécris aucune fiche.
```

---

## Prompt 2 — Reclassement d’un fichier existant (répéter ×4)

```
Migré ce fichier vers taxonomie v1.2.

Fichier source : [coller intégralement histoire.json | botanique.json | arcane.json | necromancie.json]

Consignes :
- Conserve tous les id existants.
- Supprime le champ subcategory.
- Recalcule category parmi les 27 (utilise le mapping legacy + le contenu réel du titre).
- Recalcule rarity + price pour coller aux fourchettes v1.2.
- Respecte les ouvrages canoniques s'ils sont dans ce fichier.
- Améliore description / lore_hook seulement si flou ou hors ton ; ne change pas le sens.
- Réutilise les auteurs existants quand possible.
- Si un titre est clairement un tome d'une suite, renseigne series + volume (sinon null).
- Sortie : un seul tableau JSON avec le même nombre d'entrées que l'entrée.
```

---

## Prompt 3 — Plan de répartition globale (avant création)

```
À partir des 4 fichiers déjà migrés [coller comptes ou résumés], propose un plan (markdown) pour étoffer le catalogue :

| Catégorie | Nb actuel | Nb cible | Écart | Justification (diversité du thème) |
|-----------|-----------|----------|-------|-------------------------------------|
| … | | | | |

Contraintes :
- Moyenne indicative ~25 livres / catégorie (ordre de grandeur total ~675)
- Pas de total fixe à 200 — certaines catégories beaucoup plus fournies, d'autres moins
- Minimum conseillé ≥ 10 par catégorie (sinon justification)
- Proportions de rareté globales respectées (~60 / 23 / 11 / 4 / 1–2 %)
- Les 6 canoniques restent
- Les IDs existants ne sont pas détruits : pour les nouveaux titres, propose un préfixe clair (ILL-, GAS-, MED-, etc.) + numérotation — indique ton choix explicitement
- Prévoir des suites (2–5 tomes) là où c'est naturel (Romans, Histoire, traités Arcane, guides de voyage, etc.) — chaque tome compte dans le volume de la catégorie

N'écris pas encore les fiches.
```

---

## Prompt 4 — Génération des titres manquants (par lot)

```
Génère un tableau JSON de N nouveaux ouvrages pour combler ces catégories : [liste].

N = [ex. 25 pour une catégorie standard, ou le besoin restant vers la cible du plan]
Répartition rareté demandée dans ce lot : [ex. ~60 % common, reste selon proportions]

Contraintes :
- Schéma cible v1.2 complet (sans subcategory)
- IDs nouveaux uniques : [ex. GAS-001 …]
- Auteurs : prioriser auteurs.json [coller la liste des noms] ; nouveaux auteurs autorisés si le volume l'exige (specialty cohérente)
- Collections cohérentes avec collections.json si possible [coller noms]
- supplier_available: true
- Pas de doublon de titre avec le catalogue existant [coller titres déjà pris]
- Description 1 phrase claire ; lore_hook utile simulation (vente / savoir)
- Variété réelle dans la catégorie (pas de quasi-doublons)
- Suites bienvenues : si tu crées une série, génère tous les tomes du lot (series + volume cohérents, titres distincts, id séquentiels)

Sortie : JSON tableau uniquement.
```

---

## Prompt 5 — Rééquilibrage raretés (pass global)

```
Voici le catalogue fusionné (ou un résumé id/title/category/rarity/price) [coller].

Ajuste uniquement rarity et price pour atteindre les proportions globales :
- ~60 % common, ~23 % uncommon, ~11 % rare, ~4 % legendary, ~1–2 % mythic
- fourchettes prix taxonomie v1.2
- ne touche pas aux 6 canoniques (rarity/category figées)
- ne change pas les id, title, category sauf erreur manifeste

Sortie : tableau JSON des fiches modifiées seulement { id, rarity, price } ou catalogue complet si je le demande.
```

---

## Prompt 6 — Contrôle qualité final

```
Voici le JSON catalogue final [coller ou joindre].

Vérifie et réponds en markdown :
1. Total de titres (indicatif vs ~675) et moyenne livres / catégorie
2. Toutes les category ∈ 27 ?
3. Aucun subcategory ?
4. Raretés ∈ 5 clés + % vs cibles (~60 / 23 / 11 / 4 / 1–2)
5. Canoniques OK ?
6. Doublons id / title ?
7. Prix hors fourchette ?
8. Catégories < 10 titres (lister) ou écarts extrêmes vs ~25 (justifiés ?)
9. Suites : series/volume cohérents (pas de volume sans series ; pas de trou injustifié dans la numérotation d'une série) ?

Liste les erreurs avec id concernés. Ne réécris le catalogue que si je dis « corrige ».
```

---

## Prompt 7 — Découpage fichiers de sortie (optionnel)

```
Propose une arborescence de fichiers JSON post-migration :
- soit 1 fichier par catégorie (27) — recommandé si volume ~25+/catégorie,
- soit regroupement par group taxonomie,
- soit conservation HIS/BOT/ARC/NEC + nouveaux préfixes, avec category v1.2 à l'intérieur (IDs stables pour l'existant).

Recommande une option pour l'import app (lore_code = id) et donne la liste des chemins + nombre d'entrées attendues.
```

---

## Ordre de travail recommandé

1. Prompt 0 (contexte)
2. Prompt 1 sur chaque fichier source
3. Prompt 2 ×4 (reclassement)
4. Prompt 3 (plan de volume par catégorie, ~25 en moyenne)
5. Prompt 4 en lots jusqu’à atteindre les cibles du plan
6. Prompt 5 (raretés globales en %)
7. Prompt 6 (QA)
8. Prompt 7 si besoin d’organisation fichiers

---

## Notes import app (rappel)

| Champ lore JSON | Champ BDD / app |
| --------------- | --------------- |
| `id` | `books.lore_code` |
| `cote` | `books.cote` |
| `title` | `books.title` |
| `description` | `books.summary` |
| `price` | `books.purchase_price` (+ `sale_price` = même valeur par défaut) |
| `rarity` | `books.rarity` |
| `category` (nom) | `books.category_id` via table `categories` |
| `collection` | `books.collection` |
| `series` / `volume` | `books.series` / `books.volume` |
| `format` | `books.format` |
| `supplier_available` | `books.supplier_available` |
| — | `books.cover_url` optionnel |
| `author` / `authors` | `authors` + `books_authors` |

`language`, `origin_sector`, `copy_cycle`, `lore_hook` restent hors BDD MVP (sauf décision ultérieure).
