# TP09_R4.10

## Sujet

Développement de la fonctionnalité Gestion du Carrousel pour l'application frontend-user du projet Netzlix.


## Membres du groupe et participation
SOUAMES Adam | Backend
MARTY Benjamin | Frontend 

## Travail réalisé

### Backend

- Ajout de la méthode statique `getRandomMovies` dans le modèle `Movie` (agrégation MongoDB `$sample`)
- Ajout de la route `GET /api/movies/random` → retourne 10 films disponibles au hasard
- Ajout de la route `GET /api/rentals/recommendations` → retourne 10 films recommandés basés sur les genres préférés de l'utilisateur connecté (films non encore loués)
- Tests des endpoints via Postman

### Frontend

- Complétion du service api.js : implémentation des fonctions getRandom(), getRecent(), getPopular() et getRecommendedMovies()
- Création du composant MovieHeroCarousel :
  - Utilise le composant existant MovieHero
  - Affiche les recommandations de l'API si l'utilisateur est connecté
  - Affiche 5 films au hasard si l'utilisateur n'est pas connecté
  - Navigation entre les films (précédent/suivant) avec défilement automatique
- Modification de Home.jsx :
  - Remplacement du MovieHero statique par le nouveau MovieHeroCarousel
  - Chargement et affichage des films populaires via moviesAPI.getPopular()
  - Chargement et affichage des films récents via moviesAPI.getRecent()

## Difficultés rencontrées

- Completer les fonctions de movie.controller.js
- affichage des film sur le frontend

## Technologies utilisées

- **Backend** : Node.js, Express, MongoDB/Mongoose
- **Frontend** : React (Vite), TailwindCSS
- **Tests API** : Thunder