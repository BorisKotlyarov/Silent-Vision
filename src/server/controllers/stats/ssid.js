/*
 * src/server/controllers/stats/ssid.js - Statistics controller for SSIDs
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

module.exports = function (req, res) {
  const { limit, offset } = req.pagination;
  const db = req.database;
  db.get(
    "SELECT COUNT(DISTINCT ssid) as total_ssids FROM client_ssid_relationships",
    (err, totalRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.all(
        `
        SELECT 
          ssid,
          COUNT(DISTINCT client_mac) as unique_clients,
          SUM(count) as total_requests,
          MIN(first_seen) as first_seen,
          MAX(last_seen) as last_seen
        FROM client_ssid_relationships 
        GROUP BY ssid
        ORDER BY total_requests DESC
        LIMIT ? OFFSET ?
      `,
        [limit, offset],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          res.json({
            ssid_statistics: rows,
            total_unique_ssids: totalRow.total_ssids,
            displayed: rows.length,
            limit,
            offset,
          });
        }
      );
    }
  );
};
