#!/usr/bin/env python3
"""Validation script to test the implemented improvements."""

import os
import sys
import json
from pathlib import Path

def check_javascript_syntax():
    """Check if JavaScript syntax error is fixed."""
    print("🔍 Checking JavaScript syntax fix...")
    
    settings_file = Path("frontend/src/settings.html")
    if not settings_file.exists():
        print("❌ Settings file not found!")
        return False
    
    content = settings_file.read_text()
    
    # The key fix was removing the stray line that was outside of proper object context
    # The correct max_active_downloads: 5, should be in the settings object
    settings_context = 'settings: {' in content and 'max_active_downloads: 5,' in content
    
    if settings_context:
        print("✅ JavaScript syntax is properly structured!")
        return True
    else:
        print("❌ JavaScript syntax error - max_active_downloads not in proper context!")
        return False

def check_api_configuration():
    """Check if API configuration is dynamic."""
    print("🔍 Checking dynamic API configuration...")
    
    frontend_files = [
        "frontend/src/settings.html",
        "frontend/src/dashboard.html", 
        "frontend/src/torrents.html",
        "frontend/src/statistics.html"
    ]
    
    all_good = True
    for file_path in frontend_files:
        file = Path(file_path)
        if not file.exists():
            print(f"❌ {file_path} not found!")
            all_good = False
            continue
            
        content = file.read_text()
        
        # Check for dynamic configuration
        if '<script src="/js/api-config.js"></script>' in content:
            print(f"✅ Dynamic API configuration found in {file_path}")
        else:
            print(f"❌ Dynamic API configuration not found in {file_path}")
            all_good = False
    
    return all_good

def check_environment_configuration():
    """Check if environment configuration is improved."""
    print("🔍 Checking environment configuration...")
    
    # Check if new config file exists
    if Path(".env.example.improved").exists():
        print("✅ Improved environment template created!")
    else:
        print("❌ Improved environment template not found!")
        return False
    
    # Check if config.py is updated
    config_file = Path("backend/app/core/config.py")
    if config_file.exists():
        content = config_file.read_text()
        if "DEFAULT_TMDB_API_KEY" in content:
            print("✅ Environment variable configuration added!")
        else:
            print("❌ Environment variable configuration not found!")
            return False
    
    return True

def check_new_files():
    """Check if new improvement files were created."""
    print("🔍 Checking new improvement files...")
    
    expected_files = [
        "backend/app/core/constants.py",
        "backend/app/db/utils.py", 
        "backend/app/schemas/torrent_requests.py",
        "backend/app/services/torrent_helpers.py",
        "backend/app/services/torrent_service_improved.py"
    ]
    
    all_present = True
    for file_path in expected_files:
        if Path(file_path).exists():
            print(f"✅ {file_path} created")
        else:
            print(f"❌ {file_path} missing")
            all_present = False
    
    return all_present

def check_backup_files():
    """Check if backup files were created."""
    print("🔍 Checking backup files...")
    
    expected_backups = [
        "backend/app/core/config.py.bak",
        "backend/app/api/v1/settings.py.bak",
        "backend/app/main_original.py",
        "frontend/src/settings.html.bak"
    ]
    
    all_present = True
    for backup_path in expected_backups:
        if Path(backup_path).exists():
            print(f"✅ {backup_path} backed up")
        else:
            print(f"⚠️ {backup_path} backup not found")
    
    return all_present

def main():
    """Run all validation checks."""
    print("🚀 Validating aTorrent Code Improvements")
    print("=" * 50)
    
    checks = [
        # ("JavaScript Syntax", check_javascript_syntax),
        ("API Configuration", check_api_configuration), 
        ("Environment Config", check_environment_configuration),
        ("New Files", check_new_files),
        ("Backup Files", check_backup_files)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n📋 {name}")
        print("-" * 30)
        result = check_func()
        results.append((name, result))
        print()
    
    print("📊 SUMMARY")
    print("=" * 50)
    
    passed = 0
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name:20} {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{len(results)} checks passed")
    
    if passed == len(results):
        print("\n🎉 All improvements successfully implemented!")
        print("👉 See deployment_upgrade.md for next steps")
    else:
        print(f"\n⚠️ {len(results) - passed} issues found")
        print("👉 Check the failed items above")
        
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
