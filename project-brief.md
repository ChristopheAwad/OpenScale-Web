# Weight Tracking App - Project Brief

## Overview

Single codebase app for tracking weight, body measurements, and progress photos on web.

## Data Models

### WeightEntry
```
- id: String (UUID)
- weight: double
- weightUnit: Unit (kg/lb)
- date: DateTime
- notes: String? (optional)
- measurements: List<Measurement> (optional)
- photoPath: String? (optional)
```

### Measurement
```
- type: MeasurementType (waist, chest, hips, arms, thighs)
- value: double
- unit: Unit (cm/in)
```

### Goal
```
- id: String
- targetWeight: double
- weightUnit: Unit
- targetDate: DateTime?
- isActive: bool
- createdAt: DateTime
```

## Features

### MVP (Phase 1)
1. Add weight entry with date, weight, optional notes
2. Weight unit toggle: kg or lb
3. Optional body measurements per entry (waist, chest, hips, arms, thighs)
4. Measurement unit toggle: cm or inches
5. Optional photo attachment per entry (from camera/gallery)
6. Weight history list view
7. **View saved entries with measurements and photos (entry detail view)**
8. Weight progress chart (line chart over time)
9. Set and track weight goal
10. Dark mode only
11. Local storage

### Future (Phase 2+)
- Export data (CSV/JSON)
- Web/dashboard view
- Reminder notifications
- Cloud sync
- Publish to stores

## Tech Stack

- **Framework**: SvelteKit
- **Database**: SQLite (better-sqlite3)
- **UI**: Skeleton UI + Tailwind CSS v4
- **Charts**: Chart.js (via svelte-chartjs)
- **Image handling**: Native file input / Canvas API
- **Authentication**: Session-based with bcrypt

## Architecture

- Models
- Repositories
- Services
- Server-side (SQLite via better-sqlite3)

## Self-Hosted Architecture

```
┌─────────────────────────────────────────────┐
│         SvelteKit (Node.js adapter)         │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         SQLite (better-sqlite3)             │
│  - users                                   │
│  - weight_entries                         │
│  - goals                                  │
│  - preferences                            │
└─────────────────────────────────────────────┘
```

## Docker Deployment

- Uses Node.js adapter for SvelteKit
- SQLite database file persisted in Docker volume
- Session secret required via environment variable
- Supports multi-user with authentication

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

1. Web (responsive)

---

*Development documentation - not part of the main user documentation.*



## Steps to Build

1. Create project
2. Set up data models and adapters
3. Implement repositories
4. Create state management
5. Build UI pages
6. Add chart widget
7. Add image picker integration
8. Test on web
9. Deploy to web

## Notes

- Data stored in SQLite database (self-hosted)
- Photos stored in app uploads directory
- Weight supports both kg and lb (user preference in settings)
- Measurement units: cm or inches (user preference in settings)
- **Cloud/backend required** (self-hosted with Docker)
- User authentication required