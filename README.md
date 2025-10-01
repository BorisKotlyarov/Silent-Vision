# Silent Vision.

## License

This project is licensed under the **[GNU General Public License v3.0.](https://www.google.com/search?q=LICENCE)**

## Disclaimer

Please see the **[DISCLAIMER](https://www.google.com/search?q=DISCLAIMER.md)** file for important legal and technical warnings.

## Description

Project goals:

- Researching Wi-Fi "Pollution" around the router.
- Exploring the capabilities of a standard consumer router.
- Broadening understanding of safe Wi-Fi usage.
- Providing insight into how Wi-Fi devices interact at a basic level.

This is a system for the **automatic counting and analysis of visitors using Wi-Fi technology**. It operates passively, not requiring people to connect to the network. It helps to understand visitor behavior, their number, and movements.

What exactly the system does
**Main task:** Counts the number of **unique devices** (smartphones, laptops, other Wi-Fi enabled devices) within your router's Wi-Fi coverage area, even if these devices do not connect to your network.

**Attention\!\!\!** Modern devices have protection mechanisms against this type of data collection — these mechanisms work quite simply: the device changes its MAC address to a randomly generated one at a certain period and continues to do so indefinitely. Thus, a huge number of random MAC addresses will appear in your database, even though it will actually be a single device. This is guaranteed to distort the statistics, which makes this system **useless for commercial purposes** (besides, there are more advanced and reliable ways to monitor traffic in public places). However, this system is suitable for **education, research, or satisfying curiosity**. Also, with the help of this system, you can approximately understand how "polluted" the radio air is around you — with minimal changes to the server, you can see the most used radio frequencies, which may also provide insight into how best to configure your router. Furthermore, if you use your imagination, you can find many ways to utilize the principles of this system's operation.

Good luck with your research\!

### How it works:

- The router "**eavesdrops**" on Wi-Fi signals around it
- Every device with Wi-Fi enabled constantly searches for networks by sending special requests (Probe Requests)
- The system intercepts these requests and extracts anonymous device identifiers from them
- All data is sent to a server for analysis and storage

---

## Router Requirements

- [x] **OpenWrt OS** installed and configured.
  - [x] **SSH access** to OpenWrt enabled and configured.
  - [x] **Wi-Fi** configured.
- [x] Support for **Monitor Mode**.
- [x] **1 MB** of free space.

---

## 1\. Preliminary Router Setup

### Checking for Monitor Mode Support

Before starting, make sure your router supports monitor mode:

```bash
# Check supported interface modes
for phy in $(ls /sys/class/ieee80211/); do
    echo "=== $phy ==="
    iw phy $phy info | grep -A 10 "Supported interface modes"
done
```

**Expected Result:**

```
Supported interface modes:
         * IBSS
         * managed
         * AP
         * AP/VLAN
         * monitor  <-- this line should be present
         * mesh point
```

### Installing Necessary Packages

```bash
# Update packages and install required software
opkg update
opkg install tcpdump
opkg install netcat
opkg install iw
opkg install kmod-mac80211
```

### Checking Current Interfaces

```bash
# View available interfaces
iw dev
ifconfig | grep -E "(wlan|mon)"
```

---

## 2\. Router Script + Configuration + Service

### Main Monitoring Script

1. Open the file `for_openwrt_wifi_router_files/root/counter.sh`

2. Edit it to fit your setup

```bash
#!/bin/sh
INTERFACE="mon0"             # REPLACE with the name of your monitoring interface
SERVER_HOST="192.168.1.224"  # REPLACE with the IP or hostname of your server
SERVER_PORT="3085"           # REPLACE with the PORT of your server
RECONNECT_DELAY=30           # Specify the pause (in seconds) - the time between reconnection attempts (in case the server is unavailable)
```

3. Connect to your router via ssh
4. Copy the content of the file `for_openwrt_wifi_router_files/root/counter.sh` (from the repository) to the `/root` folder on your router (it should result in `/root/counter.sh`)
5. Make the script executable: `chmod +x /root/counter.sh`

### Creating an Autostart Service

Connect to your router via ssh and copy the content of the file `for_openwrt_wifi_router_files/etc/init.d/visitor_tracker` (from the repository) to the `/etc/init.d` folder on your router (it should result in `/etc/init.d/visitor_tracker`)

Activate the service:

```bash
chmod +x /etc/init.d/visitor_tracker
/etc/init.d/visitor_tracker enable
/etc/init.d/visitor_tracker start
```

### Service Management

```bash
# Start
/etc/init.d/visitor_tracker start

# Stop
/etc/init.d/visitor_tracker stop

# Restart
/etc/init.d/visitor_tracker restart

# Status
/etc/init.d/visitor_tracker status
```

---

## 3\. Server Installation

### Requirements

- Node.js v14+
- npm

### Installing Dependencies

Execute the following command and wait for the result

```bash
npm i
```

### Starting the Server

```bash
npm start
```

### Server Configuration

Open the `config.js` file and modify it according to your preferences:

```javascript
const CONFIG = {
  TCP_PORT: 3085, // Port for TCP connection with the router
  HTTP_PORT: 3086, // Port for HTTP API
  DB_PATH: "./visitors.db", // Path to the database
  MAX_RAW_LOGS: 1000, // Maximum number of raw records
  CLEAN_DB: false, // Clear database on startup (true/false)
};
```

---

## 4\. Server API Function Descriptions

The server provides an **HTTP API** on port **3086**.

Available routes:

```text
  GET /stats - Visitor statistics
  GET /access_points - Access points list
  GET /ssid/:ssid/clients - Clients that searched for specific SSID
  GET /client/:mac/ssids - SSIDs searched by specific client
  GET /ssid_stats - SSID statistics
  GET /raw_logs - Raw logs with extracted data (max 1000 records)
  GET /dashboard - Combined dashboard
  GET /search/:term - Search by MAC or SSID
  POST /clean_database - Clean all data (requires confirmation)
```

### Visitor Statistics

**Endpoint:** `GET /stats`

**Parameters:**

- `days` - period in days (default: 1)
- `limit` - limit the number of records (default: 100)
- `offset` - the number of records to skip (default: 0)

**Example:**

```bash
curl "http://localhost:3086/stats?days=7&limit=50&offset=100"
```

**Response:**

```json
{
  "total_visitors": 150,
  "displayed_visitors": 50,
  "period": "7 day(s)",
  "visitors": [
    {
      "mac": "XX:XX:XX:XX:XX:XX",
      "first_seen": "2024-01-15T10:30:00.000Z",
      "last_seen": "2024-01-21T14:20:00.000Z",
      "count": 12
    }
  ]
}
```

### Access Points List

**Endpoint:** `GET /access_points`

**Parameters:**

- `limit` - limit the number of records (default: 50)
- `offset` - the number of records to skip (default: 0)

**Example:**

```bash
curl "http://localhost:3086/access_points?limit=20"
```

**Response:**

```json
{
  "access_points": [
    {
      "bssid": "XX:XX:XX:XX:XX:XX",
      "ssid": "TP-Link_B47B",
      "first_seen": "2024-01-15T09:00:00.000Z",
      "last_seen": "2024-01-21T16:45:00.000Z",
      "count": 45
    }
  ],
  "total": 25,
  "displayed": 20
}
```

### Clients for a Specific SSID

**Endpoint:** `GET /ssid/:ssid/clients`

**Parameters:**

- `limit` - limit the number of records (default: 100)
- `offset` - the number of records to skip (default: 0)

**Example:**

```bash
curl "http://localhost:3086/ssid/_SOME_SSID_/clients?limit=10"
```

**Response:**

```json
{
  "ssid": "_SOME_SSID_",
  "clients": [
    {
      "client_mac": "XX:XX:XX:XX:XX:XX",
      "first_seen": "2024-01-20T11:30:00.000Z",
      "last_seen": "2024-01-21T15:20:00.000Z",
      "count": 3,
      "client_first_seen": "2024-01-15T10:30:00.000Z",
      "client_last_seen": "2024-01-21T15:20:00.000Z",
      "client_total_count": 12
    }
  ],
  "total_clients": 8,
  "displayed": 1
}
```

### SSIDs Searched by a Specific Client

**Endpoint:** `GET /client/:mac/ssids`

**Parameters:**

- `limit` - limit the number of records (default: 100)
- `offset` - the number of records to skip (default: 0)

**Example:**

```bash
curl "http://localhost:3086/client/XX:XX:XX:XX:XX:XX/ssids"
```

**Response:**

```json
{
  "client_mac": "XX:XX:XX:XX:XX:XX",
  "ssids": [
    {
      "ssid": "_SOME_SSID_",
      "first_seen": "2024-01-20T11:30:00.000Z",
      "last_seen": "2024-01-21T15:20:00.000Z",
      "count": 3,
      "bssid": null,
      "ap_first_seen": null,
      "ap_last_seen": null
    }
  ],
  "total_ssids": 5,
  "displayed": 1
}
```

### SSID Statistics

**Endpoint:** `GET /ssid_stats`

**Parameters:**

- `limit` - limit the number of records (default: 50)
- `offset` - the number of records to skip (default: 0)

**Example:**

```bash
curl "http://localhost:3086/ssid_stats?limit=10"
```

**Response:**

```json
{
  "ssid_statistics": [
    {
      "ssid": "_SOME_SSID_",
      "unique_clients": 8,
      "total_requests": 25,
      "first_seen": "2024-01-15T09:00:00.000Z",
      "last_seen": "2024-01-21T16:45:00.000Z"
    }
  ],
  "total_unique_ssids": 15,
  "displayed": 1
}
```

### Raw Logs

**Endpoint:** `GET /raw_logs`

**Parameters:**

- `limit` - limit the number of records (default: 100)
- `offset` - the number of records to skip (default: 0)

**Example:**

```bash
curl "http://localhost:3086/raw_logs?limit=10&offset=0"
```

**Response:**

```json
{
  "logs": [
    {
      "timestamp": "2024-01-21T15:20:00.000Z",
      "raw_data": "15:20:00.123456 ... BSSID:Broadcast ... SA:XX:XX:XX:XX:XX:XX ... Probe Request (_SOME_SSID_) ...",
      "client_mac": "XX:XX:XX:XX:XX:XX",
      "ap_bssid": null,
      "ap_ssid": "_SOME_SSID_"
    }
  ],
  "total": 1000,
  "limit": 10,
  "offset": 0,
  "max_logs": 1000
}
```

### Dashboard

**Endpoint:** `GET /dashboard`

**Example:**

```bash
curl "http://localhost:3086/dashboard"
```

**Response:**

```json
{
  "today_visitors": 15,
  "total_visitors": 150,
  "access_points_count": 25,
  "unique_ssids_tracked": 18,
  "recent_visitors": [
    {
      "mac": "XX:XX:XX:XX:XX:XX",
      "last_seen": "2024-01-21T15:20:00.000Z",
      "count": 12
    }
  ],
  "recent_access_points": [
    {
      "ssid": "_SOME_SSID_",
      "last_seen": "2024-01-21T16:45:00.000Z",
      "count": 45
    }
  ],
  "popular_ssids": [
    {
      "ssid": "_SOME_SSID_",
      "client_count": 8
    }
  ]
}
```

### Search

**Endpoint:** `GET /search/:term`

**Example:**

```bash
curl "http://localhost:3086/search/_SOME_SSID_OR_BSSID_VISITOR_MAC_"
```

**Response:**

```json
{
  "visitors": [],
  "access_points": [
    {
      "bssid": null,
      "ssid": "_SOME_SSID_",
      "first_seen": "2024-01-15T09:00:00.000Z",
      "last_seen": "2024-01-21T16:45:00.000Z",
      "count": 45
    }
  ]
}
```

### Database Cleanup

**Endpoint:** `POST /clean_database`

**Request Body:**

```json
{
  "confirmation": "YES_DELETE_ALL_DATA"
}
```

**Example:**

```bash
curl -X POST http://localhost:3086/clean_database \
  -H "Content-Type: application/json" \
  -d '{"confirmation":"YES_DELETE_ALL_DATA"}'
```

**Response:**

```json
{
  "message": "Database cleaned successfully"
}
```

---

## Troubleshooting

### Checking Router-Server Connection

```bash
# On the router, check connectivity:
ping 192.168.1.224
nc -zv 192.168.1.224 3085
```

### Checking the Monitor Interface

```bash
# Check interface creation
iw dev mon0 info

# Check that the interface is receiving packets
tcpdump -i mon0 -c 10 subtype probereq
```

### Viewing Logs

```bash
# Server logs (if run directly)
tail -f visitor_tracker.log

# Router logs
tail -f /tmp/visitor_tracker.log
```
