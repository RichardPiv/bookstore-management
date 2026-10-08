# Personnages Reliquary

Voir [`doc/14-personnages-pixel-pipeline.md`](../../../../doc/14-personnages-pixel-pipeline.md).

## Priorité runtime

1. `full/{outfit}_{dir}_{anim}_{frame}.png` — hero set interim (staff)
2. `layers/{slot}/…` — paper-doll (quand peints)
3. Canvas procédural `fillRect` — visiteurs / fallback

## `full/`

Frames **64 × 96**, PNG transparent, nearest-neighbor.

Outfits shippés : `archivist_robe`, `dock_apron`, `stocker_tunic`  
× `down` | `up` | `side` × `idle_0..3` | `walk_0..5`

## `layers/`

Calques séparés (encore à peindre). Naming :

```
{slot}/{variant}_{dir}_{anim}_{frame}.png
```

Slots : `shadow`, `body`, `outfit`, `hair_back`, `head`, `hair`, `accessory`
