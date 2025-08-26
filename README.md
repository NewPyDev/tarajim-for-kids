# Tarajim for Kids

A bilingual (English/Arabic) educational web application for teaching children about the lives of the Sahabah (companions of Prophet Muhammad).

## Features

- **Bilingual Support**: Toggle between English and Arabic with RTL support
- **Category Filtering**: Filter stories by Caliphs, Bravery, Kindness, and Loyalty
- **Responsive Design**: Kid-friendly design that works on all devices
- **Admin Panel**: Manage Sahaba entries with full CRUD operations
- **Individual Pages**: Detailed biography pages for each Sahabi

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   node server/app.js
   ```
   
   Or on Windows, double-click `start.bat`

3. **Access the Application**
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin/login.html

### Default Admin Credentials
- **Username**: admin
- **Password**: 123456

## Project Structure

```
├── server/           # Backend Express.js server
├── public/           # Frontend static files
├── admin/            # Admin panel files
├── data/             # JSON data files
├── scripts/          # Utility scripts
└── index.html        # Root landing page
```

## API Endpoints

- `GET /api/sahaba/public` - Get all Sahaba (public access)
- `GET /api/sahaba` - Get all Sahaba (admin only)
- `POST /api/sahaba` - Add new Sahabi (admin only)
- `PUT /api/sahaba/:id` - Update Sahabi (admin only)
- `DELETE /api/sahaba/:id` - Delete Sahabi (admin only)
- `POST /api/login` - Admin login

## Usage

1. **Public Access**: Visit the main page to browse Sahaba stories
2. **Admin Access**: Login to manage content through the admin panel
3. **Language Toggle**: Use the language button to switch between English and Arabic
4. **Category Filter**: Use navigation to filter stories by category

## Development

To modify the admin password, run:
```bash
node scripts/create-admin.js
```

## License

© 2025 Tarajim for Kids | All Rights Reserved