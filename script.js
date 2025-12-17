// Google Sheets API Configuration
const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

// Application state
const state = {
    activeTab: 'waiter',
    tables: [],
    menuItems: [],
    selectedTable: null,
    currentOrder: [],
    kitchenOrders: [],
    completedTransactions: [],
    expenses: [],
    googleSheetsConfig: {
        sheetId: '',
        apiKey: '',
        sheetNames: {
            tables: 'Tables',
            menu: 'Menu',
            orders: 'Orders',
            transactions: 'Transactions',
            expenses: 'Expenses'
        },
        connected: false,
        lastSync: null
    },
    isSyncing: false,
    syncInterval: null,
    autoSyncEnabled: true,
    syncIntervalMs: 10000, // 10 seconds for faster sync
    lastPullTime: null
};

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loadingScreen'),
    tablesGrid: document.getElementById('tablesGrid'),
    menuGrid: document.getElementById('menuGrid'),
    orderSection: document.getElementById('orderSection'),
    selectedTableNumber: document.getElementById('selectedTableNumber'),
    currentOrderItems: document.getElementById('currentOrderItems'),
    orderSubtotal: document.getElementById('orderSubtotal'),
    orderTax: document.getElementById('orderTax'),
    orderTotal: document.getElementById('orderTotal'),
    kitchenOrdersList: document.getElementById('kitchenOrdersList'),
    checkoutContent: document.getElementById('checkoutContent'),
    expensesList: document.getElementById('expensesList'),
    salesSummary: document.getElementById('salesSummary'),
    recentTransactions: document.getElementById('recentTransactions'),
    expensesSummary: document.getElementById('expensesSummary'),
    settingsModal: document.getElementById('setupSettings'),
    expenseModal: document.getElementById('expenseModal'),
    menuItemModal: document.getElementById('menuItemModal'),
    paymentModal: document.getElementById('paymentModal'),
    manageTablesGrid: document.getElementById('manageTablesGrid'),
    manageMenuItems: document.getElementById('manageMenuItems'),
    syncStatus: document.getElementById('syncStatus'),
    syncBtn: document.getElementById('syncBtn'),
    syncIcon: document.getElementById('syncIcon'),
    syncBtnText: document.getElementById('syncBtnText'),
    downloadBtn: document.getElementById('downloadBtn'),
    
    // Settings inputs
    sheetId: document.getElementById('sheetId'),
    scriptUrl: document.getElementById('scriptUrl'),
    apiKey: document.getElementById('apiKey'),
    tablesSheet: document.getElementById('tablesSheet'),
    menuSheet: document.getElementById('menuSheet'),
    ordersSheet: document.getElementById('ordersSheet'),
    transactionsSheet: document.getElementById('transactionsSheet'),
    expensesSheet: document.getElementById('expensesSheet'),
    
    // Other inputs
    newTableNumber: document.getElementById('newTableNumber'),
    expenseDescription: document.getElementById('expenseDescription'),
    expenseAmount: document.getElementById('expenseAmount'),
    expenseCategory: document.getElementById('expenseCategory'),
    menuItemName: document.getElementById('menuItemName'),
    menuItemPrice: document.getElementById('menuItemPrice'),
    menuItemCategory: document.getElementById('menuItemCategory'),
    menuItemModalTitle: document.getElementById('menuItemModalTitle'),
    paymentMethod: document.getElementById('paymentMethod'),
    cashAmount: document.getElementById('cashAmount'),
    qrAmount: document.getElementById('qrAmount'),
    paymentTotal: document.getElementById('paymentTotal'),
    cashSection: document.getElementById('cashSection'),
    qrSection: document.getElementById('qrSection'),
    
    // Buttons
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    addTableBtn: document.getElementById('addTableBtn'),
    addMenuItemBtn: document.getElementById('addMenuItemBtn'),
    saveMenuItemBtn: document.getElementById('saveMenuItemBtn'),
    closeMenuItemBtn: document.getElementById('closeMenuItemBtn'),
    saveExpenseBtn: document.getElementById('saveExpenseBtn'),
    closeExpenseBtn: document.getElementById('closeExpenseBtn'),
    addExpenseBtn: document.getElementById('addExpenseBtn'),
    clearOrderBtn: document.getElementById('clearOrderBtn'),
    submitOrderBtn: document.getElementById('submitOrderBtn'),
    processPaymentBtn: document.getElementById('processPaymentBtn'),
    closePaymentBtn: document.getElementById('closePaymentBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    mobileMenuBtn: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setupEventListeners();
    setupResponsiveDesign();
    
    // Check if on mobile and adjust UI
    if (window.innerWidth <= 768) {
        setupMobileUI();
    }
});

// Setup responsive design
function setupResponsiveDesign() {
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            setupMobileUI();
        } else {
            setupDesktopUI();
        }
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                setupMobileUI();
            } else {
                setupDesktopUI();
            }
        }, 100);
    });
}

