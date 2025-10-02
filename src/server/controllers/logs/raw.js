/*
 * src/server/controllers/logs/index.js - Controller for logs from wifi router (raw)
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
const { MAX_RAW_LOGS } = require("../../../config");
module.exports = function (req, res) {
  const { limit, offset } = req.pagination;
  const db = req.database;
  db.all(
    `
      SELECT timestamp, raw_data, client_mac, ap_bssid, ap_ssid
      FROM raw_logs 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `,
    [limit, offset],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get("SELECT COUNT(*) as total FROM raw_logs", (err, countRow) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          logs: rows,
          total: countRow.total,
          limit,
          offset,
          max_logs: MAX_RAW_LOGS,
        });
      });
    }
  );
};
