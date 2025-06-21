# Stock Pick Game - Monorepo

A modern stock picking game built as a monorepo with Vue.js frontend and Node.js backend, featuring real-time stock data scraping from Google Finance.

## 🏗️ Architecture

This project is organized as a monorepo with the following structure:

```
stock-pick-game/
├── packages/
│   ├── frontend/          # Vue.js 3 + Vite frontend
│   └── backend/           # Node.js + Express backend
├── data/                  # SQLite database files (persisted)
├── logs/                  # Application logs
├── Dockerfile             # Production Docker image
├── Dockerfile.dev         # Development Docker image
├── docker-compose.yml     # Production Docker Compose
└── docker-compose.dev.yml # Development Docker Compose
```

## 🚀 Features

- **Real-time Stock Data**: Scrapes live stock prices from Google Finance using Cheerio
- **User Authentication**: JWT-based authentication system
- **Stock Picking Game**: Weekly stock picking competition
- **SQLite Database**: Lightweight, file-based database with data persistence
- **Docker Support**: Full containerization with data persistence
- **Cron Jobs**: Automated stock price updates and pick calculations
- **Modern Tech Stack**: Vue 3, Express, TypeScript, Drizzle ORM

## 🛠️ Tech Stack

### Frontend

- Vue.js 3 with Composition API
- Vite for build tooling
- Pinia for state management
- Vue Router for navigation
- Tailwind CSS for styling
- Chart.js for data visualization

### Backend

- Node.js with Express
- TypeScript for type safety
- Drizzle ORM with SQLite
- JWT for authentication
- Winston for logging
- Cheerio for web scraping
- Node-cron for scheduled tasks

### Infrastructure

- Docker for containerization
- SQLite for data persistence
- Monorepo with npm workspaces

## 📦 Installation

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd stock-pick-game
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**

   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend on http://localhost:6968
   npm run dev:backend   # Backend on http://localhost:6969
   ```

### Docker Development Setup

1. **Build and start development containers**

   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access the application**
   - Frontend: <http://localhost:5173>
   - Backend API: <http://localhost:6969>

### Production Setup

1. **Build and start production containers**

   ```bash
   docker-compose up --build -d
   ```

2. **Access the application**
   - Application: <http://localhost:3000>

## 🗄️ Database

The application uses SQLite for data storage. Database files are persisted in the `./data` directory:

- **Development**: `./data/stock-pick-game-dev.db`
- **Production**: `./data/stock-pick-game.db`

### Database Management

```bash
# Generate new migration
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=file:./data/stock-pick-game.db

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
LOG_LEVEL=info
```

### Docker Environment

For Docker deployments, you can set environment variables in the `docker-compose.yml` file or use a `.env` file.

## 📊 Stock Data

The application scrapes real-time stock data from Google Finance using Cheerio. Features include:

- **Real-time Quotes**: Live stock prices and changes
- **Caching**: 5-minute cache to reduce API calls
- **Error Handling**: Graceful fallbacks for failed requests
- **Scheduled Updates**: Automatic price updates via cron jobs

### Stock Data Endpoints

- `GET /api/stocks/quote/:symbol` - Get stock quote
- `GET /api/stocks/search?query=...` - Search stocks
- `GET /api/stocks/cache/stats` - Get cache statistics
- `POST /api/stocks/cache/clear` - Clear cache

## 🔄 Cron Jobs

The application includes several automated tasks:

- **Stock Price Updates**: Every 5 minutes during market hours
- **Pick Price Updates**: Every hour for current week picks
- **Cache Clearing**: Every hour to refresh data

## 🐳 Docker Deployment

### Production Deployment

1. **Build and deploy**

   ```bash
   docker-compose up --build -d
   ```

2. **Check status**

   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

3. **Stop services**

   ```bash
   docker-compose down
   ```

### Data Persistence

The Docker setup includes volume mounts for data persistence:

- **Database**: `./data:/app/data` - SQLite database files
- **Logs**: `./logs:/app/logs` - Application logs

### Health Checks

The application includes health checks that monitor:

- API availability
- Database connectivity
- Overall application status

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run tests in watch mode
npm run test:watch
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Stock Endpoints

- `GET /api/stocks/quote/:symbol` - Get stock quote
- `GET /api/stocks/search` - Search stocks
- `GET /api/stocks/cache/stats` - Cache statistics
- `POST /api/stocks/cache/clear` - Clear cache

### Game Endpoints

- `GET /api/weeks/current` - Get current week
- `GET /api/weeks` - Get all weeks
- `GET /api/picks` - Get user picks
- `POST /api/picks` - Create pick

### Admin Endpoints

- `POST /api/crons/update-prices` - Manual price update trigger

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Helmet.js for security headers
- Input validation and sanitization

## 📈 Monitoring

- Winston logging with file and console output
- Health check endpoints
- Docker health checks
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation
- Review the logs in `./logs/`
- Check Docker container status
- Verify environment variables

## 🔄 Migration from Vercel

This monorepo replaces the previous Vercel deployment with a Docker-based solution that provides:

- **Better Control**: Full control over the deployment environment
- **Data Persistence**: SQLite database with proper volume mounting
- **Real-time Features**: Web scraping for live stock data
- **Scalability**: Easy horizontal scaling with Docker
- **Development Experience**: Hot reloading and better debugging
