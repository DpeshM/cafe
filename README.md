# Restaurant POS Web Application

A browser-based Restaurant Point of Sale system with Google Drive synchronization.

## Features

- **Table Management**: Create, edit, delete tables with status tracking
- **Menu Management**: Full CRUD operations for menu items
- **Order Management**: Take orders, modify quantities, calculate totals
- **Google Drive Sync**: Automatic synchronization of all data
- **Responsive Design**: Works on tablets and desktop computers
- **Offline Support**: Local storage fallback when offline

## Prerequisites

1. **Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Drive API and Google Sheets API

2. **OAuth 2.0 Credentials**
   - Navigate to "APIs & Services" → "Credentials"
   - Create OAuth 2.0 Client ID
   - Application type: "Web application"
   - Add authorized JavaScript origins: `http://localhost:8000` (or your domain)
   - Add authorized redirect URIs: `http://localhost:8000` (or your domain)
   - Save your Client ID and API Key

## Installation

1. **Clone or download the project files**

2. **Update Authentication Credentials**
   - Open `auth.js`
   - Replace `YOUR_CLIENT_ID` with your actual Client ID
   - Replace `YOUR_API_KEY` with your actual API Key

3. **Serve the Application**
   - You can use any static file server
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve .`
   - Open `http://localhost:8000` in your browser

## Configuration

### Google Drive Setup
The app will automatically:
1. Create a Google Sheets file named "Restaurant POS Data" in your Drive
2. Set up three sheets: Tables, Menu, Orders
3. Create proper headers for each sheet

### Initial Data
On first run, the app will create sample menu items. You can:
1. Add your own tables
2. Customize the menu
3. All changes sync automatically to Google Drive

## Usage Guide

### 1. Authentication
- On first load, click "Sign in with Google"
- Grant the required permissions
- The app will connect to your Google Drive

### 2. Managing Tables
- Click "Add Table" in the Tables panel
- Enter table name/number and capacity
- Tables show status: Green (available), Red (occupied)
- Click a table to select it for ordering

### 3. Managing Menu
- Click "Add Item" in the Menu panel
- Fill in item details (name, category, price, description)
- Use search and category filters to find items
- Click any menu item to add it to the current order

### 4. Taking Orders
1. Select a table (turns from green to blue)
2. Click menu items to add them to the order
3. Adjust quantities using +/- buttons
4. View real-time calculations in the order panel
5. Click "Clear Order" to remove all items
6. Click "Close Order" to finalize and mark table as available

### 5. Data Synchronization
- All data automatically syncs to Google Drive
- Manual refresh: Click "Refresh" button in header
- Offline mode: Works with local storage when disconnected
- Reconnection: Automatically syncs when back online

## File Structure

- `index.html` - Main application HTML
- `style.css` - All styles and responsive design
- `app.js` - Main application logic and UI
- `auth.js` - Google OAuth authentication
- `drive-sync.js` - Google Drive/Sheets API integration
- `data-manager.js` - Data handling and local storage

## Security Notes

- OAuth tokens are stored in browser memory only
- No backend server required
- All API calls made directly from browser
- Data stored in user's own Google Drive
- No shared data between users

## Troubleshooting

### Authentication Issues
1. Ensure correct Client ID and API Key
2. Check authorized origins in Google Cloud Console
3. Clear browser cache and retry

### Sync Issues
1. Check internet connection
2. Verify Drive API is enabled in Google Cloud
3. Check browser console for errors

### Performance
- Large datasets may slow down the interface
- Consider pagination for very large menus
- Regular sync operations may cause brief delays

## Browser Compatibility

- Chrome 60+ (recommended)
- Firefox 55+
- Safari 11+
- Edge 79+

## License

This project is for educational and demonstration purposes.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Google API credentials
3. Ensure proper OAuth scopes are enabled

---

**Note**: This is a frontend-only application. All data processing happens in the browser. For production use, consider adding a backend server for enhanced security and scalability.
