const apiKey = '41e23e1524b7cb3d0c1b15b816308624';
const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=en-US&page=1`;

const gridViewButton = document.getElementById('gridView');
const listViewButton = document.getElementById('listView');
const searchInput = document.getElementById('searchInput');
const moviesContainer = document.querySelector('.movies-container');

let moviesData = [];

// Toggle views between grid and list
gridViewButton.addEventListener('click', () => {
    moviesContainer.style.display = 'grid';
    moviesContainer.classList.add('gridView');
    moviesContainer.classList.remove('listView');
});

listViewButton.addEventListener('click', () => {
    moviesContainer.style.display = 'block';
    moviesContainer.classList.add('listView');
    moviesContainer.classList.remove('gridView');
});

// Fetch movies data
async function fetchMovies(query = '') {
    showLoading(true);
    const fetchUrl = query
        ? `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}&language=en-US&page=1`
        : url;

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch movie data.');
        }

        const data = await response.json();
        moviesData = data.results;
        displayMovies(moviesData);
    } catch (error) {
        displayError(error);
    } finally {
        showLoading(false);
    }
}

// Display movies on the page
function displayMovies(movies) {
    moviesContainer.innerHTML = '';
    if (movies.length === 0) {
        moviesContainer.innerHTML = `<p>No movies found matching your query.</p>`;
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.addEventListener('click', () => showMovieDetails(movie));

        const poster = document.createElement('img');
        poster.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        poster.alt = `${movie.title} Poster`;
        poster.className = 'movie-poster';

        const title = document.createElement('h3');
        title.textContent = movie.title;
        title.className = 'movie-title';

        const rank = document.createElement('p');
        rank.textContent = `Rank: ${movie.vote_average}`;
        rank.className = 'movie-rank';

        movieCard.appendChild(poster);
        movieCard.appendChild(title);
        movieCard.appendChild(rank);
        moviesContainer.appendChild(movieCard);
    });
}

// Show loading indicator
function showLoading(isLoading) {
    if (isLoading) {
        moviesContainer.innerHTML = '<p>Loading movies...</p>';
    }
}

// Handle errors
function displayError(error) {
    console.error('Error fetching movies:', error);
    moviesContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
}

function showMovieDetails(movie) {
    const modal = document.createElement('div');
    modal.className = 'movie-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'close-button';
    closeButton.addEventListener('click', () => modal.remove());

    const movieTitle = document.createElement('h2');
    movieTitle.textContent = movie.title;

    const movieDescription = document.createElement('p');
    movieDescription.textContent = movie.overview || 'No description available';

    const movieYear = document.createElement('p');
    movieYear.textContent = `Year: ${movie.release_date || 'N/A'}`;

    const movieRating = document.createElement('p');
    movieRating.textContent = `Rating: ${movie.vote_average || 'N/A'}`;

    const poster = document.createElement('img');
    poster.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    poster.alt = `${movie.title} Poster`;
    poster.className = 'movie-poster-modal';

    const paymentButton = document.createElement('button');
    paymentButton.textContent = 'Pay to Book Movie';
    paymentButton.className = 'payment-button';
    paymentButton.addEventListener('click', () => initiatePayment(movie));

    modalContent.appendChild(closeButton);
    modalContent.appendChild(poster);
    modalContent.appendChild(movieTitle);
    modalContent.appendChild(movieDescription);
    modalContent.appendChild(movieYear);
    modalContent.appendChild(movieRating);
    modalContent.appendChild(paymentButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Initiate payment through MTN MoMo API
async function initiatePayment(movie) {
    const msisdn = prompt('Enter your MTN Mobile Number:');
    if (!msisdn) {
        alert('Mobile number is required!');
        return;
    }

    const body = {
        login_hint: `ID:${msisdn}/MSISDN`,
        scope: 'payment',
        access_type: 'online',
    };

    try {
        const response = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v1_0/bc-authorize', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Ocp-Apim-Subscription-Key': 'df8b55ab5e7f4fbfac41502e9ef66e56', // Replace with correct key
            },
        });

        const result = await response.json();
        if (response.status === 200) {
            console.log('Payment Response:', result);
            alert('Payment successful!');
            generateInvoice(movie, msisdn);
        } else {
            console.error('Payment failed:', result);
            alert('Payment failed. Please verify details and try again.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment request failed. Please check your network or API configuration.');
    }
}


// Generate invoice
function generateInvoice(movie, msisdn) {
    const invoice = `
        ============================
        MOVIE BOOKING INVOICE
        ============================
        Movie: ${movie.title}
        Date: ${new Date().toLocaleDateString()}
        Mobile Number: ${msisdn}
        Amount Paid: UGX 10,000
        ============================
        Thank you for booking with us!
    `;

    console.log(invoice);
    alert(invoice);
    allowMovieAccess(movie);
}

// Allow user to stream or download movie
function allowMovieAccess(movie) {
    const options = `
        Payment successful! You can now:
        1. Stream the movie.
        2. Download the movie.
    `;
    alert(options);

    // Redirect to streaming or download page
    window.location.href = `https://www.themoviedb.org/movie/${movie.id}`;
}

// Initial fetch for top rated movies
fetchMovies();
