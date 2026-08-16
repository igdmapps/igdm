# IGdm Multi-Client Integration Documentation

## Overview

This repository contains the original IGdm desktop application plus a shared API layer that supports three client integrations:

- React frontend
- Flutter client
- Laravel sample integration

The project is structured to keep Instagram session logic on the Node/Express API and let frontend clients call the same backend endpoints.

## Repository layout

- Root application and Electron desktop app
- [server](server): Express API server
- [react](react): React client
- [flutter](flutter): Flutter client
- [laravel](laravel): Laravel sample integration
- [README.md](README.md): project overview

## Verified environment status

The following tools were checked in this environment:

- Node.js: verified as installed (`v26.4.0`)
- npm: verified as installed (`11.17.0`)
- Flutter: verified as installed (`Flutter 3.47.0`)
- PHP: not available on PATH in this shell (`php` not recognized)
- Composer: not available on PATH in this shell (`composer` not recognized)

This means the project is partially verified:

- Verified: repository structure, Node toolchain, Flutter SDK, API source files
- Not yet verified in the current environment: Laravel runtime, Composer-based install, and full end-to-end PHP workflow

## Prerequisites

### Required for all clients

- Node.js and npm
- A working internet connection for package installation

### Required for Flutter

- Flutter SDK installed and added to PATH
- Chrome or an Android/iOS emulator if running a mobile/web app target

### Required for Laravel

- PHP installed
- Composer installed
- Laravel runtime environment ready

If XAMPP is installed locally, ensure its `php` folder is added to PATH before running Laravel commands.

## Shared API setup

From the repository root:

```bash
npm install
npm run api:start
```

The API listens at:

```text
http://localhost:4000
```

Health check:

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{ "status": "ok", "version": "1.0.0" }
```

## React client setup

From the project root:

```bash
cd react
npm install
npm run dev
```

The React client is configured to use the API at `http://localhost:4000`.

## Flutter client setup

From the project root:

```bash
cd flutter
flutter pub get
flutter run
```

For Chrome/web testing:

```bash
cd flutter
flutter run -d chrome --web-hostname=127.0.0.1 --web-port=8080
```

The Flutter app uses the shared backend URL defined in [flutter/lib/config.dart](flutter/lib/config.dart).

## Laravel integration setup

The sample integration is stored in [laravel](laravel).

### Laravel runtime requirements

The Laravel environment requires:

- PHP
- Composer
- A Laravel project or Laravel-compatible app structure

### Typical local flow

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

Then open:

```text
http://127.0.0.1:8000/igdm/login
```

The sample Laravel controller proxies requests to the Node API server at `http://localhost:4000`.

## Important notes

- The existing Electron application remains intact.
- The API reuses Instagram session and chat logic from the desktop backend.
- For production, use secure session handling, HTTPS, and environment-based configuration.
- The Laravel sample is a lightweight integration pattern and should be adapted to your real Laravel app structure.

## Troubleshooting

### PHP/Composer not recognized

If `php` and `composer` are installed but not on PATH, add the XAMPP PHP directory to PATH manually:

```powershell
$env:Path += ";C:\xampp\php"
```

Then verify:

```powershell
php -v
composer -v
```

### Flutter web debugging timeout

If Flutter fails to connect to Chrome, try:

- ensuring Chrome is installed
- restarting the browser
- running with explicit host and port
- checking for stale Chrome processes

### API server not responding

Verify the Node server is running:

```bash
npm run api:start
```

Then test:

```bash
curl http://localhost:4000/health
```

## Final assessment

The codebase is successfully structured for multi-platform integration across React, Flutter, and Laravel, and the shared API layer is implemented. The runtime verification is partial because PHP and Composer are currently unavailable in this environment, so the Laravel side and full end-to-end validation remain pending until the PHP toolchain is installed and added to PATH.

The build and app layers that were successfully verified in this environment are:

- Node/npm
- Flutter SDK
- repository integration files
- API project structure

The steps still requiring environment confirmation are:

- Laravel installation and server startup
- full PHP app validation
- final browser/device execution for Flutter
- end-to-end request verification between clients and the API
