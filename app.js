// Main Application UI Controller
class POSApp {
    constructor() {
        this.currentModal = null;
        this.editingId = null;
        this.confirmCallback = null;
        
        this.initializeEventListeners();
        this.refreshAll();
        
        // Check if already authenticated
        if (window.googleAuth && window.googleAuth.isAuthenticated()) {
            window.driveSync.initialize().then(() => {
                window.dataManager.initialize();
            });
        }
    }
    
    initializeEventListeners() {
        // Table Management
        document.getElementById('addTableBtn').addEventListener('click', () => this.showTableModal());
        document.getElementById('tableForm').addEventListener('submit', (e) => this.handleTableSubmit(e));
        document.getElementById('cancelTableBtn').addEventListener('click', () => this.hideModal('tableModal'));
        
        // Menu Management
        document.getElementById('addMenuItemBtn').addEventListener('click', () => this.showMenuModal());
        document.getElementById('menuForm').addEventListener('submit', (e) => this.handleMenuSubmit(e));
        document.getElementById('cancelMenuBtn').addEventListener('click', () => this.hideModal('menuModal'));
        
        // Order Management
        document.getElementById('clearOrderBtn').addEventListener('click', () => this.clearCurrentOrder());
        document.getElementById('closeOrderBtn').addEventListener('click', () => this.closeCurrentOrder());
        
        // Search and Filter
        document.getElementById('menuSearch').addEventListener('input', (e) => this.filterMenuItems(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterMenuByCategory(e.target.value));
        
        // Refresh Data
        document.getElementById('refreshData').addEventListener('click', () => this.refreshFromDrive());
        
        // Confirmation Modal
        document.getElementById('confirmCancel').addEventListener('click', () => this.hideModal('confirmModal'));
        document.getElementById('confirmAction').addEventListener('click', () => this.executeConfirmAction());
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }
    
    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            this.currentModal = modalId;
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.currentModal = null;
            this.editingId = null;
            
            // Reset forms
            if (modalId === 'tableModal') {
                document.getElementById('tableForm').reset();
                document.getElementById('tableModalTitle').textContent = 'Add New Table';
            } else if (modalId === 'menuModal') {
                document.getElementById('menuForm').reset();
                document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
            }
        }
    }
    
    showConfirmModal(title, message, callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        this.confirmCallback = callback;
        this.showModal('confirmModal');
    }
    
    executeConfirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hideModal('confirmModal');
        this.confirmCallback = null;
    }
    
    // Table Management UI
    showTableModal(tableId = null) {
        if (tableId) {
            const table = window.dataManager.getTable(tableId);
            if (table) {
                document.getElementById('tableName').value = table.name;
                document.getElementById('tableCapacity').value = table.capacity;
                document.getElementById('tableModalTitle').textContent = 'Edit Table';
                this.editingId = tableId;
            }
        }
        this.showModal('tableModal');
    }
    
    async handleTableSubmit(e) {
        e.preventDefault();
        
        const tableData = {
            name: document.getElementById('tableName').value.trim(),
            capacity: parseInt(document.getElementById('tableCapacity').value)
        };
        
        if (!tableData.name) {
            alert('Table name is required');
            return;
        }
        
        if (this.editingId) {
            window.dataManager.updateTable(this.editingId, tableData);
        } else {
            window.dataManager.addTable(tableData);
        }
        
        this.hideModal('tableModal');
        this.refreshTables();
    }
    
    deleteTable(tableId) {
        this.showConfirmModal(
            'Delete Table',
            'Are you sure you want to delete this table?',
            () => {
                try {
                    window.dataManager.deleteTable(tableId);
                    this.refreshTables();
                    
                    // If deleted table was selected, clear order panel
                    if (window.dataManager.selectedTableId === tableId) {
                        window.dataManager.selectedTableId = null;
                        window.dataManager.currentOrder = null;
                        this.refreshOrderPanel();
                    }
                } catch (error) {
                    alert(error.message);
                }
            }
        );
    }
    
    refreshTables() {
        const tablesContainer = document.getElementById('tablesList');
        tablesContainer.innerHTML = '';
        
        window.dataManager.tables.forEach(table => {
            const tableElement = this.createTableElement(table);
            tablesContainer.appendChild(tableElement);
        });
    }
    
    createTableElement(table) {
        const div = document.createElement('div');
        div.className = `table-card ${table.status} ${window.dataManager.selectedTableId === table.id ? 'selected' : ''}`;
        div.dataset.id = table.id;
        
        const statusClass = table.status === 'available' ? 'available' : 'occupied';
        
        div.innerHTML = `
            <div class="table-status ${statusClass}"></div>
            <div class="table-name">${table.name}</div>
            <div class="table-info">Capacity: ${table.capacity}</div>
            <div class="table-actions">
                <button class="btn btn-secondary btn-small edit-table">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small delete-table">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Table selection
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.table-actions')) {
                this.selectTable(table.id);
            }
        });
        
        // Edit button
        div.querySelector('.edit-table').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTableModal(table.id);
        });
        
        // Delete button
        div.querySelector('.delete-table').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTable(table.id);
        });
        
        return div;
    }
    
    selectTable(tableId) {
        const table = window.dataManager.getTable(tableId);
        if (!table) return;
        
        window.dataManager.selectedTableId = tableId;
        
        // Create or get order for this table
        const order = window.dataManager.createOrder(tableId);
        window.dataManager.currentOrder = order;
        
        // Update UI
        this.refreshTables();
        this.refreshOrderPanel();
        
        // Update selected table info
        document.getElementById('selectedTableInfo').textContent = `Table: ${table.name}`;
        document.getElementById('selectedTableInfo').className = 'selected-table';
        
        // Enable order buttons
        document.getElementById('clearOrderBtn').disabled = false;
        document.getElementById('closeOrderBtn').disabled = false;
    }
    
    // Menu Management UI
    showMenuModal(itemId = null) {
        if (itemId) {
            const item = window.dataManager.getMenuItem(itemId);
            if (item) {
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemCategory').value = item.category;
                document.getElementById('itemPrice').value = item.price;
                document.getElementById('itemDescription').value = item.description;
                document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
                this.editingId = itemId;
            }
        }
        this.showModal('menuModal');
    }
    
    async handleMenuSubmit(e) {
        e.preventDefault();
        
        const itemData = {
            name: document.getElementById('itemName').value.trim(),
            category: document.getElementById('itemCategory').value,
            price: parseFloat(document.getElementById('itemPrice').value),
            description: document.getElementById('itemDescription').value.trim()
        };
        
        if (!itemData.name || itemData.price < 0) {
            alert('Valid name and price are required');
            return;
        }
        
        if (this.editingId) {
            window.dataManager.updateMenuItem(this.editingId, itemData);
        } else {
            window.dataManager.addMenuItem(itemData);
        }
        
        this.hideModal('menuModal');
        this.refreshMenu();
    }
    
    deleteMenuItem(itemId) {
        this.showConfirmModal(
            'Delete Menu Item',
            'Are you sure you want to delete this menu item?',
            () => {
                window.dataManager.deleteMenuItem(itemId);
                this.refreshMenu();
            }
        );
    }
    
    refreshMenu() {
        const menuContainer = document.getElementById('menuItems');
        menuContainer.innerHTML = '';
        
        window.dataManager.menuItems.forEach(item => {
            const itemElement = this.createMenuItemElement(item);
            menuContainer.appendChild(itemElement);
        });
    }
    
    createMenuItemElement(item) {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.dataset.id = item.id;
        
        const categoryColors = {
            food: '#27ae60',
            beverage: '#3498db',
            custom: '#9b59b6'
        };
        
        div.innerHTML = `
            <span class="item-category" style="background: ${categoryColors[item.category] || '#95a5a6'}">
                ${item.category}
            </span>
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small edit-item">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small delete-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add to order on click
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.item-actions')) {
                this.addToCurrentOrder(item.id);
            }
        });
        
        // Edit button
        div.querySelector('.edit-item').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMenuModal(item.id);
        });
        
        // Delete button
        div.querySelector('.delete-item').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteMenuItem(item.id);
        });
        
        return div;
    }
    
    filterMenuItems(searchTerm) {
        const items = document.querySelectorAll('.menu-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.item-name').textContent.toLowerCase();
            const description = item.querySelector('.item-description').textContent.toLowerCase();
            const isVisible = name.includes(term) || description.includes(term);
            item.style.display = isVisible ? 'block' : 'none';
        });
    }
    
    filterMenuByCategory(category) {
        const items = document.querySelectorAll('.menu-item');
        
        items.forEach(item => {
            if (category === 'all') {
                item.style.display = 'block';
            } else {
                const itemCategory = item.querySelector('.item-category').textContent.toLowerCase();
                item.style.display = itemCategory === category ? 'block' : 'none';
            }
        });
    }
    
    // Order Management UI
    addToCurrentOrder(itemId) {
        if (!window.dataManager.selectedTableId) {
            alert('Please select a table first');
            return;
        }
        
        window.dataManager.addToOrder(itemId, 1);
        this.refreshOrderPanel();
    }
    
    updateOrderItemQuantity(itemId, change) {
        if (!window.dataManager.currentOrder) return;
        
        const item = window.dataManager.currentOrder.items.find(i => i.id === itemId);
        if (!item) return;
        
        const newQuantity = item.quantity + change;
        window.dataManager.updateOrderItemQuantity(itemId, newQuantity);
        this.refreshOrderPanel();
    }
    
    clearCurrentOrder() {
        if (!window.dataManager.currentOrder) return;
        
        this.showConfirmModal(
            'Clear Order',
            'Are you sure you want to clear all items from this order?',
            () => {
                window.dataManager.clearOrder();
                this.refreshOrderPanel();
            }
        );
    }
    
    closeCurrentOrder() {
        if (!window.dataManager.currentOrder) return;
        
        const order = window.dataManager.currentOrder;
        const table = window.dataManager.getTable(order.tableId);
        
        this.showConfirmModal(
            'Close Order',
            `Close order for ${table?.name || 'table'}? Total: $${order.total.toFixed(2)}`,
            () => {
                const closedOrder = window.dataManager.closeOrder();
                if (closedOrder) {
                    alert(`Order closed successfully! Total: $${closedOrder.total.toFixed(2)}`);
                    this.refreshAll();
                }
            }
        );
    }
    
    refreshOrderPanel() {
        const orderItemsContainer = document.getElementById('orderItemsList');
        
        if (!window.dataManager.currentOrder || window.dataManager.currentOrder.items.length === 0) {
            orderItemsContainer.innerHTML = `
                <div class="empty-order">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Select a table and add items</p>
                </div>
            `;
            
            document.getElementById('subtotal').textContent = '$0.00';
            document.getElementById('tax').textContent = '$0.00';
            document.getElementById('total').textContent = '$0.00';
            
            return;
        }
        
        const order = window.dataManager.currentOrder;
        let itemsHTML = '';
        
        order.items.forEach(item => {
            itemsHTML += `
                <div class="order-item" data-id="${item.id}">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">$${item.price.toFixed(2)} each</div>
                    </div>
                    <div class="item-quantity-controls">
                        <button class="quantity-btn decrease">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increase">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-total">$${item.total.toFixed(2)}</div>
                </div>
            `;
        });
        
        orderItemsContainer.innerHTML = itemsHTML;
        
        // Update totals
        document.getElementById('subtotal').textContent = `$${order.subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${order.tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${order.total.toFixed(2)}`;
        
        // Add event listeners to quantity buttons
        orderItemsContainer.querySelectorAll('.decrease').forEach(btn => {
            const itemId = btn.closest('.order-item').dataset.id;
            btn.addEventListener('click', () => this.updateOrderItemQuantity(itemId, -1));
        });
        
        orderItemsContainer.querySelectorAll('.increase').forEach(btn => {
            const itemId = btn.closest('.order-item').dataset.id;
            btn.addEventListener('click', () => this.updateOrderItemQuantity(itemId, 1));
        });
    }
    
    // Refresh all UI components
    refreshAll() {
        this.refreshTables();
        this.refreshMenu();
        this.refreshOrderPanel();
        
        // Update sync status
        this.updateSyncStatus();
    }
    
    async refreshFromDrive() {
        if (!window.googleAuth.isAuthenticated()) {
            alert('Please sign in to Google to sync with Drive');
            return;
        }
        
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Syncing...';
        syncStatus.className = 'sync-status syncing';
        
        try {
            const success = await window.dataManager.syncFromDrive();
            if (success) {
                this.refreshAll();
                syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Synced with Drive';
                syncStatus.className = 'sync-status';
                
                // Show success message
                this.showTempMessage('Data synced from Google Drive', 'success');
            } else {
                throw new Error('Sync failed');
            }
        } catch (error) {
            console.error('Refresh error:', error);
            syncStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Sync failed';
            syncStatus.className = 'sync-status error';
            
            this.showTempMessage('Failed to sync with Drive. Using local data.', 'error');
        }
    }
    
    updateSyncStatus() {
        const syncStatus = document.getElementById('syncStatus');
        if (window.googleAuth && window.googleAuth.isAuthenticated()) {
            syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Connected to Google Drive';
            syncStatus.className = 'sync-status';
        } else {
            syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Offline (Local Data)';
            syncStatus.className = 'sync-status error';
        }
    }
    
    showTempMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message status-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '80px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '1000';
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.appUI = new POSApp();
    
    // Auto-sync every 5 minutes if authenticated
    if (window.googleAuth && window.googleAuth.isAuthenticated()) {
        setInterval(() => {
            if (window.driveSync && window.googleAuth.isAuthenticated()) {
                window.driveSync.syncAll().then(success => {
                    if (success) {
                        console.log('Auto-sync completed');
                    }
                });
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
});
