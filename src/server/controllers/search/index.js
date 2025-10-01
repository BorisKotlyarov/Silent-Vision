/*
 * src/server/controllers/search/index.js - Controller for search
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
  const searchTerm = req.params.term;
  const db = req.database;
  db.all(
    "SELECT * FROM visitors WHERE mac LIKE ?",
    [`%${searchTerm}%`],
    (err, visitors) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.all(
        "SELECT * FROM access_points WHERE ssid LIKE ? OR bssid LIKE ?",
        [`%${searchTerm}%`, `%${searchTerm}%`],
        (err, accessPoints) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          res.json({
            visitors,
            access_points: accessPoints,
          });
        }
      );
    }
  );
};
