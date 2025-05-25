class MusicApp {
  constructor() {
    this.apiKey = 'YOUR_LASTFM_API_KEY'; // You'll need to get this from Last.fm
    this.baseUrl = 'https://ws.audioscrobbler.com/2.0/';
    this.initEventListeners();
  }

  initEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', () => this.searchMusic());
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchMusic();
    });
    document.getElementById('trendingBtn').addEventListener('click', () => this.getTrending());
    document.getElementById('randomBtn').addEventListener('click', () => this.getRandomSong());
    document.getElementById('topChartsBtn').addEventListener('click', () => this.getTopCharts());
    document.getElementById('genreBtn').addEventListener('click', () => this.getByGenre());
  }

  showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').innerHTML = '';
    document.getElementById('error').classList.add('hidden');
  }

  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  }

  showError(message) {
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
    this.hideLoading();
  }

  async searchMusic() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    this.showLoading();

    try {
      // Using iTunes API as a free alternative
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=12`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        this.displayResults(data.results);
      } else {
        this.showError('No results found. Try a different search term.');
      }
    } catch (error) {
      this.showError('Failed to fetch music data. Please try again.');
    }

    this.hideLoading();
  }

  async getTrending() {
    this.showLoading();

    try {
      // Simulate trending songs with popular artists
      const trendingArtists = ['Taylor Swift', 'Drake', 'The Weeknd', 'Billie Eilish', 'Post Malone', 'Ariana Grande'];
      const randomArtist = trendingArtists[Math.floor(Math.random() * trendingArtists.length)];

      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(randomArtist)}&media=music&limit=9`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        this.displayResults(data.results);
      } else {
        this.showError('No trending music found.');
      }
    } catch (error) {
      this.showError('Failed to fetch trending music.');
    }

    this.hideLoading();
  }

  async getRandomSong() {
    this.showLoading();

    try {
      const genres = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'country', 'hip hop', 'r&b'];
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];

      const response = await fetch(`https://itunes.apple.com/search?term=${randomGenre}&media=music&limit=6`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Shuffle and take random selection
        const shuffled = data.results.sort(() => 0.5 - Math.random()).slice(0, 6);
        this.displayResults(shuffled);
      } else {
        this.showError('No random songs found.');
      }
    } catch (error) {
      this.showError('Failed to fetch random music.');
    }

    this.hideLoading();
  }

  async getTopCharts() {
    this.showLoading();

    try {
      // Simulate top charts with popular searches
      const response = await fetch(`https://itunes.apple.com/search?term=top hits 2024&media=music&limit=12`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        this.displayResults(data.results);
      } else {
        this.showError('No chart data found.');
      }
    } catch (error) {
      this.showError('Failed to fetch chart data.');
    }

    this.hideLoading();
  }

  async getByGenre() {
    const genres = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'country', 'hip hop', 'r&b', 'reggae', 'blues'];
    const selectedGenre = prompt(`Enter a genre (${genres.join(', ')}):`);

    if (!selectedGenre) return;

    this.showLoading();

    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(selectedGenre)}&media=music&limit=12`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        this.displayResults(data.results);
      } else {
        this.showError(`No ${selectedGenre} music found.`);
      }
    } catch (error) {
      this.showError('Failed to fetch genre music.');
    }

    this.hideLoading();
  }

  displayResults(tracks) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    tracks.forEach(track => {
      const trackCard = this.createTrackCard(track);
      resultsContainer.appendChild(trackCard);
    });
  }

  createTrackCard(track) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-200';

    const releaseDate = new Date(track.releaseDate).getFullYear();
    const duration = this.formatDuration(track.trackTimeMillis);

    card.innerHTML = `
      <div class="relative">
        <img src="${track.artworkUrl100}" alt="${track.trackName}" class="w-full h-48 object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div class="absolute bottom-2 left-2 text-white">
          <p class="text-sm font-medium">${duration}</p>
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-lg text-gray-800 mb-1 truncate">${track.trackName}</h3>
        <p class="text-purple-600 font-medium mb-1 truncate">${track.artistName}</p>
        <p class="text-gray-500 text-sm mb-3 truncate">${track.collectionName} (${releaseDate})</p>
        <div class="flex items-center justify-between">
          <span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            ${track.primaryGenreName}
          </span>
          <button onclick="window.open('${track.trackViewUrl}', '_blank')" class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded-full transition-colors duration-200">
            <i class="fas fa-external-link-alt mr-1"></i>View
          </button>
        </div>
        ${track.previewUrl ? `
        <audio controls class="w-full mt-3">
          <source src="${track.previewUrl}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
        ` : ''}
      </div>
    `;

    return card;
  }

  formatDuration(milliseconds) {
    if (!milliseconds) return 'Unknown';
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new MusicApp();
});
