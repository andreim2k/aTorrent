#!/bin/bash
# Database migration helper script

set -e

cd "$(dirname "$0")"

# Activate virtual environment
if [ -f venv/bin/activate ]; then
    source venv/bin/activate
fi

# Set development mode for migrations
export DEVELOPMENT_MODE=true

case "$1" in
    init)
        echo "Initializing Alembic..."
        alembic init alembic
        ;;
    create)
        if [ -z "$2" ]; then
            echo "Usage: $0 create <migration_message>"
            exit 1
        fi
        echo "Creating new migration: $2"
        alembic revision --autogenerate -m "$2"
        ;;
    upgrade)
        echo "Upgrading database to latest version..."
        alembic upgrade head
        ;;
    downgrade)
        echo "Downgrading database one version..."
        alembic downgrade -1
        ;;
    history)
        echo "Migration history:"
        alembic history
        ;;
    current)
        echo "Current database version:"
        alembic current
        ;;
    *)
        echo "Database Migration Tool"
        echo "======================="
        echo ""
        echo "Usage: $0 {init|create|upgrade|downgrade|history|current}"
        echo ""
        echo "Commands:"
        echo "  init                 Initialize Alembic (first time only)"
        echo "  create <message>     Create new migration"
        echo "  upgrade              Upgrade to latest version"
        echo "  downgrade            Downgrade one version"
        echo "  history              Show migration history"
        echo "  current              Show current version"
        echo ""
        echo "Examples:"
        echo "  $0 create 'Add user table'"
        echo "  $0 upgrade"
        exit 1
        ;;
esac


