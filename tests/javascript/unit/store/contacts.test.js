/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import contactsStore from '../../../../src/store/contacts.js'

describe('store/contacts test suite', () => {

	it('should provide a default state', () => {
		expect(contactsStore.state.contacts).toEqual([])
		expect(contactsStore.state.contactByEMail).toEqual({})
	})

	it('should provide a mutation to add a contact', () => {
		const state = {
			contacts: [],
			contactByEMail: {},
		}

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

		contactsStore.mutations.appendContact(state, { contact: contact1 })
		contactsStore.mutations.appendContact(state, { contact: contact2 })
		contactsStore.mutations.appendContact(state, { contact: contact3 })

		// It should not add the same again:
		contactsStore.mutations.appendContact(state, { contact: contact1 })

		expect(state.contacts).toEqual([
			contact1,
			contact2,
			contact3,
		])

		expect(state.contactByEMail).toEqual({
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
			contactByEMail: {
				'john.doe@example.com': contact1,
				'jane.doe@example.com': contact2,
			},
		}

		contactsStore.mutations.removeContact(state, { contact: contact1 })

		expect(state.contacts).toEqual([
			contact2,
		])

		expect(state.contactByEMail).toEqual({
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
			contactByEMail: {
				'john.doe@example.com': contact1,
				'jane.doe@example.com': contact2,
			},
		}

		const unknownContact = {
			name: 'Foo Bar',
			emails: ['foo.bar@example.com'],
		}

		contactsStore.mutations.removeContact(state, { contact: unknownContact })

		expect(state.contacts).toEqual([
			contact1,
			contact2,
		])

		expect(state.contactByEMail).toEqual({
			'john.doe@example.com': contact1,
			'jane.doe@example.com': contact2,
		})
	})
})
