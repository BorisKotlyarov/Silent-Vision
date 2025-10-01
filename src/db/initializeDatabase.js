/*
 * src/db/initializeDatabase.js - Initialization of SQLite database
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

const sqlite3 = require("sqlite3").verbose();
const { DB_PATH } = require("../config");

// Initialize SQLite database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        reject(err);
        return;
      }

      console.log("Connected to SQLite database.");

      // Enable WAL mode for better concurrency
      db.run("PRAGMA journal_mode = WAL");

      // Create tables
      db.serialize(() => {
        // Access Points table - SSID теперь UNIQUE
        db.run(`CREATE TABLE IF NOT EXISTS access_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bssid TEXT,
          ssid TEXT UNIQUE,
          first_seen TEXT,
          last_seen TEXT,
          count INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        // Visitors table
        db.run(`CREATE TABLE IF NOT EXISTS visitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mac TEXT UNIQUE,
          first_seen TEXT,
          last_seen TEXT,
          count INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        // Raw logs table
        db.run(`CREATE TABLE IF NOT EXISTS raw_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          raw_data TEXT,
          timestamp TEXT,
          client_mac TEXT,
          ap_bssid TEXT,
          ap_ssid TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        // Client-SSID relationships table
        db.run(`CREATE TABLE IF NOT EXISTS client_ssid_relationships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_mac TEXT,
          ssid TEXT,
          first_seen TEXT,
          last_seen TEXT,
          count INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(client_mac, ssid)
        )`);

        // Create indexes
        db.run("CREATE INDEX IF NOT EXISTS idx_visitors_mac ON visitors(mac)");
        db.run("CREATE INDEX IF NOT EXISTS idx_ap_ssid ON access_points(ssid)");
        db.run(
          "CREATE INDEX IF NOT EXISTS idx_raw_logs_timestamp ON raw_logs(timestamp)"
        );
        db.run(
          "CREATE INDEX IF NOT EXISTS idx_client_ssid_mac ON client_ssid_relationships(client_mac)"
        );
        db.run(
          "CREATE INDEX IF NOT EXISTS idx_client_ssid_ssid ON client_ssid_relationships(ssid)"
        );
      });

      resolve(db);
    });
  });
}

module.exports = initializeDatabase;
