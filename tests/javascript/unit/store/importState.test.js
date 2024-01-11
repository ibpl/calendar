/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <oc.list@georgehrke.com>
 * @author 2024 Richard Steinmetz <richard@steinmetz.cloud>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import useImportStateStore from '../../../../src/store/importState.js'
import { setActivePinia, createPinia } from 'pinia'

import {
	IMPORT_STAGE_AWAITING_USER_SELECT,
	IMPORT_STAGE_DEFAULT,
} from "../../../../src/models/consts.js";

describe('store/importState test suite', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	it('should provide a default state', () => {
		const importStateStore = useImportStateStore()

		expect(importStateStore.$state).toEqual({
			total: 0,
			accepted: 0,
			denied: 0,
			stage: IMPORT_STAGE_DEFAULT,
		})
	})

	it('should provide a mutation to reset the state', () => {
		const importStateStore = useImportStateStore()

		const state = {
			stage: IMPORT_STAGE_AWAITING_USER_SELECT,
			total: 1337,
			accepted: 42,
			denied: 500,
		}

		importStateStore.$state = state

		importStateStore.resetState()

		expect(importStateStore.$state).toEqual({
			total: 0,
			accepted: 0,
			denied: 0,
			stage: IMPORT_STAGE_DEFAULT,
		})
	})

})