// Setup mobile UI
function setupMobileUI() {
    // Create mobile menu button if it doesn't exist
    if (!elements.mobileMenuBtn) {
        const header = document.querySelector('.app-header');
        if (header) {
            const mobileMenuBtn = document.createElement('button');
            mobileMenuBtn.id = 'mobileMenuBtn';
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            mobileMenuBtn.className = 'mobile-menu-btn';
            mobileMenuBtn.style.cssText = `
                display: block;
                background: none;
                border: none;
                font-size: 24px;
                color: var(--text);
                margin-right: 15px;
                cursor: pointer;
            `;
            header.insertBefore(mobileMenuBtn, header.firstChild);
            elements.mobileMenuBtn = mobileMenuBtn;
            
            mobileMenuBtn.addEventListener('click', () => {
                const navTabs = document.querySelector('.nav-tabs');
                if (navTabs) {
                    navTabs.classList.toggle('mobile-show');
                }
            });
        }
    }
    
    // Add mobile styles if not already added
    if (!document.getElementById('mobile-styles')) {
        const style = document.createElement('style');
        style.id = 'mobile-styles';
        style.textContent = `
            @media (max-width: 768px) {
                .container {
                    padding: 10px;
                }
                
                .app-header {
                    flex-direction: row;
                    align-items: center;
                    padding: 10px;
                }
                
                .nav-tabs {
                    position: fixed;
                    top: 60px;
                    left: 0;
                    right: 0;
                    background: var(--background);
                    flex-direction: column;
                    z-index: 1000;
                    display: none;
                    padding: 10px;
                    border-bottom: 2px solid var(--border);
                }
                
                .nav-tabs.mobile-show {
                    display: flex;
                }
                
                .nav-tab {
                    width: 100%;
                    margin: 5px 0;
                    padding: 12px;
                    text-align: center;
                }
                
                .header-actions {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                }
                
                .grid-container {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                
                .tables-grid, .menu-grid, .checkout-grid {
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                }
                
                .table-card {
                    min-height: 100px;
                    padding: 15px;
                }
                
                .menu-item {
                    min-height: 80px;
                    padding: 10px;
                }
                
                .order-item {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .item-controls {
                    margin-top: 10px;
                    width: 100%;
                    justify-content: space-between;
                }
                
                .modal-content {
                    width: 95%;
                    max-height: 90vh;
                    margin: 10px auto;
                    padding: 15px;
                }
                
                .reports-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .expenses-table {
                    font-size: 12px;
                }
                
                .expenses-table th,
                .expenses-table td {
                    padding: 5px;
                }
                
                .order-section {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--background);
                    border-top: 2px solid var(--border);
                    padding: 15px;
                    z-index: 1000;
                    max-height: 50vh;
                    overflow-y: auto;
                    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                }
                
                .menu-category {
                    margin-bottom: 20px;
                }
                
                .category-title {
                    font-size: 18px;
                    margin: 15px 0 10px 0;
                }
                
                /* Prevent zoom on input focus */
                input, select, textarea {
                    font-size: 16px !important;
                }
            }
            
            @media (max-width: 480px) {
                .tables-grid, .menu-grid, .checkout-grid {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                }
                
                .table-card {
                    padding: 10px;
                }
                
                .menu-item {
                    padding: 8px;
                }
                
                .reports-grid {
                    grid-template-columns: 1fr;
                }
                
                .settings-tabs {
                    flex-wrap: wrap;
                }
                
                .settings-tab {
                    flex: 1 0 50%;
                    text-align: center;
                }
                
                .modal-content {
                    width: 98%;
                    margin: 5px auto;
                    padding: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Setup desktop UI
function setupDesktopUI() {
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.style.display = 'none';
    }
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) {
        navTabs.classList.remove('mobile-show');
        navTabs.style.display = 'flex';
    }
}

// Load configuration from localStorage
function loadConfig() {
    try {
        const config = localStorage.getItem('restaurant_sheets_config');
        if (config) {
            const parsed = JSON.parse(config);
            state.googleSheetsConfig = parsed;
            
            if (state.googleSheetsConfig.sheetId && state.googleSheetsConfig.apiKey) {
                loadAllData();
            } else {
                elements.loadingScreen.style.display = 'none';
                setTimeout(() => openSettingsModal(), 500);
            }
        } else {
            elements.loadingScreen.style.display = 'none';
            setTimeout(() => openSettingsModal(), 500);
        }
    } catch (error) {
        console.error('Error loading config:', error);
        elements.loadingScreen.style.display = 'none';
        setTimeout(() => openSettingsModal(), 500);
    }
}

// Load all data from Google Sheets
async function loadAllData() {
    try {
        setSyncStatus('Loading from Google Sheets...', 'connecting');
        
        // Load all data in parallel
        const [tablesData, menuData, ordersData, transactionsData, expensesData] = await Promise.all([
            loadFromGoogleSheets(state.googleSheetsConfig.sheetNames.tables).catch(() => []),
            loadFromGoogleSheets(state.googleSheetsConfig.sheetNames.menu).catch(() => []),
            loadFromGoogleSheets(state.googleSheetsConfig.sheetNames.orders).catch(() => []),
            loadFromGoogleSheets(state.googleSheetsConfig.sheetNames.transactions).catch(() => []),
            loadFromGoogleSheets(state.googleSheetsConfig.sheetNames.expenses).catch(() => [])
        ]);
        
        // Process tables data
        state.tables = tablesData.length > 0 ? tablesData.map(row => ({
            id: parseInt(row.ID || row.id || row.Number || Date.now()),
            number: parseInt(row.Number || row.number),
            status: row.Status || row.status || 'vacant',
            orders: row.Orders ? JSON.parse(row.Orders) : []
        })) : getDefaultTables();
        
        // Process menu data
        state.menuItems = menuData.length > 0 ? menuData.map(row => ({
            id: parseInt(row.ID || row.id || Date.now()),
            name: row.Name || row.name,
            price: parseFloat(row.Price || row.price),
            category: row.Category || row.category || 'Main'
        })) : getDefaultMenu();
        
        // Process kitchen orders
        state.kitchenOrders = ordersData.map(row => ({
            id: parseInt(row.ID || row.id || Date.now()),
            tableNumber: parseInt(row.TableNumber || row.tableNumber),
            items: row.Items ? JSON.parse(row.Items) : [],
            status: row.Status || row.status || 'pending',
            timestamp: row.Timestamp || row.timestamp || new Date().toLocaleTimeString()
        })).filter(order => order.status !== 'completed');
        
        // Process transactions
        state.completedTransactions = transactionsData.map(row => ({
            id: parseInt(row.ID || row.id || Date.now()),
            tableNumber: parseInt(row.TableNumber || row.tableNumber),
            items: row.Items ? JSON.parse(row.Items) : [],
            total: parseFloat(row.Total || row.total),
            paymentMethod: row.PaymentMethod || row.paymentMethod,
            cashAmount: parseFloat(row.CashAmount || row.cashAmount || 0),
            qrAmount: parseFloat(row.QRAmount || row.qrAmount || 0),
            timestamp: row.Timestamp || row.timestamp || new Date().toLocaleTimeString(),
            date: row.Date || row.date || new Date().toLocaleDateString()
        }));
        
        // Process expenses
        state.expenses = expensesData.map(row => ({
            id: parseInt(row.ID || row.id || Date.now()),
            description: row.Description || row.description,
            amount: parseFloat(row.Amount || row.amount),
            category: row.Category || row.category || 'Other',
            timestamp: row.Timestamp || row.timestamp || new Date().toLocaleTimeString(),
            date: row.Date || row.date || new Date().toLocaleDateString()
        }));
        
        state.googleSheetsConfig.connected = true;
        state.googleSheetsConfig.lastSync = new Date();
        state.lastPullTime = new Date();
        
        setSyncStatus('Connected ✓', 'connected');
        renderAll();
        
        // Start auto-sync
        startAutoSync();
        
    } catch (error) {
        console.error('Error loading from Google Sheets:', error);
        setSyncStatus('Connection failed ✗', 'error');
        state.googleSheetsConfig.connected = false;
        
        // Fallback to localStorage
        loadFromLocalStorage();
    } finally {
        elements.loadingScreen.style.display = 'none';
    }
}

// Load data from Google Sheets
async function loadFromGoogleSheets(sheetName) {
    const { sheetId, apiKey } = state.googleSheetsConfig;
    
    if (!sheetId || !apiKey) {
        throw new Error('Google Sheets configuration missing');
    }
    
    // Add cache busting to prevent browser caching
    const cacheBuster = `&t=${Date.now()}`;
    const url = `${GOOGLE_SHEETS_API}/${sheetId}/values/${sheetName}?key=${apiKey}${cacheBuster}`;
    
    const response = await fetch(url, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
    
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Access denied. Check API key and sharing settings.');
        } else if (response.status === 404) {
            throw new Error(`Sheet "${sheetName}" not found. Create it in your Google Sheet.`);
        }
        throw new Error(`Failed to load ${sheetName}: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
        return [];
    }
    
    // Convert array of arrays to array of objects
    const headers = data.values[0];
    const rows = data.values.slice(1);
    
    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
}

