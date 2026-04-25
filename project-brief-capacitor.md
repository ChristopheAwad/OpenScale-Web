# Capacitor Android App - Project Brief

## Overview
Create an Android APK from the existing SvelteKit web app using Capacitor, for manual sideloading (GitHub releases).

## Scope
- Android only (skip iOS)
- Skip push notifications (add later)
- Skip Play Store (GitHub releases for sideloading)
- Unsigned APK (okay for now)

## Approach
Wrap existing SvelteKit frontend in Capacitor native shell, build .apk for GitHub release.

## Deliverables
1. Capacitor integration in existing SvelteKit project
2. Android project setup
3. Working debug .apk build
4. GitHub release with .apk

## Out of Scope
- Push notifications
- Play Store publishing
- iOS builds
- Signed APK (for now)

---

## Tasks

### Phase 1: Capacitor Setup
- [ ] 1. Install @capacitor/core, @capacitor/cli
- [ ] 2. Add @capacitor/app plugin
- [ ] 3. Initialize Capacitor config
- [ ] 4. Run `npx cap add android`
- [ ] 5. Configure app icon and name
- [ ] 6. Test build compiles

### Phase 2: Build & Publish
- [ ] 7. Build debug .apk
- [ ] 8. Create GitHub release
- [ ] 9. Upload .apk

---

## Notes
- Uses cookie-based auth (no backend changes needed for sideloaded APK)
- 90% code reuse from existing SvelteKit frontend