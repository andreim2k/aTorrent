#!/bin/bash

# aTorrent Deployment Script
# Easy deployment for various platforms including ARM devices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="atorrent"
COMPOSE_FILE="docker-compose.production.yml"

# Detect architecture
detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            echo "amd64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l|armhf)
            echo "arm/v7"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        echo "Visit: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose.${NC}"
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo -e "${GREEN}Prerequisites check passed!${NC}"
}

# Setup environment
setup_environment() {
    echo -e "${YELLOW}Setting up environment...${NC}"
    
    # Copy .env.example if .env doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${YELLOW}Created .env file from .env.example${NC}"
            echo -e "${YELLOW}Please edit .env file to configure your settings${NC}"
            read -p "Press Enter to continue after editing .env file..."
        else
            echo -e "${RED}.env.example not found!${NC}"
            exit 1
        fi
    fi
    
    # Create necessary directories
    mkdir -p downloads data logs
    
    echo -e "${GREEN}Environment setup complete!${NC}"
}

# Deploy application
deploy() {
    echo -e "${YELLOW}Deploying aTorrent...${NC}"
    
    # Use docker compose or docker-compose based on availability
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    # Pull or build images
    if [ "$1" == "build" ]; then
        echo -e "${YELLOW}Building images locally...${NC}"
        $COMPOSE_CMD -f $COMPOSE_FILE build
    else
        echo -e "${YELLOW}Pulling images...${NC}"
        $COMPOSE_CMD -f $COMPOSE_FILE pull
    fi
    
    # Start services
    echo -e "${YELLOW}Starting services...${NC}"
    $COMPOSE_CMD -f $COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Check service status
    $COMPOSE_CMD -f $COMPOSE_FILE ps
    
    echo -e "${GREEN}Deployment complete!${NC}"
}

# Stop services
stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    
    if docker compose version &> /dev/null; then
        docker compose -f $COMPOSE_FILE down
    else
        docker-compose -f $COMPOSE_FILE down
    fi
    
    echo -e "${GREEN}Services stopped!${NC}"
}

# Update application
update() {
    echo -e "${YELLOW}Updating aTorrent...${NC}"
    
    # Stop services
    stop_services
    
    # Pull latest changes if in git repository
    if [ -d .git ]; then
        echo -e "${YELLOW}Pulling latest changes from git...${NC}"
        git pull
    fi
    
    # Deploy with new images
    deploy
}

# Show logs
show_logs() {
    if docker compose version &> /dev/null; then
        docker compose -f $COMPOSE_FILE logs -f
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# Main menu
show_menu() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   aTorrent Deployment Script   ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "Architecture: $(detect_arch)"
    echo ""
    echo "1) Deploy aTorrent"
    echo "2) Deploy with local build"
    echo "3) Stop services"
    echo "4) Update aTorrent"
    echo "5) Show logs"
    echo "6) Exit"
    echo ""
    read -p "Select option: " option
    
    case $option in
        1)
            check_prerequisites
            setup_environment
            deploy
            ;;
        2)
            check_prerequisites
            setup_environment
            deploy "build"
            ;;
        3)
            stop_services
            ;;
        4)
            update
            ;;
        5)
            show_logs
            ;;
        6)
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            show_menu
            ;;
    esac
}

# Handle command line arguments
if [ $# -eq 0 ]; then
    show_menu
else
    case "$1" in
        deploy)
            check_prerequisites
            setup_environment
            deploy
            ;;
        build)
            check_prerequisites
            setup_environment
            deploy "build"
            ;;
        stop)
            stop_services
            ;;
        update)
            update
            ;;
        logs)
            show_logs
            ;;
        *)
            echo -e "${RED}Invalid command. Use: deploy, build, stop, update, or logs${NC}"
            exit 1
            ;;
    esac
fi