// Save data to Google Sheets
async function saveToGoogleSheets(sheetName, data) {
    const { sheetId, apiKey } = state.googleSheetsConfig;
    
    if (!sheetId || !apiKey) {
        throw new Error('Google Sheets configuration missing');
    }
    
    // Prepare headers based on sheet type
    let headers = [];
    let values = [];
    
    if (sheetName === state.googleSheetsConfig.sheetNames.tables) {
        headers = ['ID', 'Number', 'Status', 'Orders'];
        values = data.map(table => [
            table.id,
            table.number,
            table.status,
            JSON.stringify(table.orders)
        ]);
    } else if (sheetName === state.googleSheetsConfig.sheetNames.menu) {
        headers = ['ID', 'Name', 'Price', 'Category'];
        values = data.map(item => [
            item.id,
            item.name,
            item.price,
            item.category
        ]);
    } else if (sheetName === state.googleSheetsConfig.sheetNames.orders) {
        headers = ['ID', 'TableNumber', 'Items', 'Status', 'Timestamp'];
        values = data.filter(order => order.status !== 'completed').map(order => [
            order.id,
            order.tableNumber,
            JSON.stringify(order.items),
            order.status,
            order.timestamp || new Date().toLocaleTimeString()
        ]);
    } else if (sheetName === state.googleSheetsConfig.sheetNames.transactions) {
        headers = ['ID', 'TableNumber', 'Items', 'Total', 'PaymentMethod', 'CashAmount', 'QRAmount', 'Timestamp', 'Date'];
        values = data.map(transaction => [
            transaction.id || Date.now(),
            transaction.tableNumber,
            JSON.stringify(transaction.items),
            transaction.total,
            transaction.paymentMethod,
            transaction.cashAmount,
            transaction.qrAmount,
            transaction.timestamp,
            transaction.date
        ]);
    } else if (sheetName === state.googleSheetsConfig.sheetNames.expenses) {
        headers = ['ID', 'Description', 'Amount', 'Category', 'Timestamp', 'Date'];
        values = data.map(expense => [
            expense.id,
            expense.description,
            expense.amount,
            expense.category,
            expense.timestamp,
            expense.date
        ]);
    }
    
    if (values.length === 0) {
        // Write empty sheet with headers only
        values = [];
    }
    
    // Clear existing data first
    const clearUrl = `${GOOGLE_SHEETS_API}/${sheetId}/values/${sheetName}!A1:Z1000:clear?key=${apiKey}`;
    await fetch(clearUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    // Write headers first
    const writeHeadersUrl = `${GOOGLE_SHEETS_API}/${sheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
    await fetch(writeHeadersUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            values: [headers]
        })
    });
    
    // Write data if exists
    if (values.length > 0) {
        const writeDataUrl = `${GOOGLE_SHEETS_API}/${sheetId}/values/${sheetName}!A2:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
        const response = await fetch(writeDataUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                values: values
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to save to ${sheetName}: ${error.error?.message}`);
        }
    }
    
    return true;
}

// Sync all data to Google Sheets
async function syncAllData() {
    if (state.isSyncing) return;
    
    state.isSyncing = true;
    setSyncStatus('Syncing...', 'connecting');
    if (elements.syncBtn) elements.syncBtn.classList.add('btn-loading');
    if (elements.syncIcon) elements.syncIcon.classList.add('sync-spin');
    
    try {
        // Sync in sequence to avoid conflicts
        await saveToGoogleSheets(state.googleSheetsConfig.sheetNames.tables, state.tables);
        await saveToGoogleSheets(state.googleSheetsConfig.sheetNames.menu, state.menuItems);
        await saveToGoogleSheets(state.googleSheetsConfig.sheetNames.orders, state.kitchenOrders);
        await saveToGoogleSheets(state.googleSheetsConfig.sheetNames.transactions, state.completedTransactions);
        await saveToGoogleSheets(state.googleSheetsConfig.sheetNames.expenses, state.expenses);
        
        state.googleSheetsConfig.lastSync = new Date();
        state.googleSheetsConfig.connected = true;
        
        setSyncStatus('Synced successfully!', 'connected');
        
        // Update last pull time to trigger UI update
        state.lastPullTime = new Date();
        
        // Show success message
        setTimeout(() => {
            setSyncStatus('', 'connected');
        }, 2000);
        
    } catch (error) {
        console.error('Sync error:', error);
        setSyncStatus('Sync failed!', 'error');
        state.googleSheetsConfig.connected = false;
    } finally {
        state.isSyncing = false;
        if (elements.syncBtn) elements.syncBtn.classList.remove('btn-loading');
        if (elements.syncIcon) elements.syncIcon.classList.remove('sync-spin');
    }
}

// Start auto-sync
function startAutoSync() {
    if (state.syncInterval) {
        clearInterval(state.syncInterval);
    }
    
    if (state.autoSyncEnabled && state.googleSheetsConfig.connected) {
        state.syncInterval = setInterval(async () => {
            if (document.hidden) return; // Don't sync if tab is hidden
            
            try {
                await pullFromGoogleSheets();
            } catch (error) {
                console.error('Auto-sync failed:', error);
            }
        }, state.syncIntervalMs);
    }
}

// Pull data from Google Sheets (for other devices)
async function pullFromGoogleSheets() {
    if (!state.googleSheetsConfig.connected || state.isSyncing) return;
    
    try {
        state.isSyncing = true;
        
        // Load only tables and orders (critical data for sync)
        const [tablesData, ordersData] = await Promise.all([
            loadFromGoogleSheets(state.googleSheetsConfig.sheetNames.tables).catch(() => []),
            loadFromGoogleSheets(state.googleSheetsConfig.sheetNames.orders).catch(() => [])
        ]);
        
        let dataChanged = false;
        
        // Update tables if changed
        if (tablesData.length > 0) {
            const newTables = tablesData.map(row => ({
                id: parseInt(row.ID || row.id || row.Number || Date.now()),
                number: parseInt(row.Number || row.number),
                status: row.Status || row.status || 'vacant',
                orders: row.Orders ? JSON.parse(row.Orders) : []
            }));
            
            // Sort tables by number
            newTables.sort((a, b) => a.number - b.number);
            
            // Check if tables data changed
            const oldTablesJSON = JSON.stringify(state.tables.map(t => ({
                number: t.number,
                status: t.status,
                orders: t.orders
            })).sort((a, b) => a.number - b.number));
            
            const newTablesJSON = JSON.stringify(newTables.map(t => ({
                number: t.number,
                status: t.status,
                orders: t.orders
            })));
            
            if (oldTablesJSON !== newTablesJSON) {
                state.tables = newTables;
                dataChanged = true;
            }
        }
        
        // Update kitchen orders if changed
        if (ordersData.length > 0) {
            const newKitchenOrders = ordersData.map(row => ({
                id: parseInt(row.ID || row.id || Date.now()),
                tableNumber: parseInt(row.TableNumber || row.tableNumber),
                items: row.Items ? JSON.parse(row.Items) : [],
                status: row.Status || row.status || 'pending',
                timestamp: row.Timestamp || row.timestamp || new Date().toLocaleTimeString()
            })).filter(order => order.status !== 'completed');
            
            // Check if orders data changed
            const oldOrdersJSON = JSON.stringify(state.kitchenOrders);
            const newOrdersJSON = JSON.stringify(newKitchenOrders);
            
            if (oldOrdersJSON !== newOrdersJSON) {
                state.kitchenOrders = newKitchenOrders;
                dataChanged = true;
            }
        }
        
        state.lastPullTime = new Date();
        
        // Only re-render if data changed
        if (dataChanged) {
            renderAll();
            console.log('Data updated from Google Sheets at', new Date().toLocaleTimeString());
        }
        
    } catch (error) {
        console.error('Pull error:', error);
    } finally {
        state.isSyncing = false;
    }
}

// Set sync status
function setSyncStatus(message, type = '') {
    if (!elements.syncStatus) return;
    
    elements.syncStatus.textContent = message;
    
    if (message) {
        elements.syncStatus.classList.remove('hidden');
        elements.syncStatus.className = 'sync-status';
        
        if (type === 'connected') {
            elements.syncStatus.classList.add('status-connected');
        } else if (type === 'error') {
            elements.syncStatus.classList.add('status-error');
        } else if (type === 'connecting') {
            elements.syncStatus.classList.add('status-connecting');
        }
    } else {
        elements.syncStatus.classList.add('hidden');
    }
}

// Test Google Sheets connection
async function testConnection() {
    const sheetId = elements.sheetId.value.trim();
    const apiKey = elements.apiKey.value.trim();
    
    if (!sheetId || !apiKey) {
        alert('Please enter both Sheet ID and API Key');
        return;
    }
    
    setSyncStatus('Testing connection...', 'connecting');
    
    try {
        // Test by fetching sheet info
        const url = `${GOOGLE_SHEETS_API}/${sheetId}?key=${apiKey}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            setSyncStatus('Connection successful!', 'connected');
            alert(`Successfully connected to: "${data.properties.title}"`);
        } else {
            const error = await response.json();
            throw new Error(error.error?.message || 'Connection failed');
        }
    } catch (error) {
        console.error('Connection test error:', error);
        
        let errorMessage = error.message;
        if (errorMessage.includes('PERMISSION_DENIED')) {
            errorMessage = 'Permission denied. Please:\n1. Share your Google Sheet with "Anyone with the link" as Viewer\n2. Make sure API key is not restricted';
        } else if (errorMessage.includes('API key not valid')) {
            errorMessage = 'API Key is invalid. Please check your Google Cloud Console settings';
        } else if (errorMessage.includes('not found')) {
            errorMessage = 'Sheet not found. Please check your Sheet ID';
        }
        
        setSyncStatus('Connection failed', 'error');
        alert(`Connection failed: ${errorMessage}`);
    }
}

