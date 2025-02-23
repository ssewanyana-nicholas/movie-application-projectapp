const apiKey = '41e23e1524b7cb3d0c1b15b816308624';
const subscriptionKey = 'df8b55ab5e7f4fbfac41502e9ef66e56';
const callbackUrl = 'http://localhost:3000/';
const targetEnvironment = 'sandbox';

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
        console.log('Fetching movies from:', fetchUrl);
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch movie data.');
        }

        const data = await response.json();
        console.log('Fetched movies data:', data);
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

// Show movie details
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
    paymentButton.textContent = 'Pay UGX 100 to Book Movie';
    paymentButton.className = 'payment-button';
    paymentButton.addEventListener('click', () => initiatePayment(movie));

    modalContent.append(closeButton, poster, movieTitle, movieDescription, movieYear, movieRating, paymentButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Initiate payment
async function initiatePayment(movie) {
    const msisdn = prompt('Enter your MTN Mobile Number:');
    if (!msisdn) {
        alert('Mobile number is required!');
        return;
    }

    const requestId = crypto.randomUUID();

    try {
        const response = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v2_0/requesttopay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'X-Reference-Id': requestId,
                'X-Target-Environment': targetEnvironment,
                'X-Callback-Url': callbackUrl,
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                amount: '100',
                currency: 'UGX',
                externalId: requestId,
                payer: { partyIdType: 'MSISDN', partyId: msisdn },
                payerMessage: `Payment for ${movie.title}`,
                payeeNote: `Movie Booking`
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert('Payment request sent!');
            checkPaymentStatus(requestId, movie, msisdn);
        } else {
            alert('Payment failed. Please try again.');
        }
    } catch (error) {
        alert('Error processing payment.');
    }
}

// Check payment status
async function checkPaymentStatus(requestId, movie, msisdn) {
    try {
        const response = await fetch(`https://sandbox.momodeveloper.mtn.com/collection/v2_0/requesttopay/${requestId}`, {
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'X-Target-Environment': targetEnvironment,
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
            }
        });

        const result = await response.json();
        if (result.status === 'SUCCESSFUL') {
            alert('Payment successful!');
            generateInvoice(movie, msisdn);
        } else {
            alert('Payment still pending...');
        }
    } catch (error) {
        alert('Error checking payment status.');
    }
}

// Generate invoice
function generateInvoice(movie, msisdn) {
    const invoiceContent = `
        ============================
        MOVIE BOOKING INVOICE
        ============================
        Movie: ${movie.title}
        Date: ${new Date().toLocaleDateString()}
        Mobile Number: ${msisdn}
        Amount Paid: UGX 100
        ============================
        Thank you for booking with us!
    `;

    console.log(invoiceContent);
    alert(invoiceContent);

    const doc = new jsPDF();
    doc.text(invoiceContent, 10, 10);
    doc.save(`Invoice_${movie.title}_${Date.now()}.pdf`);

    allowMovieAccess(movie);
}

// Allow movie access
function allowMovieAccess(movie) {
    alert('Payment successful! You can now stream or download the movie.');
    window.location.href = `https://www.themoviedb.org/movie/${movie.id}`;
}

// Fetch movies on load
fetchMovies();
