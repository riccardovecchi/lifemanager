// uiManager.js
export class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    renderAll() {
        this.renderAreas();
        this.renderProjects();
        this.renderTasks();
        this.renderNotes();
        this.updateFilters();
    }

    // Render Aree
    renderAreas() {
        const container = document.getElementById('areasList');
        const areas = this.dataManager.getAreas();

        if (areas.length === 0) {
            container.innerHTML = this.getEmptyState('📁', 'Nessuna area creata', 'Crea la tua prima area di vita');
            return;
        }

        container.innerHTML = areas.map(area => {
            const projectCount = this.dataManager.getProjects({ areaId: area.id }).length;

            return `
                <div class="card" data-id="${area.id}">
                    <div class="card-header">
                        <div>
                            <div style="font-size: 2rem; margin-bottom: 10px;">${area.icon}</div>
                            <div class="card-title">${this.escapeHtml(area.name)}</div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-area" data-id="${area.id}">✏️</button>
                            <button class="icon-btn delete-area" data-id="${area.id}">🗑️</button>
                        </div>
                    </div>
                    <div class="card-description">${this.escapeHtml(area.description || '')}</div>
                    <div class="card-meta">
                        <span class="badge badge-primary">${projectCount} progetti</span>
                    </div>
                </div>
            `;
        }).join('');

        this.attachAreaEventListeners();
    }

    attachAreaEventListeners() {
        document.querySelectorAll('.edit-area').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                window.app.modalManager.openAreaModal(id);
            });
        });

        document.querySelectorAll('.delete-area').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                if (confirm('Eliminare questa area e tutti i progetti collegati?')) {
                    await this.dataManager.deleteArea(id);
                    this.renderAll();
                }
            });
        });
    }

    // Render Progetti
    renderProjects() {
        const container = document.getElementById('projectsList');
        const areaFilter = document.getElementById('projectAreaFilter').value;
        const statusFilter = document.getElementById('projectStatusFilter').value;

        let projects = this.dataManager.getProjects({
            areaId: areaFilter || undefined,
            status: statusFilter || undefined
        });

        if (projects.length === 0) {
            container.innerHTML = this.getEmptyState('📊', 'Nessun progetto trovato', 'Crea il tuo primo progetto');
            return;
        }

        container.innerHTML = projects.map(project => {
            const area = this.dataManager.getArea(project.areaId);
            const progress = this.dataManager.getProjectProgress(project.id);
            const taskCount = this.dataManager.getTasks({ projectId: project.id }).length;

            return `
                <div class="card" data-id="${project.id}">
                    <div class="card-header">
                        <div style="flex: 1;">
                            <div class="card-title">${this.escapeHtml(project.name)}</div>
                            <div class="card-description">${this.escapeHtml(project.description || '')}</div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-project" data-id="${project.id}">✏️</button>
                            <button class="icon-btn delete-project" data-id="${project.id}">🗑️</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        ${area ? `<span class="badge badge-primary">${area.icon} ${this.escapeHtml(area.name)}</span>` : ''}
                        <span class="badge ${this.getStatusBadgeClass(project.status)}">${this.getStatusLabel(project.status)}</span>
                        <span class="badge badge-secondary">${taskCount} task</span>
                        ${project.startDate ? `<span>📅 ${project.startDate}</span>` : ''}
                    </div>
                    ${taskCount > 0 ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div style="text-align: right; font-size: 0.875rem; color: var(--text-secondary); margin-top: 5px;">
                            ${progress}% completato
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        this.attachProjectEventListeners();
    }

    attachProjectEventListeners() {
        document.querySelectorAll('.edit-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                window.app.modalManager.openProjectModal(id);
            });
        });

        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                if (confirm('Eliminare questo progetto e tutti i task collegati?')) {
                    await this.dataManager.deleteProject(id);
                    this.renderAll();
                }
            });
        });
    }

    // Render Task
    renderTasks() {
        const container = document.getElementById('tasksList');
        const projectFilter = document.getElementById('taskProjectFilter').value;
        const priorityFilter = document.getElementById('taskPriorityFilter').value;
        const showCompleted = document.getElementById('taskCompletedFilter').checked;

        let tasks = this.dataManager.getTasks({
            projectId: projectFilter || undefined,
            priority: priorityFilter || undefined
        });

        if (!showCompleted) {
            tasks = tasks.filter(t => !t.completed);
        }

        // Ordina per priorità e data
        tasks.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        if (tasks.length === 0) {
            container.innerHTML = this.getEmptyState('✅', 'Nessun task trovato', 'Crea il tuo primo task');
            return;
        }

        container.innerHTML = tasks.map(task => {
            const project = this.dataManager.getProject(task.projectId);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

            return `
                <div class="card ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
                    <div class="card-header">
                        <div style="display: flex; align-items: start; gap: 15px; flex: 1;">
                            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                            <div style="flex: 1;">
                                <div class="card-title">${this.escapeHtml(task.title)}</div>
                                ${task.description ? `<div class="card-description">${this.escapeHtml(task.description)}</div>` : ''}
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-task" data-id="${task.id}">✏️</button>
                            <button class="icon-btn delete-task" data-id="${task.id}">🗑️</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        ${project ? `<span class="badge badge-primary">${this.escapeHtml(project.name)}</span>` : ''}
                        <span class="badge priority-${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                        ${task.dueDate ? `<span class="${isOverdue ? 'badge badge-danger' : ''}">📅 ${task.dueDate}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.attachTaskEventListeners();
    }

    attachTaskEventListeners() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                await this.dataManager.toggleTaskComplete(id);
                this.renderTasks();
                this.renderProjects(); // Aggiorna progress bar
            });
        });

        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                window.app.modalManager.openTaskModal(id);
            });
        });

        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                if (confirm('Eliminare questo task?')) {
                    await this.dataManager.deleteTask(id);
                    this.renderAll();
                }
            });
        });
    }

    // Render Note
    renderNotes() {
        const container = document.getElementById('notesList');
        const linkedFilter = document.getElementById('noteLinkedFilter').value;
        const searchQuery = document.getElementById('noteSearchInput').value;

        let notes = this.dataManager.getNotes({
            search: searchQuery || undefined
        });

        if (linkedFilter) {
            const [type, id] = linkedFilter.split(':');
            notes = notes.filter(n => n.linkedTo && n.linkedTo.type === type && n.linkedTo.id === id);
        }

        if (notes.length === 0) {
            container.innerHTML = this.getEmptyState('📝', 'Nessuna nota trovata', 'Crea la tua prima nota');
            return;
        }

        container.innerHTML = notes.map(note => {
            let linkedInfo = '';
            if (note.linkedTo) {
                if (note.linkedTo.type === 'area') {
                    const area = this.dataManager.getArea(note.linkedTo.id);
                    linkedInfo = area ? `<span class="badge badge-primary">📁 ${this.escapeHtml(area.name)}</span>` : '';
                } else if (note.linkedTo.type === 'project') {
                    const project = this.dataManager.getProject(note.linkedTo.id);
                    linkedInfo = project ? `<span class="badge badge-primary">📊 ${this.escapeHtml(project.name)}</span>` : '';
                }
            }

            return `
                <div class="card" data-id="${note.id}">
                    <div class="card-header">
                        <div style="flex: 1;">
                            <div class="card-title">${this.escapeHtml(note.title)}</div>
                            <div class="card-description">${this.escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}</div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-note" data-id="${note.id}">✏️</button>
                            <button class="icon-btn delete-note" data-id="${note.id}">🗑️</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        ${linkedInfo}
                        ${note.tags && note.tags.length > 0 ? note.tags.map(tag => `<span class="badge badge-secondary">#${this.escapeHtml(tag)}</span>`).join('') : ''}
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">${this.formatDate(note.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.attachNoteEventListeners();
    }

    attachNoteEventListeners() {
        document.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                window.app.modalManager.openNoteModal(id);
            });
        });

        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                if (confirm('Eliminare questa nota?')) {
                    await this.dataManager.deleteNote(id);
                    this.renderNotes();
                }
            });
        });
    }

    // Aggiorna i filtri
    updateFilters() {
        // Project area filter
        const projectAreaFilter = document.getElementById('projectAreaFilter');
        const areas = this.dataManager.getAreas();
        projectAreaFilter.innerHTML = '<option value="">Tutte le aree</option>' +
            areas.map(area => `<option value="${area.id}">${area.icon} ${this.escapeHtml(area.name)}</option>`).join('');

        // Task project filter
        const taskProjectFilter = document.getElementById('taskProjectFilter');
        const projects = this.dataManager.getProjects();
        taskProjectFilter.innerHTML = '<option value="">Tutti i progetti</option>' +
            projects.map(project => `<option value="${project.id}">${this.escapeHtml(project.name)}</option>`).join('');

        // Note linked filter
        const noteLinkedFilter = document.getElementById('noteLinkedFilter');
        noteLinkedFilter.innerHTML = '<option value="">Tutti i collegamenti</option>' +
            areas.map(area => `<option value="area:${area.id}">📁 ${this.escapeHtml(area.name)}</option>`).join('') +
            projects.map(project => `<option value="project:${project.id}">📊 ${this.escapeHtml(project.name)}</option>`).join('');
    }

    // Utility functions
    getEmptyState(icon, title, subtitle) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-text">${title}</div>
                <div style="color: var(--text-secondary); margin-top: 10px;">${subtitle}</div>
            </div>
        `;
    }

    getStatusBadgeClass(status) {
        const classes = {
            planning: 'badge-secondary',
            active: 'badge-success',
            paused: 'badge-warning',
            completed: 'badge-primary'
        };
        return classes[status] || 'badge-secondary';
    }

    getStatusLabel(status) {
        const labels = {
            planning: 'Pianificazione',
            active: 'Attivo',
            paused: 'In pausa',
            completed: 'Completato'
        };
        return labels[status] || status;
    }

    getPriorityLabel(priority) {
        const labels = {
            high: '🔴 Alta',
            medium: '🟡 Media',
            low: '🟢 Bassa'
        };
        return labels[priority] || priority;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
