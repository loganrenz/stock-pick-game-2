# Stock Pick Game

A web application for tracking and managing a weekly stock picking competition between friends.

## Features

- Weekly stock picks tracking
- Real-time price updates
- Performance tracking and leaderboards
- Historical data visualization
- User authentication and profiles
- Mobile-responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd stock-pick-game
```

2. Install dependencies:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:

```bash
# Backend (.env)
DATABASE_URL=postgresql://username:password@localhost:5432/stockpickgame
JWT_SECRET=your_jwt_secret
PORT=3001

# Frontend (.env)
VITE_API_URL=http://localhost:3001
```

4. Set up the database:

```bash
# Using Docker (recommended)
./scripts/db.sh start

# Or manually on your VPS
./backend/scripts/setup-db.sh
```

5. Run database migrations and seed data:

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

6. Start the development servers:

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

## Usage

### Making Stock Picks

1. Log in to your account
2. Navigate to the "Make Pick" page
3. Enter your stock symbol and pick date
4. Submit your pick

### Viewing Results

- Dashboard: View overall performance and current standings
- History: Browse past picks and their performance
- Leaderboard: See who's winning the competition

### Admin Features

- Manage users and permissions
- Update stock prices
- Modify historical data
- Generate reports

### Default Users

The application comes with the following default users:

- Admin: username: `admin`, password: `admin123`
- Patrick: username: `patrick`, no password required
- Taylor: username: `taylor`, no password required
- Logan: username: `logan`, no password required

## Deployment

The application can be deployed using Docker:

```bash
# Build and start containers
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
