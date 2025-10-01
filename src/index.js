/*
 * src/index.js - Main application file for Enhanced Visitor Tracking System
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
const path = require("path");
const fs = require("fs");

const initializeDatabase = require("./db/initializeDatabase");
const initializeHttpServer = require("./server/initializeHttpServer");
const createTcpServer = require("./server/createTcpServer");

const {
  DB_PATH,
  TCP_PORT,
  HTTP_PORT,
  CLEAN_DB,
  MAX_RAW_LOGS,
} = require("./config");

// Main function
async function main() {
  try {
    // Delete old database ONLY if CLEAN_DB is true
    if (CLEAN_DB && fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
      console.log("Cleaning database as CLEAN_DB = true");
    } else if (fs.existsSync(DB_PATH)) {
      console.log("Using existing database");
    } else {
      console.log("Creating new database");
    }

    const db = await initializeDatabase();

    createTcpServer(db);
    initializeHttpServer(db);

    console.log("Enhanced visitor tracking system started!");
    console.log(`Database: ${DB_PATH}`);
    console.log(`TCP Port: ${TCP_PORT}`);
    console.log(`HTTP Port: ${HTTP_PORT}`);
    console.log(`Clean DB on startup: ${CLEAN_DB}`);
    console.log(`Max raw logs: ${MAX_RAW_LOGS} records`);

    process.on("SIGINT", () => {
      console.log("Shutting down...");
      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
        } else {
          console.log("Database connection closed.");
        }
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the application
main();
