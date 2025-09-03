class TodoStorage {
    constructor() {
        this.todos = [];
        this.settings = {};
        this.loaded = false;
    }

    async init() {
        if (!this.loaded) {
            this.todos = await window.electronAPI.loadTodos();
            this.settings = await window.electronAPI.loadSettings();
            this.loaded = true;
        }
    }

    async saveTodos() {
        const result = await window.electronAPI.saveTodos(this.todos);
        return result.success;
    }

    async saveSettings() {
        const result = await window.electronAPI.saveSettings(this.settings);
        return result.success;
    }

    // CRUD Operations
    async getAllTodos() {
        await this.init();
        return this.todos;
    }

    async addTodo(todo) {
        await this.init();
        const newTodo = {
            id: Date.now(),
            title: todo.title,
            description: todo.description || '',
            completed: false,
            priority: todo.priority || 'medium',
            category: todo.category || 'general',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.todos.unshift(newTodo);
        await this.saveTodos();
        return newTodo;
    }

    async updateTodo(id, updates) {
        await this.init();
        const index = this.todos.findIndex(todo => todo.id === id);
        if (index !== -1) {
            this.todos[index] = {
                ...this.todos[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await this.saveTodos();
            return this.todos[index];
        }
        return null;
    }

    async deleteTodo(id) {
        await this.init();
        this.todos = this.todos.filter(todo => todo.id !== id);
        await this.saveTodos();
        return true;
    }

    async toggleTodo(id) {
        await this.init();
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.updatedAt = new Date().toISOString();
            await this.saveTodos();
            return todo;
        }
        return null;
    }

    // Filter methods
    async getCompletedTodos() {
        await this.init();
        return this.todos.filter(todo => todo.completed);
    }

    async getPendingTodos() {
        await this.init();
        return this.todos.filter(todo => !todo.completed);
    }

    async getTodosByCategory(category) {
        await this.init();
        return this.todos.filter(todo => todo.category === category);
    }

    // Settings
    async getSettings() {
        await this.init();
        return this.settings;
    }

    async updateSettings(newSettings) {
        await this.init();
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        return this.settings;
    }

    // Import/Export
    async exportData() {
        return await window.electronAPI.exportData();
    }

    async importData() {
        const result = await window.electronAPI.importData();
        if (result.success && result.data) {
            this.todos = result.data.todos || [];
            this.settings = result.data.settings || {};
            await this.saveTodos();
            await this.saveSettings();
        }
        return result;
    }
}

export const todoStorage = new TodoStorage();


