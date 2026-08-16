# Laravel Integration for IGdm API

This directory contains a small Laravel-compatible integration example for the IGdm Node API.

## Setup

1. Create a new Laravel project or use an existing one.
2. Copy `laravel/routes.php` into `laravel/routes/web.php`.
3. Copy `laravel/app/Http/Controllers/IgdmController.php` into your Laravel app.
4. Copy `laravel/resources/views/igdm` into `resources/views/igdm`.
5. Update the `API_BASE_URL` constant if your API server is not at `http://localhost:4000`.
6. Start Laravel with `php artisan serve --host=127.0.0.1 --port=8000`.
7. Visit `http://127.0.0.1:8000/igdm/login`.

## Notes

- The Laravel sample uses the built-in `Http` client to proxy requests to the Node API.
- It keeps Instagram auth state on the API server, not inside Laravel.
- For production, add CSRF protection, Laravel sessions, and HTTPS.

## Example Laravel app setup

1. Install a Laravel app: `composer create-project laravel/laravel igdm-laravel`
2. Copy `laravel/routes.php` into `igdm-laravel/routes/web.php`.
3. Copy `laravel/app/Http/Controllers/IgdmController.php` into `igdm-laravel/app/Http/Controllers/IgdmController.php`.
4. Copy `laravel/resources/views/igdm` into `igdm-laravel/resources/views/igdm`.
5. Run `composer install` inside the Laravel project.
6. Run `php artisan serve --host=127.0.0.1 --port=8000`.
7. Visit `http://127.0.0.1:8000/igdm/login`.
