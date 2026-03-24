# AGENTS.md — openclaw/apps

Platform-specific OpenClaw applications. Native builds for Android, iOS, macOS, plus shared cross-platform code.

## STRUCTURE

```
apps/
├── android/          # Android app (Kotlin, Gradle, Jetpack Compose)
├── ios/              # iOS app (Swift, SwiftUI, Xcode project)
├── macos/            # macOS app (Swift, SwiftUI, Xcode project, menubar gateway)
└── shared/           # Shared cross-platform code and assets
```

## WHERE TO LOOK

| Task | Directory | Notes |
|------|-----------|-------|
| Android build | android/ | Gradle build, versionName/versionCode in build.gradle.kts |
| iOS build | ios/ | Xcode project, CFBundleShortVersionString in Info.plist |
| macOS build | macos/ | Xcode project, menubar app, gateway integration |
| Shared assets | shared/ | Cross-platform resources, configs, utilities |
| Version bumps | All apps | Update versionName/versionCode (Android), CFBundleShortVersionString/CFBundleVersion (iOS/macOS) |

## CONVENTIONS

**SwiftUI state management** (iOS/macOS):
- Prefer `Observation` framework (`@Observable`, `@Bindable`)
- Avoid new `ObservableObject`/`@StateObject` unless required for compatibility
- Migrate existing `ObservableObject` when touching related code

**Version locations**:
- Android: `apps/android/app/build.gradle.kts` (versionName, versionCode)
- iOS: `apps/ios/Sources/Info.plist` + `apps/ios/Tests/Info.plist` (CFBundleShortVersionString, CFBundleVersion)
- macOS: `apps/macos/Sources/OpenClaw/Resources/Info.plist` (CFBundleShortVersionString, CFBundleVersion)

**Testing**:
- Before using simulator/emulator, check for connected real devices (prefer real hardware)
- "Restart apps" means rebuild (recompile/install) and relaunch, not just kill/launch

**macOS gateway**:
- Gateway runs as menubar app (no separate LaunchAgent)
- Restart via OpenClaw Mac app or `scripts/restart-mac.sh`
- Do NOT rebuild macOS app over SSH (must run directly on Mac)

**iOS Team ID**:
- Lookup: `security find-identity -p codesigning -v` (use Apple Development TEAMID)
- Fallback: `defaults read com.apple.dt.Xcode IDEProvisioningTeamIdentifiers`

## ANTI-PATTERNS

- Do NOT use `ObservableObject` for new SwiftUI code (use `@Observable` instead)
- Do NOT rebuild macOS app over SSH (local build only)
- Do NOT skip version bumps in all platform Info.plist/build.gradle.kts files
- Do NOT use simulators/emulators when real devices are available
- Do NOT assume gateway runs as LaunchAgent on macOS (it's the menubar app)
