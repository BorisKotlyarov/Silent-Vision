/*
 * src/server/controllers/clean/index.js - Clean database controller
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
  const { confirmation } = req.body;
  const db = req.database;
  if (confirmation !== "YES_DELETE_ALL_DATA") {
    res.status(400).json({
      error:
        "Confirmation required. Send { confirmation: 'YES_DELETE_ALL_DATA' } to delete all data.",
    });
    return;
  }

  db.serialize(() => {
    db.run("DELETE FROM visitors");
    db.run("DELETE FROM access_points");
    db.run("DELETE FROM raw_logs");
    db.run("DELETE FROM client_ssid_relationships");

    res.json({ message: "Database cleaned successfully" });
  });
};
