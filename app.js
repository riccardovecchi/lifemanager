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
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
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
            this.showNotification('Dati sincronizzati', 'success');
        });

        // Global search
        const searchInput = document.getElementById('globalSearch');
        const searchResults = document.getElementById('searchResults');

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                this.performGlobalSearch(query);
            }, 300);
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.style.display = 'none';
            }
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
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Reset detail views
        this.uiManager.hideAreaDetail();
        this.uiManager.hideProjectDetail();
    }

    performGlobalSearch(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        // Search in areas
        this.dataManager.getAreas().forEach(area => {
            if (area.name.toLowerCase().includes(lowerQuery) || 
                (area.description && area.description.toLowerCase().includes(lowerQuery))) {
                results.push({
                    type: 'area',
                    id: area.id,
                    title: area.name,
                    description: area.description
                });
            }
        });

        // Search in projects
        this.dataManager.getProjects().forEach(project => {
            if (project.name.toLowerCase().includes(lowerQuery) || 
                (project.description && project.description.toLowerCase().includes(lowerQuery))) {
                results.push({
                    type: 'project',
                    id: project.id,
                    title: project.name,
                    description: project.description
                });
            }
        });

        // Search in tasks
        this.dataManager.getTasks().forEach(task => {
            if (task.title.toLowerCase().includes(lowerQuery) || 
                (task.description && task.description.toLowerCase().includes(lowerQuery))) {
                results.push({
                    type: 'task',
                    id: task.id,
                    title: task.title,
                    description: task.description
                });
            }
        });

        // Search in notes
        this.dataManager.getNotes().forEach(note => {
            if (note.title.toLowerCase().includes(lowerQuery) || 
                note.content.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'note',
                    id: note.id,
                    title: note.title,
                    description: note.content.substring(0, 100)
                });
            }
        });

        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">Nessun risultato trovato</div>';
            searchResults.style.display = 'block';
            return;
        }

        const typeLabels = {
            area: 'Area',
            project: 'Progetto',
            task: 'Task',
            note: 'Nota'
        };

        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
                <div class="search-result-title">${this.escapeHtml(result.title)}</div>
                <div class="search-result-type">${typeLabels[result.type]}</div>
            </div>
        `).join('');

        searchResults.style.display = 'block';

        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.navigateToItem(type, id);
                searchResults.style.display = 'none';
                document.getElementById('globalSearch').value = '';
            });
        });
    }

    navigateToItem(type, id) {
        switch(type) {
            case 'area':
                this.switchTab('areas');
                setTimeout(() => this.uiManager.showAreaDetail(id), 100);
                break;
            case 'project':
                this.switchTab('projects');
                setTimeout(() => this.uiManager.showProjectDetail(id), 100);
                break;
            case 'task':
                this.switchTab('tasks');
                break;
            case 'note':
                this.switchTab('notes');
                break;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? 'var(--accent-primary)' : 'var(--accent-secondary)'};
            color: var(--bg-primary);
            border-radius: 4px;
            box-shadow: 0 0 20px ${type === 'success' ? 'var(--accent-primary)' : 'var(--accent-secondary)'};
            z-index: 10000;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.875rem;
            animation: slideIn 0.3s;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inizializza l'applicazione e rendila accessibile globalmente
window.app = new LifeManager();
