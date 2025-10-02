/*
 * src/server/createTcpServer.js - TCP server for receiving and processing Wi-Fi probe requests
 *
 * Copyright (C) 2025 Borys Kotliarov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * ADDITIONAL DISCLAIMER: This software involves Wi-Fi monitoring.
 * See the LICENSE file for important legal and ethical considerations
 * before use.
 */

// Create TCP server
const net = require("net");
const DatabaseQueue = require("../utils/DatabaseQueue");
const formatMac = require("../utils/formatMac");
const { MAX_RAW_LOGS, TCP_PORT } = require("../config");

// Extract data from tcpdump line
function extractDataFromLine(line) {
  const result = {
    clientMac: null,
    apBssid: null,
    apSsid: null,
  };

  try {
    // Extract Client MAC (SA) - Source Address
    const saMatch = line.match(/SA:([0-9a-fA-F:]{17})/);
    if (saMatch) {
      result.clientMac = formatMac(saMatch[1]);
    }

    // Extract Access Point BSSID (if not Broadcast)
    const bssidMatch = line.match(/BSSID:([0-9a-fA-F:]{17})/);
    if (bssidMatch && bssidMatch[1].toLowerCase() !== "broadcast") {
      result.apBssid = formatMac(bssidMatch[1]);
    }

    // Extract SSID from Probe Request
    const ssidMatch = line.match(/Probe Request \(([^)]+)\)/);
    if (ssidMatch && ssidMatch[1]) {
      result.apSsid = ssidMatch[1];
    }

    if (!result.apSsid) {
      const altSsidMatch = line.match(/Probe Request \(([^)]*)\)/);
      if (altSsidMatch && altSsidMatch[1] && altSsidMatch[1].length > 0) {
        result.apSsid = altSsidMatch[1];
      }
    }
  } catch (error) {
    console.error("Error extracting data from line:", error);
  }

  return result;
}

// Save access point data
function saveAccessPoint(db, bssid, ssid, timestamp) {
  return new Promise((resolve, reject) => {
    if (!ssid) {
      resolve(null);
      return;
    }

    const query = `
      INSERT INTO access_points (bssid, ssid, first_seen, last_seen) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(ssid) DO UPDATE SET 
        last_seen = excluded.last_seen,
        count = count + 1,
        bssid = COALESCE(excluded.bssid, bssid)
    `;

    db.run(query, [bssid, ssid, timestamp, timestamp], function (err) {
      if (err) {
        reject(err);
      } else {
        const action = this.changes === 1 ? "created" : "updated";
        resolve({ action, bssid, ssid });
      }
    });
  });
}

// Save visitor data
function saveVisitorData(db, mac, timestamp) {
  return new Promise((resolve, reject) => {
    if (!mac) {
      resolve(null);
      return;
    }

    const query = `
      INSERT INTO visitors (mac, first_seen, last_seen, count) 
      VALUES (?, ?, ?, 1)
      ON CONFLICT(mac) DO UPDATE SET 
        last_seen = excluded.last_seen,
        count = count + 1
    `;

    db.run(query, [mac, timestamp, timestamp], function (err) {
      if (err) {
        reject(err);
      } else {
        const action = this.changes === 1 ? "created" : "updated";
        resolve({ action, mac });
      }
    });
  });
}

// Save client-SSID relationship
function saveClientSsidRelationship(db, clientMac, ssid, timestamp) {
  return new Promise((resolve, reject) => {
    if (!clientMac || !ssid) {
      resolve(null);
      return;
    }

    const query = `
      INSERT INTO client_ssid_relationships (client_mac, ssid, first_seen, last_seen) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(client_mac, ssid) DO UPDATE SET 
        last_seen = excluded.last_seen,
        count = count + 1
    `;

    db.run(query, [clientMac, ssid, timestamp, timestamp], function (err) {
      if (err) {
        reject(err);
      } else {
        const action = this.changes === 1 ? "created" : "updated";
        resolve({ action, clientMac, ssid });
      }
    });
  });
}

// Save raw log with extracted data
function saveRawLog(db, rawData, timestamp, clientMac, apBssid, apSsid) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO raw_logs (raw_data, timestamp, client_mac, ap_bssid, ap_ssid) VALUES (?, ?, ?, ?, ?)",
      [rawData, timestamp, clientMac, apBssid, apSsid],
      function (err) {
        if (err) {
          reject(err);
          return;
        }

        const newId = this.lastID;

        // Check and clean old records if needed
        db.get("SELECT COUNT(*) as count FROM raw_logs", (err, row) => {
          if (err) {
            console.error("Error counting raw logs:", err);
            resolve(newId);
            return;
          }

          if (row.count > MAX_RAW_LOGS) {
            const excess = row.count - MAX_RAW_LOGS;
            db.run(
              "DELETE FROM raw_logs WHERE id IN (SELECT id FROM raw_logs ORDER BY id ASC LIMIT ?)",
              [excess],
              (err) => {
                if (err) {
                  console.error("Error cleaning old raw logs:", err);
                } else {
                  //   console.log(`Cleaned ${excess} old raw log records`);
                }
                resolve(newId);
              }
            );
          } else {
            resolve(newId);
          }
        });
      }
    );
  });
}

// Process a single line of data

async function processLine(db, line, timestamp) {
  try {
    const { clientMac, apBssid, apSsid } = extractDataFromLine(line);

    if (apSsid) {
      await saveAccessPoint(db, apBssid, apSsid, timestamp);
    }

    if (clientMac) {
      await saveVisitorData(db, clientMac, timestamp);
    }

    if (clientMac && apSsid) {
      await saveClientSsidRelationship(db, clientMac, apSsid, timestamp);
    }

    await saveRawLog(db, line, timestamp, clientMac, apBssid, apSsid);

    return {
      clientMac,
      apBssid,
      apSsid,
      status: clientMac ? "Processed" : "No client MAC found",
    };
  } catch (error) {
    console.error("Error processing line:", error);
    throw error;
  }
}

module.exports = function createTcpServer(db) {
  const dbQueue = new DatabaseQueue(db);

  const server = net.createServer((socket) => {
    const client = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`New TCP connection from ${client}`);

    let buffer = "";

    socket.on("data", async (data) => {
      try {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            const timestamp = new Date().toISOString();

            try {
              const result = await dbQueue.enqueue((db) =>
                processLine(db, line, timestamp)
              );

              let response = "Processed: ";
              if (result.clientMac) response += `Client: ${result.clientMac} `;
              if (result.apSsid) response += `SSID: ${result.apSsid}`;
              if (result.apBssid) response += ` (BSSID: ${result.apBssid})`;

              socket.write(response + "\n");
            } catch (error) {
              console.error("Error processing line:", error);
              socket.write("ERROR: Failed to process data\n");
            }
          }
        }
      } catch (error) {
        console.error("Error processing data:", error);
      }
    });

    socket.on("error", (error) => {
      console.error(`Socket error from ${client}:`, error.message);
    });

    socket.on("close", () => {
      console.log(`TCP connection closed: ${client}`);
    });

    socket.write("ENHANCED_VISITOR_TRACKER_READY\n");
  });

  server.listen(TCP_PORT, "0.0.0.0", () => {
    console.log(`TCP server listening on port ${TCP_PORT}`);
  });

  return server;
};
