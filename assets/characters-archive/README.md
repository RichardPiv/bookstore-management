# Archive sprites personnages (hors runtime)

Sprites générés (hero set `full/` + calques `layers/`) **isolés hors de `public/`**.

Le jeu utilise uniquement le rendu **canvas procédural** (`scripts/characters/compose-character.ts`).  
Ces PNG ne sont plus servis ni préchargés — aucun 404 réseau.

## Contenu

- `full/` — sprites 64×96 pré-composés (`{outfit}_{dir}_{anim}_{frame}.png`)
- `layers/` — calques paper-doll (si présents)

Pour réactiver un pipeline image plus tard, recopier vers `public/img/characters/` et reconnecter le chargeur.
