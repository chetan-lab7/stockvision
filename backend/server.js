const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',  // In production, replace with your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://gowrilakshmi:Eqo6Dw5ZC6X2KhgY@cluster0.pf1iakq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Authentication Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            fullName,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Stock Schema
const stockDataSchema = new mongoose.Schema({
  Date: String,
  series: String,
  OPEN: String,
  HIGH: String,
  LOW: String,
  'PREV. CLOSE': String,
  ltp: String,
  close: String,
  vwap: String,
  '52W H': String,
  '52W L': String,
  VOLUME: String,
  VALUE: String,
  'No of trades': String,
  industry: String,
  symbol: String,
  timestamp: Date
});

const StockData = mongoose.model('StockData', stockDataSchema);

// Watchlist Schema
const watchlistSchema = new mongoose.Schema({
  userId: String, // We'll use a simple userId for now
  stocks: [{
    symbol: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }]
});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

// Helper function to parse string numbers
function parseStringNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

// API Routes

// Get latest stock data for all stocks
app.get('/api/stocks', async (req, res) => {
  try {
    // Get the latest timestamp
    const latestData = await StockData.findOne().sort({ timestamp: -1 });
    if (!latestData) {
      return res.status(404).json({ error: 'No stock data found' });
    }

    // Get all stocks for the latest timestamp
    const stocks = await StockData.find({ timestamp: latestData.timestamp });
    
    // Format the response
    const formattedStocks = stocks.map(stock => ({
      symbol: stock.symbol,
      series: stock.series,
      industry: stock.industry,
      open: parseStringNumber(stock.OPEN),
      high: parseStringNumber(stock.HIGH),
      low: parseStringNumber(stock.LOW),
      close: parseStringNumber(stock.close),
      prevClose: parseStringNumber(stock['PREV. CLOSE']),
      ltp: parseStringNumber(stock.ltp),
      volume: parseStringNumber(stock.VOLUME),
      value: parseStringNumber(stock.VALUE),
      trades: parseStringNumber(stock['No of trades']),
      high52W: parseStringNumber(stock['52W H']),
      low52W: parseStringNumber(stock['52W L']),
      vwap: parseStringNumber(stock.vwap),
      date: stock.timestamp
    }));

    res.json(formattedStocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get historical data for a specific stock
app.get('/api/stocks/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await StockData.find({
      symbol: symbol.toUpperCase(),
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    const formattedHistory = history.map(record => ({
      date: record.timestamp,
      open: parseStringNumber(record.OPEN),
      high: parseStringNumber(record.HIGH),
      low: parseStringNumber(record.LOW),
      close: parseStringNumber(record.close),
      volume: parseStringNumber(record.VOLUME)
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get market overview statistics
app.get('/api/market/overview', async (req, res) => {
  try {
    // Get the latest timestamp
    const latestData = await StockData.findOne().sort({ timestamp: -1 });
    if (!latestData) {
      return res.status(404).json({ error: 'No market data found' });
    }

    // Get all stocks for the latest timestamp
    const stocks = await StockData.find({ timestamp: latestData.timestamp });

    // Calculate market statistics
    let totalVolume = 0;
    let totalValue = 0;
    let gainers = 0;
    let losers = 0;

    stocks.forEach(stock => {
      const close = parseStringNumber(stock.close);
      const prevClose = parseStringNumber(stock['PREV. CLOSE']);
      
      totalVolume += parseStringNumber(stock.VOLUME);
      totalValue += parseStringNumber(stock.VALUE);
      
      if (close > prevClose) gainers++;
      else if (close < prevClose) losers++;
    });

    res.json({
      timestamp: latestData.timestamp,
      totalStocks: stocks.length,
      totalVolume,
      totalValue,
      gainers,
      losers,
      unchanged: stocks.length - gainers - losers
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top gainers and losers
app.get('/api/market/movers', async (req, res) => {
  try {
    // Get the latest timestamp
    const latestData = await StockData.findOne().sort({ timestamp: -1 });
    if (!latestData) {
      return res.status(404).json({ error: 'No market data found' });
    }

    // Get all stocks for the latest timestamp
    const stocks = await StockData.find({ timestamp: latestData.timestamp });

    // Calculate percentage changes and sort
    const stocksWithChanges = stocks.map(stock => {
      const close = parseStringNumber(stock.close);
      const prevClose = parseStringNumber(stock['PREV. CLOSE']);
      const percentageChange = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;

      return {
        symbol: stock.symbol,
        series: stock.series,
        industry: stock.industry,
        close,
        prevClose,
        percentageChange,
        volume: parseStringNumber(stock.VOLUME)
      };
    });

    // Sort by percentage change
    const sortedStocks = stocksWithChanges.sort((a, b) => b.percentageChange - a.percentageChange);

    res.json({
      gainers: sortedStocks.slice(0, 5),
      losers: sortedStocks.slice(-5).reverse()
    });
  } catch (error) {
    console.error('Error fetching market movers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stocks by industry
app.get('/api/stocks/industry/:industry', async (req, res) => {
  try {
    const { industry } = req.params;
    
    // Get the latest timestamp
    const latestData = await StockData.findOne().sort({ timestamp: -1 });
    if (!latestData) {
      return res.status(404).json({ error: 'No stock data found' });
    }

    // Get all stocks for the specified industry and latest timestamp
    const stocks = await StockData.find({
      industry: industry,
      timestamp: latestData.timestamp
    });

    const formattedStocks = stocks.map(stock => ({
      symbol: stock.symbol,
      series: stock.series,
      open: parseStringNumber(stock.OPEN),
      high: parseStringNumber(stock.HIGH),
      low: parseStringNumber(stock.LOW),
      close: parseStringNumber(stock.close),
      prevClose: parseStringNumber(stock['PREV. CLOSE']),
      ltp: parseStringNumber(stock.ltp),
      volume: parseStringNumber(stock.VOLUME),
      value: parseStringNumber(stock.VALUE)
    }));

    res.json(formattedStocks);
  } catch (error) {
    console.error('Error fetching industry stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for stock screening with advanced filters
app.post('/api/stocks/screen', async (req, res) => {
  try {
    // Extract filter criteria from request body
    const {
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      minVolume = 0,
      industry = '',
      priceChange = 'any',
      marketCap = '',
      weekRange = '',
      format = 'json'
    } = req.body;

    // Get the latest timestamp
    const latestData = await StockData.findOne().sort({ timestamp: -1 });
    if (!latestData) {
      return res.status(404).json({ error: 'No stock data found' });
    }

    // Build query object
    let query = { timestamp: latestData.timestamp };
    
    // Add industry filter if specified
    if (industry) {
      query.industry = industry;
    }

    // Get stocks based on the query
    let stocks = await StockData.find(query);
    
    // Apply additional filters that can't be directly queried
    stocks = stocks.filter(stock => {
      const close = parseStringNumber(stock.close);
      const prevClose = parseStringNumber(stock['PREV. CLOSE']);
      const volume = parseStringNumber(stock.VOLUME);
      const high52W = parseStringNumber(stock['52W H']);
      const low52W = parseStringNumber(stock['52W L']);
      const percentChange = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;
      
      // Basic filters
      if (close < minPrice || close > maxPrice) return false;
      if (volume < minVolume) return false;
      
      // Price change filter
      if (priceChange === 'up' && percentChange <= 0) return false;
      if (priceChange === 'down' && percentChange >= 0) return false;
      
      // 52-week range filters
      if (weekRange === 'near_high') {
        // Stock within 5% of 52-week high
        if (high52W && (high52W - close) / high52W > 0.05) return false;
      } else if (weekRange === 'near_low') {
        // Stock within 5% of 52-week low
        if (low52W && (close - low52W) / low52W > 0.05) return false;
      }
      
      // Market cap filter - this would need a proper market cap calculation
      // For now, we'll use a simplistic approach based on closing price
      // In reality, market cap = price * shares outstanding
      if (marketCap) {
        // Simplistic approach - using just the price as a proxy
        if (marketCap === 'large' && close < 1000) return false;
        if (marketCap === 'mid' && (close < 200 || close > 1000)) return false;
        if (marketCap === 'small' && close > 200) return false;
      }
      
      return true;
    });
    
    // Format the response data
    const formattedStocks = stocks.map(stock => {
      const close = parseStringNumber(stock.close);
      const prevClose = parseStringNumber(stock['PREV. CLOSE']);
      const percentChange = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;
      
      return {
        symbol: stock.symbol,
        industry: stock.industry || '-',
        close: close,
        prevClose: prevClose,
        open: parseStringNumber(stock.OPEN),
        high: parseStringNumber(stock.HIGH),
        low: parseStringNumber(stock.LOW),
        percentChange: percentChange,
        volume: parseStringNumber(stock.VOLUME),
        high52W: parseStringNumber(stock['52W H']),
        low52W: parseStringNumber(stock['52W L']),
        vwap: parseStringNumber(stock.vwap),
        date: stock.timestamp
      };
    });
    
    // If CSV format is requested, send as CSV
    if (format === 'csv') {
      // Create CSV header
      const csvHeader = 'Symbol,Industry,Price,Change %,Volume,52W High,52W Low\n';
      
      // Create CSV rows
      const csvRows = formattedStocks.map(stock => {
        return `${stock.symbol},"${stock.industry}",${stock.close.toFixed(2)},${stock.percentChange.toFixed(2)},${Math.round(stock.volume)},${stock.high52W.toFixed(2)},${stock.low52W.toFixed(2)}`;
      }).join('\n');
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stock_screener_results.csv');
      
      // Send CSV data
      return res.send(csvHeader + csvRows);
    }
    
    // Otherwise send as JSON
    res.json(formattedStocks);
  } catch (error) {
    console.error('Error screening stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add stock to watchlist
app.post('/api/watchlist/add', async (req, res) => {
  try {
    const { userId, symbol } = req.body;
    
    if (!userId || !symbol) {
      return res.status(400).json({ error: 'userId and symbol are required' });
    }

    let watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      watchlist = new Watchlist({ userId, stocks: [] });
    }

    // Check if stock already exists in watchlist
    if (!watchlist.stocks.some(stock => stock.symbol === symbol)) {
      watchlist.stocks.push({ symbol });
    }

    await watchlist.save();
    res.json(watchlist);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove stock from watchlist
app.post('/api/watchlist/remove', async (req, res) => {
  try {
    const { userId, symbol } = req.body;
    
    if (!userId || !symbol) {
      return res.status(400).json({ error: 'userId and symbol are required' });
    }

    const watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    watchlist.stocks = watchlist.stocks.filter(stock => stock.symbol !== symbol);
    await watchlist.save();
    res.json(watchlist);
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's watchlist
app.get('/api/watchlist/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      return res.json({ stocks: [] });
    }

    // Get latest stock data for watchlist items
    const latestData = await StockData.findOne().sort({ timestamp: -1 });
    const stocks = await StockData.find({
      symbol: { $in: watchlist.stocks.map(s => s.symbol) },
      timestamp: latestData.timestamp
    });

    const formattedStocks = stocks.map(stock => ({
      symbol: stock.symbol,
      series: stock.series,
      industry: stock.industry,
      open: parseStringNumber(stock.OPEN),
      high: parseStringNumber(stock.HIGH),
      low: parseStringNumber(stock.LOW),
      close: parseStringNumber(stock.close),
      prevClose: parseStringNumber(stock['PREV. CLOSE']),
      ltp: parseStringNumber(stock.ltp),
      volume: parseStringNumber(stock.VOLUME),
      value: parseStringNumber(stock.VALUE),
      dateAdded: watchlist.stocks.find(s => s.symbol === stock.symbol).dateAdded
    }));

    res.json({ stocks: formattedStocks });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 