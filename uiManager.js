// uiManager.js
export class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentAreaDetail = null;
        this.currentProjectDetail = null;
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
            container.innerHTML = this.getEmptyState('◆', 'Nessuna area creata', 'Inizia creando la tua prima area di vita');
            return;
        }

        container.innerHTML = areas.map(area => {
            const projectCount = this.dataManager.getProjects({ areaId: area.id }).length;
            const projects = this.dataManager.getProjects({ areaId: area.id });
            const activeProjects = projects.filter(p => p.status === 'active').length;

            return `
                <div class="card area-card" data-id="${area.id}">
                    <div class="card-header">
                        <div style="flex: 1;">
                            <div class="card-title">${this.escapeHtml(area.name)}</div>
                            <div class="card-description">${this.escapeHtml(area.description || 'Nessuna descrizione')}</div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-area" data-id="${area.id}" title="Modifica">✎</button>
                            <button class="icon-btn delete-area" data-id="${area.id}" title="Elimina">✕</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        <span class="badge badge-primary">${projectCount} progetti</span>
                        ${activeProjects > 0 ? `<span class="badge badge-success">${activeProjects} attivi</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.attachAreaEventListeners();
    }

    attachAreaEventListeners() {
        // Click sulla card per aprire il dettaglio
        document.querySelectorAll('.area-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Ignora click sui bottoni
                if (e.target.closest('.icon-btn')) return;

                const id = card.dataset.id;
                this.showAreaDetail(id);
            });
        });

        document.querySelectorAll('.edit-area').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openAreaModal(id);
            });
        });

        document.querySelectorAll('.delete-area').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                if (confirm('Eliminare questa area e tutti i progetti collegati?')) {
                    await this.dataManager.deleteArea(id);
                    this.renderAll();
                }
            });
        });
    }

    // Mostra dettaglio area
    showAreaDetail(areaId) {
        const area = this.dataManager.getArea(areaId);
        if (!area) return;

        this.currentAreaDetail = areaId;

        // Nascondi lista aree
        document.getElementById('areasView').style.display = 'none';

        // Mostra dettaglio
        const detailView = document.getElementById('areaDetailView');
        detailView.style.display = 'block';

        // Ottieni dati collegati
        const projects = this.dataManager.getProjects({ areaId });
        const allTasks = [];
        projects.forEach(project => {
            const tasks = this.dataManager.getTasks({ projectId: project.id });
            allTasks.push(...tasks);
        });
        const notes = this.dataManager.getNotes().filter(n => 
            n.linkedTo && n.linkedTo.type === 'area' && n.linkedTo.id === areaId
        );

        // Calcola statistiche
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.completed).length;
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;

        detailView.innerHTML = `
            <a href="#" class="back-btn" id="backToAreas">← Indietro</a>

            <div class="area-detail">
                <div class="area-detail-header">
                    <div>
                        <div class="area-detail-title">${this.escapeHtml(area.name)}</div>
                        <div class="area-detail-description">${this.escapeHtml(area.description || 'Nessuna descrizione')}</div>
                    </div>
                    <div class="card-actions" style="opacity: 1;">
                        <button class="btn btn-secondary btn-small" id="editAreaDetail">Modifica</button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${projects.length}</div>
                        <div class="stat-label">Progetti</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${activeProjects}</div>
                        <div class="stat-label">Attivi</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalTasks}</div>
                        <div class="stat-label">Task totali</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${completedTasks}/${totalTasks}</div>
                        <div class="stat-label">Completati</div>
                    </div>
                </div>

                ${projects.length > 0 ? `
                    <div class="area-detail-section">
                        <h3>Progetti</h3>
                        <div class="items-list">
                            ${projects.map(project => {
                                const progress = this.dataManager.getProjectProgress(project.id);
                                const taskCount = this.dataManager.getTasks({ projectId: project.id }).length;

                                return `
                                    <div class="card project-detail-card" data-id="${project.id}">
                                        <div class="card-header">
                                            <div style="flex: 1;">
                                                <div class="card-title">${this.escapeHtml(project.name)}</div>
                                                <div class="card-description">${this.escapeHtml(project.description || 'Nessuna descrizione')}</div>
                                            </div>
                                            <div class="card-actions">
                                                <button class="icon-btn edit-project-detail" data-id="${project.id}">✎</button>
                                            </div>
                                        </div>
                                        <div class="card-meta">
                                            <span class="badge ${this.getStatusBadgeClass(project.status)}">${this.getStatusLabel(project.status)}</span>
                                            <span class="badge badge-secondary">${taskCount} task</span>
                                            ${project.startDate ? `<span>${project.startDate}</span>` : ''}
                                        </div>
                                        ${taskCount > 0 ? `
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${progress}%"></div>
                                            </div>
                                            <div style="text-align: right; font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;">
                                                ${progress}% completato
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${allTasks.length > 0 ? `
                    <div class="area-detail-section">
                        <h3>Task recenti</h3>
                        <div class="items-list">
                            ${allTasks.slice(0, 10).map(task => {
                                const project = this.dataManager.getProject(task.projectId);
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

                                return `
                                    <div class="card ${task.completed ? 'task-completed' : ''}">
                                        <div class="card-header">
                                            <div style="display: flex; align-items: start; gap: 12px; flex: 1;">
                                                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''} disabled>
                                                <div style="flex: 1;">
                                                    <div class="card-title">${this.escapeHtml(task.title)}</div>
                                                    ${task.description ? `<div class="card-description">${this.escapeHtml(task.description)}</div>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-meta">
                                            ${project ? `<span class="badge badge-primary">${this.escapeHtml(project.name)}</span>` : ''}
                                            <span class="badge priority-${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                                            ${task.dueDate ? `<span class="${isOverdue ? 'badge badge-danger' : ''}">${task.dueDate}</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${notes.length > 0 ? `
                    <div class="area-detail-section">
                        <h3>Note</h3>
                        <div class="items-list">
                            ${notes.map(note => `
                                <div class="card note-detail-card" data-id="${note.id}">
                                    <div class="card-header">
                                        <div style="flex: 1;">
                                            <div class="card-title">${this.escapeHtml(note.title)}</div>
                                            <div class="card-description">${this.escapeHtml(note.content.substring(0, 200))}${note.content.length > 200 ? '...' : ''}</div>
                                        </div>
                                        <div class="card-actions">
                                            <button class="icon-btn edit-note-detail" data-id="${note.id}">✎</button>
                                        </div>
                                    </div>
                                    <div class="card-meta">
                                        ${note.tags && note.tags.length > 0 ? note.tags.map(tag => `<span class="badge badge-secondary">#${this.escapeHtml(tag)}</span>`).join('') : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listeners per il dettaglio
        document.getElementById('backToAreas').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideAreaDetail();
        });

        document.getElementById('editAreaDetail').addEventListener('click', () => {
            window.app.modalManager.openAreaModal(areaId);
        });

        // Click su progetti nel dettaglio
        document.querySelectorAll('.project-detail-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.icon-btn')) return;
                const id = card.dataset.id;
                this.hideAreaDetail();
                window.app.switchTab('projects');
                setTimeout(() => this.showProjectDetail(id), 100);
            });
        });

        document.querySelectorAll('.edit-project-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openProjectModal(id);
            });
        });

        // Click su note nel dettaglio
        document.querySelectorAll('.note-detail-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.icon-btn')) return;
                const id = card.dataset.id;
                window.app.modalManager.openNoteModal(id);
            });
        });

        document.querySelectorAll('.edit-note-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openNoteModal(id);
            });
        });
    }

    hideAreaDetail() {
        this.currentAreaDetail = null;
        document.getElementById('areasView').style.display = 'block';
        document.getElementById('areaDetailView').style.display = 'none';
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
            container.innerHTML = this.getEmptyState('◇', 'Nessun progetto trovato', 'Crea il tuo primo progetto');
            return;
        }

        container.innerHTML = projects.map(project => {
            const area = this.dataManager.getArea(project.areaId);
            const progress = this.dataManager.getProjectProgress(project.id);
            const taskCount = this.dataManager.getTasks({ projectId: project.id }).length;

            return `
                <div class="card project-card" data-id="${project.id}">
                    <div class="card-header">
                        <div style="flex: 1;">
                            <div class="card-title">${this.escapeHtml(project.name)}</div>
                            <div class="card-description">${this.escapeHtml(project.description || 'Nessuna descrizione')}</div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-project" data-id="${project.id}" title="Modifica">✎</button>
                            <button class="icon-btn delete-project" data-id="${project.id}" title="Elimina">✕</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        ${area ? `<span class="badge badge-primary">${this.escapeHtml(area.name)}</span>` : ''}
                        <span class="badge ${this.getStatusBadgeClass(project.status)}">${this.getStatusLabel(project.status)}</span>
                        <span class="badge badge-secondary">${taskCount} task</span>
                        ${project.startDate ? `<span>${project.startDate}</span>` : ''}
                    </div>
                    ${taskCount > 0 ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div style="text-align: right; font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;">
                            ${progress}% completato
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        this.attachProjectEventListeners();
    }

    attachProjectEventListeners() {
        // Click sulla card per aprire il dettaglio
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.icon-btn')) return;

                const id = card.dataset.id;
                this.showProjectDetail(id);
            });
        });

        document.querySelectorAll('.edit-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openProjectModal(id);
            });
        });

        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                if (confirm('Eliminare questo progetto e tutti i task collegati?')) {
                    await this.dataManager.deleteProject(id);
                    this.renderAll();
                }
            });
        });
    }

    // Mostra dettaglio progetto
    showProjectDetail(projectId) {
        const project = this.dataManager.getProject(projectId);
        if (!project) return;

        this.currentProjectDetail = projectId;

        // Nascondi lista progetti
        document.getElementById('projectsList').style.display = 'none';
        document.querySelector('#projects .section-header').style.display = 'none';
        document.querySelector('#projects .filters').style.display = 'none';

        // Mostra dettaglio
        const detailView = document.getElementById('projectDetailView');
        detailView.style.display = 'block';

        const area = this.dataManager.getArea(project.areaId);
        const tasks = this.dataManager.getTasks({ projectId });
        const completedTasks = tasks.filter(t => t.completed).length;
        const progress = this.dataManager.getProjectProgress(projectId);
        const notes = this.dataManager.getNotes().filter(n => 
            n.linkedTo && n.linkedTo.type === 'project' && n.linkedTo.id === projectId
        );

        detailView.innerHTML = `
            <a href="#" class="back-btn" id="backToProjects">← Indietro</a>

            <div class="area-detail">
                <div class="area-detail-header">
                    <div>
                        <div class="area-detail-title">${this.escapeHtml(project.name)}</div>
                        <div class="area-detail-description">${this.escapeHtml(project.description || 'Nessuna descrizione')}</div>
                    </div>
                    <div class="card-actions" style="opacity: 1;">
                        <button class="btn btn-secondary btn-small" id="editProjectDetail">Modifica</button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${tasks.length}</div>
                        <div class="stat-label">Task totali</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${completedTasks}</div>
                        <div class="stat-label">Completati</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${progress}%</div>
                        <div class="stat-label">Progresso</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.getStatusLabel(project.status)}</div>
                        <div class="stat-label">Stato</div>
                    </div>
                </div>

                ${area ? `
                    <div style="margin-bottom: 24px;">
                        <span class="badge badge-primary" style="font-size: 0.875rem; padding: 6px 12px;">
                            Area: ${this.escapeHtml(area.name)}
                        </span>
                    </div>
                ` : ''}

                ${tasks.length > 0 ? `
                    <div class="area-detail-section">
                        <h3>Task</h3>
                        <div class="items-list">
                            ${tasks.map(task => {
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

                                return `
                                    <div class="card ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
                                        <div class="card-header">
                                            <div style="display: flex; align-items: start; gap: 12px; flex: 1;">
                                                <input type="checkbox" class="task-checkbox-detail" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                                                <div style="flex: 1;">
                                                    <div class="card-title">${this.escapeHtml(task.title)}</div>
                                                    ${task.description ? `<div class="card-description">${this.escapeHtml(task.description)}</div>` : ''}
                                                </div>
                                            </div>
                                            <div class="card-actions">
                                                <button class="icon-btn edit-task-detail" data-id="${task.id}">✎</button>
                                            </div>
                                        </div>
                                        <div class="card-meta">
                                            <span class="badge priority-${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                                            ${task.dueDate ? `<span class="${isOverdue ? 'badge badge-danger' : ''}">${task.dueDate}</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : '<div class="empty-state"><div class="empty-state-text">Nessun task in questo progetto</div></div>'}

                ${notes.length > 0 ? `
                    <div class="area-detail-section">
                        <h3>Note</h3>
                        <div class="items-list">
                            ${notes.map(note => `
                                <div class="card note-detail-card" data-id="${note.id}">
                                    <div class="card-header">
                                        <div style="flex: 1;">
                                            <div class="card-title">${this.escapeHtml(note.title)}</div>
                                            <div class="card-description">${this.escapeHtml(note.content.substring(0, 200))}${note.content.length > 200 ? '...' : ''}</div>
                                        </div>
                                        <div class="card-actions">
                                            <button class="icon-btn edit-note-detail" data-id="${note.id}">✎</button>
                                        </div>
                                    </div>
                                    <div class="card-meta">
                                        ${note.tags && note.tags.length > 0 ? note.tags.map(tag => `<span class="badge badge-secondary">#${this.escapeHtml(tag)}</span>`).join('') : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listeners
        document.getElementById('backToProjects').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideProjectDetail();
        });

        document.getElementById('editProjectDetail').addEventListener('click', () => {
            window.app.modalManager.openProjectModal(projectId);
        });

        // Task checkboxes
        document.querySelectorAll('.task-checkbox-detail').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                await this.dataManager.toggleTaskComplete(id);
                this.showProjectDetail(projectId);
                this.renderTasks();
            });
        });

        document.querySelectorAll('.edit-task-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openTaskModal(id);
            });
        });

        // Note clicks
        document.querySelectorAll('.note-detail-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.icon-btn')) return;
                const id = card.dataset.id;
                window.app.modalManager.openNoteModal(id);
            });
        });

        document.querySelectorAll('.edit-note-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openNoteModal(id);
            });
        });
    }

    hideProjectDetail() {
        this.currentProjectDetail = null;
        document.getElementById('projectsList').style.display = 'flex';
        document.querySelector('#projects .section-header').style.display = 'flex';
        document.querySelector('#projects .filters').style.display = 'flex';
        document.getElementById('projectDetailView').style.display = 'none';
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
            container.innerHTML = this.getEmptyState('□', 'Nessun task trovato', 'Crea il tuo primo task');
            return;
        }

        container.innerHTML = tasks.map(task => {
            const project = this.dataManager.getProject(task.projectId);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

            return `
                <div class="card ${task.completed ? 'task-completed' : ''} task-card" data-id="${task.id}">
                    <div class="card-header">
                        <div style="display: flex; align-items: start; gap: 12px; flex: 1;">
                            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                            <div style="flex: 1;">
                                <div class="card-title">${this.escapeHtml(task.title)}</div>
                                ${task.description ? `<div class="card-description">${this.escapeHtml(task.description)}</div>` : ''}
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-task" data-id="${task.id}" title="Modifica">✎</button>
                            <button class="icon-btn delete-task" data-id="${task.id}" title="Elimina">✕</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        ${project ? `<span class="badge badge-primary">${this.escapeHtml(project.name)}</span>` : ''}
                        <span class="badge priority-${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                        ${task.dueDate ? `<span class="${isOverdue ? 'badge badge-danger' : ''}">${task.dueDate}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.attachTaskEventListeners();
    }

    attachTaskEventListeners() {
        // Click sulla card per modificare
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.icon-btn') || e.target.classList.contains('task-checkbox')) return;

                const id = card.dataset.id;
                window.app.modalManager.openTaskModal(id);
            });
        });

        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                await this.dataManager.toggleTaskComplete(id);
                this.renderTasks();
                this.renderProjects();

                // Aggiorna dettagli se aperti
                if (this.currentAreaDetail) {
                    this.showAreaDetail(this.currentAreaDetail);
                }
                if (this.currentProjectDetail) {
                    this.showProjectDetail(this.currentProjectDetail);
                }
            });
        });

        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openTaskModal(id);
            });
        });

        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
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
            container.innerHTML = this.getEmptyState('▫', 'Nessuna nota trovata', 'Crea la tua prima nota');
            return;
        }

        container.innerHTML = notes.map(note => {
            let linkedInfo = '';
            if (note.linkedTo) {
                if (note.linkedTo.type === 'area') {
                    const area = this.dataManager.getArea(note.linkedTo.id);
                    linkedInfo = area ? `<span class="badge badge-primary">${this.escapeHtml(area.name)}</span>` : '';
                } else if (note.linkedTo.type === 'project') {
                    const project = this.dataManager.getProject(note.linkedTo.id);
                    linkedInfo = project ? `<span class="badge badge-primary">${this.escapeHtml(project.name)}</span>` : '';
                }
            }

            return `
                <div class="card note-card" data-id="${note.id}">
                    <div class="card-header">
                        <div style="flex: 1;">
                            <div class="card-title">${this.escapeHtml(note.title)}</div>
                            <div class="card-description">${this.escapeHtml(note.content.substring(0, 200))}${note.content.length > 200 ? '...' : ''}</div>
                        </div>
                        <div class="card-actions">
                            <button class="icon-btn edit-note" data-id="${note.id}" title="Modifica">✎</button>
                            <button class="icon-btn delete-note" data-id="${note.id}" title="Elimina">✕</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        ${linkedInfo}
                        ${note.tags && note.tags.length > 0 ? note.tags.map(tag => `<span class="badge badge-secondary">#${this.escapeHtml(tag)}</span>`).join('') : ''}
                        <span style="color: var(--text-muted); font-size: 0.7rem;">${this.formatDate(note.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.attachNoteEventListeners();
    }

    attachNoteEventListeners() {
        // Click sulla card per modificare
        document.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.icon-btn')) return;

                const id = card.dataset.id;
                window.app.modalManager.openNoteModal(id);
            });
        });

        document.querySelectorAll('.edit-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
                window.app.modalManager.openNoteModal(id);
            });
        });

        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = e.target.closest('.icon-btn').dataset.id;
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
            areas.map(area => `<option value="${area.id}">${this.escapeHtml(area.name)}</option>`).join('');

        // Task project filter
        const taskProjectFilter = document.getElementById('taskProjectFilter');
        const projects = this.dataManager.getProjects();
        taskProjectFilter.innerHTML = '<option value="">Tutti i progetti</option>' +
            projects.map(project => `<option value="${project.id}">${this.escapeHtml(project.name)}</option>`).join('');

        // Note linked filter
        const noteLinkedFilter = document.getElementById('noteLinkedFilter');
        noteLinkedFilter.innerHTML = '<option value="">Tutti i collegamenti</option>' +
            areas.map(area => `<option value="area:${area.id}">${this.escapeHtml(area.name)}</option>`).join('') +
            projects.map(project => `<option value="project:${project.id}">${this.escapeHtml(project.name)}</option>`).join('');
    }

    // Utility functions
    getEmptyState(icon, title, subtitle) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-text">${title}</div>
                <div style="color: var(--text-muted); margin-top: 8px; font-size: 0.875rem;">${subtitle}</div>
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
            planning: 'PLAN',
            active: 'ACTIVE',
            paused: 'PAUSED',
            completed: 'DONE'
        };
        return labels[status] || status.toUpperCase();
    }

    getPriorityLabel(priority) {
        const labels = {
            high: 'HIGH',
            medium: 'MED',
            low: 'LOW'
        };
        return labels[priority] || priority.toUpperCase();
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
