/*
 * src/utils/formatMac.js - Utility to format MAC addresses to standard format (XX:XX:XX:XX:XX:XX)
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
// Format MAC address to standard format (XX:XX:XX:XX:XX:XX)
function formatMac(mac) {
  if (!mac) return null;

  const cleanMac = mac.replace(/:/g, "").toUpperCase();
  return cleanMac.replace(/(.{2})(?=.)/g, "$1:");
}

module.exports = formatMac;
