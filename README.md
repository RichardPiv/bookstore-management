# Bookstore Management — Application Next.js

Application web de gestion et simulation d'une librairie.

> Documentation complète du projet : voir le [README parent](../README.md) et le dossier [`doc/`](../doc/).

## Prérequis

- Node.js 20+
- MySQL avec la base `bookstore_management` (voir [`doc/bookstore_management.sql`](../doc/bookstore_management.sql))

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Vérification ESLint |

## Stack

| Composant | Version |
|-----------|---------|
| Next.js | 16.2.9 (App Router) |
| React | 19.2.4 |
| TypeScript | 5.x (strict) |
| Tailwind CSS | 4.x |
| Prisma | À installer (ORM choisi) |

## Configuration

Le fichier `.env.example` documente la variable `DATABASE_URL` requise par Prisma :

```
DATABASE_URL=mysql://user:pass@localhost:3306/bookstore_management
SESSION_SECRET=...
```

Voir [`doc/03-exigences-techniques.md`](../doc/03-exigences-techniques.md) pour le détail des variables d'environnement.

## Structure

```
app/              # Pages et routes Next.js (App Router)
public/           # Assets statiques
prisma/           # Schéma Prisma et seed (à créer)
lib/db.ts         # Instance Prisma Client (à créer)
```

Les dossiers `components/`, `lib/services/` et `app/api/` seront ajoutés au fil de la Phase A.
