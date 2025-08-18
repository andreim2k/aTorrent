#!/bin/bash

# aTorrent Multi-Architecture Build Script
# Builds Docker images for both AMD64 and ARM64 architectures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="atorrent"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
NAMESPACE="${DOCKER_NAMESPACE:-atorrent}"
VERSION="${VERSION:-latest}"

# Check if Docker buildx is available
check_buildx() {
    if ! docker buildx version &> /dev/null; then
        echo -e "${RED}Docker buildx is not available. Please install Docker Desktop or enable buildx.${NC}"
        exit 1
    fi
}

# Create and use buildx builder for multi-platform builds
setup_builder() {
    echo -e "${YELLOW}Setting up Docker buildx builder...${NC}"
    
    # Check if builder already exists
    if ! docker buildx ls | grep -q "${PROJECT_NAME}-builder"; then
        docker buildx create --name "${PROJECT_NAME}-builder" --driver docker-container --use
    else
        docker buildx use "${PROJECT_NAME}-builder"
    fi
    
    docker buildx inspect --bootstrap
}

# Build backend image
build_backend() {
    echo -e "${YELLOW}Building backend image for multiple architectures...${NC}"
    
    cd backend
    
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag "${REGISTRY}/${NAMESPACE}/backend:${VERSION}" \
        --tag "${REGISTRY}/${NAMESPACE}/backend:latest" \
        --file Dockerfile.multiarch \
        --push=${PUSH:-false} \
        .
    
    cd ..
    
    echo -e "${GREEN}Backend image built successfully!${NC}"
}

# Build frontend image
build_frontend() {
    echo -e "${YELLOW}Building frontend image for multiple architectures...${NC}"
    
    cd frontend
    
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag "${REGISTRY}/${NAMESPACE}/frontend:${VERSION}" \
        --tag "${REGISTRY}/${NAMESPACE}/frontend:latest" \
        --file Dockerfile.multiarch \
        --push=${PUSH:-false} \
        .
    
    cd ..
    
    echo -e "${GREEN}Frontend image built successfully!${NC}"
}

# Build all images
build_all() {
    build_backend
    build_frontend
}

# Main script
main() {
    echo -e "${GREEN}aTorrent Multi-Architecture Build Script${NC}"
    echo "========================================="
    
    check_buildx
    setup_builder
    
    case "${1:-all}" in
        backend)
            build_backend
            ;;
        frontend)
            build_frontend
            ;;
        all)
            build_all
            ;;
        *)
            echo -e "${RED}Invalid option. Use: backend, frontend, or all${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}Build complete!${NC}"
    
    if [ "${PUSH}" != "true" ]; then
        echo -e "${YELLOW}Note: Images were built locally. To push to registry, run with PUSH=true${NC}"
    fi
}

# Run main function
main "$@"