// Save settings
function saveSettings() {
    const sheetId = elements.sheetId.value.trim();
    const apiKey = elements.apiKey.value.trim();
    
    if (!sheetId || !apiKey) {
        alert('Please enter Sheet ID and API Key');
        return;
    }
    
    state.googleSheetsConfig = {
        sheetId,
        apiKey,
        sheetNames: {
            tables: elements.tablesSheet.value || 'Tables',
            menu: elements.menuSheet.value || 'Menu',
            orders: elements.ordersSheet.value || 'Orders',
            transactions: elements.transactionsSheet.value || 'Transactions',
            expenses: elements.expensesSheet.value || 'Expenses'
        },
        connected: false,
        lastSync: null
    };
    
    localStorage.setItem('restaurant_sheets_config', JSON.stringify(state.googleSheetsConfig));
    
    alert('Settings saved successfully! Loading data...');
    document.getElementById('setupSettings').classList.remove('active');
    
    // Reload all data
    loadAllData();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
            // Close mobile menu if open
            const navTabs = document.querySelector('.nav-tabs');
            if (navTabs && navTabs.classList.contains('mobile-show')) {
                navTabs.classList.remove('mobile-show');
            }
        });
    });
    
    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-settings-tab');
            switchSettingsTab(tabId);
        });
    });
    
    // Settings button
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', openSettingsModal);
    }
    
    // Close settings button
    if (elements.closeSettingsBtn) {
        elements.closeSettingsBtn.addEventListener('click', () => {
            closeModal('settingsModal');
        });
    }
    
    // Sync button
    if (elements.syncBtn) {
        elements.syncBtn.addEventListener('click', syncAllData);
    }
    
    // Refresh button
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', async () => {
            if (!state.googleSheetsConfig.connected) {
                alert('Not connected to Google Sheets');
                return;
            }
            
            elements.refreshBtn.classList.add('btn-loading');
            elements.refreshBtn.disabled = true;
            
            try {
                await pullFromGoogleSheets();
                alert('Data refreshed successfully!');
            } catch (error) {
                alert('Failed to refresh data: ' + error.message);
            } finally {
                elements.refreshBtn.classList.remove('btn-loading');
                elements.refreshBtn.disabled = false;
            }
        });
    }
    
    // Test connection button
    if (elements.testConnectionBtn) {
        elements.testConnectionBtn.addEventListener('click', testConnection);
    }
    
    // Save settings button
    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Add table button
    if (elements.addTableBtn) {
        elements.addTableBtn.addEventListener('click', addTable);
    }
    
    // Add menu item button
    if (elements.addMenuItemBtn) {
        elements.addMenuItemBtn.addEventListener('click', openAddMenuItemModal);
    }
    
    // Save menu item button
    if (elements.saveMenuItemBtn) {
        elements.saveMenuItemBtn.addEventListener('click', saveMenuItem);
    }
    
    // Close menu item modal
    if (elements.closeMenuItemBtn) {
        elements.closeMenuItemBtn.addEventListener('click', () => {
            closeModal('menuItemModal');
        });
    }
    
    // Save expense button
    if (elements.saveExpenseBtn) {
        elements.saveExpenseBtn.addEventListener('click', addExpense);
    }
    
    // Close expense modal
    if (elements.closeExpenseBtn) {
        elements.closeExpenseBtn.addEventListener('click', () => {
            closeModal('expenseModal');
        });
    }
    
    // Add expense button
    if (elements.addExpenseBtn) {
        elements.addExpenseBtn.addEventListener('click', openAddExpenseModal);
    }
    
    // Download button
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', downloadExcel);
    }
    
    // Clear order button
    if (elements.clearOrderBtn) {
        elements.clearOrderBtn.addEventListener('click', clearOrder);
    }
    
    // Submit order button
    if (elements.submitOrderBtn) {
        elements.submitOrderBtn.addEventListener('click', submitOrder);
    }
    
    // Payment method change
    if (elements.paymentMethod) {
        elements.paymentMethod.addEventListener('change', updatePaymentSections);
    }
    
    // Process payment button
    if (elements.processPaymentBtn) {
        elements.processPaymentBtn.addEventListener('click', processPayment);
    }
    
    // Close payment modal
    if (elements.closePaymentBtn) {
        elements.closePaymentBtn.addEventListener('click', () => {
            closeModal('paymentModal');
        });
    }
    
    // Click outside modal to close
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Sync when tab becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.googleSheetsConfig.connected) {
            pullFromGoogleSheets();
        }
    });
    
    // Sync when window gets focus
    window.addEventListener('focus', () => {
        if (state.googleSheetsConfig.connected) {
            pullFromGoogleSheets();
        }
    });
}

// Open settings modal
function openSettingsModal() {
    // Load current settings
    elements.sheetId.value = state.googleSheetsConfig.sheetId || '';
    elements.apiKey.value = state.googleSheetsConfig.apiKey || '';
    elements.tablesSheet.value = state.googleSheetsConfig.sheetNames.tables || 'Tables';
    elements.menuSheet.value = state.googleSheetsConfig.sheetNames.menu || 'Menu';
    elements.ordersSheet.value = state.googleSheetsConfig.sheetNames.orders || 'Orders';
    elements.transactionsSheet.value = state.googleSheetsConfig.sheetNames.transactions || 'Transactions';
    elements.expensesSheet.value = state.googleSheetsConfig.sheetNames.expenses || 'Expenses';
    
    elements.settingsModal.classList.add('active');
}

