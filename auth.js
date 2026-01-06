// Simplified Google Auth - Most common fix
class GoogleAuth {
    constructor() {
        // IMPORTANT: Replace these with your actual credentials
        this.CLIENT_ID = '487976344571-q71d1tl69lqv3ckg4je6s7sbrjrid97p.apps.googleusercontent.com';
        this.API_KEY = 'AIzaSyC106AewYLjiJ20vunHUmzaLnUxLtDzyCA';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';
        
        this.tokenClient = null;
        this.isSignedIn = false;
        
        this.initGoogleAPIs();
    }
    
    async initGoogleAPIs() {
        try {
            console.log('Initializing Google APIs...');
            
            // Load the Google API client library
            await new Promise((resolve) => {
                gapi.load('client', resolve);
            });
            
            console.log('gapi.load completed');
            
            // Initialize the client
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: [
                    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                    'https://sheets.googleapis.com/$discovery/rest?version=v4'
                ],
            });
            
            console.log('gapi.client.init completed');
            
            // Initialize the token client
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    if (response.error !== undefined) {
                        console.error('OAuth error:', response);
                        this.showError('Authentication failed: ' + response.error);
                        return;
                    }
                    console.log('OAuth success, token received');
                    this.handleAuthSuccess(response.access_token);
                },
            });
            
            console.log('Token client initialized');
            
            // Check if user is already signed in
            this.checkSignedIn();
            
        } catch (error) {
            console.error('Error initializing Google APIs:', error);
            this.showError('Failed to initialize Google services: ' + error.message);
        }
    }
    
    handleAuthSuccess(accessToken) {
        console.log('Setting access token');
        gapi.client.setToken({ access_token: accessToken });
        this.isSignedIn = true;
        
        // Show app, hide auth modal
        document.getElementById('authModal').classList.remove('active');
        document.getElementById('appContainer').style.display = 'flex';
        
        // Update sync status
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Connected to Google Drive';
        syncStatus.className = 'sync-status';
        
        console.log('Authentication successful');
        
        // Initialize the rest of the app
        if (window.dataManager) {
            window.dataManager.initialize();
        }
    }
    
    checkSignedIn() {
        const token = gapi.client.getToken();
        if (token) {
            console.log('Found existing token');
            this.isSignedIn = true;
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('appContainer').style.display = 'flex';
            
            if (window.dataManager) {
                window.dataManager.initialize();
            }
        } else {
            console.log('No existing token found');
        }
    }
    
    signIn() {
        console.log('Sign in clicked');
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            this.showError('Google services not loaded yet. Please wait.');
        }
    }
    
    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken(null);
            this.isSignedIn = false;
            
            // Show auth modal, hide app
            document.getElementById('authModal').classList.add('active');
            document.getElementById('appContainer').style.display = 'none';
            
            // Clear local data
            localStorage.clear();
            
            console.log('Signed out');
        }
    }
    
    showError(message) {
        const authStatus = document.getElementById('authStatus');
        authStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        authStatus.className = 'auth-status status-error';
        console.error('Auth Error:', message);
    }
    
    isAuthenticated() {
        return this.isSignedIn && gapi.client.getToken() !== null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth...');
    
    // Create global instance
    window.googleAuth = new GoogleAuth();
    
    // Set up event listeners
    document.getElementById('signInButton').addEventListener('click', () => {
        console.log('Sign in button clicked');
        window.googleAuth.signIn();
    });
    
    document.getElementById('signOutButton').addEventListener('click', () => {
        window.googleAuth.signOut();
    });
    
    console.log('Auth initialization complete');
});
