## Stack Remix with NestJS, Turborepo

Retrouvez le guide vidéo pour configurer ce projet sur YouTube (en français)

- [Partie 1 : Configurer Remix, NestJS et Turborepo](https://www.youtube.com/watch?v=yv96ar6XNnU&list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM&index=1)
- [Partie 2 : CI/CD, Déploiement avec Github Actions et Docker](https://www.youtube.com/watch?v=KCMFcHTYf9o&list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM&index=2)
- [Partie 3: Intégration Design System | Figma, Tailwind CSS & Shadcn UI](https://www.youtube.com/watch?v=GWfZewdFx4o&list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM&index=3)
- [Partie 4: Authentification avec Redis, express-session, Passport.js](https://youtu.be/SyuXRIbECEY?list=PL2TfCPpDwZVTQr3Ox9KT0Ex2D-QajUyhM)
- [Partie 5: Authentification par token, inscription avec Redis, express-session, Passport.js](https://youtu.be/k6KrmuVgvec)
- [Partie 6: Développement des fonctionnalités principales d'échange de service, faire une offre, éditer le profil ...](https://youtu.be/0C4Xh1x7flY)

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