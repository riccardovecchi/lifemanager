// app.js
import { DataManager } from './dataManager.js';
import { UIManager } from './uiManager.js';
import { ModalManager } from './modalManager.js';

class LifeManager {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager(this.dataManager);
        this.modalManager = new ModalManager(this.dataManager, this.uiManager);

        this.init();
    }

    async init() {
        // Carica i dati
        await this.dataManager.loadData();

        // Inizializza UI
        this.setupEventListeners();
        this.uiManager.renderAll();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Add buttons
        document.getElementById('addAreaBtn').addEventListener('click', () => {
            this.modalManager.openAreaModal();
        });

        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.modalManager.openProjectModal();
        });

        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.modalManager.openTaskModal();
        });

        document.getElementById('addNoteBtn').addEventListener('click', () => {
            this.modalManager.openNoteModal();
        });

        // Sync button
        document.getElementById('syncBtn').addEventListener('click', async () => {
            await this.dataManager.saveData();
            this.showNotification('Dati sincronizzati con successo!', 'success');
        });

        // Filters
        this.setupFilters();

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.modalManager.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.modalManager.closeModal();
            }
        });
    }

    setupFilters() {
        // Project filters
        document.getElementById('projectAreaFilter').addEventListener('change', () => {
            this.uiManager.renderProjects();
        });

        document.getElementById('projectStatusFilter').addEventListener('change', () => {
            this.uiManager.renderProjects();
        });

        // Task filters
        document.getElementById('taskProjectFilter').addEventListener('change', () => {
            this.uiManager.renderTasks();
        });

        document.getElementById('taskPriorityFilter').addEventListener('change', () => {
            this.uiManager.renderTasks();
        });

        document.getElementById('taskCompletedFilter').addEventListener('change', () => {
            this.uiManager.renderTasks();
        });

        // Note filters
        document.getElementById('noteLinkedFilter').addEventListener('change', () => {
            this.uiManager.renderNotes();
        });

        document.getElementById('noteSearchInput').addEventListener('input', () => {
            this.uiManager.renderNotes();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    showNotification(message, type = 'info') {
        // Simple notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#52c41a' : '#4a90e2'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inizializza l'applicazione e rendila accessibile globalmente
window.app = new LifeManager();
