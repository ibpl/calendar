/**
 * @copyright Copyright (c) 2019 Georg Ehrke
 *
 * @author Georg Ehrke <oc.list@georgehrke.com>
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
import useContactsStore from '../../../../src/store/contacts.js'
import { setActivePinia, createPinia } from 'pinia'

describe('store/contacts test suite', () => {

	setActivePinia(createPinia())

	const contactsStore = useContactsStore()

	it('should provide a default state', () => {
		expect(contactsStore.contacts).toEqual([])
		expect(contactsStore.contactByEmail).toEqual({})
	})

	it('should provide a mutation to add a contact', () => {
		const contact1 = {
			name: 'John Doe',
			emails: ['john.doe@example.com'],
		}
		const contact2 = {
			name: 'Jane Doe',
			emails: ['jane.doe@example.com'],
		}
		const contact3 = {
			name: 'John Doe Doppelgänger',
			emails: [
				'john.doe@example.com',
				'john.doe.doppelganger@example.com',
			],
		}

		contactsStore.appendContact({ contact: contact1 })
		contactsStore.appendContact({ contact: contact2 })
		contactsStore.appendContact({ contact: contact3 })

		// It should not add the same again:
		contactsStore.appendContact({ contact: contact1 })

		expect(contactsStore.contacts).toEqual([
			contact1,
			contact2,
			contact3,
		])

		expect(contactsStore.contactByEmail).toEqual({
			'john.doe@example.com': contact1,
			'jane.doe@example.com': contact2,
			'john.doe.doppelganger@example.com': contact3,
		})
	})

	it('should provide a mutation to remove a contact - existing', () => {
		const contact1 = {
			name: 'John Doe',
			emails: ['john.doe@example.com'],
		}
		const contact2 = {
			name: 'Jane Doe',
			emails: ['jane.doe@example.com'],
		}

		const state = {
			contacts: [
				contact1,
				contact2,
			],
			contactByEmail: {
				'john.doe@example.com': contact1,
				'jane.doe@example.com': contact2,
			},
		}

		contactsStore.contacts = state.contacts
		contactsStore.contactByEmail = state.contactByEmail

		contactsStore.removeContact({ contact: contact1 })

		expect(contactsStore.contacts).toEqual([
			contact2,
		])

		expect(contactsStore.contactByEmail).toEqual({
			'jane.doe@example.com': contact2,
		})
	})

	it('should provide a mutation to remove a contact - non-existing', () => {
		const contact1 = {
			name: 'John Doe',
			emails: ['john.doe@example.com'],
		}
		const contact2 = {
			name: 'Jane Doe',
			emails: ['jane.doe@example.com'],
		}

		const state = {
			contacts: [
				contact1,
				contact2,
			],
			contactByEmail: {
				'john.doe@example.com': contact1,
				'jane.doe@example.com': contact2,
			},
		}

		const unknownContact = {
			name: 'Foo Bar',
			emails: ['foo.bar@example.com'],
		}

		contactsStore.removeContact({ contact: unknownContact })

		expect(state.contacts).toEqual([
			contact1,
			contact2,
		])

		expect(state.contactByEmail).toEqual({
			'john.doe@example.com': contact1,
			'jane.doe@example.com': contact2,
		})
	})
})
