/*
 * src/server/controllers/ap/index.js - Controller for access points
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
  db.get("SELECT COUNT(*) as total FROM access_points", (err, totalRow) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    db.all(
      `
        SELECT bssid, ssid, first_seen, last_seen, count
        FROM access_points 
        ORDER BY last_seen DESC
        LIMIT ? OFFSET ?
      `,
      [limit, offset],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          access_points: rows,
          total: totalRow.total,
          displayed: rows.length,
          limit,
          offset,
        });
      }
    );
  });
};
