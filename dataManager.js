// dataManager.js
export class DataManager {
    constructor() {
        this.data = {
            areas: [],
            projects: [],
            tasks: [],
            notes: []
        };
        this.apiUrl = '/api/data';
    }

    // Genera ID univoco
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Carica dati dal server
    async loadData() {
        try {
            const response = await fetch(this.apiUrl);
            if (response.ok) {
                this.data = await response.json();
                console.log('✅ Dati caricati dal server');
            } else {
                console.error('❌ Errore nel caricamento dei dati');
            }
        } catch (error) {
            console.error('❌ Errore di connessione al server:', error);
        }
    }

    // Salva dati sul server
    async saveData() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.data)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Dati salvati sul server');
                return true;
            } else {
                console.error('❌ Errore nel salvataggio dei dati');
                return false;
            }
        } catch (error) {
            console.error('❌ Errore di connessione al server:', error);
            return false;
        }
    }

    // CRUD Aree
    getAreas() {
        return this.data.areas;
    }

    getArea(id) {
        return this.data.areas.find(a => a.id === id);
    }

    async addArea(area) {
        const newArea = {
            id: this.generateId(),
            ...area,
            createdAt: new Date().toISOString()
        };
        this.data.areas.push(newArea);
        await this.saveData();
        return newArea;
    }

    async updateArea(id, updates) {
        const index = this.data.areas.findIndex(a => a.id === id);
        if (index !== -1) {
            this.data.areas[index] = { ...this.data.areas[index], ...updates };
            await this.saveData();
            return this.data.areas[index];
        }
        return null;
    }

    async deleteArea(id) {
        // Elimina anche progetti collegati
        this.data.projects = this.data.projects.filter(p => p.areaId !== id);
        this.data.areas = this.data.areas.filter(a => a.id !== id);
        await this.saveData();
    }

    // CRUD Progetti
    getProjects(filters = {}) {
        let projects = this.data.projects;

        if (filters.areaId) {
            projects = projects.filter(p => p.areaId === filters.areaId);
        }

        if (filters.status) {
            projects = projects.filter(p => p.status === filters.status);
        }

        return projects;
    }

    getProject(id) {
        return this.data.projects.find(p => p.id === id);
    }

    async addProject(project) {
        const newProject = {
            id: this.generateId(),
            ...project,
            createdAt: new Date().toISOString()
        };
        this.data.projects.push(newProject);
        await this.saveData();
        return newProject;
    }

    async updateProject(id, updates) {
        const index = this.data.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.projects[index] = { ...this.data.projects[index], ...updates };
            await this.saveData();
            return this.data.projects[index];
        }
        return null;
    }

    async deleteProject(id) {
        // Elimina anche task collegati
        this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
        this.data.projects = this.data.projects.filter(p => p.id !== id);
        await this.saveData();
    }

    // CRUD Task
    getTasks(filters = {}) {
        let tasks = this.data.tasks;

        if (filters.projectId) {
            tasks = tasks.filter(t => t.projectId === filters.projectId);
        }

        if (filters.priority) {
            tasks = tasks.filter(t => t.priority === filters.priority);
        }

        if (filters.completed !== undefined) {
            tasks = tasks.filter(t => t.completed === filters.completed);
        }

        return tasks;
    }

    getTask(id) {
        return this.data.tasks.find(t => t.id === id);
    }

    async addTask(task) {
        const newTask = {
            id: this.generateId(),
            completed: false,
            ...task,
            createdAt: new Date().toISOString()
        };
        this.data.tasks.push(newTask);
        await this.saveData();
        return newTask;
    }

    async updateTask(id, updates) {
        const index = this.data.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.data.tasks[index] = { ...this.data.tasks[index], ...updates };
            await this.saveData();
            return this.data.tasks[index];
        }
        return null;
    }

    async deleteTask(id) {
        this.data.tasks = this.data.tasks.filter(t => t.id !== id);
        await this.saveData();
    }

    async toggleTaskComplete(id) {
        const task = this.getTask(id);
        if (task) {
            return await this.updateTask(id, { completed: !task.completed });
        }
        return null;
    }

    // CRUD Note
    getNotes(filters = {}) {
        let notes = this.data.notes;

        if (filters.linkedType && filters.linkedId) {
            notes = notes.filter(n => 
                n.linkedTo && 
                n.linkedTo.type === filters.linkedType && 
                n.linkedTo.id === filters.linkedId
            );
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            notes = notes.filter(n => 
                n.title.toLowerCase().includes(search) || 
                n.content.toLowerCase().includes(search)
            );
        }

        return notes;
    }

    getNote(id) {
        return this.data.notes.find(n => n.id === id);
    }

    async addNote(note) {
        const newNote = {
            id: this.generateId(),
            ...note,
            createdAt: new Date().toISOString()
        };
        this.data.notes.push(newNote);
        await this.saveData();
        return newNote;
    }

    async updateNote(id, updates) {
        const index = this.data.notes.findIndex(n => n.id === id);
        if (index !== -1) {
            this.data.notes[index] = { ...this.data.notes[index], ...updates };
            await this.saveData();
            return this.data.notes[index];
        }
        return null;
    }

    async deleteNote(id) {
        this.data.notes = this.data.notes.filter(n => n.id !== id);
        await this.saveData();
    }

    // Utility per ottenere statistiche
    getProjectProgress(projectId) {
        const tasks = this.getTasks({ projectId });
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.completed).length;
        return Math.round((completed / tasks.length) * 100);
    }
}
