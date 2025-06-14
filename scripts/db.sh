#!/bin/bash

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to start the database
start_db() {
    echo "Starting PostgreSQL database..."
    docker-compose up -d
    echo "Waiting for database to be ready..."
    sleep 5
    echo "Database is ready!"
}

# Function to stop the database
stop_db() {
    echo "Stopping PostgreSQL database..."
    docker-compose down
    echo "Database stopped!"
}

# Function to reset the database
reset_db() {
    echo "Resetting PostgreSQL database..."
    docker-compose down -v
    docker-compose up -d
    echo "Waiting for database to be ready..."
    sleep 5
    echo "Database has been reset!"
}

# Function to show database status
status_db() {
    echo "Checking database status..."
    if docker ps | grep -q stock_pick_game_db; then
        echo "Database is running"
        docker ps | grep stock_pick_game_db
    else
        echo "Database is not running"
    fi
}

# Main script
case "$1" in
    start)
        check_docker
        start_db
        ;;
    stop)
        stop_db
        ;;
    reset)
        check_docker
        reset_db
        ;;
    status)
        status_db
        ;;
    *)
        echo "Usage: $0 {start|stop|reset|status}"
        exit 1
        ;;
esac

exit 0 