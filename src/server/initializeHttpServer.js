/*
 * src/server/initializeHttpServer.js - Initialize HTTP server
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
const httpServerRouter = require("./httpServerRouter");
const express = require("express");
const { HTTP_PORT, MAX_RAW_LOGS } = require("../config");

// Initialize Express app for HTTP API
function initializeHttpServer(db) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  app.use((req, res, next) => {
    req.database = db;
    next();
  });

  httpServerRouter(app);

  app.listen(HTTP_PORT, () => {
    console.log(`HTTP API server running on port ${HTTP_PORT}`);
    console.log(`Available routes:`);
    console.log(`  GET /stats - Visitor statistics`);
    console.log(`  GET /access_points - Access points list`);
    console.log(
      `  GET /ssid/:ssid/clients - Clients that searched for specific SSID`
    );
    console.log(`  GET /client/:mac/ssids - SSIDs searched by specific client`);
    console.log(`  GET /ssid_stats - SSID statistics`);
    console.log(
      `  GET /raw_logs - Raw logs with extracted data (max ${MAX_RAW_LOGS} records)`
    );
    console.log(`  GET /dashboard - Combined dashboard`);
    console.log(`  GET /search/:term - Search by MAC or SSID`);
    console.log(
      `  POST /clean_database - Clean all data (requires confirmation)`
    );
  });

  return app;
}

module.exports = initializeHttpServer;
