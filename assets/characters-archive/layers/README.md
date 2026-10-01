# Calques personnages Reliquary

Voir la spec : [`doc/14-personnages-pixel-pipeline.md`](../../../../doc/14-personnages-pixel-pipeline.md).

## Format

- **64 × 96** px, PNG transparent, pixel art net (pas d’anti-alias).
- Naming : `{variant}_{dir}_{anim}_{frame}.png`
  - `dir` = `down` | `up` | `side` (`right` = flip runtime)
  - `anim` = `idle` (frames 0–3) | `walk` (frames 0–5)

## Dossiers

| Dossier | Contenu |
|---------|---------|
| `shadow/` | Ombre sol |
| `body/` | `body01`…`body03` |
| `outfit/` | `archivist_robe`, `dock_apron`, `stocker_tunic`, `visitor_cloak`, `scholar_coat` |
| `hair_back/` | Optionnel, même index que `hair` |
| `head/` | Visage / tête |
| `hair/` | `hair01`…`hair06` |
| `accessory/` | v1.1 |

## Hero set (priorité)

Pour `body01`, `hair01`–`hair02`, outfits staff (`archivist_robe`, `dock_apron`, `stocker_tunic`) :

- `down` + `side` × `idle_0..3` + `walk_0..5`

Exemple : `outfit/archivist_robe_down_idle_0.png`
