/*
 * src/config.js - Configuration for Enhanced Visitor Tracking System
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

const CONFIG = {
  TCP_PORT: 3085,
  HTTP_PORT: 3086,
  DB_PATH: path.resolve("./visitors.db"),
  MAX_RAW_LOGS: 1000,
  CLEAN_DB: false,
};

module.exports = CONFIG;
