// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Get current page
function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1);
}

// Create navigation HTML
function createNavigation() {
    const currentPage = getCurrentPage();
    
    return `
        <nav class="bg-white shadow-md px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <span class="text-2xl font-bold text-indigo-600">StockVision</span>
                    <span class="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-md">${getPageTitle(currentPage)}</span>
                </div>
                <div class="flex items-center">
                    <div class="relative mr-4">
                        <input type="text" id="stock-search" placeholder="Search stocks..." 
                               class="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-bell text-lg"></i>
                        </button>
                        <button id="refreshBtn" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-sync-alt text-lg"></i>
                        </button>
                        <button id="logoutBtn" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-sign-out-alt text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <div class="flex">
            <!-- Sidebar -->
            <aside class="sidebar w-64 bg-white shadow-md p-4">
                <div class="mb-6">
                    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</h3>
                    <ul class="mt-4 space-y-2">
                        <li>
                            <a href="dashboard.html" class="${getActiveClass('dashboard.html', currentPage)}">
                                <i class="fas fa-chart-line mr-3"></i>
                                <span>Dashboard</span>
                            </a>
                        </li>
                        <li>
                            <a href="watchlist.html" class="${getActiveClass('watchlist.html', currentPage)}">
                                <i class="fas fa-star mr-3"></i>
                                <span>Watchlist</span>
                            </a>
                        </li>
                        <li>
                            <a href="screener.html" class="${getActiveClass('screener.html', currentPage)}">
                                <i class="fas fa-search mr-3"></i>
                                <span>Stock Screener</span>
                            </a>
                        </li>
                        <li>
                            <a href="insights.html" class="${getActiveClass('insights.html', currentPage)}">
                                <i class="fas fa-lightbulb mr-3"></i>
                                <span>Insights</span>
                            </a>
                        </li>
                        <li>
                            <a href="news.html" class="${getActiveClass('news.html', currentPage)}">
                                <i class="fas fa-newspaper mr-3"></i>
                                <span>Market News</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <div id="watchlist-container" class="mb-6">
                    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Watchlist</h3>
                    <div id="watchlist-stocks" class="mt-4 space-y-2">
                        <!-- Watchlist stocks will be dynamically populated here -->
                    </div>
                </div>
            </aside>
    `;
}

// Helper functions
function getPageTitle(page) {
    switch (page) {
        case 'dashboard.html':
            return 'Dashboard';
        case 'watchlist.html':
            return 'Watchlist';
        case 'screener.html':
            return 'Stock Screener';
        case 'news.html':
            return 'Market News';
        case 'insights.html':
            return 'Insights';
        default:
            return 'Dashboard';
    }
}

function getActiveClass(page, currentPage) {
    const baseClass = 'flex items-center px-4 py-2 rounded-lg';
    if (page === currentPage) {
        return `${baseClass} text-indigo-600 bg-indigo-50`;
    }
    return `${baseClass} text-gray-700 hover:bg-gray-100`;
}

// Event handlers
function setupEventHandlers() {
    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // Refresh handler
    document.getElementById('refreshBtn').addEventListener('click', () => {
        window.location.reload();
    });

    // Stock search handler
    const searchInput = document.getElementById('stock-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const event = new CustomEvent('stockSearch', { 
                detail: { searchTerm: e.target.value }
            });
            window.dispatchEvent(event);
        });
    }
}

// Initialize navigation
function initializeNavigation() {
    if (!checkAuth()) return;

    const navContainer = document.createElement('div');
    navContainer.innerHTML = createNavigation();
    document.body.insertBefore(navContainer, document.body.firstChild);
    setupEventHandlers();

    // Load watchlist in sidebar
    fetchWatchlists();
}

// Fetch watchlists for sidebar
async function fetchWatchlists() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/watchlists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch watchlists');
        }

        const watchlists = await response.json();
        updateWatchlistSidebar(watchlists);
    } catch (error) {
        console.error('Error fetching watchlists:', error);
    }
}

// Update watchlist sidebar
function updateWatchlistSidebar(watchlists) {
    const container = document.getElementById('watchlist-stocks');
    if (!container) return;

    if (!watchlists.length) {
        container.innerHTML = `
            <p class="text-sm text-gray-500">No stocks in watchlist</p>
        `;
        return;
    }

    const allStocks = watchlists.reduce((acc, watchlist) => [...acc, ...watchlist.stocks], []);
    container.innerHTML = allStocks.slice(0, 5).map(stock => `
        <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <span class="text-sm font-medium">${stock.symbol}</span>
            <span class="text-xs text-gray-500">${stock.companyName}</span>
        </div>
    `).join('');
}

// Export functions
window.initializeNavigation = initializeNavigation;
window.checkAuth = checkAuth; 