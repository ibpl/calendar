/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <oc.list@georgehrke.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import dateRangeFormat from '../filters/dateRangeFormat.js'
import { getDateFromFirstdayParam } from '../utils/date.js'
import useSettingsStore from '../store/settings.js'

const originalWindowTitle = document.title

/**
 * This function listens to the router and
 * automatically adjusts the title of the window
 *
 * @param {VueRouter} router The VueJS Router instance
 */
export default function(router) {
	const settingsStore = useSettingsStore()

	/**
	 * Updates the title of the window
	 *
	 * @param {Date} date viewed Date
	 * @param {string} view Name of the current view
	 * @param {string} locale Locale to be used for formatting
	 */
	function updateTitle(date, view, locale) {
		const title = dateRangeFormat(date, view, locale)
		document.title = [
			title,
			originalWindowTitle,
		].join(' - ')
	}

	/**
	 * This listens to router changes and automatically
	 * updates the title
	 */
	router.beforeEach((to, from, next) => {
		if (!to.params.firstDay) {
			next()
			return
		}

		const date = getDateFromFirstdayParam(to.params.firstDay)
		const view = to.params.view
		const locale = settingsStore.momentLocale

		updateTitle(date, view, locale)

		next()
	})

	/**
	 * This listens to changes of the locale
	 * and automatically updates it.
	 */
	settingsStore.$onAction(({
		name,
		store,
		args,
	}) => {
		if (name !== 'setMomentLocale') {
			return
		}
		if (!router.currentRoute.params?.firstDay) {
			return
		}

		const date = getDateFromFirstdayParam(router.currentRoute.params.firstDay)
		const view = router.currentRoute.params.view
		const { locale } = args[0] // JavaScript, I love it ...

		updateTitle(date, view, locale)
	})
}
