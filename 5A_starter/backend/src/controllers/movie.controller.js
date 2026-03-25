import Movie from "../models/Movie.js";

// @desc    Obtenir tous les films
// @route   GET /api/movies
// @access  Public
export const getAllMovies = async (req, res, next) => {
  try {
    const {
      genre,
      year,
      search,q,
      sort = "createdAt",
      page = 1,
      limit = 10,
    } = req.query;

    // Construction de la requête
    let query = { isAvailable: true };

    // Filtre par genre
    if (genre) {
      query.genre = { $regex: genre, $options: "i" };
    }

    // Filtre par année
    if (year) {
      query.year = parseInt(year);
    }

    const what = q || search; // Support des deux paramètres pour la recherche
    // Recherche textuelle
    if (what) {
      query.$or = [
        { title: { $regex: what, $options: "i" } },
        { description: { $regex: what, $options: "i" } },
      ];
    }

    // Tri
    let sortOption = {};
    switch (sort) {
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "year":
        sortOption = { year: -1 };
        break;
      case "price-asc":
        sortOption = { price: 1 };
        break;
      case "price-desc":
        sortOption = { price: -1 };
        break;
      case "popular":
        sortOption = { rentalCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécution de la requête
    const movies = await Movie.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    // Comptage total pour la pagination
    const total = await Movie.countDocuments(query);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un film par ID
// @route   GET /api/movies/:id
// @access  Public
export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID du film requis",
      });
    }
    // Gérer les routes spéciales pour les films populaires et récents
    if (id === "popular") {
      return getPopularMovies(req, res, next);
    }
    if (id === "recent") {
      return getRecentMovies(req, res, next);
    }
    //aléatoire
    if (id === "random") {
      return getRandomMovies(req, res, next);
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Film non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    // Erreur de format d'ID MongoDB
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID de film invalide",
      });
    }
    next(error);
  }
};

// @desc    Créer un nouveau film
// @route   POST /api/movies
// @access  Private/Admin
export const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      poster,
      backdrop,
      genre,
      year,
      duration,
      price,
      rating,
    } = req.body;

    // Vérifier si le film existe déjà
    const existingMovie = await Movie.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
      year,
    });

    if (existingMovie) {
      return res.status(400).json({
        success: false,
        message: "Ce film existe déjà dans la base de données",
      });
    }

    // Créer le film
    const movie = await Movie.create({
      title,
      description,
      poster,
      backdrop,
      genre,
      year,
      duration,
      price,
      rating,
    });

    res.status(201).json({
      success: true,
      message: "Film créé avec succès",
      data: movie,
    });
  } catch (error) {
    // Erreur de validation Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: messages,
      });
    }
    next(error);
  }
};

// @desc    Modifier un film
// @route   PUT /api/movies/:id
// @access  Private/Admin
export const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Film non trouvé",
      });
    }

    // Mise à jour
    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Retourner le document modifié
        runValidators: true, // Exécuter les validations
      },
    );

    res.status(200).json({
      success: true,
      message: "Film modifié avec succès",
      data: updatedMovie,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: messages,
      });
    }
    next(error);
  }
};

// @desc    Supprimer un film
// @route   DELETE /api/movies/:id
// @access  Private/Admin
export const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Film non trouvé",
      });
    }

    // Vérifier s'il y a des locations actives
    const Rental = (await import("../models/Rental.js")).default;
    const activeRentals = await Rental.countDocuments({
      movie: req.params.id,
      status: "active",
    });

    if (activeRentals > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce film, ${activeRentals} location(s) active(s)`,
      });
    }

    await movie.deleteOne();

    res.status(200).json({
      success: true,
      message: "Film supprimé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les statistiques des films
// @route   GET /api/movies/stats
// @access  Private/Admin
export const getMovieStats = async (req, res, next) => {
  try {
    const stats = await Movie.getStatsByGenre();

    const totalMovies = await Movie.countDocuments();
    const totalRevenue = await Movie.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$rentalCount"] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMovies,
        estimatedRevenue: totalRevenue[0]?.total || 0,
        byGenre: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les films similaires
// @route   GET /api/movies/:id/similar
// @access  Public
export const getSimilarMovies = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Film non trouvé",
      });
    }

    // Trouver des films du même genre
    const similarMovies = await Movie.find({
      genre: { $in: movie.genre },
      _id: { $ne: movie._id }, // Exclure le film actuel
      isAvailable: true,
    })
      .sort({ rating: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      count: similarMovies.length,
      data: similarMovies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les films les plus populaires
// @route   GET /api/movies/popular
// @access  Public
export const getPopularMovies = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const movies = await Movie.getPopularMovies(limit);

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les films récemment ajoutés
// @route   GET /api/movies/recent
// @access  Public
export const getRecentMovies = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const movies = await Movie.getRecentMovies(limit);

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Obtenir les films d'un genre spécifique
// @route   GET /api/movies/genre/:genre
// @access  Public
export const getMoviesByGenre = async (req, res, next) => {
  try {
    const genre = req.params.genre;
    const movies = await Movie.find({
      genre: { $regex: genre, $options: "i" },
      isAvailable: true,
    }).sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Obtenir des films aléatoires
// @route   GET /api/movies/random
// @access  Public
export const getRandomMovies = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const movies = await Movie.getRandomMovies(limit);

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};
