// debug-auth.js - Replace your auth.js with this
class GoogleAuth {
    constructor() {
        // IMPORTANT: Make sure these are correct
        this.CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace
        this.API_KEY = 'YOUR_API_KEY'; // Replace
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';
        
        this.tokenClient = null;
        this.isSignedIn = false;
        
        console.log('GoogleAuth constructor called');
        console.log('Client ID exists:', !!this.CLIENT_ID && this.CLIENT_ID !== 'YOUR_CLIENT_ID.apps.googleusercontent.com');
        console.log('API Key exists:', !!this.API_KEY && this.API_KEY !== 'YOUR_API_KEY');
        
        this.initGoogleAPIs();
    }
    
    async initGoogleAPIs() {
        console.log('Step 1: Starting initGoogleAPIs');
        
        try {
            // Step 2: Check if gapi is loaded
            if (typeof gapi === 'undefined') {
                console.error('Step 2 FAILED: gapi is undefined');
                this.showError('Google API library not loaded. Check network.');
                return;
            }
            console.log('Step 2 PASSED: gapi is defined');
            
            // Step 3: Load gapi client
            console.log('Step 3: Loading gapi client...');
            await new Promise((resolve, reject) => {
                gapi.load('client', {
                    callback: resolve,
                    onerror: reject,
                    timeout: 5000,
                    ontimeout: () => reject(new Error('Timeout loading gapi.client'))
                });
            });
            console.log('Step 3 PASSED: gapi.client loaded');
            
            // Step 4: Initialize gapi client
            console.log('Step 4: Initializing gapi client...');
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: [
                    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                    'https://sheets.googleapis.com/$discovery/rest?version=v4'
                ],
            });
            console.log('Step 4 PASSED: gapi.client initialized');
            
            // Step 5: Check if google.accounts is loaded
            if (typeof google === 'undefined' || typeof google.accounts === 'undefined') {
                console.error('Step 5 FAILED: google.accounts is undefined');
                this.showError('Google Identity Services not loaded.');
                return;
            }
            console.log('Step 5 PASSED: google.accounts is defined');
            
            // Step 6: Initialize token client
            console.log('Step 6: Initializing token client...');
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    console.log('OAuth callback received:', response);
                    if (response.error !== undefined) {
                        console.error('OAuth error:', response);
                        this.showError('Authentication failed: ' + JSON.stringify(response));
                        return;
                    }
                    console.log('OAuth success!');
                    this.handleAuthSuccess(response.access_token);
                },
                error_callback: (error) => {
                    console.error('OAuth error callback:', error);
                    this.showError('OAuth error: ' + JSON.stringify(error));
                }
            });
            console.log('Step 6 PASSED: Token client initialized');
            
            // Step 7: Check for existing token
            console.log('Step 7: Checking for existing token...');
            this.checkSignedIn();
            
            console.log('Google APIs initialized successfully!');
            
        } catch (error) {
            console.error('FULL ERROR TRACE:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            this.showError('Failed to initialize: ' + error.message);
        }
    }
    
    handleAuthSuccess(accessToken) {
        console.log('Setting access token:', accessToken ? 'Token received' : 'No token');
        
        try {
            gapi.client.setToken({ access_token: accessToken });
            this.isSignedIn = true;
            
            // Update UI
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('appContainer').style.display = 'flex';
            
            // Initialize the rest of the app
            if (window.dataManager) {
                window.dataManager.initialize();
            }
            
            console.log('Authentication successful!');
        } catch (error) {
            console.error('Error in handleAuthSuccess:', error);
            this.showError('Error after auth: ' + error.message);
        }
    }
    
    checkSignedIn() {
        try {
            const token = gapi.client.getToken();
            console.log('Existing token check:', token ? 'Token found' : 'No token');
            
            if (token) {
                this.isSignedIn = true;
                document.getElementById('authModal').style.display = 'none';
                document.getElementById('appContainer').style.display = 'flex';
                
                if (window.dataManager) {
                    window.dataManager.initialize();
                }
            }
        } catch (error) {
            console.error('Error in checkSignedIn:', error);
        }
    }
    
    signIn() {
        console.log('Sign in clicked, tokenClient exists:', !!this.tokenClient);
        
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            this.showError('Google services not ready. Try refreshing the page.');
        }
    }
    
    signOut() {
        try {
            const token = gapi.client.getToken();
            if (token !== null) {
                google.accounts.oauth2.revoke(token.access_token);
                gapi.client.setToken(null);
                this.isSignedIn = false;
                
                // Reset UI
                document.getElementById('authModal').style.display = 'flex';
                document.getElementById('appContainer').style.display = 'none';
                
                localStorage.clear();
                
                console.log('Signed out successfully');
            }
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }
    
    showError(message) {
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
            authStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            authStatus.className = 'auth-status status-error';
        }
        console.error('Auth Error:', message);
    }
    
    isAuthenticated() {
        return this.isSignedIn && gapi.client.getToken() !== null;
    }
}

// Initialize when everything is ready
function initializeApp() {
    console.log('DOM loaded, initializing app...');
    
    // Create global instance
    window.googleAuth = new GoogleAuth();
    
    // Set up event listeners
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    
    if (signInButton) {
        signInButton.addEventListener('click', () => {
            console.log('Sign in button clicked');
            window.googleAuth.signIn();
        });
    }
    
    if (signOutButton) {
        signOutButton.addEventListener('click', () => {
            window.googleAuth.signOut();
        });
    }
    
    console.log('App initialization complete');
}

// Wait for both DOM and Google scripts
let googleScriptsLoaded = false;
let domLoaded = false;

function checkInitialization() {
    if (googleScriptsLoaded && domLoaded) {
        console.log('Both DOM and Google scripts are ready');
        initializeApp();
    }
}

// Check when Google scripts load
function onGoogleScriptsLoad() {
    console.log('Google scripts loaded');
    console.log('gapi defined:', typeof gapi !== 'undefined');
    console.log('google defined:', typeof google !== 'undefined');
    googleScriptsLoaded = true;
    checkInitialization();
}

// Check when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    domLoaded = true;
    checkInitialization();
});

// Set up Google script load detection
window.onGoogleScriptsLoad = onGoogleScriptsLoad;
