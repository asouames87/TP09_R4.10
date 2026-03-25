import React, { useState, useEffect, useRef } from 'react';
import MovieHero from './MovieHero';
import { moviesAPI, rentalsAPI, isAuthenticated } from '../../services/api';
import Loading from '../common/Loading';

const MovieHeroCarousel = () => {
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        const fetchCarouselMovies = async () => {
            try {
                setLoading(true);
                let data;
                if (isAuthenticated()) {
                    data = await rentalsAPI.getRecommendedMovies();
                } else {
                    data = await moviesAPI.getRandom(5);
                }
                setMovies(data || []);
            } catch (error) {
                console.error("Error fetching carousel movies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCarouselMovies();
    }, []);

    useEffect(() => {
        resetTimeout();
        if (movies.length > 0) {
            timeoutRef.current = setTimeout(
                () => setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length),
                5000
            );
        }
        return () => {
            resetTimeout();
        };
    }, [currentIndex, movies]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? movies.length - 1 : prevIndex - 1));
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center bg-black"><Loading message="Chargement des recommandations..." /></div>;
    if (movies.length === 0) return null;

    return (
        <div className="relative group">
            <MovieHero movie={movies[currentIndex]} />

            {/* Navigation Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-opacity opacity-0 group-hover:opacity-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-opacity opacity-0 group-hover:opacity-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
                {movies.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-primary w-6' : 'bg-white/50 hover:bg-white'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default MovieHeroCarousel;
