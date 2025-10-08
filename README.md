# Matlada 🍱

A lunch planning application for teams, classes, and groups built with Laravel and React.

## Features

- **Week Status Planning**: Plan your lunch for each day (Lunchbox, Buying, Home)
- **Group Management**: Create groups, invite members with codes/links
- **Multi-Group Support**: Be part of multiple groups with separate planning
- **Real-time Updates**: Changes sync instantly across all users
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Backend**: Laravel 12, SQLite, Inertia.js v2
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Testing**: Pest (PHP), comprehensive test coverage

## Quick Start

1. **Install dependencies**
   ```bash
   composer install
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   touch database/database.sqlite
   php artisan migrate
   ```

3. **Start development**
   ```bash
   # Terminal 1
   php artisan serve
   
   # Terminal 2
   npm run dev
   ```

Visit `http://localhost:8000`

## Usage

1. **Create an account** and sign in
2. **Create a group** from the Groups page
3. **Share the group code** or invite link with others
4. **Plan your lunches** for each day of the week
5. **Switch between groups** to see different contexts

## Development

```bash
# Format code
vendor/bin/pint
npm run format

# Run tests
php artisan test

# Build for production
npm run build
```

## Architecture

- **Groups**: Users can create/join multiple groups
- **Statuses**: Daily lunch plans scoped to specific groups
- **Roles**: Admins can manage members, creators can delete groups
- **Security**: Group-based access control and input validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Submit a pull request

---

Built with ❤️ using Laravel and React