// Switch between settings tabs
function switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-settings-tab') === tabId);
    });
    
    document.querySelectorAll('.settings-section').forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}Settings`);
    });
    
    if (tabId === 'tables') {
        renderManageTables();
    } else if (tabId === 'menu') {
        renderManageMenuItems();
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Open add expense modal
function openAddExpenseModal() {
    elements.expenseDescription.value = '';
    elements.expenseAmount.value = '';
    elements.expenseCategory.value = 'Food Supplies';
    elements.expenseModal.classList.add('active');
}

// Open add menu item modal
function openAddMenuItemModal() {
    elements.menuItemName.value = '';
    elements.menuItemPrice.value = '';
    elements.menuItemCategory.value = 'Main';
    elements.menuItemModalTitle.textContent = 'Add Menu Item';
    elements.saveMenuItemBtn.textContent = 'Add Item';
    elements.saveMenuItemBtn.removeAttribute('data-edit-id');
    elements.menuItemModal.classList.add('active');
}

// Get default tables
function getDefaultTables() {
    return Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        status: 'vacant',
        orders: []
    }));
}

// Get default menu
function getDefaultMenu() {
    return [
        { id: 1, name: 'Momo', price: 150, category: 'Main' },
        { id: 2, name: 'Chowmein', price: 120, category: 'Main' },
        { id: 3, name: 'Fried Rice', price: 180, category: 'Main' },
        { id: 4, name: 'Chicken Chilly', price: 250, category: 'Main' },
        { id: 5, name: 'Veg Salad', price: 100, category: 'Starter' },
        { id: 6, name: 'French Fries', price: 80, category: 'Side' },
        { id: 7, name: 'Coke', price: 60, category: 'Drink' },
        { id: 8, name: 'Water', price: 20, category: 'Drink' },
        { id: 9, name: 'Ice Cream', price: 120, category: 'Dessert' },
        { id: 10, name: 'Kheer', price: 100, category: 'Dessert' }
    ];
}

// Load from localStorage (fallback)
function loadFromLocalStorage() {
    try {
        const tablesData = localStorage.getItem('restaurant_tables');
        state.tables = tablesData ? JSON.parse(tablesData) : getDefaultTables();
        
        const menuData = localStorage.getItem('restaurant_menu');
        state.menuItems = menuData ? JSON.parse(menuData) : getDefaultMenu();
        
        const kitchenData = localStorage.getItem('restaurant_kitchen_orders');
        state.kitchenOrders = kitchenData ? JSON.parse(kitchenData) : [];
        
        const transactionsData = localStorage.getItem('restaurant_transactions');
        state.completedTransactions = transactionsData ? JSON.parse(transactionsData) : [];
        
        const expensesData = localStorage.getItem('restaurant_expenses');
        state.expenses = expensesData ? JSON.parse(expensesData) : [];
        
        renderAll();
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        // Use defaults
        state.tables = getDefaultTables();
        state.menuItems = getDefaultMenu();
        state.kitchenOrders = [];
        state.completedTransactions = [];
        state.expenses = [];
        renderAll();
    }
}

// Save to localStorage (fallback)
function saveToLocalStorage() {
    localStorage.setItem('restaurant_tables', JSON.stringify(state.tables));
    localStorage.setItem('restaurant_menu', JSON.stringify(state.menuItems));
    localStorage.setItem('restaurant_kitchen_orders', JSON.stringify(state.kitchenOrders));
    localStorage.setItem('restaurant_transactions', JSON.stringify(state.completedTransactions));
    localStorage.setItem('restaurant_expenses', JSON.stringify(state.expenses));
}

let tableSyncTimer = null;
function syncCurrentOrderToTable() {
    if (!state.selectedTable) return;
    const idx = state.tables.findIndex(t => t.number === state.selectedTable);
    if (idx === -1) return;
    state.tables[idx].orders = [...state.currentOrder];
    state.tables[idx].status = state.currentOrder.length > 0 ? 'occupied' : 'vacant';
}
function queueTableSync() {
    if (!state.googleSheetsConfig.connected) return;
    if (tableSyncTimer) clearTimeout(tableSyncTimer);
    tableSyncTimer = setTimeout(async () => {
        try {
            await saveToGoogleSheets(state.googleSheetsConfig.sheetNames.tables, state.tables);
            state.googleSheetsConfig.lastSync = new Date();
            setSyncStatus('Synced successfully!', 'connected');
            state.lastPullTime = new Date();
        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('Sync failed!', 'error');
            state.googleSheetsConfig.connected = false;
            saveToLocalStorage();
        } finally {
            tableSyncTimer = null;
        }
    }, 500);
}

// Render all components
function renderAll() {
    renderTables();
    renderMenu();
    renderOrder();
    renderKitchenOrders();
    renderCheckout();
    renderExpenses();
    renderReports();
    updateDownloadButton();
}

// Render tables
function renderTables() {
    if (!elements.tablesGrid) return;
    
    elements.tablesGrid.innerHTML = '';
    
    state.tables.forEach(table => {
        const tableCard = document.createElement('div');
        tableCard.className = `table-card ${state.selectedTable === table.number ? 'selected' : ''}`;
        tableCard.setAttribute('data-table', table.number);
        
        const total = calculateTotal(table.orders);
        const itemCount = table.orders.reduce((sum, item) => sum + item.quantity, 0);
        
        tableCard.innerHTML = `
            <div class="table-number">${table.number}</div>
            <div class="table-status status-${table.status}">${table.status.toUpperCase()}</div>
            <div class="table-info">
                ${itemCount} items<br>
                Rs.${total.toFixed(2)}
            </div>
        `;
        
        tableCard.addEventListener('click', () => selectTable(table.number));
        
        // Add checkout button if occupied
        if (table.status === 'occupied') {
            const checkoutBtn = document.createElement('button');
            checkoutBtn.className = 'action-btn btn-primary mt-2';
            checkoutBtn.textContent = 'Checkout';
            checkoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                proceedToCheckout(table.number);
            });
            tableCard.appendChild(checkoutBtn);
        }
        
        elements.tablesGrid.appendChild(tableCard);
    });
}

// Render menu items grouped by category
function renderMenu() {
    if (!elements.menuGrid) return;
    
    elements.menuGrid.innerHTML = '';
    
    // Group items by category
    const groupedItems = {};
    state.menuItems.forEach(item => {
        if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
    });
    
    // Render each category
    Object.keys(groupedItems).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'menu-grid';
        
        groupedItems[category].forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.setAttribute('data-item-id', item.id);
            
            menuItem.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-price">Rs.${item.price.toFixed(2)}</div>
                <div class="item-category">${item.category}</div>
            `;
            
            menuItem.addEventListener('click', () => addItemToOrder(item));
            
            itemsGrid.appendChild(menuItem);
        });
        
        categoryDiv.appendChild(itemsGrid);
        elements.menuGrid.appendChild(categoryDiv);
    });
}

// Render current order
function renderOrder() {
    if (!elements.orderSection) return;
    
    if (state.selectedTable) {
        elements.orderSection.classList.remove('hidden');
        elements.selectedTableNumber.textContent = state.selectedTable;
        
        // Render order items
        renderCurrentOrderItems();
        
        // Calculate and display totals
        const subtotal = calculateTotal(state.currentOrder);
        const tax = subtotal * 0.13;
        const total = subtotal + tax;
        
        elements.orderSubtotal.textContent = `Rs.${subtotal.toFixed(2)}`;
        elements.orderTax.textContent = `Rs.${tax.toFixed(2)}`;
        elements.orderTotal.textContent = `Rs.${total.toFixed(2)}`;
    } else {
        elements.orderSection.classList.add('hidden');
    }
}

// Render current order items
function renderCurrentOrderItems() {
    if (!elements.currentOrderItems) return;
    
    elements.currentOrderItems.innerHTML = '';
    
    if (state.currentOrder.length === 0) {
        elements.currentOrderItems.innerHTML = '<div class="text-center" style="color: var(--gray);">No items in order</div>';
        return;
    }
    
    state.currentOrder.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        orderItem.innerHTML = `
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">Rs.${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="item-controls">
                <button class="quantity-btn decrease-btn" data-item-id="${item.id}">-</button>
                <span class="item-quantity">${item.quantity}</span>
                <button class="quantity-btn increase-btn" data-item-id="${item.id}">+</button>
                <button class="delete-btn" data-item-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        orderItem.querySelector('.decrease-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            updateQuantity(item.id, -1);
        });
        
        orderItem.querySelector('.increase-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            updateQuantity(item.id, 1);
        });
        
        orderItem.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeItem(item.id);
        });
        
        elements.currentOrderItems.appendChild(orderItem);
    });
}

// Render kitchen orders
function renderKitchenOrders() {
    if (!elements.kitchenOrdersList) return;
    
    elements.kitchenOrdersList.innerHTML = '';
    
    if (state.kitchenOrders.length === 0) {
        elements.kitchenOrdersList.innerHTML = '<div class="text-center" style="color: var(--gray);">No pending orders</div>';
        return;
    }
    
    state.kitchenOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const total = calculateTotal(order.items);
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-table">Table ${order.tableNumber}</div>
                    <div class="order-time">${order.timestamp}</div>
                </div>
                <button class="order-status status-${order.status}" data-order-id="${order.id}">
                    ${order.status.toUpperCase()}
                </button>
            </div>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-tag">
                        <span>${item.quantity}x</span>
                        <span>${item.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="summary-row mt-3">
                <span>Total:</span>
                <span class="summary-total">Rs.${total.toFixed(2)}</span>
            </div>
        `;
        
        // Add event listener for status button
        const statusBtn = orderCard.querySelector('.order-status');
        if (order.status === 'pending') {
            statusBtn.addEventListener('click', () => markOrderReady(order.id));
        }
        
        elements.kitchenOrdersList.appendChild(orderCard);
    });
}

