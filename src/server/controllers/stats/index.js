/*
 * src/server/controllers/stats/index.js - Statistics controller
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
  const { days = 1 } = req.query;
  const { limit, offset } = req.pagination;

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - parseInt(days));

  // Сначала получаем общее количество
  req.database.get(
    `
      SELECT COUNT(*) as total_count
      FROM visitors 
      WHERE last_seen > ?
    `,
    [sinceDate.toISOString()],
    (err, countRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Затем получаем данные с лимитом
      req.database.all(
        `
        SELECT mac, first_seen, last_seen, count
        FROM visitors 
        WHERE last_seen > ?
        ORDER BY last_seen DESC
        LIMIT ? OFFSET ?
      `,
        [sinceDate.toISOString(), limit, offset],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          const stats = {
            total_visitors: countRow.total_count,
            displayed_visitors: rows.length,
            period: `${days} day(s)`,
            visitors: rows,
            limit,
            offset,
          };

          res.json(stats);
        }
      );
    }
  );
};
