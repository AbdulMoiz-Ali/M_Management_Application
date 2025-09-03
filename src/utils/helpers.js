// Format date to readable string
export const formatDate = (date) => {
    if (!date) return '';

    const now = new Date();
    const todoDate = new Date(date);
    const diffTime = Math.abs(now - todoDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 'Today';
    } else if (diffDays === 2) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return todoDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};

// Generate unique ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate todo input
export const validateTodo = (title, description = '') => {
    const errors = {};

    if (!title || title.trim().length === 0) {
        errors.title = 'Title is required';
    } else if (title.trim().length > 100) {
        errors.title = 'Title must be less than 100 characters';
    }

    if (description && description.length > 500) {
        errors.description = 'Description must be less than 500 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Filter todos based on search query
export const filterTodos = (todos, searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
        return todos;
    }

    const query = searchQuery.toLowerCase().trim();
    return todos.filter(todo =>
        todo.title.toLowerCase().includes(query) ||
        (todo.description && todo.description.toLowerCase().includes(query))
    );
};

// Sort todos by different criteria
export const sortTodos = (todos, sortBy = 'createdAt', order = 'desc') => {
    return [...todos].sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'title':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
                break;
            case 'createdAt':
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
                break;
            case 'updatedAt':
                aValue = new Date(a.updatedAt);
                bValue = new Date(b.updatedAt);
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                aValue = priorityOrder[a.priority] || 0;
                bValue = priorityOrder[b.priority] || 0;
                break;
            default:
                aValue = a.createdAt;
                bValue = b.createdAt;
        }

        if (order === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
};

// Get todos statistics
export const getTodosStats = (todos) => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
        total,
        completed,
        pending,
        completionRate
    };
};

// Group todos by date
export const groupTodosByDate = (todos) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    todos.forEach(todo => {
        const todoDate = new Date(todo.createdAt);
        let groupKey;

        if (isSameDay(todoDate, today)) {
            groupKey = 'Today';
        } else if (isSameDay(todoDate, yesterday)) {
            groupKey = 'Yesterday';
        } else {
            groupKey = todoDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(todo);
    });

    return groups;
};

// Check if two dates are the same day
const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
};

// Debounce function for search
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Export/Import helpers
export const exportTodos = (todos) => {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

// Theme helpers
export const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme) => {
    if (theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark')) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};