// Render checkout tab
function renderCheckout() {
    if (!elements.checkoutContent) return;
    
    elements.checkoutContent.innerHTML = '';
    
    // Find occupied tables
    const occupiedTables = state.tables.filter(table => table.status === 'occupied');
    
    if (occupiedTables.length === 0) {
        elements.checkoutContent.innerHTML = '<div class="text-center" style="color: var(--gray);">No tables to checkout</div>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'checkout-grid';
    
    occupiedTables.forEach(table => {
        const tableCard = document.createElement('div');
        tableCard.className = 'table-card';
        
        const total = calculateTotal(table.orders);
        const itemCount = table.orders.reduce((sum, item) => sum + item.quantity, 0);
        
        tableCard.innerHTML = `
            <div class="table-number">${table.number}</div>
            <div class="table-status status-occupied">OCCUPIED</div>
            <div class="table-info">
                ${itemCount} items<br>
                Rs.${total.toFixed(2)}
            </div>
        `;
        
        const checkoutBtn = document.createElement('button');
        checkoutBtn.className = 'action-btn btn-primary mt-2';
        checkoutBtn.textContent = 'Process Payment';
        checkoutBtn.addEventListener('click', () => openPaymentModal(table.number));
        
        tableCard.appendChild(checkoutBtn);
        grid.appendChild(tableCard);
    });
    
    elements.checkoutContent.appendChild(grid);
}

// Render expenses
function renderExpenses() {
    if (!elements.expensesList) return;
    
    elements.expensesList.innerHTML = '';
    
    if (state.expenses.length === 0) {
        elements.expensesList.innerHTML = '<div class="text-center" style="color: var(--gray);">No expenses recorded</div>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'expenses-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${state.expenses.map(expense => `
                <tr>
                    <td>${expense.date}<br><small>${expense.timestamp}</small></td>
                    <td>${expense.description}</td>
                    <td>${expense.category}</td>
                    <td>Rs.${expense.amount.toFixed(2)}</td>
                    <td class="expense-actions">
                        <button class="expense-delete-btn" data-expense-id="${expense.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    // Add event listeners to delete buttons
    table.querySelectorAll('.expense-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const expenseId = parseInt(e.target.closest('button').getAttribute('data-expense-id'));
            deleteExpense(expenseId);
        });
    });
    
    elements.expensesList.appendChild(table);
}

// Render tables in settings
function renderManageTables() {
    if (!elements.manageTablesGrid) return;
    
    elements.manageTablesGrid.innerHTML = '';
    
    state.tables.forEach(table => {
        const tableCard = document.createElement('div');
        tableCard.className = 'table-card';
        
        tableCard.innerHTML = `
            <button class="table-delete-btn" data-table-number="${table.number}">
                <i class="fas fa-times"></i>
            </button>
            <div class="table-number">${table.number}</div>
            <div class="table-status status-${table.status}">${table.status.toUpperCase()}</div>
        `;
        
        // Add delete event listener
        const deleteBtn = tableCard.querySelector('.table-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTable(table.number);
        });
        
        elements.manageTablesGrid.appendChild(tableCard);
    });
}

// Render menu items in settings
function renderManageMenuItems() {
    if (!elements.manageMenuItems) return;
    
    elements.manageMenuItems.innerHTML = '';
    
    // Group items by category
    const groupedItems = {};
    state.menuItems.forEach(item => {
        if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
    });
    
    // Render each category
    Object.keys(groupedItems).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'menu-grid';
        
        groupedItems[category].forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            
            menuItem.innerHTML = `
                <div class="menu-item-controls">
                    <button class="menu-item-edit" data-item-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="menu-item-delete" data-item-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">Rs.${item.price.toFixed(2)}</div>
                <div class="item-category">${item.category}</div>
            `;
            
            // Add event listeners
            menuItem.querySelector('.menu-item-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                editMenuItem(item.id);
            });
            
            menuItem.querySelector('.menu-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMenuItem(item.id);
            });
            
            itemsGrid.appendChild(menuItem);
        });
        
        categoryDiv.appendChild(itemsGrid);
        elements.manageMenuItems.appendChild(categoryDiv);
    });
}

// Switch between main tabs
function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Update active tab button
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });
    
    // Show active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}Tab`);
    });
    
    // Render specific tab content
    if (tabId === 'waiter') {
        renderTables();
        renderMenu();
        renderOrder();
    } else if (tabId === 'kitchen') {
        renderKitchenOrders();
    } else if (tabId === 'checkout') {
        renderCheckout();
    } else if (tabId === 'expenses') {
        renderExpenses();
    } else if (tabId === 'reports') {
        renderReports();
    }
}

// Select a table
function selectTable(tableNumber) {
    const table = state.tables.find(t => t.number === tableNumber);
    if (table) {
        state.selectedTable = tableNumber;
        state.currentOrder = [...table.orders];
        renderTables();
        renderOrder();
    }
}

// Add item to order
function addItemToOrder(item) {
    if (!state.selectedTable) {
        alert('Please select a table first');
        return;
    }
    
    const existingItem = state.currentOrder.find(i => i.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.currentOrder.push({
            ...item,
            quantity: 1
        });
    }
    
    renderOrder();
    syncCurrentOrderToTable();
    queueTableSync();
}

// Update quantity of an item
function updateQuantity(itemId, delta) {
    const item = state.currentOrder.find(i => i.id === itemId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            state.currentOrder = state.currentOrder.filter(i => i.id !== itemId);
        }
        renderOrder();
        syncCurrentOrderToTable();
        queueTableSync();
    }
}

// Remove item from order
function removeItem(itemId) {
    state.currentOrder = state.currentOrder.filter(i => i.id !== itemId);
    renderOrder();
    syncCurrentOrderToTable();
    queueTableSync();
}

// Clear current order
function clearOrder() {
    state.currentOrder = [];
    renderOrder();
    syncCurrentOrderToTable();
    queueTableSync();
}

// Submit order to kitchen
async function submitOrder() {
    if (!state.selectedTable || state.currentOrder.length === 0) {
        alert('Please select a table and add items');
        return;
    }
    
    const newOrder = {
        id: Date.now(),
        tableNumber: state.selectedTable,
        items: [...state.currentOrder],
        status: 'pending',
        timestamp: new Date().toLocaleTimeString()
    };
    
    state.kitchenOrders.push(newOrder);
    
    // Update table
    const tableIndex = state.tables.findIndex(t => t.number === state.selectedTable);
    if (tableIndex !== -1) {
        state.tables[tableIndex].orders = [...state.currentOrder];
        state.tables[tableIndex].status = 'occupied';
    }
    
    // Save to Google Sheets
    if (state.googleSheetsConfig.connected) {
        try {
            await syncAllData();
        } catch (error) {
            console.error('Sync error:', error);
            saveToLocalStorage();
        }
    } else {
        saveToLocalStorage();
    }
    
    alert(`Order submitted to kitchen for Table ${state.selectedTable}`);
    
    // Reset
    state.selectedTable = null;
    state.currentOrder = [];
    
    // Render updates
    renderAll();
}

