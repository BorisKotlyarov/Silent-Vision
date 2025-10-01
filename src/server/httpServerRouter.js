/*
 * src/server/httpServerRouter.js - HTTP server routes
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

const statsController = require("./controllers/stats");
const accessPointsController = require("./controllers/ap");
const dashboardController = require("./controllers/dashboard");
const ssidController = require("./controllers/ssid");
const clinetsController = require("./controllers/clients");
const ssidStatsController = require("./controllers/stats/ssid");
const rawLogsController = require("./controllers/logs/raw");
const searchController = require("./controllers/search");
const cleanDatabaseController = require("./controllers/clean");
const paginationMiddleware = require("./middlewares/pagination");

module.exports = function httpServerRouter(app) {
  // Route: Get statistics
  app.get("/stats", paginationMiddleware, statsController);

  // Route: Get access points
  app.get("/access_points", paginationMiddleware, accessPointsController);

  // Route: Get clients for specific SSID
  app.get("/ssid/:ssid/clients", paginationMiddleware, ssidController);

  // Route: Get SSIDs for specific client
  app.get("/client/:mac/ssids", paginationMiddleware, clinetsController);

  // Route: Get SSID statistics
  app.get("/ssid_stats", paginationMiddleware, ssidStatsController);

  // Route: Get raw logs
  app.get("/raw_logs", paginationMiddleware, rawLogsController);

  // Route: Get dashboard
  app.get("/dashboard", dashboardController);

  // Route: Search by MAC address or SSID
  app.get("/search/:term", searchController);

  // New route: Clean database manually
  app.post("/clean_database", cleanDatabaseController);
};
