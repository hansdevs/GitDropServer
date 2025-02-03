"""
server.py - Minimal Flask server running on the Raspberry Pi.
Installation neeeeds:
1) pip install flask
2) python server.py
"""
from flask import Flask, request, jsonify
import os, time, shutil
from datetime import datetime
import threading
import subprocess
app = Flask(__name__)
# Where to store incoming uploads -- create
UPLOAD_FOLDER = 'incoming_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
@app.route('/upload', methods=['POST'])
def handle_upload():
    # 1) Extract form fields
    repo_name = request.form.get('repoName')
    schedule_str = request.form.get('scheduleTime')
    if not repo_name or not schedule_str:
        return jsonify({'error': 'Missing repoName or scheduleTime'}), 400
    # 2) Convert scheduleTime from HTML datetime-local, e.g. "2025-01-29T15:30"
    try:
        schedule_dt = datetime.fromisoformat(schedule_str)
    except ValueError:
        return jsonify({'error': 'Invalid scheduleTime format'}), 400
    # 3) Create a unique subfolder for this upload
    timestamp = int(time.time())
    upload_id = f"{repo_name}_{timestamp}"
    folder_path = os.path.join(UPLOAD_FOLDER, upload_id)
    os.makedirs(folder_path, exist_ok=True)
    # 4) Save the README file
    readme_file = request.files.get('readmeFile')
    if not readme_file:
        return jsonify({'error': 'No README file provided'}), 400
    readme_path = os.path.join(folder_path, readme_file.filename)
    readme_file.save(readme_path)
    # 5) Save the main files
    main_files = request.files.getlist('mainFiles[]')  # multiple files
    for f in main_files:
        dest_path = os.path.join(folder_path, f.filename)
        f.save(dest_path)
    # Optionally, write instructions to a small text file
    instructions_path = os.path.join(folder_path, 'instructions.txt')
    with open(instructions_path, 'w') as f:
        f.write(f"repoName={repo_name}\n")
        f.write(f"schedule={schedule_dt.isoformat()}\n")
        f.write(f"folder={folder_path}\n")
    # 6) Schedule the action with a simple thread
    def scheduled_action():
        delay = (schedule_dt - datetime.now()).total_seconds()
        if delay > 0:
            time.sleep(delay)
        # At the scheduled time, trigger Windows
        trigger_windows_server(folder_path, repo_name)
    threading.Thread(target=scheduled_action, daemon=True).start()
    return jsonify({
        'success': True,
        'message': 'Files received and upload scheduled.',
        'upload_id': upload_id
    })
def trigger_windows_server(folder_path, repo_name):
    """
    This function is called at the scheduled time to tell Windows:
       "Hey, push these files to GitHub."
    Implementation depends on your Windows environment.
    Ideas:
      1) SSH into Windows (using paramiko or subprocess to run plink).
      2) Send an HTTP POST to a server on Windows.
      3) Copy files to a shared folder, then run a remote PowerShell script.
    """
    print(f"[Pi] Time to push {repo_name} from {folder_path} to GitHub via Windows server...")
    # Example (SSH using 'ssh' command) - you'll need to set up key-based auth:
    # subprocess.run(["ssh", "windowsUser@192.168.1.200", 
    #                "powershell.exe", 
    #                "C:\\scripts\\doGitPush.ps1", folder_path, repo_name])
    # For now, just print
    print("[Pi] Triggering Windows (example) complete.")
if __name__ == '__main__':
    # Run Flask on all interfaces, port 8080
    app.run(host='0.0.0.0', port=8080, debug=False)
'''
Later on run this server on the Raspberry Pi.

# 1) Install Flask
pip install flask

# 2) Start the server
python server.py

# Pi will listen on port 8080
# From mac Mac, you can access http://<Pi-IP>:8080/upload
'''
#missing function -- add later