// Mark order as ready
async function markOrderReady(orderId) {
    const orderIndex = state.kitchenOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        state.kitchenOrders[orderIndex].status = 'ready';
        
        // Save to Google Sheets
        if (state.googleSheetsConfig.connected) {
            try {
                await syncAllData();
            } catch (error) {
                console.error('Sync error:', error);
                saveToLocalStorage();
            }
        } else {
            saveToLocalStorage();
        }
        
        renderKitchenOrders();
    }
}

// Proceed to checkout
function proceedToCheckout(tableNumber) {
    state.selectedTable = tableNumber;
    switchTab('checkout');
}

// Open payment modal
function openPaymentModal(tableNumber) {
    state.selectedTable = tableNumber;
    const table = state.tables.find(t => t.number === tableNumber);
    
    if (!table) {
        alert('Table not found');
        return;
    }
    
    const total = calculateTotal(table.orders);
    elements.paymentTotal.textContent = `Rs.${total.toFixed(2)}`;
    
    // Reset payment fields
    elements.paymentMethod.value = '';
    elements.cashAmount.value = '';
    elements.qrAmount.value = '';
    elements.cashSection.classList.add('hidden');
    elements.qrSection.classList.add('hidden');
    
    elements.paymentModal.classList.add('active');
}

// Update payment sections based on selected method
function updatePaymentSections() {
    const method = elements.paymentMethod.value;
    
    if (method === 'Cash') {
        elements.cashSection.classList.remove('hidden');
        elements.qrSection.classList.add('hidden');
        elements.cashAmount.value = '';
    } else if (method === 'QR') {
        elements.cashSection.classList.add('hidden');
        elements.qrSection.classList.remove('hidden');
        elements.qrAmount.value = '';
    } else if (method === 'Both') {
        elements.cashSection.classList.remove('hidden');
        elements.qrSection.classList.remove('hidden');
        elements.cashAmount.value = '';
        elements.qrAmount.value = '';
    } else {
        elements.cashSection.classList.add('hidden');
        elements.qrSection.classList.add('hidden');
    }
}

// Process payment
async function processPayment() {
    const method = elements.paymentMethod.value;
    if (!method) {
        alert('Please select a payment method');
        return;
    }
    
    const table = state.tables.find(t => t.number === state.selectedTable);
    if (!table) {
        alert('Table not found');
        return;
    }
    
    const total = calculateTotal(table.orders);
    
    let transaction;
    if (method === 'Both') {
        const cash = parseFloat(elements.cashAmount.value) || 0;
        const qr = parseFloat(elements.qrAmount.value) || 0;
        
        if (Math.abs((cash + qr) - total) > 0.01) {
            alert(`Total must equal Rs.${total.toFixed(2)}. Cash (Rs.${cash.toFixed(2)}) + QR (Rs.${qr.toFixed(2)}) = Rs.${(cash + qr).toFixed(2)}`);
            return;
        }
        
        transaction = {
            id: Date.now(),
            tableNumber: state.selectedTable,
            items: [...table.orders],
            total: total,
            paymentMethod: method,
            cashAmount: cash,
            qrAmount: qr,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };
    } else {
        transaction = {
            id: Date.now(),
            tableNumber: state.selectedTable,
            items: [...table.orders],
            total: total,
            paymentMethod: method,
            cashAmount: method === 'Cash' ? total : 0,
            qrAmount: method === 'QR' ? total : 0,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };
    }
    
    state.completedTransactions.push(transaction);
    
    // Update table status
    const tableIndex = state.tables.findIndex(t => t.number === state.selectedTable);
    if (tableIndex !== -1) {
        state.tables[tableIndex].orders = [];
        state.tables[tableIndex].status = 'vacant';
    }
    
    // Remove from kitchen orders
    state.kitchenOrders = state.kitchenOrders.filter(o => o.tableNumber !== state.selectedTable);
    
    // Save to Google Sheets
    if (state.googleSheetsConfig.connected) {
        try {
            await syncAllData();
        } catch (error) {
            console.error('Sync error:', error);
            saveToLocalStorage();
        }
    } else {
        saveToLocalStorage();
    }
    
    // Close modal
    closeModal('paymentModal');
    
    // Reset
    state.selectedTable = null;
    
    // Show success message
    alert(`Payment processed for Table ${table.number}`);
    
    // Render updates
    renderAll();
}

// Add expense
async function addExpense() {
    const description = elements.expenseDescription.value.trim();
    const amount = parseFloat(elements.expenseAmount.value);
    const category = elements.expenseCategory.value;
    
    if (!description || isNaN(amount) || amount <= 0) {
        alert('Please enter valid description and amount');
        return;
    }
    
    const expense = {
        id: Date.now(),
        description: description,
        amount: amount,
        category: category,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
    };
    
    state.expenses.push(expense);
    
    // Save to Google Sheets
    if (state.googleSheetsConfig.connected) {
        try {
            await syncAllData();
        } catch (error) {
            console.error('Sync error:', error);
            saveToLocalStorage();
        }
    } else {
        saveToLocalStorage();
    }
    
    // Close modal
    closeModal('expenseModal');
    
    // Render updates
    renderExpenses();
    renderReports();
    updateDownloadButton();
    
    alert('Expense added successfully!');
}

// Delete expense
async function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        state.expenses = state.expenses.filter(e => e.id !== expenseId);
        
        // Save to Google Sheets
        if (state.googleSheetsConfig.connected) {
            try {
                await syncAllData();
            } catch (error) {
                console.error('Sync error:', error);
                saveToLocalStorage();
            }
        } else {
            saveToLocalStorage();
        }
        
        renderExpenses();
        renderReports();
        updateDownloadButton();
    }
}

// Add table
async function addTable() {
    const tableNumber = parseInt(elements.newTableNumber.value);
    
    if (!tableNumber || tableNumber <= 0) {
        alert('Please enter a valid table number');
        return;
    }
    
    if (state.tables.find(t => t.number === tableNumber)) {
        alert('Table number already exists');
        return;
    }
    
    const newTable = {
        id: Date.now(),
        number: tableNumber,
        status: 'vacant',
        orders: []
    };
    
    state.tables.push(newTable);
    state.tables.sort((a, b) => a.number - b.number);
    
    // Save to Google Sheets
    if (state.googleSheetsConfig.connected) {
        try {
            await syncAllData();
        } catch (error) {
            console.error('Sync error:', error);
            saveToLocalStorage();
        }
    } else {
        saveToLocalStorage();
    }
    
    elements.newTableNumber.value = '';
    alert(`Table ${tableNumber} added successfully!`);
    
    renderManageTables();
    renderTables();
}

// Delete table
async function deleteTable(tableNumber) {
    const table = state.tables.find(t => t.number === tableNumber);
    if (!table) return;
    
    if (table.status === 'occupied') {
        alert('Cannot delete an occupied table');
        return;
    }
    
    if (confirm(`Are you sure you want to delete Table ${tableNumber}?`)) {
        state.tables = state.tables.filter(t => t.number !== tableNumber);
        
        // Save to Google Sheets
        if (state.googleSheetsConfig.connected) {
            try {
                await syncAllData();
            } catch (error) {
                console.error('Sync error:', error);
                saveToLocalStorage();
            }
        } else {
            saveToLocalStorage();
        }
        
        renderManageTables();
        renderTables();
    }
}

