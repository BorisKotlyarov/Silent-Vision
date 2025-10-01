#!/bin/sh
#
# /root/counter.sh - Passive Wi-Fi monitoring script for OpenWrt routers
#
# Copyright (C) 2025 Borys Kotliarov
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.
#
# ADDITIONAL DISCLAIMER: This software involves passive Wi-Fi monitoring.
# See the DISCLAIMER file for important legal and ethical considerations
# before use.
#
# Description: Service script for Silent Vision - passive Wi-Fi monitoring
# system that analyzes probe requests from nearby devices without connection.

INTERFACE="mon0"
SERVER_HOST="192.168.1.115"
SERVER_PORT="3085"
RECONNECT_DELAY=30

echo "Starting visitor monitoring on interface $INTERFACE"
echo "Server: ${SERVER_HOST}:${SERVER_PORT}"
echo "Started at: $(date)"

# Function to check if monitor interface exists
check_interface() {
    if iw dev "$INTERFACE" info > /dev/null 2>&1; then
        echo "Interface $INTERFACE is available"
        return 0
    else
        echo "ERROR: Interface $INTERFACE not found"
        return 1
    fi
}

# Function to check server connectivity
check_server() {
    if ping -c 1 -W 3 "$SERVER_HOST" > /dev/null 2>&1; then
        echo "Server $SERVER_HOST is reachable"
        return 0
    else
        echo "Server $SERVER_HOST is not reachable"
        return 1
    fi
}

# Function to monitor connection and restart if needed
monitor_connection() {
    # Create named pipe for communication
    PIPE="/tmp/tcpdump_pipe"
    rm -f "$PIPE"
    mkfifo "$PIPE"

    echo "Starting tcpdump on interface $INTERFACE..."

    # Start tcpdump in background, writing to pipe
    tcpdump -l -i "$INTERFACE" -e subtype probereq -vv 2>/dev/null > "$PIPE" &
    TCPDUMP_PID=$!

    echo "TCPDUMP started with PID: $TCPDUMP_PID"

    # Connect to server and keep connection alive
    while true; do
        if nc "$SERVER_HOST" "$SERVER_PORT" < "$PIPE"; then
            echo "Connection completed normally"
            break
        else
            echo "Connection failed, restarting..."
            sleep 1
        fi
    done

    # Cleanup
    echo "Cleaning up tcpdump process..."
    kill $TCPDUMP_PID 2>/dev/null
    wait $TCPDUMP_PID 2>/dev/null
    rm -f "$PIPE"
}

# Main reconnection loop
while true; do
    echo "--- $(date) ---"

    # Check if interface exists
    if ! check_interface; then
        echo "Waiting 10 seconds and retrying interface check..."
        sleep 10
        continue
    fi

    # Check server connectivity
    if ! check_server; then
        echo "Waiting $RECONNECT_DELAY seconds for server..."
        sleep $RECONNECT_DELAY
        continue
    fi

    echo "Establishing connection to server..."
    monitor_connection
    echo "Connection lost, reconnecting in $RECONNECT_DELAY seconds..."
    sleep $RECONNECT_DELAY
done