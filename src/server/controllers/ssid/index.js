/*
 * src/server/controllers/ssid/index.js - Controller for SSIDs
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
  const { ssid } = req.params;
  const { limit, offset } = req.pagination;
  const db = req.database;

  db.get(
    `
      SELECT COUNT(*) as total_count
      FROM client_ssid_relationships 
      WHERE ssid = ?
    `,
    [ssid],
    (err, totalRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.all(
        `
        SELECT 
          cs.client_mac,
          cs.first_seen,
          cs.last_seen,
          cs.count,
          v.first_seen as client_first_seen,
          v.last_seen as client_last_seen,
          v.count as client_total_count
        FROM client_ssid_relationships cs
        LEFT JOIN visitors v ON cs.client_mac = v.mac
        WHERE cs.ssid = ?
        ORDER BY cs.last_seen DESC
        LIMIT ? OFFSET ?
      `,
        [ssid, limit, offset],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          res.json({
            ssid: ssid,
            clients: rows,
            total_clients: totalRow.total_count,
            displayed: rows.length,
            limit,
            offset,
          });
        }
      );
    }
  );
};
