/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @copyright Copyright (c) 2019 John Molakvoæ
 *
 * @author Georg Ehrke <oc.list@georgehrke.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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
import 'core-js/stable/index.js'

import '../css/calendar.scss'

import Vue from 'vue'
import App from './App.vue'
import router from './router.js'
import { getRequestToken } from '@nextcloud/auth'
import { linkTo } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
import { translate, translatePlural } from '@nextcloud/l10n'
import AppointmentConfig from './models/appointmentConfig.js'
import ClickOutside from 'vue-click-outside'
import VTooltip from 'v-tooltip'
import VueShortKey from 'vue-shortkey'
import windowTitleService from './services/windowTitleService.js'
import { createPinia, PiniaVuePlugin } from 'pinia'
import useAppointmentConfigsStore from './store/appointmentConfigs.js'

Vue.use(PiniaVuePlugin)
const pinia = createPinia()

// register global components
Vue.directive('ClickOutside', ClickOutside)
Vue.use(VTooltip)
Vue.use(VueShortKey, { prevent: ['input', 'textarea'] })

// CSP config for webpack dynamic chunk loading
// eslint-disable-next-line
__webpack_nonce__ = btoa(getRequestToken())

// Correct the root of the app for chunk loading
// OC.linkTo matches the apps folders
// OC.generateUrl ensure the index.php (or not)
// We do not want the index.php since we're loading files
// eslint-disable-next-line
__webpack_public_path__ = linkTo('calendar', 'js/')

Vue.prototype.$t = translate
Vue.prototype.$n = translatePlural

// The nextcloud-vue package does currently rely on t and n
Vue.prototype.t = translate
Vue.prototype.n = translatePlural

export default new Vue({
	el: '#content',
	router,
	render: h => h(App),
	pinia,
})

const appointmentsConfigsStore = useAppointmentConfigsStore()
appointmentsConfigsStore.addInitialConfigs(loadState('calendar', 'appointmentConfigs', []).map(config => new AppointmentConfig(config)))

windowTitleService(router)
