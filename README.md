---

## 🚀 Tu as aimé cette formation ? Passe à React Router 7 !

[![Formation React Router 7](https://algomax.fr/api/image?src=https%3A%2F%2Falgomax-public.s3.eu-west-3.amazonaws.com%2F47b80a89-fd57-41fb-bb91-93bdeecd3e43.png&width=1920&height=1080&fit=cover&position=center&quality=80&compressionLevel=9&contentType=image%2Fwebp)](https://algomax.fr/formation-react-router-7)

**React Router 7**, c'est Remix réinventé : **plus simple, plus rapide, avec Vite 6**. Toute la puissance du SSR, des loaders et actions, mais sans la complexité.

✨ **Formation complète** : 76 leçons, 19h56 de contenu  
💼 **Projets réels** : E-commerce avec Stripe, Better Auth, Prisma, AWS S3  
🎯 **Stack moderne** : TypeScript, Tailwind v4, shadcn-ui, déploiement prod  

### 🎁 **-65% avec le code REMIXJAM** → [Accéder à la formation](https://algomax.fr/formation-react-router-7)

---

## Stack Remix with NestJS, Turborepo

### 📋 Pré-requis

- [Node.js via nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommandé)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)

### 🏗️ Architecture

Monorepo Turborepo : NestJS sert le frontend Remix directement. Pas d'API REST séparée, juste le serveur NestJS qui monte Remix.

```
├── backend/        # NestJS + Prisma + Remix server
├── frontend/       # Remix app (UI/routes)
└── packages/       # Configs partagées (ESLint, TS)
```

### 🚀 Setup local

```bash
# 1. Redis (sessions)
docker compose -f docker-compose.redis.yml up -d

# 2. Dépendances
npm install

# 3. Créer .env à la racine (voir section Variables ci-dessous)

# 4. Copier .env dans backend/ à chaque modif
cp .env backend/.env

# 5. DB migrations
cd backend
npx prisma migrate dev
npx prisma generate

# 6. Lancer dev (depuis racine)
cd ..
npm run dev
```

App dispo sur `http://localhost:3000`

### 🔑 Variables d'environnement

Créer `.env` **à la racine** et dans `backend/` :

```bash
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Redis (sessions utilisateur)
REDIS_URL="redis://localhost:6379"

# Secret session (générer string aléatoire sécurisé)
SESSION_SECRET="your-super-secret-key-change-me"

# Environnement
NODE_ENV="development"
PORT="3000"

# Stripe (paiements)
STRIPE_SECRET_KEY="sk_test_..."           # Clé secrète Stripe
STRIPE_WEBHOOK_SECRET="whsec_..."         # Secret webhook Stripe

# AWS S3 (upload fichiers)
AWS_ACCESS_KEY="AKIA..."
AWS_SECRET="your-secret"
AWS_REGION="eu-west-3"
AWS_BUCKET_NAME="your-bucket"

# Optionnel : seed BD avec X offres fictives
SEED_OFFERS_COUNT="1000"
```

> ⚠️ **Important** : Copier `.env` dans `backend/` après chaque modif : `cp .env backend/.env`

### 📹 Tutoriels vidéo

Retrouvez le guide vidéo pour configurer ce projet sur YouTube (en français)

- [Partie 1 : Configurer Remix, NestJS et Turborepo](https://www.youtube.com/watch?v=yv96ar6XNnU&list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM&index=1)
- [Partie 2 : CI/CD, Déploiement avec Github Actions et Docker](https://www.youtube.com/watch?v=KCMFcHTYf9o&list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM&index=2)
- [Partie 3: Intégration Design System | Figma, Tailwind CSS & Shadcn UI](https://www.youtube.com/watch?v=GWfZewdFx4o&list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM&index=3)
- [Partie 4: Authentification avec Redis, express-session, Passport.js](https://youtu.be/SyuXRIbECEY?list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM)
- [Partie 5: Authentification par token, inscription avec Redis, express-session, Passport.js](https://youtu.be/k6KrmuVgvec)
- [Partie 6: Développement des fonctionnalités principales d'échange de service, faire une offre, éditer le profil ...](https://youtu.be/0C4Xh1x7flY)
- [Partie 7: Intégrer Amazon S3 pour héberger les fichiers des utilisateurs](https://youtu.be/4_Q8dsj-X9k)
- [Partie 8: J'ai redesigné ce SaaS avec l'IA | Formation Remix, NestJS, Shadcn UI 2024](https://www.youtube.com/watch?v=ZxYvbvF1dDA)
- [Partie 9: Implémentation de Nuqs: filtres et pagination côté serveur | Formation Remix, NestJS, Shadcn UI 2024](https://youtu.be/4nF_dgbkorw?list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM)
- [Partie 10: Implémenter Stripe Connect en multi-tenant | Formation Remix, NestJS, Shadcn UI 2024](https://youtu.be/uRzK8kVGJeY?list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM)

### Motivation

En 4 ans de développement, je n'ai pas encore trouvé une stack qui me plaît. Il y a toujours un élément qui manque (une fonctionnalité, ou une limitation technique).

En tant que développeur fullstack, je souhaite bénéficier du meilleur des deux mondes.

Je souhaite utiliser une technologie :

- simple à utiliser
- qui me permet d'implémenter une fonctionnalité rapidement
- qui me permet d'avoir un contrôle total sur la logique, front comme back

[Remix](https://remix.run) répond à mes attentes. C'est un framework frontend qui me permet d'utiliser Javascript et React pour créer des sites web performants et ergonomiques.

Ce framework est full-stack, signifiant que tu n'as pas besoin de configurer un serveur pour ajouter une logique backend. Tu peux appeler une base de donnée, intégrer l'authentification, et plein d'autres fonctionnalités.

Cependant, il n'a pas suffisamment de maturité. Il manque plein de features, comme les middleware (qui sont très utiles pour ne pas recopier la même logique de protection des routes)

J'utilisais donc [NestJS](https://nestjs.com/) comme serveur séparé jusqu'à présent. Ce framework Node.JS m'a permi d'utiliser Javascript pour configurer une base de donnée, des routes et toute ma logique métier.

Ensuite, j'appelle chaque route dans Remix. Mais c'est sujet à beaucoup d'erreurs d'inattention, ou de perte de synchronisation. J'informe Remix des réponses API de NestJS en déclarant un schéma Zod, qui peut être erroné, et générer des erreurs.

Je perd donc pas mal de temps à :

- déclarer des schémas Zod
- réparer des bugs, erreurs d'inattention
- déclarer des méthodes pour appeler mes routes

MAIS c'est terminé ! J'ai découvert une stack qui me permet d'intégrer ce serveur NestJS avec Remix. Cela remplace le serveur de Remix (celui qui faisait les appels à NestJS) par le serveur NestJS, directement.

Voici les avantages :

- aucune duplication de code
- aucun schéma zod
- aucun bug de ce style à régler

C'est un gain de temps énorme.

Et dans cette formation, je te montre comment j'ai configuré cette stack pour que tu puisses l'utiliser dans tes projets.

---

## ⚠️ Note importante

**Cette stack n'est plus recommandée pour de nouveaux projets.**

L'écosystème a évolué : Remix a fusionné avec React Router 7, qui simplifie énormément l'architecture. Plus besoin de NestJS, Redis, ni Docker pour du dev local. Ma nouvelle stack (enseignée dans [la formation React Router 7](https://algomax.fr/formation-react-router-7)) est **plus simple, plus rapide, plus maintenable**.

Ce repo reste utile pour apprendre, mais pour du prod, regarde React Router 7.

💬 **Des questions ?** Rejoins le [Discord Algomax](https://algomax.fr/discord)

---

## 🚀 Next Steps (améliorations possibles)

Si tu veux moderniser ce projet :

### 1. **Retirer Redis** (optionnel)

Remplacer express-session + Redis par auth en DB avec Prisma. Stocker sessions directement en PostgreSQL. Ça supprime la dépendance Docker/Redis en local.

### 2. **Migrer vers React Router 7**

- Activer tous les Remix future flags
- Updater vers dernière version Remix
- Migrer vers React Router 7 (guide officiel : [reactrouter.com](https://reactrouter.com))

### 3. **Retirer NestJS** (optionnel)

React Router 7 suffit pour la plupart des apps. Garde NestJS seulement si tu as besoin de microservices, websockets complexes, ou logique backend lourde.

**Résultat** : Stack ultra-simple avec juste React Router 7 + Prisma + PostgreSQL.
