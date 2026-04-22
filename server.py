#!/usr/bin/env python3
# server.py
import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = 3000
DATA_FILE = 'life_manager_data.json'

class LifeManagerHandler(http.server.SimpleHTTPRequestHandler):

    def end_headers(self):
        # Abilita CORS e cache control
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        """Gestisce le richieste OPTIONS per CORS"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """Gestisce le richieste GET"""
        parsed_path = urlparse(self.path)

        # API endpoint per ottenere i dati
        if parsed_path.path == '/api/data':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            data = self.load_data()
            self.wfile.write(json.dumps(data).encode())
        else:
            # Serve file statici
            super().do_GET()

    def do_POST(self):
        """Gestisce le richieste POST per salvare i dati"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/api/data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))
                self.save_data(data)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Dati salvati con successo'}).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def load_data(self):
        """Carica i dati dal file JSON"""
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Errore nel caricamento dei dati: {e}")
                return self.get_initial_data()
        else:
            # Crea file con dati iniziali
            initial_data = self.get_initial_data()
            self.save_data(initial_data)
            return initial_data

    def save_data(self, data):
        """Salva i dati nel file JSON"""
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ Dati salvati in {DATA_FILE} alle {datetime.now().strftime('%H:%M:%S')}")
        except Exception as e:
            print(f"❌ Errore nel salvataggio dei dati: {e}")
            raise

    def get_initial_data(self):
        """Restituisce i dati iniziali di esempio"""
        now = datetime.now().isoformat()

        area_id = self.generate_id()
        project_id = self.generate_id()

        return {
            'areas': [{
                'id': area_id,
                'name': 'Lavoro',
                'description': 'Progetti e attività professionali',
                'color': '#4a90e2',
                'icon': '💼',
                'createdAt': now
            }],
            'projects': [{
                'id': project_id,
                'name': 'Life Manager App',
                'description': 'Sviluppo applicazione per gestione vita personale',
                'areaId': area_id,
                'status': 'active',
                'startDate': datetime.now().strftime('%Y-%m-%d'),
                'endDate': None,
                'createdAt': now
            }],
            'tasks': [{
                'id': self.generate_id(),
                'title': 'Creare interfaccia utente',
                'description': 'Sviluppare l\'interfaccia web responsive',
                'projectId': project_id,
                'priority': 'high',
                'completed': False,
                'dueDate': datetime.now().strftime('%Y-%m-%d'),
                'createdAt': now
            }],
            'notes': [{
                'id': self.generate_id(),
                'title': 'Idee per funzionalità',
                'content': 'Aggiungere sistema di notifiche e promemoria',
                'linkedTo': {'type': 'project', 'id': project_id},
                'tags': ['idee', 'sviluppo'],
                'createdAt': now
            }]
        }

    def generate_id(self):
        """Genera un ID univoco"""
        import time
        import random
        timestamp = int(time.time() * 1000)
        random_part = random.randint(1000, 9999)
        return f"{timestamp}{random_part}"

    def log_message(self, format, *args):
        """Override per log più puliti"""
        if self.path.startswith('/api/'):
            print(f"🔵 API {self.command} {self.path}")
        else:
            print(f"📄 {self.command} {self.path}")

def run_server():
    """Avvia il server"""
    Handler = LifeManagerHandler

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("🚀 Life Manager Server in esecuzione!")
        print("=" * 60)
        print(f"🌐 URL: http://localhost:{PORT}")
        print(f"💾 File dati: {os.path.abspath(DATA_FILE)}")
        print(f"📁 Directory: {os.getcwd()}")
        print("=" * 60)
        print("Premi Ctrl+C per fermare il server\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server arrestato. Arrivederci!")

if __name__ == "__main__":
    run_server()
