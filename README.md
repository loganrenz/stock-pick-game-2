# Stock Pick Game

A web application where users can pick stocks and compete with others.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Run database migrations:

```bash
npm run db:migrate
```

4. Start the development server:

```bash
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run type-check` - Run type checking

## Database

The application uses Turso as its database. Make sure to set the following environment variables:

- `TURSO_DB_URL` - Your Turso database URL
- `TURSO_DB_TOKEN` - Your Turso authentication token

## Testing

Run tests with:

```bash
npm run test
```

For end-to-end tests:

```bash
npm run test:e2e
```

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
DATABASE_URL=file:./dev.db
JWT_SECRET=your_jwt_secret
PORT=3001

# Frontend (.env)
VITE_API_URL=http://localhost:3001
```

4. Run database migrations and seed data:

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

5. Start the development servers:

```bash
# Start both backend and frontend (from the project root)
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

## Stock Pick Game Rules

### Pick Window

- Picks for the following week can be made after Friday 4:30pm Eastern (market close) until Sunday midnight Eastern.
- Picks are locked as soon as Monday starts (12:00am ET).
- If a player does not make a pick, their previous week's pick rolls over.
- The backend automatically creates the next week as soon as the pick window opens (no admin needed).
- On backend restart, if the next week is missing and the pick window is open, it is created immediately.

### Game Flow

- Users see the current week's picks in a table.
- On weekends, the end result and winner (best % gain from Monday open to Friday close) are shown.
- Only one screen: shows current week, pick history, and winner (prominently).
- Stock info includes Monday open, daily open/close, and previous day's prices for holidays.

### Authentication

- Simple password login.
- Long-lived JWT (1 year), refreshed on each visit.
