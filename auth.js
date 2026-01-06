// Google OAuth Configuration and Authentication
class GoogleAuth {
    constructor() {
        this.CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your actual Client ID
        this.API_KEY = 'YOUR_API_KEY'; // Replace with your actual API Key
        this.DISCOVERY_DOCS = [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://sheets.googleapis.com/$discovery/rest?version=v4'
        ];
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';
        
        this.gapiLoaded = false;
        this.gisLoaded = false;
        this.tokenClient = null;
        this.isSignedIn = false;
        
        this.initGoogleAPIs();
    }
    
    initGoogleAPIs() {
        // Load the gapi client and auth2 library
        gapi.load('client', this.initializeGapiClient.bind(this));
        
        // Load the GIS library
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            this.gisLoaded = true;
            this.initializeGIS();
        };
        document.head.appendChild(script);
    }
    
    async initializeGapiClient() {
        try {
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: this.DISCOVERY_DOCS,
            });
            this.gapiLoaded = true;
            console.log('Google API client initialized');
            
            // Check if user is already signed in
            this.checkSignedIn();
        } catch (error) {
            console.error('Error initializing Google API client:', error);
            this.showError('Failed to initialize Google services');
        }
    }
    
    initializeGIS() {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES,
            callback: (response) => {
                if (response.error !== undefined) {
                    throw response;
                }
                this.handleAuthSuccess(response.access_token);
            },
            error_callback: (error) => {
                console.error('GIS error:', error);
                this.showError('Authentication failed');
            }
        });
    }
    
    handleAuthSuccess(accessToken) {
        this.isSignedIn = true;
        gapi.client.setToken({ access_token: accessToken });
        
        // Hide auth modal, show app
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Update UI
        this.updateAuthUI();
        
        // Initialize data sync
        if (window.dataManager) {
            window.dataManager.initialize();
        }
        
        console.log('User authenticated successfully');
    }
    
    checkSignedIn() {
        const token = gapi.client.getToken();
        if (token) {
            this.isSignedIn = true;
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('appContainer').style.display = 'flex';
            this.updateAuthUI();
            
            if (window.dataManager) {
                window.dataManager.initialize();
            }
        }
    }
    
    updateAuthUI() {
        const syncStatus = document.getElementById('syncStatus');
        if (this.isSignedIn) {
            syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Connected to Google Drive';
            syncStatus.className = 'sync-status';
        }
    }
    
    signIn() {
        if (!this.gapiLoaded || !this.gisLoaded) {
            this.showError('Google services still loading. Please try again.');
            return;
        }
        
        if (gapi.client.getToken() === null) {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            this.tokenClient.requestAccessToken({ prompt: '' });
        }
    }
    
    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token, () => {
                console.log('Access token revoked');
            });
            gapi.client.setToken(null);
            this.isSignedIn = false;
            
            // Show auth modal, hide app
            document.getElementById('authModal').style.display = 'flex';
            document.getElementById('appContainer').style.display = 'none';
            
            // Clear local data
            localStorage.clear();
            
            // Reset UI
            document.getElementById('authStatus').innerHTML = '';
            document.getElementById('authStatus').className = 'auth-status';
        }
    }
    
    showError(message) {
        const authStatus = document.getElementById('authStatus');
        authStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        authStatus.className = 'auth-status status-error';
    }
    
    showSuccess(message) {
        const authStatus = document.getElementById('authStatus');
        authStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        authStatus.className = 'auth-status status-success';
    }
    
    isAuthenticated() {
        return this.isSignedIn && gapi.client.getToken() !== null;
    }
    
    getAccessToken() {
        const token = gapi.client.getToken();
        return token ? token.access_token : null;
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.googleAuth = new GoogleAuth();
    
    // Set up event listeners
    document.getElementById('signInButton').addEventListener('click', () => {
        window.googleAuth.signIn();
    });
    
    document.getElementById('signOutButton').addEventListener('click', () => {
        window.googleAuth.signOut();
    });
});
