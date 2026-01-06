// Google Drive Sync Operations
class DriveSync {
    constructor() {
        this.FOLDER_NAME = 'Restaurant POS Data';
        this.FOLDER_ID = null;
        this.FILE_IDS = {
            tables: null,
            menu: null,
            orders: null
        };
        
        this.SPREADSHEET_ID = null; // Alternative: Use Google Sheets
        this.USE_SHEETS = true; // Set to false to use JSON files
    }
    
    // Initialize Drive sync
    async initialize() {
        if (!window.googleAuth || !window.googleAuth.isAuthenticated()) {
            console.log('Not authenticated, skipping Drive initialization');
            return false;
        }
        
        try {
            if (this.USE_SHEETS) {
                await this.initializeSheets();
            } else {
                await this.initializeDriveFiles();
            }
            
            console.log('Drive sync initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Drive sync:', error);
            return false;
        }
    }
    
    // Google Sheets Method
    async initializeSheets() {
        try {
            // Check if spreadsheet exists
            const response = await gapi.client.drive.files.list({
                q: "name='Restaurant POS Data' and mimeType='application/vnd.google-apps.spreadsheet'",
                fields: 'files(id, name)',
                spaces: 'drive'
            });
            
            let spreadsheetId;
            
            if (response.result.files.length > 0) {
                // Use existing spreadsheet
                spreadsheetId = response.result.files[0].id;
                console.log('Found existing spreadsheet:', spreadsheetId);
            } else {
                // Create new spreadsheet
                const createResponse = await gapi.client.sheets.spreadsheets.create({
                    properties: {
                        title: 'Restaurant POS Data'
                    },
                    sheets: [
                        { properties: { title: 'Tables', sheetId: 0 } },
                        { properties: { title: 'Menu', sheetId: 1 } },
                        { properties: { title: 'Orders', sheetId: 2 } }
                    ]
                });
                
                spreadsheetId = createResponse.result.spreadsheetId;
                console.log('Created new spreadsheet:', spreadsheetId);
                
                // Set up headers
                await this.setupSheetHeaders(spreadsheetId);
            }
            
            this.SPREADSHEET_ID = spreadsheetId;
            return true;
        } catch (error) {
            console.error('Error initializing Google Sheets:', error);
            throw error;
        }
    }
    
