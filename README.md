# StockVision

StockVision is a comprehensive stock market analysis and visualization web application that provides real-time stock data, advanced charting capabilities, watchlist management, and stock screening tools.

![StockVision Dashboard](https://via.placeholder.com/800x400?text=StockVision+Dashboard)

## Features

- **Interactive Dashboard**: View market overview, stock charts, and trending stocks
- **Advanced Charting**: Toggle between line charts and candlestick charts with technical indicators
- **Watchlist Management**: Create and manage personalized stock watchlists
- **Stock Screener**: Filter stocks based on various criteria like price, volume, industry, etc.
- **Market Insights**: Analyze market trends, top gainers, and losers
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, TailwindCSS, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/stockvision.git
   cd stockvision
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `backend` directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/stockvision
   JWT_SECRET=your-secret-key
   ```

4. Start the backend server:
   ```
   npm start
   ```

5. Open the frontend files:
   - Simply open `dashboard.html` in your browser to access the dashboard
   - You can also use a static file server like `http-server`:
     ```
     npm install -g http-server
     cd ..
     http-server
     ```

## Usage

### Dashboard

The dashboard provides an overview of the market and detailed stock information:
- View market statistics at the top
- Explore detailed stock charts with technical indicators
- Toggle between line and candlestick charts
- View trending stocks and your watchlist

### Stock Screener

The stock screener lets you filter stocks based on various criteria:
- Filter by industry, price range, volume, etc.
- Sort results by different metrics
- Export results to CSV

### Watchlist

Manage your favorite stocks:
- Add/remove stocks to your watchlist
- View quick metrics for your watchlist items
- Track performance over time

## API Documentation

The backend provides several API endpoints:

### Authentication
- POST `/api/users/signup` - Register a new user
- POST `/api/users/login` - Login and get JWT token

### Stock Data
- GET `/api/stocks/latest` - Get latest stock data
- GET `/api/stocks/:symbol` - Get data for a specific stock
- GET `/api/stocks/history/:symbol` - Get historical data
- GET `/api/market/overview` - Get market overview
- GET `/api/market/movers` - Get top gainers and losers
- GET `/api/stocks/industry/:industry` - Get industry stocks
- POST `/api/stocks/screen` - Screen stocks with filters

### Watchlist
- POST `/api/watchlist/add` - Add stock to watchlist
- POST `/api/watchlist/remove` - Remove from watchlist
- GET `/api/watchlist/:userId` - Get user's watchlist

## Data Sources

The application uses historical and real-time stock data. For a production environment, you'll need to integrate with a reliable stock data provider API.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Chart.js for the charting library
- TailwindCSS for the UI framework
- Font Awesome for icons 