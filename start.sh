#!/bin/bash

echo "Starting StockVision Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js version 14 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "Node.js version 14 or higher is required. Your version is: $(node -v)"
    exit 1
fi

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    if ! mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo "MongoDB is not running. Please start MongoDB before running the application."
        echo "You can use MongoDB Atlas as an alternative. Make sure to update your .env file."
    else
        echo "MongoDB is running."
    fi
else
    echo "MongoDB shell (mongosh) not found. Make sure MongoDB is properly installed and running."
    echo "You can use MongoDB Atlas as an alternative. Make sure to update your .env file."
fi

# Start the backend server
echo "Installing backend dependencies..."
cd backend
npm install

echo "Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend server to start..."
sleep 5

# Open the dashboard in the default browser
echo "Opening StockVision Dashboard in your browser..."
case "$(uname -s)" in
    Darwin)  # macOS
        open ../dashboard.html
        ;;
    Linux)
        if command -v xdg-open &> /dev/null; then
            xdg-open ../dashboard.html
        else
            echo "Please open dashboard.html in your browser manually."
        fi
        ;;
    MINGW*|CYGWIN*|MSYS*)  # Windows
        start ../dashboard.html
        ;;
    *)
        echo "Please open dashboard.html in your browser manually."
        ;;
esac

echo "StockVision is now running!"
echo "Press Ctrl+C to stop the server."

# Wait for user to press Ctrl+C
trap "kill $BACKEND_PID; echo 'StockVision has been stopped.'; exit 0" INT
wait $BACKEND_PID 