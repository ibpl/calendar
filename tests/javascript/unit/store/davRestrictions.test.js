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
import useDavRestrictionsStore from '../../../../src/store/davRestrictions.js'
import { setActivePinia, createPinia } from 'pinia'

describe('store/davRestrictions test suite', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	it('should provide a default state', () => {
		const davRestrictionsStore = useDavRestrictionsStore()

		// Minimum Date should be the start of Unix-Date
		expect(davRestrictionsStore.minimumDate).toEqual('1970-01-01T00:00:00Z')

		// Maximum Date should prevent the Year 2038 problem
		expect(davRestrictionsStore.maximumDate).toEqual('2037-12-31T23:59:59Z')
	})

	it('should provide a mutation to set the default value', () => {
		const davRestrictionsStore = useDavRestrictionsStore()

		davRestrictionsStore.loadDavRestrictionsFromServer({
			minimumDate: '2010-01-01T00:00:00Z',
			maximumDate: '2019-12-31T23:59:59Z',
		})

		expect(davRestrictionsStore.$state).toEqual({
			minimumDate: '2010-01-01T00:00:00Z',
			maximumDate: '2019-12-31T23:59:59Z',
		})
	})

})
