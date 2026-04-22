// modalManager.js
export class ModalManager {
    constructor(dataManager, uiManager) {
        this.dataManager = dataManager;
        this.uiManager = uiManager;
        this.modal = document.getElementById('modal');
        this.modalBody = document.getElementById('modalBody');
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.modalBody.innerHTML = '';
    }

    // Modal Area
    openAreaModal(areaId = null) {
        const area = areaId ? this.dataManager.getArea(areaId) : null;
        const isEdit = !!area;

        const colors = ['#4a90e2', '#7b68ee', '#52c41a', '#faad14', '#f5222d', '#eb2f96', '#722ed1', '#13c2c2'];
        const icons = ['💼', '🏠', '💪', '🎓', '💰', '❤️', '🎨', '🌱', '🚀', '⚡'];

        this.modalBody.innerHTML = `
            <h2>${isEdit ? 'Modifica Area' : 'Nuova Area'}</h2>
            <form id="areaForm">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="areaName" value="${area ? area.name : ''}" required>
                </div>

                <div class="form-group">
                    <label>Descrizione</label>
                    <textarea id="areaDescription">${area ? area.description : ''}</textarea>
                </div>

                <div class="form-group">
                    <label>Icona</label>
                    <div class="color-picker">
                        ${icons.map(icon => `
                            <div class="color-option ${area && area.icon === icon ? 'selected' : ''}" 
                                 data-icon="${icon}" 
                                 style="background: linear-gradient(135deg, #f5f7fa, #c3cfe2); font-size: 1.5rem; display: flex; align-items: center; justify-content: center;">
                                ${icon}
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="areaIcon" value="${area ? area.icon : icons[0]}">
                </div>

                <div class="form-group">
                    <label>Colore</label>
                    <div class="color-picker">
                        ${colors.map(color => `
                            <div class="color-option ${area && area.color === color ? 'selected' : ''}" 
                                 data-color="${color}" 
                                 style="background-color: ${color};">
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="areaColor" value="${area ? area.color : colors[0]}">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelBtn">Annulla</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Salva' : 'Crea'}</button>
                </div>
            </form>
        `;

        this.setupColorPicker();
        this.setupIconPicker();

        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('areaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveArea(areaId);
        });

        this.openModal();
    }

    async saveArea(areaId) {
        const data = {
            name: document.getElementById('areaName').value,
            description: document.getElementById('areaDescription').value,
            icon: document.getElementById('areaIcon').value,
            color: document.getElementById('areaColor').value
        };

        if (areaId) {
            await this.dataManager.updateArea(areaId, data);
        } else {
            await this.dataManager.addArea(data);
        }

        this.closeModal();
        this.uiManager.renderAll();
    }

    // Modal Progetto
    openProjectModal(projectId = null) {
        const project = projectId ? this.dataManager.getProject(projectId) : null;
        const isEdit = !!project;
        const areas = this.dataManager.getAreas();

        this.modalBody.innerHTML = `
            <h2>${isEdit ? 'Modifica Progetto' : 'Nuovo Progetto'}</h2>
            <form id="projectForm">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" id="projectName" value="${project ? project.name : ''}" required>
                </div>

                <div class="form-group">
                    <label>Descrizione</label>
                    <textarea id="projectDescription">${project ? project.description : ''}</textarea>
                </div>

                <div class="form-group">
                    <label>Area *</label>
                    <select id="projectArea" required>
                        <option value="">Seleziona un'area</option>
                        ${areas.map(area => `
                            <option value="${area.id}" ${project && project.areaId === area.id ? 'selected' : ''}>
                                ${area.icon} ${area.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Stato</label>
                    <select id="projectStatus">
                        <option value="planning" ${project && project.status === 'planning' ? 'selected' : ''}>Pianificazione</option>
                        <option value="active" ${project && project.status === 'active' ? 'selected' : ''}>Attivo</option>
                        <option value="paused" ${project && project.status === 'paused' ? 'selected' : ''}>In pausa</option>
                        <option value="completed" ${project && project.status === 'completed' ? 'selected' : ''}>Completato</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Data Inizio</label>
                    <input type="date" id="projectStartDate" value="${project && project.startDate ? project.startDate : ''}">
                </div>

                <div class="form-group">
                    <label>Data Fine</label>
                    <input type="date" id="projectEndDate" value="${project && project.endDate ? project.endDate : ''}">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelBtn">Annulla</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Salva' : 'Crea'}</button>
                </div>
            </form>
        `;

        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('projectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveProject(projectId);
        });

        this.openModal();
    }

    async saveProject(projectId) {
        const data = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            areaId: document.getElementById('projectArea').value,
            status: document.getElementById('projectStatus').value,
            startDate: document.getElementById('projectStartDate').value || null,
            endDate: document.getElementById('projectEndDate').value || null
        };

        if (projectId) {
            await this.dataManager.updateProject(projectId, data);
        } else {
            await this.dataManager.addProject(data);
        }

        this.closeModal();
        this.uiManager.renderAll();
    }

    // Modal Task
    openTaskModal(taskId = null) {
        const task = taskId ? this.dataManager.getTask(taskId) : null;
        const isEdit = !!task;
        const projects = this.dataManager.getProjects();

        this.modalBody.innerHTML = `
            <h2>${isEdit ? 'Modifica Task' : 'Nuovo Task'}</h2>
            <form id="taskForm">
                <div class="form-group">
                    <label>Titolo *</label>
                    <input type="text" id="taskTitle" value="${task ? task.title : ''}" required>
                </div>

                <div class="form-group">
                    <label>Descrizione</label>
                    <textarea id="taskDescription">${task ? task.description : ''}</textarea>
                </div>

                <div class="form-group">
                    <label>Progetto *</label>
                    <select id="taskProject" required>
                        <option value="">Seleziona un progetto</option>
                        ${projects.map(project => `
                            <option value="${project.id}" ${task && task.projectId === project.id ? 'selected' : ''}>
                                ${project.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Priorità</label>
                    <select id="taskPriority">
                        <option value="low" ${task && task.priority === 'low' ? 'selected' : ''}>🟢 Bassa</option>
                        <option value="medium" ${task && task.priority === 'medium' ? 'selected' : ''}>🟡 Media</option>
                        <option value="high" ${task && task.priority === 'high' ? 'selected' : ''}>🔴 Alta</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Data Scadenza</label>
                    <input type="date" id="taskDueDate" value="${task && task.dueDate ? task.dueDate : ''}">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelBtn">Annulla</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Salva' : 'Crea'}</button>
                </div>
            </form>
        `;

        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTask(taskId);
        });

        this.openModal();
    }

    async saveTask(taskId) {
        const data = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            projectId: document.getElementById('taskProject').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value || null
        };

        if (taskId) {
            await this.dataManager.updateTask(taskId, data);
        } else {
            await this.dataManager.addTask(data);
        }

        this.closeModal();
        this.uiManager.renderAll();
    }

    // Modal Nota
    openNoteModal(noteId = null) {
        const note = noteId ? this.dataManager.getNote(noteId) : null;
        const isEdit = !!note;
        const areas = this.dataManager.getAreas();
        const projects = this.dataManager.getProjects();

        this.modalBody.innerHTML = `
            <h2>${isEdit ? 'Modifica Nota' : 'Nuova Nota'}</h2>
            <form id="noteForm">
                <div class="form-group">
                    <label>Titolo *</label>
                    <input type="text" id="noteTitle" value="${note ? note.title : ''}" required>
                </div>

                <div class="form-group">
                    <label>Contenuto *</label>
                    <textarea id="noteContent" style="min-height: 200px;" required>${note ? note.content : ''}</textarea>
                </div>

                <div class="form-group">
                    <label>Collega a</label>
                    <select id="noteLinkedTo">
                        <option value="">Nessun collegamento</option>
                        <optgroup label="Aree">
                            ${areas.map(area => `
                                <option value="area:${area.id}" ${note && note.linkedTo && note.linkedTo.type === 'area' && note.linkedTo.id === area.id ? 'selected' : ''}>
                                    ${area.icon} ${area.name}
                                </option>
                            `).join('')}
                        </optgroup>
                        <optgroup label="Progetti">
                            ${projects.map(project => `
                                <option value="project:${project.id}" ${note && note.linkedTo && note.linkedTo.type === 'project' && note.linkedTo.id === project.id ? 'selected' : ''}>
                                    ${project.name}
                                </option>
                            `).join('')}
                        </optgroup>
                    </select>
                </div>

                <div class="form-group">
                    <label>Tag (separati da virgola)</label>
                    <input type="text" id="noteTags" value="${note && note.tags ? note.tags.join(', ') : ''}" placeholder="es: idee, importante, revisione">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelBtn">Annulla</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Salva' : 'Crea'}</button>
                </div>
            </form>
        `;

        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('noteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveNote(noteId);
        });

        this.openModal();
    }

