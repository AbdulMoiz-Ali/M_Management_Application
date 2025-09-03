    import { useState, useEffect } from 'react';
    import { todoStorage } from '../services/storage';

    export function useTodos() {
        const [todos, setTodos] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
            loadTodos();
        }, []);

        const loadTodos = async () => {
            try {
                setLoading(true);
                const todoList = await todoStorage.getAllTodos();
                setTodos(todoList);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const addTodo = async (todoData) => {
            try {
                const newTodo = await todoStorage.addTodo(todoData);
                setTodos([newTodo, ...todos]);
                return newTodo;
            } catch (err) {
                setError(err.message);
                throw err;
            }
        };

        const updateTodo = async (id, updates) => {
            try {
                const updatedTodo = await todoStorage.updateTodo(id, updates);
                setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
                return updatedTodo;
            } catch (err) {
                setError(err.message);
                throw err;
            }
        };

        const deleteTodo = async (id) => {
            try {
                await todoStorage.deleteTodo(id);
                setTodos(todos.filter(todo => todo.id !== id));
            } catch (err) {
                setError(err.message);
                throw err;
            }
        };

        const toggleTodo = async (id) => {
            try {
                const updatedTodo = await todoStorage.toggleTodo(id);
                setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
                return updatedTodo;
            } catch (err) {
                setError(err.message);
                throw err;
            }
        };

        return {
            todos,
            loading,
            error,
            addTodo,
            updateTodo,
            deleteTodo,
            toggleTodo,
            refreshTodos: loadTodos
        };
    }