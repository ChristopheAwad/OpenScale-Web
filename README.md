# OpenScale-Web

A self-hosted weight tracking application for tracking weight, body measurements, and progress photos.

## Repository

https://github.com/ChristopheAwad/OpenScale-Web

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

## Deployment

OpenWeight uses Docker Compose for all deployments. The only difference between systems is the volume path mapping to match each platform's storage conventions.

### Base Docker Compose (Universal)

Pre-built image available at `ghcr.io/christopheawad/openscale-web:latest` - no local build required.

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    # Option 1: Use pre-built image (recommended)
    image: ghcr.io/christopheawad/openscale-web:latest
    # Option 2: Build locally (requires Dockerfile in same directory)
    # build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-key
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

**Required environment variables:**
- `SESSION_SECRET` - Secret key for session cookies (generate a random string)
- `NODE_ENV=production` - Sets production mode
- `DATA_DIR=/app/data` - Internal path (no modification needed)

**Commands:**
```sh
docker-compose up -d
```
Access at `http://<server-ip>:3000/auth/register` to create your first account.

**Backup:** All data lives in the mapped `./data` and `./uploads` directories. Follow your system's standard backup workflow for these paths.

### Unraid

**Delta:** Uses `/mnt/user/` shares. Create share `openweight` first.

```yaml
# docker-compose.yml (Unraid)
version: '3.8'
services:
  web:
    # Use pre-built image (recommended)
    image: ghcr.io/christopheawad/openscale-web:latest
    # Or build locally:
    # build: .
    ports:
      - "3000:3000"
    volumes:
      - /mnt/user/appdata/openweight/data:/app/data
      - /mnt/user/appdata/openweight/uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-key
    restart: unless-stopped
```

**Notes:** Ensure Docker is enabled in Unraid Settings. Use Unraid's Docker tab to manage the container.

### TrueNAS SCALE

**Delta:** Uses ZFS pool paths (`/mnt/<pool>/`). Replace `<pool>` with your pool name.

```yaml
# docker-compose.yml (TrueNAS SCALE)
version: '3.8'
services:
  web:
    # Use pre-built image (recommended)
    image: ghcr.io/christopheawad/openscale-web:latest
    # Or build locally:
    # build: .
    ports:
      - "3000:3000"
    volumes:
      - /mnt/<pool>/appdata/openweight/data:/app/data
      - /mnt/<pool>/appdata/openweight/uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-key
    restart: unless-stopped
```

**Notes:** Set dataset permissions to UID 1000. Enable SSH in System → Settings → Services → SSH to deploy via CLI.

### CasaOS

**Delta:** Uses `/var/lib/casaos/volumes/` default volume paths.

```yaml
# docker-compose.yml (CasaOS)
version: '3.8'
services:
  web:
    # Use pre-built image (recommended)
    image: ghcr.io/christopheawad/openscale-web:latest
    # Or build locally:
    # build: .
    ports:
      - "3000:3000"
    volumes:
      - /var/lib/casaos/volumes/openweight/data:/app/data
      - /var/lib/casaos/volumes/openweight/uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-key
    restart: unless-stopped
```

**Notes:** Deploy via CasaOS Container → + Create → Manual Setup. Built-in monitoring and logs available in CasaOS UI.

### OpenMediaVault

**Delta:** Uses `/srv/dev-disk-by-uuid-*` for mounted disks. Replace `<uuid>` with your disk UUID.

```yaml
# docker-compose.yml (OpenMediaVault)
version: '3.8'
services:
  web:
    # Use pre-built image (recommended)
    image: ghcr.io/christopheawad/openscale-web:latest
    # Or build locally:
    # build: .
    ports:
      - "3000:3000"
    volumes:
      - /srv/dev-disk-by-uuid-<uuid>/appdata/openweight/data:/app/data
      - /srv/dev-disk-by-uuid-<uuid>/appdata/openweight/uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-key
    restart: unless-stopped
```

**Notes:** Find your disk UUID in Storage → Disks. Use SSH or OMV's Docker plugin to deploy.

### Proxmox VE

**Delta:** Run Docker in LXC/VM. Uses standard Linux paths.

```yaml
# docker-compose.yml (Proxmox VE)
version: '3.8'
services:
  web:
    # Use pre-built image (recommended)
    image: ghcr.io/christopheawad/openscale-web:latest
    # Or build locally:
    # build: .
    ports:
      - "3000:3000"
    volumes:
      - /opt/openweight/data:/app/data
      - /opt/openweight/uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-key
    restart: unless-stopped
```

**Notes:** Create an LXC container (Debian/Ubuntu) and install Docker inside. Standard Linux deployment approach.

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