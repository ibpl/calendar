/**
 * @copyright Copyright (c) 2020 Georg Ehrke
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
import useImportFilesStore from '../../../../src/store/importFiles.js'
import { setActivePinia, createPinia } from 'pinia'

describe('store/importFiles test suite', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	it('should provide a default state', () => {
		const importFilesStore = useImportFilesStore()

		expect(importFilesStore.$state).toEqual({
			lastFileInsertId: -1,
			importFiles: [],
			importFilesById: {},
			importCalendarRelation: {},
		})
	})

	it('should provide a mutation to add a file', () => {
		const importFilesStore = useImportFilesStore()

		const state = {
			lastFileInsertId: 41,
			importFiles: [],
			importFilesById: {},
		}

		importFilesStore.$state = state

		const file1 = {
			contents: 'BEGIN:VCALENDAR...',
			lastModified: 1590151056,
			name: 'file-1.ics',
			parser: {},
			size: 1337,
			type: 'text/calendar',
		}
		const file2 = {
			contents: '{}',
			lastModified: 1590151056,
			name: 'file-2.ics',
			parser: {},
			size: 42,
			type: 'application/json+calendar',
		}

		importFilesStore.addFile(file1)
		importFilesStore.addFile(file2)

		expect(importFilesStore.importFiles).toEqual([
			{
				...file1,
				id: 42,
			}, {
				...file2,
				id: 43,
			}
		])

		expect(importFilesStore.importFilesById[42]).toEqual({
			...file1,
			id: 42,
		})
		expect(importFilesStore.importFilesById[43]).toEqual({
			...file2,
			id: 43,
		})
	})

	it('should provide a mutation to set a calendarId for a file', () => {
		const importFilesStore = useImportFilesStore()

		const state = {
			importCalendarRelation: {},
		}

		importFilesStore.importCalendarRelation = state.importCalendarRelation

		importFilesStore.importCalendarRelation[0] = 'CALENDAR-ID-1'
		importFilesStore.importCalendarRelation[42] = 'CALENDAR-ID-1'

		expect(importFilesStore.importCalendarRelation).toEqual({
			0: 'CALENDAR-ID-1',
			42: 'CALENDAR-ID-1',
		})
	})

	it('should provide a mutation to remove all files', () => {
		const importFilesStore = useImportFilesStore()

		const file1 = {
			id: 0,
			contents: 'BEGIN:VCALENDAR...',
			lastModified: 1590151056,
			name: 'file-1.ics',
			parser: {},
			size: 1337,
			type: 'text/calendar',
		}
		const file2 = {
			id: 1,
			contents: '{}',
			lastModified: 1590151056,
			name: 'file-2.ics',
			parser: {},
			size: 42,
			type: 'application/json+calendar',
		}

		const state = {
			lastFileInsertId: 1,
			importFiles: [
				file1,
				file2,
			],
			importFilesById: {
				0: file1,
				1: file2,
			},
			importCalendarRelation: {
				0: 'CALENDAR-ID-1',
				1: 'CALENDAR-ID-1',
			},
		}

		importFilesStore.$state = state

		importFilesStore.removeAllFiles()

		expect(importFilesStore.$state).toEqual({
			lastFileInsertId: 1,
			importFiles: [],
			importFilesById: {},
			importCalendarRelation: {},
		})
	})

})