    async saveNote(noteId) {
        const linkedValue = document.getElementById('noteLinkedTo').value;
        let linkedTo = null;

        if (linkedValue) {
            const [type, id] = linkedValue.split(':');
            linkedTo = { type, id };
        }

        const tagsValue = document.getElementById('noteTags').value;
        const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];

        const data = {
            title: document.getElementById('noteTitle').value,
            content: document.getElementById('noteContent').value,
            linkedTo: linkedTo,
            tags: tags
        };

        if (noteId) {
            await this.dataManager.updateNote(noteId, data);
        } else {
            await this.dataManager.addNote(data);
        }

        this.closeModal();
        this.uiManager.renderAll();
    }

    // Utility per color picker
    setupColorPicker() {
        document.querySelectorAll('[data-color]').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('[data-color]').forEach(o => o.classList.remove('selected'));
                e.target.classList.add('selected');
                document.getElementById('areaColor').value = e.target.dataset.color;
            });
        });
    }

    // Utility per icon picker
    setupIconPicker() {
        document.querySelectorAll('[data-icon]').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('[data-icon]').forEach(o => o.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                document.getElementById('areaIcon').value = e.currentTarget.dataset.icon;
            });
        });
    }
}

// Rendi l'app accessibile globalmente per gli event listeners
window.app = null;