    async setupSheetHeaders(spreadsheetId) {
        const requests = [
            {
                updateCells: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 5
                    },
                    rows: [{
                        values: [
                            { userEnteredValue: { stringValue: 'ID' } },
                            { userEnteredValue: { stringValue: 'Name' } },
                            { userEnteredValue: { stringValue: 'Capacity' } },
                            { userEnteredValue: { stringValue: 'Status' } },
                            { userEnteredValue: { stringValue: 'Updated At' } }
                        ]
                    }],
                    fields: 'userEnteredValue'
                }
            },
            {
                updateCells: {
                    range: {
                        sheetId: 1,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 6
                    },
                    rows: [{
                        values: [
                            { userEnteredValue: { stringValue: 'ID' } },
                            { userEnteredValue: { stringValue: 'Name' } },
                            { userEnteredValue: { stringValue: 'Category' } },
                            { userEnteredValue: { stringValue: 'Price' } },
                            { userEnteredValue: { stringValue: 'Description' } },
                            { userEnteredValue: { stringValue: 'Updated At' } }
                        ]
                    }],
                    fields: 'userEnteredValue'
                }
            },
            {
                updateCells: {
                    range: {
                        sheetId: 2,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: 9
                    },
                    rows: [{
                        values: [
                            { userEnteredValue: { stringValue: 'ID' } },
                            { userEnteredValue: { stringValue: 'Table ID' } },
                            { userEnteredValue: { stringValue: 'Status' } },
                            { userEnteredValue: { stringValue: 'Subtotal' } },
                            { userEnteredValue: { stringValue: 'Tax' } },
                            { userEnteredValue: { stringValue: 'Total' } },
                            { userEnteredValue: { stringValue: 'Items JSON' } },
                            { userEnteredValue: { stringValue: 'Created At' } },
                            { userEnteredValue: { stringValue: 'Updated At' } }
                        ]
                    }],
                    fields: 'userEnteredValue'
                }
            }
        ];
        
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            requests: requests
        });
    }
    
    // Drive Files Method (JSON files)
    async initializeDriveFiles() {
        try {
            // Create or find POS data folder
            const folderResponse = await gapi.client.drive.files.list({
                q: "name='" + this.FOLDER_NAME + "' and mimeType='application/vnd.google-apps.folder'",
                fields: 'files(id, name)',
                spaces: 'drive'
            });
            
            if (folderResponse.result.files.length > 0) {
                this.FOLDER_ID = folderResponse.result.files[0].id;
                console.log('Found existing folder:', this.FOLDER_ID);
            } else {
                // Create new folder
                const createResponse = await gapi.client.drive.files.create({
                    resource: {
                        name: this.FOLDER_NAME,
                        mimeType: 'application/vnd.google-apps.folder'
                    },
                    fields: 'id'
                });
                
                this.FOLDER_ID = createResponse.result.id;
                console.log('Created new folder:', this.FOLDER_ID);
            }
            
            // Create or find data files
            await this.initializeDataFile('tables', 'tables.json');
            await this.initializeDataFile('menu', 'menu.json');
            await this.initializeDataFile('orders', 'orders.json');
            
            return true;
        } catch (error) {
            console.error('Error initializing Drive files:', error);
            throw error;
        }
    }
    
    async initializeDataFile(fileType, fileName) {
        try {
            const query = `name='${fileName}' and '${this.FOLDER_ID}' in parents and trashed=false`;
            const response = await gapi.client.drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive'
            });
            
            if (response.result.files.length > 0) {
                this.FILE_IDS[fileType] = response.result.files[0].id;
            } else {
                const createResponse = await gapi.client.drive.files.create({
                    resource: {
                        name: fileName,
                        mimeType: 'application/json',
                        parents: [this.FOLDER_ID]
                    },
                    fields: 'id'
                });
                
                this.FILE_IDS[fileType] = createResponse.result.id;
                
                // Initialize with empty array
                await this.updateDriveFile(fileType, []);
            }
        } catch (error) {
            console.error(`Error initializing ${fileName}:`, error);
            throw error;
        }
    }
    
    // Data Sync Methods
    async fetchAllData() {
        if (this.USE_SHEETS) {
            return await this.fetchFromSheets();
        } else {
            return await this.fetchFromDriveFiles();
        }
    }
    
    async fetchFromSheets() {
        if (!this.SPREADSHEET_ID) {
            await this.initializeSheets();
        }
        
        try {
            const response = await gapi.client.sheets.spreadsheets.values.batchGet({
                spreadsheetId: this.SPREADSHEET_ID,
                ranges: ['Tables!A2:E', 'Menu!A2:F', 'Orders!A2:I']
            });
            
            const result = {
                tables: [],
                menu: [],
                orders: []
            };
            
            // Parse tables
            const tablesData = response.result.valueRanges[0].values || [];
            result.tables = tablesData.map(row => ({
                id: row[0] || '',
                name: row[1] || '',
                capacity: parseInt(row[2]) || 4,
                status: row[3] || 'available',
                updatedAt: row[4] || new Date().toISOString()
            }));
            
            // Parse menu
            const menuData = response.result.valueRanges[1].values || [];
            result.menu = menuData.map(row => ({
                id: row[0] || '',
                name: row[1] || '',
                category: row[2] || 'food',
                price: parseFloat(row[3]) || 0,
                description: row[4] || '',
                updatedAt: row[5] || new Date().toISOString()
            }));
            
            // Parse orders
            const ordersData = response.result.valueRanges[2].values || [];
            result.orders = ordersData.map(row => {
                try {
                    const items = row[6] ? JSON.parse(row[6]) : [];
                    return {
                        id: row[0] || '',
                        tableId: row[1] || '',
                        status: row[2] || 'active',
                        subtotal: parseFloat(row[3]) || 0,
                        tax: parseFloat(row[4]) || 0,
                        total: parseFloat(row[5]) || 0,
                        items: items,
                        createdAt: row[7] || new Date().toISOString(),
                        updatedAt: row[8] || new Date().toISOString()
                    };
                } catch (e) {
                    console.error('Error parsing order items:', e);
                    return null;
                }
            }).filter(order => order !== null);
            
            return result;
        } catch (error) {
            console.error('Error fetching from Sheets:', error);
            throw error;
        }
    }
    
    async fetchFromDriveFiles() {
        const result = {
            tables: [],
            menu: [],
            orders: []
        };
        
        for (const fileType of ['tables', 'menu', 'orders']) {
            if (this.FILE_IDS[fileType]) {
                try {
                    const response = await gapi.client.drive.files.get({
                        fileId: this.FILE_IDS[fileType],
                        alt: 'media'
                    });
                    
                    result[fileType] = response.result || [];
                } catch (error) {
                    console.error(`Error fetching ${fileType}:`, error);
                    result[fileType] = [];
                }
            }
        }
        
        return result;
    }
    
    // Sync Methods
    async syncTables() {
        if (!window.dataManager) return;
        
        if (this.USE_SHEETS) {
            await this.syncTablesToSheets();
        } else {
            await this.syncTablesToDrive();
        }
    }
    
    async syncTablesToSheets() {
        if (!this.SPREADSHEET_ID) return;
        
        try {
            const tables = window.dataManager.tables;
            const values = tables.map(table => [
                table.id,
                table.name,
                table.capacity,
                table.status,
                table.updatedAt
            ]);
            
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.SPREADSHEET_ID,
                range: 'Tables!A2:E',
                valueInputOption: 'RAW',
                resource: { values }
            });
            
            console.log('Tables synced to Sheets');
        } catch (error) {
            console.error('Error syncing tables to Sheets:', error);
        }
    }
    
    async syncTablesToDrive() {
        if (!this.FILE_IDS.tables) return;
        
        try {
            await this.updateDriveFile('tables', window.dataManager.tables);
            console.log('Tables synced to Drive');
        } catch (error) {
            console.error('Error syncing tables to Drive:', error);
        }
    }
    
    async syncMenu() {
        if (!window.dataManager) return;
        
        if (this.USE_SHEETS) {
            await this.syncMenuToSheets();
        } else {
            await this.syncMenuToDrive();
        }
    }
    
    async syncMenuToSheets() {
        if (!this.SPREADSHEET_ID) return;
        
        try {
            const menu = window.dataManager.menuItems;
            const values = menu.map(item => [
                item.id,
                item.name,
                item.category,
                item.price,
                item.description,
                item.updatedAt
            ]);
            
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.SPREADSHEET_ID,
                range: 'Menu!A2:F',
                valueInputOption: 'RAW',
                resource: { values }
            });
            
            console.log('Menu synced to Sheets');
        } catch (error) {
            console.error('Error syncing menu to Sheets:', error);
        }
    }
    
    async syncMenuToDrive() {
        if (!this.FILE_IDS.menu) return;
        
        try {
            await this.updateDriveFile('menu', window.dataManager.menuItems);
            console.log('Menu synced to Drive');
        } catch (error) {
            console.error('Error syncing menu to Drive:', error);
        }
    }
    
    async syncOrders() {
        if (!window.dataManager) return;
        
        if (this.USE_SHEETS) {
            await this.syncOrdersToSheets();
        } else {
            await this.syncOrdersToDrive();
        }
    }
    
    async syncOrdersToSheets() {
        if (!this.SPREADSHEET_ID) return;
        
        try {
            const orders = window.dataManager.orders;
            const values = orders.map(order => [
                order.id,
                order.tableId,
                order.status,
                order.subtotal,
                order.tax,
                order.total,
                JSON.stringify(order.items),
                order.createdAt,
                order.updatedAt
            ]);
            
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.SPREADSHEET_ID,
                range: 'Orders!A2:I',
                valueInputOption: 'RAW',
                resource: { values }
            });
            
            console.log('Orders synced to Sheets');
        } catch (error) {
            console.error('Error syncing orders to Sheets:', error);
        }
    }
    
    async syncOrdersToDrive() {
        if (!this.FILE_IDS.orders) return;
        
        try {
            await this.updateDriveFile('orders', window.dataManager.orders);
            console.log('Orders synced to Drive');
        } catch (error) {
            console.error('Error syncing orders to Drive:', error);
        }
    }
    
    // Helper Methods
    async updateDriveFile(fileType, data) {
        if (!this.FILE_IDS[fileType]) return;
        
        try {
            // Convert data to JSON string
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Update file using multipart upload
            const form = new FormData();
            form.append('metadata', JSON.stringify({
                name: `${fileType}.json`,
                mimeType: 'application/json'
            }));
            form.append('file', blob);
            
            await gapi.client.request({
                path: `/upload/drive/v3/files/${this.FILE_IDS[fileType]}`,
                method: 'PATCH',
                params: { uploadType: 'multipart' },
                body: form
            });
        } catch (error) {
            console.error(`Error updating ${fileType} file:`, error);
            throw error;
        }
    }
    
    // Sync all data
    async syncAll() {
        try {
            await this.syncTables();
            await this.syncMenu();
            await this.syncOrders();
            
            console.log('All data synced to Google Drive');
            return true;
        } catch (error) {
            console.error('Error syncing all data:', error);
            return false;
        }
    }
}

// Initialize drive sync
document.addEventListener('DOMContentLoaded', () => {
    window.driveSync = new DriveSync();
});
