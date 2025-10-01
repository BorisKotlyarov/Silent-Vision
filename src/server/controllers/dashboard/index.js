/*
 * src/server/controllers/dashboard/index.js - Controller for dashboard
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
  const today = new Date().toISOString().split("T")[0];
  const db = req.database;

  db.get(
    "SELECT COUNT(*) as count FROM visitors WHERE DATE(last_seen) = ?",
    [today],
    (err, todayRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get("SELECT COUNT(*) as count FROM visitors", (err, totalRow) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        db.get("SELECT COUNT(*) as count FROM access_points", (err, apRow) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          db.get(
            "SELECT COUNT(DISTINCT ssid) as count FROM client_ssid_relationships",
            (err, ssidRow) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }

              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);

              db.all(
                `
              SELECT mac, last_seen, count 
              FROM visitors 
              WHERE last_seen > ? 
              ORDER BY last_seen DESC 
              LIMIT 10
            `,
                [yesterday.toISOString()],
                (err, recentRows) => {
                  if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                  }

                  db.all(
                    `
                SELECT ssid, last_seen, count
                FROM access_points 
                ORDER BY last_seen DESC 
                LIMIT 10
              `,
                    (err, apRows) => {
                      if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                      }

                      db.all(
                        `
                  SELECT ssid, COUNT(DISTINCT client_mac) as client_count
                  FROM client_ssid_relationships 
                  GROUP BY ssid
                  ORDER BY client_count DESC
                  LIMIT 10
                `,
                        (err, popularSsids) => {
                          if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                          }

                          res.json({
                            today_visitors: todayRow.count,
                            total_visitors: totalRow.count,
                            access_points_count: apRow.count,
                            unique_ssids_tracked: ssidRow.count,
                            recent_visitors: recentRows,
                            recent_access_points: apRows,
                            popular_ssids: popularSsids,
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    }
  );
};
