/**
 * @copyright Copyright (c) 2024 Richard Steinmetz <richard@steinmetz.cloud>
 *
 * @author 2024 Richard Steinmetz <richard@steinmetz.cloud>
 * @author 2024 Hamza Mahjoubi <hamzamahjoubi221@gmail.com>
 *
 * @license AGPL-3.0-or-later
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
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { defineStore } from 'pinia'

export default defineStore('widget', {
	state: () => {
		return {
			widgetView: 'dayGridMonth',
			widgetDate: 'now',
			widgetEventDetailsOpen: false,
			widgetEventDetails: {},
			widgetRef: undefined,
		}
	},
	actions: {
		setWidgetView({ viewName }) {
			this.widgetView = viewName
		},

		setWidgetDate({ widgetDate }) {
			this.widgetDate = widgetDate
		},

		setWidgetRef({ widgetRef }) {
			this.widgetRef = widgetRef
		},

		setSelectedEvent({ object, recurrenceId }) {
			this.widgetEventDetailsOpen = true
			this.widgetEventDetails = {
				object,
				recurrenceId,
			}
		},

		closeWidgetEventDetails() {
			this.widgetEventDetailsOpen = false
		},
	},
})
