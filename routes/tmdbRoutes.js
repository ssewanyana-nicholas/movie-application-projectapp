import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const tmdbApiKey = process.env.TMDB_API_KEY;

router.get('/top-rated', async (req, res) => {
    const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${tmdbApiKey}&language=en-US&page=1`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching top-rated movies:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch top-rated movies' });
    }
});

router.get('/search', async (req, res) => {
    const query = req.query.query;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${query}&language=en-US&page=1`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error searching movies:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to search movies' });
    }
});

export default router;