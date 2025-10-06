#!/usr/bin/env python3
"""
@Torrent Setup Script
Created by Andrei (@andreim2k)
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
import secrets

class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_status(message):
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {message}")

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {message}")

def print_warning(message):
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {message}")

def print_error(message):
    print(f"{Colors.RED}[ERROR]{Colors.NC} {message}")

def run_command(cmd, cwd=None, check=True):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {cmd}")
        print_error(f"Error: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_python():
    """Check if Python 3.10+ is installed."""
    try:
        result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
        version = result.stdout.strip().split()[1]
        version_parts = [int(x) for x in version.split('.')]
        
        if version_parts[0] >= 3 and version_parts[1] >= 10:
            print_success(f"Python {version} is installed")
            return True
        else:
            print_warning(f"Python version is {version}. Recommended version is 3.10.0 or higher.")
            return False
    except Exception as e:
        print_error(f"Failed to check Python version: {e}")
        return False

def check_nodejs():
    """Check if Node.js 18+ is installed."""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            print_warning("Node.js is not installed. You'll need it for local frontend development.")
            return False
            
        version = result.stdout.strip().lstrip('v')
        version_parts = [int(x) for x in version.split('.')]
        
        if version_parts[0] >= 18:
            print_success(f"Node.js v{version} is installed")
            return True
        else:
            print_warning(f"Node.js version is {version}. Recommended version is 18.0.0 or higher.")
            return False
    except Exception:
        print_warning("Node.js is not installed. You'll need it for local frontend development.")
        return False

def create_directories():
    """Create necessary directories."""
    print_status("Creating necessary directories...")
    
    directories = ["downloads", "backend/data", "logs"]
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    
    print_success("Directories created")

def setup_backend():
    """Setup the backend environment."""
    print_status("Setting up backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print_error("Backend directory not found!")
        sys.exit(1)
    
    os.chdir(backend_dir)
    
    try:
        # Copy environment file
        if not Path(".env").exists():
            if Path(".env.example").exists():
                shutil.copy(".env.example", ".env")
                print_success("Created .env file from .env.example")
            else:
                print_warning(".env.example not found, skipping .env creation")
        
        # Setup Python virtual environment
        if check_python():
            venv_path = Path("venv")
            
            # Remove existing broken venv if it exists
            if venv_path.exists():
                activate_script = venv_path / "bin" / "activate"
                if not activate_script.exists():
                    print_status("Removing broken virtual environment...")
                    shutil.rmtree(venv_path)
            
            # Create virtual environment
            if not venv_path.exists():
                print_status("Creating Python virtual environment...")
                result = run_command(f"{sys.executable} -m venv venv")
                if result.returncode == 0:
                    print_success("Created Python virtual environment")
                else:
                    print_error("Failed to create virtual environment")
                    return False
            
            # Verify virtual environment
            activate_script = venv_path / "bin" / "activate"
            if not activate_script.exists():
                print_error("Virtual environment activation script not found")
                return False
            
            # Install dependencies
            print_status("Installing Python dependencies...")
            
            # Get the python executable from the venv
            venv_python = venv_path / "bin" / "python"
            venv_pip = venv_path / "bin" / "pip"
            
            # Upgrade pip
            run_command(f"{venv_pip} install --upgrade pip")
            
            # Install requirements
            if Path("requirements.txt").exists():
                result = run_command(f"{venv_pip} install -r requirements.txt")
                if result.returncode == 0:
                    print_success("Python dependencies installed")
                else:
                    print_error("Failed to install Python dependencies")
                    return False
            else:
                print_warning("requirements.txt not found, skipping dependency installation")
        
    finally:
        os.chdir("..")
    
    return True

def setup_frontend():
    """Setup the frontend environment."""
    print_status("Setting up frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print_warning("Frontend directory not found, skipping frontend setup")
        return
    
    os.chdir(frontend_dir)
    
    try:
        if check_nodejs():
            print_status("Installing Node.js dependencies...")
            result = run_command("npm install")
            if result.returncode == 0:
                print_success("Node.js dependencies installed")
            else:
                print_error("Failed to install Node.js dependencies")
    finally:
        os.chdir("..")

def generate_secret_key():
    """Generate a secret key for the application."""
    print_status("Generating secret key...")
    
    env_file = Path("backend/.env")
    if env_file.exists():
        # Read the current .env file
        content = env_file.read_text()
        
        # Generate a new secret key
        secret_key = secrets.token_hex(32)
        
        # Replace the secret key if it exists
        if "SECRET_KEY=your-secret-key" in content:
            content = content.replace("SECRET_KEY=your-secret-key", f"SECRET_KEY={secret_key}")
            env_file.write_text(content)
            print_success("Updated secret key in backend/.env")
        elif "SECRET_KEY=" in content:
            print_warning("Secret key already exists in .env file")
        else:
            # Append the secret key
            with open(env_file, "a") as f:
                f.write(f"\nSECRET_KEY={secret_key}\n")
            print_success("Added secret key to backend/.env")

def setup_git():
    """Setup Git repository."""
    print_status("Setting up Git repository...")
    
    if not Path(".git").exists():
        result = run_command("git init", check=False)
        if result.returncode == 0:
            print_success("Initialized Git repository")
    
    # Create .gitignore if it doesn't exist
    if not Path(".gitignore").exists():
        gitignore_content = """# Environment files
.env
*.env.local

# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Build outputs
.next/
dist/
build/

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Downloads
downloads/
"""
        Path(".gitignore").write_text(gitignore_content)
        print_success("Created .gitignore file")

def main():
    """Main setup function."""
    print("🚀 Setting up @Torrent")
    print("=====================")
    print()
    
    print_status("Starting @Torrent setup...")
    print()
    
    # Ensure we're in the right directory
    if not Path("backend").exists():
        print_error("Backend directory not found. Please run this script from the project root.")
        sys.exit(1)
    
    try:
        create_directories()
        setup_backend()
        setup_frontend()
        generate_secret_key()
        setup_git()
        
        print()
        print_success("🎉 @Torrent setup completed successfully!")
        print()
        print("Next steps:")
        print()
        print("Use the app manager:")
        print("   ./app.sh start all     # Start both services")
        print("   ./app.sh stop all      # Stop both services")
        print("   ./app.sh status        # Check service status")
        print("   ./app.sh logs all      # View logs")
        print()
        print("Or run manually:")
        print("   - Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        print("   - Frontend: cd frontend && npm run dev")
        print()
        print("Access the application:")
        print("- Frontend: http://localhost:3000")
        print("- Backend API: http://localhost:8000")
        print("- API Documentation: http://localhost:8000/api/v1/docs")
        print()
        print("Default login credentials:")
        print("- Email: admin@aTorrent.local")
        print("- Password: admin123")
        print()
        print("📖 For more information, check the README.md file")
        print()
        
    except KeyboardInterrupt:
        print()
        print_warning("Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print()
        print_error(f"Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
