// Data Manager - Handles local data and sync operations
class DataManager {
    constructor() {
        this.tables = [];
        this.menuItems = [];
        this.orders = [];
        this.currentOrder = null;
        this.selectedTableId = null;
        
        // Initialize from localStorage
        this.loadFromLocalStorage();
    }
    
    // Local Storage Operations
    loadFromLocalStorage() {
        try {
            const savedTables = localStorage.getItem('pos_tables');
            const savedMenu = localStorage.getItem('pos_menu');
            const savedOrders = localStorage.getItem('pos_orders');
            
            this.tables = savedTables ? JSON.parse(savedTables) : [];
            this.menuItems = savedMenu ? JSON.parse(savedMenu) : [];
            this.orders = savedOrders ? JSON.parse(savedOrders) : [];
            
            // Set default menu if empty
            if (this.menuItems.length === 0) {
                this.setDefaultMenu();
            }
            
            console.log('Loaded from localStorage:', {
                tables: this.tables.length,
                menu: this.menuItems.length,
                orders: this.orders.length
            });
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.setDefaultMenu();
        }
    }
    
    saveToLocalStorage() {
        try {
            localStorage.setItem('pos_tables', JSON.stringify(this.tables));
            localStorage.setItem('pos_menu', JSON.stringify(this.menuItems));
            localStorage.setItem('pos_orders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    setDefaultMenu() {
        this.menuItems = [
            {
                id: '1',
                name: 'Chicken Burger',
                category: 'food',
                price: 12.99,
                description: 'Juicy chicken patty with fresh veggies'
            },
            {
                id: '2',
                name: 'Caesar Salad',
                category: 'food',
                price: 9.99,
                description: 'Fresh romaine with Caesar dressing'
            },
            {
                id: '3',
                name: 'Margherita Pizza',
                category: 'food',
                price: 14.99,
                description: 'Classic tomato and mozzarella'
            },
            {
                id: '4',
                name: 'Coca Cola',
                category: 'beverage',
                price: 2.99,
                description: '330ml can'
            },
            {
                id: '5',
                name: 'Coffee',
                category: 'beverage',
                price: 3.50,
                description: 'Freshly brewed coffee'
            },
            {
                id: '6',
                name: 'Chocolate Cake',
                category: 'custom',
                price: 6.99,
                description: 'Rich chocolate dessert'
            }
        ];
        this.saveToLocalStorage();
    }
    
    // Table Operations
    addTable(tableData) {
        const newTable = {
            id: this.generateId('table'),
            name: tableData.name,
            capacity: tableData.capacity || 4,
            status: 'available',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tables.push(newTable);
        this.saveToLocalStorage();
        
        // Sync to Google Drive
        if (window.driveSync && window.googleAuth.isAuthenticated()) {
            window.driveSync.syncTables();
        }
        
        return newTable;
    }
    
    updateTable(tableId, updates) {
        const tableIndex = this.tables.findIndex(t => t.id === tableId);
        if (tableIndex === -1) return null;
        
        this.tables[tableIndex] = {
            ...this.tables[tableIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveToLocalStorage();
        
        // Sync to Google Drive
        if (window.driveSync && window.googleAuth.isAuthenticated()) {
            window.driveSync.syncTables();
        }
        
        return this.tables[tableIndex];
    }
    
    deleteTable(tableId) {
        const tableIndex = this.tables.findIndex(t => t.id === tableId);
        if (tableIndex === -1) return false;
        
        // Check if table has active order
        const activeOrder = this.orders.find(o => o.tableId === tableId && o.status === 'active');
        if (activeOrder) {
            throw new Error('Cannot delete table with active order');
        }
        
        this.tables.splice(tableIndex, 1);
        this.saveToLocalStorage();
        
        // Sync to Google Drive
        if (window.driveSync && window.googleAuth.isAuthenticated()) {
            window.driveSync.syncTables();
        }
        
        return true;
    }
    
    getTable(tableId) {
        return this.tables.find(t => t.id === tableId);
    }
    
    // Menu Operations
    addMenuItem(itemData) {
        const newItem = {
            id: this.generateId('menu'),
            name: itemData.name,
            category: itemData.category,
            price: parseFloat(itemData.price),
            description: itemData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.menuItems.push(newItem);
        this.saveToLocalStorage();
        
        // Sync to Google Drive
        if (window.driveSync && window.googleAuth.isAuthenticated()) {
            window.driveSync.syncMenu();
        }
        
        return newItem;
    }
    
    updateMenuItem(itemId, updates) {
        const itemIndex = this.menuItems.findIndex(m => m.id === itemId);
        if (itemIndex === -1) return null;
        
        this.menuItems[itemIndex] = {
            ...this.menuItems[itemIndex],
            ...updates,
            price: parseFloat(updates.price || this.menuItems[itemIndex].price),
            updatedAt: new Date().toISOString()
        };
        
        this.saveToLocalStorage();
        
        // Sync to Google Drive
        if (window.driveSync && window.googleAuth.isAuthenticated()) {
            window.driveSync.syncMenu();
        }
        
        return this.menuItems[itemIndex];
    }
    
    deleteMenuItem(itemId) {
        const itemIndex = this.menuItems.findIndex(m => m.id === itemId);
        if (itemIndex === -1) return false;
        
        this.menuItems.splice(itemIndex, 1);
        this.saveToLocalStorage();
        
        // Sync to Google Drive
        if (window.driveSync && window.googleAuth.isAuthenticated()) {
            window.driveSync.syncMenu();
        }
        
        return true;
    }
    
    getMenuItem(itemId) {
        return this.menuItems.find(m => m.id === itemId);
    }
    
    // Order Operations
    createOrder(tableId) {
        // Check if table already has active order
        const existingOrder = this.orders.find(o => o.tableId === tableId && o.status === 'active');
        if (existingOrder) {
            this.currentOrder = existingOrder;
            return existingOrder;
        }
        
        const newOrder = {
            id: this.generateId('order'),
            tableId: tableId,
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.orders.push(newOrder);
        this.currentOrder = newOrder;
        
        // Update table status
       
