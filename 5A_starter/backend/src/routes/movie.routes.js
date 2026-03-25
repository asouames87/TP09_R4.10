import express from "express";
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieStats,
  getSimilarMovies,
  getMoviesByGenre,
  getRandomMovies,
} from "../controllers/movie.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Routes publiques
router.get("/", getAllMovies);
router.get("/random", getRandomMovies);       
router.get("/genre/:genre", getMoviesByGenre); 
router.get("/stats", protect, admin, getMovieStats); 

// Routes dynamiques avec paramètre
router.get("/:id", getMovieById);
router.get("/:id/similar", getSimilarMovies);

// Routes protégées admin
router.post("/", protect, admin, createMovie);
router.put("/:id", protect, admin, updateMovie);
router.delete("/:id", protect, admin, deleteMovie);

export default router;