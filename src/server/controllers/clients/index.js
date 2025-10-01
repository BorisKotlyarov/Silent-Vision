module.exports = function (req, res) {
  /*
   * src/server/controllers/clients/index.js - Controller for clients
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

  const { mac } = req.params;
  const formattedMac = formatMac(mac);
  const { limit, offset } = req.pagination;
  const db = req.database;

  if (!formattedMac) {
    res.status(400).json({ error: "Invalid MAC address" });
    return;
  }

  db.get(
    `
      SELECT COUNT(*) as total_count
      FROM client_ssid_relationships 
      WHERE client_mac = ?
    `,
    [formattedMac],
    (err, totalRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.all(
        `
        SELECT 
          cs.ssid,
          cs.first_seen,
          cs.last_seen,
          cs.count,
          ap.bssid,
          ap.first_seen as ap_first_seen,
          ap.last_seen as ap_last_seen
        FROM client_ssid_relationships cs
        LEFT JOIN access_points ap ON cs.ssid = ap.ssid
        WHERE cs.client_mac = ?
        ORDER BY cs.last_seen DESC
        LIMIT ? OFFSET ?
      `,
        [formattedMac, limit, offset],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          res.json({
            client_mac: formattedMac,
            ssids: rows,
            total_ssids: totalRow.total_count,
            displayed: rows.length,
            limit,
            offset,
          });
        }
      );
    }
  );
};
