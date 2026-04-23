# OpenWeight

A self-hosted weight tracking application for tracking weight, body measurements, and progress photos.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (optional, for containerized deployment)

### Development

```sh
npm install
npm run dev
```

Visit `http://localhost:5173` to use the app.

### Production (Docker)

```sh
docker-compose up --build
```

Visit `http://localhost:3000` to use the app.

### Production (Node.js)

```sh
npm install
npm run build
npm run start
```

## Self-Hosted Setup

OpenWeight is designed to be self-hosted with SQLite for data persistence.

### First-Time Setup

1. Run the app (via Docker or Node.js)
2. Navigate to `http://localhost:3000/auth/register`
3. Create your account
4. Log in with your credentials

### Data Storage

- **Database**: SQLite (`data/openweight.db`)
- **Photos**: Stored in `data/uploads/`
- All data persists across restarts via Docker volume

### Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-key
```

Required environment variables:
- `SESSION_SECRET` - Secret key for session cookies (generate a random string)

### Architecture

```
┌─────────────────────────────────────────────┐
│         SvelteKit (Node.js)                 │
│  - @sveltejs/adapter-node                   │
│  - Server-side rendering                   │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         SQLite (better-sqlite3)             │
│  - Tables: users, weight_entries, goals   │
│  - Stored in: data/openweight.db          │
└─────────────────────────────────────────────┘
```

## Tech Stack

- **Framework**: SvelteKit
- **Database**: SQLite (better-sqlite3)
- **UI**: Skeleton UI + Tailwind CSS v4
- **Charts**: Chart.js
- **Image handling**: Native file input / Canvas API

## Data Models

### WeightEntry
- id: String (UUID)
- userId: String (UUID)
- weight: Number
- weightUnit: 'kg' | 'lb'
- date: DateTime
- notes: String? (optional)
- measurements: List<Measurement> (optional)
- photoPath: String? (optional)

### Measurement
- type: 'waist' | 'chest' | 'hips' | 'arms' | 'thighs'
- value: Number
- unit: 'cm' | 'in'

### Goal
- id: String (UUID)
- userId: String (UUID)
- targetWeight: Number
- weightUnit: 'kg' | 'lb'
- targetDate: DateTime? (optional)
- isActive: Boolean
- createdAt: DateTime

## Features

- Add weight entry with date, weight, optional notes
- Weight unit toggle: kg or lb
- Optional body measurements per entry (waist, chest, hips, arms, thighs)
- Measurement unit toggle: cm or inches
- Optional photo attachment per entry (from camera/gallery)
- Weight history list view
- View saved entries with measurements and photos
- Weight progress chart (line chart over time)
- Set and track weight goal
- Dark mode only
- **Self-hosted with SQLite**
- **User authentication**

## UI/UX

- **Theme**: Dark mode only
- **Primary color**: Deep purple or teal accent
- **Layout**: Bottom navigation (Home/Chart/Add/Goals/Settings)
- **Home**: List of recent entries (clickable) + FAB to add new
- **Entry Detail**: Full view of a saved entry with weight, date, notes, measurements, and photo
- **Chart**: Line chart showing weight over time with goal line
- **Add Entry**: Form with weight, date picker, measurement accordion, photo picker
- **Goals**: Simple goal display with progress indicator

## Platform Targets

- Web (responsive)

## Development

### Building

```sh
npm run build
```

### Type Checking

```sh
npm run check
```

## License

MIT