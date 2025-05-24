class SpotifyMusicApp {
  constructor() {
    // Spotify API Configuration
    this.clientId = 'YOUR_SPOTIFY_CLIENT_ID'; // You need to register your app at https://developer.spotify.com
    this.redirectUri = window.location.origin + window.location.pathname;
    this.scopes = 'user-read-private user-read-email playlist-read-private user-top-read';
    
    this.accessToken = null;
    this.tokenExpiryTime = null;
    
    this.initApp();
  }

  initApp() {
    // Check if we have a token in the URL (from Spotify redirect)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.get('access_token')) {
      this.accessToken = params.get('access_token');
      this.tokenExpiryTime = Date.now() + (parseInt(params.get('expires_in')) * 1000);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      this.showMainApp();
      this.loadUserProfile();
    } else {
      // Check for stored token
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedExpiry = localStorage.getItem('spotify_token_expiry');
      
      if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
        this.accessToken = storedToken;
        this.tokenExpiryTime = parseInt(storedExpiry);
        this.showMainApp();
        this.loadUserProfile();
      }
    }
    
    this.initEventListeners();
  }

  initEventListeners() {
    document.getElementById('loginBtn').addEventListener('click', () => this.login());
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    document.getElementById('searchBtn').addEventListener('click', () => this.searchMusic());
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchMusic();
    });
    document.getElementById('trendingBtn').addEventListener('click', () => this.getFeaturedPlaylists());
    document.getElementById('randomBtn').addEventListener('click', () => this.getNewReleases());
    document.getElementById('topChartsBtn').addEventListener('click', () => this.getTopArtists());
    document.getElementById('genreBtn').addEventListener('click', () => this.browseGenres());
  }

  login() {
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `response_type=token&` +
      `client_id=${this.clientId}&` +
      `scope=${encodeURIComponent(this.scopes)}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    
    window.location.href = authUrl;
  }

  logout() {
    this.accessToken = null;
    this.tokenExpiryTime = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('userInfo').classList.add('hidden');
  }

  showMainApp() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Store token
    localStorage.setItem('spotify_access_token', this.accessToken);
    localStorage.setItem('spotify_token_expiry', this.tokenExpiryTime.toString());
  }

  async makeSpotifyRequest(endpoint) {
    if (!this.accessToken || Date.now() >= this.tokenExpiryTime) {
      this.logout();
      throw new Error('Authentication required');
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  async loadUserProfile() {
    try {
      const user = await this.makeSpotifyRequest('/me');
      
      document.getElementById('userName').textContent = user.display_name || 'Spotify User';
      document.getElementById('userFollowers').textContent = `${user.followers?.total || 0} followers`;
      
      if (user.images && user.images.length > 0) {
        document.getElementById('userAvatar').src = user.images[0].url;
      }
      
      document.getElementById('userInfo').classList.remove('hidden');
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
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
      const data = await this.makeSpotifyRequest(`/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=12`);
      
      const results = [];
      
      // Add tracks
      if (data.tracks?.items) {
        results.push(...data.tracks.items.map(item => ({ ...item, type: 'track' })));
      }
      
      // Add albums
      if (data.albums?.items) {
        results.push(...data.albums.items.slice(0, 6).map(item => ({ ...item, type: 'album' })));
      }
      
      if (results.length > 0) {
        this.displayResults(results);
      } else {
        this.showError('No results found. Try a different search term.');
      }
    } catch (error) {
      this.showError(error.message || 'Failed to search music. Please try again.');
    }
    
    this.hideLoading();
  }

  async getFeaturedPlaylists() {
    this.showLoading();
    
    try {
      const data = await this.makeSpotifyRequest('/browse/featured-playlists?limit=12');
      
      if (data.playlists?.items) {
        const results = data.playlists.items.map(item => ({ ...item, type: 'playlist' }));
        this.displayResults(results);
      } else {
        this.showError('No featured playlists found.');
      }
    } catch (error) {
      this.showError(error.message || 'Failed to fetch featured playlists.');
    }
    
    this.hideLoading();
  }

  async getNewReleases() {
    this.showLoading();
    
    try {
      const data = await this.makeSpotifyRequest('/browse/new-releases?limit=12');
      
      if (data.albums?.items) {
        const results = data.albums.items.map(item => ({ ...item, type: 'album' }));
        this.displayResults(results);
      } else {
        this.showError('No new releases found.');
      }
    } catch (error) {
      this.showError(error.message || 'Failed to fetch new releases.');
    }
    
    this.hideLoading();
  }

  async getTopArtists() {
    this.showLoading();
    
    try {
      const data = await this.makeSpotifyRequest('/me/top/artists?limit=12&time_range=medium_term');
      
      if (data.items && data.items.length > 0) {
        const results = data.items.map(item => ({ ...item, type: 'artist' }));
        this.displayResults(results);
      } else {
        // Fallback to search for popular artists
        const fallbackData = await this.makeSpotifyRequest('/search?q=genre:pop&type=artist&limit=12');
        if (fallbackData.artists?.items) {
          const results = fallbackData.artists.items.map(item => ({ ...item, type: 'artist' }));
          this.displayResults(results);
        } else {
          this.showError('No top artists found.');
        }
      }
    } catch (error) {
      this.showError(error.message || 'Failed to fetch top artists.');
    }
    
    this.hideLoading();
  }

  async browseGenres() {
    const genres = ['pop', 'rock', 'hip-hop', 'jazz', 'classical', 'electronic', 'country', 'r&b', 'reggae', 'blues'];
    const selectedGenre = prompt(`Choose a genre:\n${genres.join(', ')}`);
    
    if (!selectedGenre || !genres.includes(selectedGenre.toLowerCase())) {
      return;
    }
    
    this.showLoading();
    
    try {
      const data = await this.makeSpotifyRequest(`/search?q=genre:${encodeURIComponent(selectedGenre)}&type=track&limit=12`);
      
      if (data.tracks?.items) {
        const results = data.tracks.items.map(item => ({ ...item, type: 'track' }));
        this.displayResults(results);
      } else {
        this.showError(`No ${selectedGenre} music found.`);
      }
    } catch (error) {
      this.showError(error.message || 'Failed to fetch genre music.');
    }
    
    this.hideLoading();
  }

  displayResults(items) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    items.forEach(item => {
      const card = this.createCard(item);
      resultsContainer.appendChild(card);
    });
  }

  createCard(item) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-200';
    
    let imageUrl = 'https://via.placeholder.com/300x300?text=No+Image';
    let title = 'Unknown';
    let subtitle = 'Unknown';
    let description = '';
    let spotifyUrl = '#';

    if (item.type === 'track') {
      imageUrl = item.album?.images?.[0]?.url || imageUrl;
      title = item.name;
      subtitle = item.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
      description = item.album?.name || '';
      spotifyUrl = item.external_urls?.spotify || '#';
    } else if (item.type === 'album') {
      imageUrl = item.images?.[0]?.url || imageUrl;
      title = item.name;
      subtitle = item.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
      description = `${item.total_tracks} tracks • ${new Date(item.release_date).getFullYear()}`;
      spotifyUrl = item.external_urls?.spotify || '#';
    } else if (item.type === 'artist') {
      imageUrl = item.images?.[0]?.url || imageUrl;
      title = item.name;
      subtitle = `${item.followers?.total?.toLocaleString() || 0} followers`;
      description = item.genres?.slice(0, 2).join(', ') || 'Artist';
      spotifyUrl = item.external_urls?.spotify || '#';
    } else if (item.type === 'playlist') {
      imageUrl = item.images?.[0]?.url || imageUrl;
      title = item.name;
      subtitle = `By ${item.owner?.display_name || 'Spotify'}`;
      description = `${item.tracks?.total || 0} tracks`;
      spotifyUrl = item.external_urls?.spotify || '#';
    }
    
    card.innerHTML = `
      <div class="relative">
        <img src="${imageUrl}" alt="${title}" class="w-full h-48 object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div class="absolute bottom-2 left-2 text-white">
          <span class="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            <i class="fab fa-spotify mr-1"></i>${item.type}
          </span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-lg text-gray-800 mb-1 truncate">${title}</h3>
        <p class="text-purple-600 font-medium mb-1 truncate">${subtitle}</p>
        <p class="text-gray-500 text-sm mb-3 truncate">${description}</p>
        <div class="flex items-center justify-between">
          <span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
          <button onclick="window.open('${spotifyUrl}', '_blank')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-full transition-colors duration-200">
            <i class="fab fa-spotify mr-1"></i>Open
          </button>
        </div>
        ${item.preview_url ? `
        <audio controls class="w-full mt-3">
          <source src="${item.preview_url}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
        ` : ''}
      </div>
    `;
    
    return card;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new SpotifyMusicApp();
});