// Edit menu item
function editMenuItem(itemId) {
    const item = state.menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    elements.menuItemName.value = item.name;
    elements.menuItemPrice.value = item.price;
    elements.menuItemCategory.value = item.category;
    elements.menuItemModalTitle.textContent = 'Edit Menu Item';
    elements.saveMenuItemBtn.textContent = 'Update Item';
    elements.menuItemModal.classList.add('active');
    
    // Store the item ID being edited
    elements.saveMenuItemBtn.setAttribute('data-edit-id', itemId);
}

// Save menu item (add or update)
async function saveMenuItem() {
    const name = elements.menuItemName.value.trim();
    const price = parseFloat(elements.menuItemPrice.value);
    const category = elements.menuItemCategory.value;
    const editId = elements.saveMenuItemBtn.getAttribute('data-edit-id');
    
    if (!name || isNaN(price) || price <= 0) {
        alert('Please enter valid item name and price');
        return;
    }
    
    if (editId) {
        // Update existing item
        const itemId = parseInt(editId);
        const itemIndex = state.menuItems.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
            state.menuItems[itemIndex] = {
                ...state.menuItems[itemIndex],
                name: name,
                price: price,
                category: category
            };
        }
        
        // Remove edit ID
        elements.saveMenuItemBtn.removeAttribute('data-edit-id');
    } else {
        // Add new item
        const newItem = {
            id: Date.now(),
            name: name,
            price: price,
            category: category
        };
        
        state.menuItems.push(newItem);
    }
    
    // Save to Google Sheets
    if (state.googleSheetsConfig.connected) {
        try {
            await syncAllData();
        } catch (error) {
            console.error('Sync error:', error);
            saveToLocalStorage();
        }
    } else {
        saveToLocalStorage();
    }
    
    // Close modal
    closeModal('menuItemModal');
    
    // Render updates
    renderMenu();
    renderManageMenuItems();
    
    alert(`Menu item ${editId ? 'updated' : 'added'} successfully!`);
}

// Delete menu item
async function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        state.menuItems = state.menuItems.filter(i => i.id !== itemId);
        
        // Save to Google Sheets
        if (state.googleSheetsConfig.connected) {
            try {
                await syncAllData();
            } catch (error) {
                console.error('Sync error:', error);
                saveToLocalStorage();
            }
        } else {
            saveToLocalStorage();
        }
        
        renderMenu();
        renderManageMenuItems();
    }
}

// Calculate total for items
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Update download button visibility
function updateDownloadButton() {
    if (!elements.downloadBtn) return;
    
    if (state.completedTransactions.length > 0 || state.expenses.length > 0) {
        elements.downloadBtn.classList.remove('hidden');
    } else {
        elements.downloadBtn.classList.add('hidden');
    }
}

// Download Excel/CSV report
function downloadExcel() {
    let csvContent = "=== SALES REPORT ===\n";
    csvContent += "Table Number,Item Name,Quantity,Price,Item Total,Order Total,Payment Method,Cash Amount,QR Amount,Date,Time\n";
    
    state.completedTransactions.forEach(transaction => {
        transaction.items.forEach((item, index) => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            csvContent += `${transaction.tableNumber},${item.name},${item.quantity},${item.price},${itemTotal},`;
            
            if (index === 0) {
                csvContent += `${transaction.total.toFixed(2)},${transaction.paymentMethod},${transaction.cashAmount.toFixed(2)},${transaction.qrAmount.toFixed(2)},${transaction.date},${transaction.timestamp}\n`;
            } else {
                csvContent += ",,,,\n";
            }
        });
    });

    const totalSales = state.completedTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCash = state.completedTransactions.reduce((sum, t) => sum + t.cashAmount, 0);
    const totalQR = state.completedTransactions.reduce((sum, t) => sum + t.qrAmount, 0);
    
    csvContent += "\n=== SALES SUMMARY ===\n";
    csvContent += `Total Sales,Rs.${totalSales.toFixed(2)}\n`;
    csvContent += `Total Cash,Rs.${totalCash.toFixed(2)}\n`;
    csvContent += `Total QR,Rs.${totalQR.toFixed(2)}\n`;
    csvContent += `Total Transactions,${state.completedTransactions.length}\n`;

    csvContent += "\n=== EXPENSES REPORT ===\n";
    csvContent += "Description,Amount,Category,Date,Time\n";
    
    state.expenses.forEach(expense => {
        csvContent += `${expense.description},${expense.amount.toFixed(2)},${expense.category},${expense.date},${expense.timestamp}\n`;
    });

    const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    csvContent += "\n=== EXPENSES SUMMARY ===\n";
    csvContent += `Total Expenses,Rs.${totalExpenses.toFixed(2)}\n`;
    
    const expensesByCategory = state.expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {});
    
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
        csvContent += `${category},Rs.${amount.toFixed(2)}\n`;
    });

    csvContent += "\n=== NET PROFIT ===\n";
    csvContent += `Total Sales,Rs.${totalSales.toFixed(2)}\n`;
    csvContent += `Total Expenses,Rs.${totalExpenses.toFixed(2)}\n`;
    csvContent += `Net Profit,Rs.${(totalSales - totalExpenses).toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `restaurant_report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Render reports
function renderReports() {
    renderSalesSummary();
    renderRecentTransactions();
    renderExpensesSummary();
}

// Render sales summary
function renderSalesSummary() {
    if (!elements.salesSummary) return;
    
    const totalSales = state.completedTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCash = state.completedTransactions.reduce((sum, t) => sum + t.cashAmount, 0);
    const totalQR = state.completedTransactions.reduce((sum, t) => sum + t.qrAmount, 0);
    const totalTransactions = state.completedTransactions.length;
    
    elements.salesSummary.innerHTML = `
        <div class="reports-grid">
            <div class="stat-card">
                <div class="stat-value">Rs.${totalSales.toFixed(2)}</div>
                <div class="stat-label">Total Sales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">Rs.${totalCash.toFixed(2)}</div>
                <div class="stat-label">Cash Sales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">Rs.${totalQR.toFixed(2)}</div>
                <div class="stat-label">QR Sales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalTransactions}</div>
                <div class="stat-label">Total Transactions</div>
            </div>
        </div>
    `;
}

// Render recent transactions
function renderRecentTransactions() {
    if (!elements.recentTransactions) return;
    
    const recentTransactions = state.completedTransactions.slice(-10).reverse();
    
    if (recentTransactions.length === 0) {
        elements.recentTransactions.innerHTML = '<div class="text-center" style="color: var(--gray);">No transactions yet</div>';
        return;
    }
    
    elements.recentTransactions.innerHTML = `
        <div class="transactions-list">
            ${recentTransactions.map(transaction => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div>Table ${transaction.tableNumber}</div>
                        <small>${transaction.date} ${transaction.timestamp}</small>
                    </div>
                    <div class="transaction-amount">Rs.${transaction.total.toFixed(2)}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render expenses summary
function renderExpensesSummary() {
    if (!elements.expensesSummary) return;
    
    const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesByCategory = state.expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {});
    
    elements.expensesSummary.innerHTML = `
        <div class="stat-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <div class="stat-value">Rs.${totalExpenses.toFixed(2)}</div>
            <div class="stat-label">Total Expenses</div>
        </div>
        
        <h4 class="mt-4 mb-2">Expenses by Category</h4>
        <div class="expense-categories">
            ${Object.entries(expensesByCategory).map(([category, amount]) => `
                <div class="category-item">
                    <span class="category-name">${category}</span>
                    <span class="category-amount">Rs.${amount.toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
    `;
}
