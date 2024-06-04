/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import navLinkDayClick from '../../../../../src/fullcalendar/interaction/navLinkDayClick.js'
import { getYYYYMMDDFromDate } from '../../../../../src/utils/date.js'
jest.mock('../../../../../src/utils/date.js')

describe('fullcalendar/eventClick test suite', () => {

	beforeEach(() => {
		getYYYYMMDDFromDate.mockClear()
	})

	it('should open the clicked day in day view', () => {
		const router = {
			push: jest.fn(),
		}
		const route = {
			name: 'CalendarView',
			params: {
				view: 'dayGridMonth',
				firstDay: 'now',
				otherParam: '456',
			},
		}

		getYYYYMMDDFromDate
			.mockReturnValueOnce('first-day-param-of-date')

		const date = new Date(Date.UTC(2019, 11, 5, 12, 36, 48, 0))

		const navLinkDayClickFunction = navLinkDayClick(router, route)
		navLinkDayClickFunction(date)

		expect(getYYYYMMDDFromDate).toHaveBeenCalledTimes(1)
		expect(getYYYYMMDDFromDate).toHaveBeenNthCalledWith(1, date)

		expect(router.push.mock.calls.length).toEqual(1)
		expect(router.push.mock.calls[0][0]).toEqual({
			name: 'CalendarView',
			params: {
				otherParam: '456',
				view: 'timeGridDay',
				firstDay: 'first-day-param-of-date',
			}
		})
	})

	it('should open the clicked day in day view (already on correct date)', () => {
		const router = {
			push: jest.fn(),
		}
		const route = {
			name: 'CalendarView',
			params: {
				view: 'dayGridMonth',
				firstDay: 'first-day-param-of-date',
				otherParam: '456',
			},
		}

		getYYYYMMDDFromDate
			.mockReturnValueOnce('first-day-param-of-date')

		const date = new Date(Date.UTC(2019, 11, 5, 12, 36, 48, 0))

		const navLinkDayClickFunction = navLinkDayClick(router, route)
		navLinkDayClickFunction(date)

		expect(getYYYYMMDDFromDate).toHaveBeenCalledTimes(1)
		expect(getYYYYMMDDFromDate).toHaveBeenNthCalledWith(1, date)

		expect(router.push.mock.calls.length).toEqual(1)
		expect(router.push.mock.calls[0][0]).toEqual({
			name: 'CalendarView',
			params: {
				otherParam: '456',
				view: 'timeGridDay',
				firstDay: 'first-day-param-of-date',
			}
		})
	})

	it('should open the clicked day in day view (already in correct view)', () => {
		const router = {
			push: jest.fn(),
		}
		const route = {
			name: 'CalendarView',
			params: {
				view: 'timeGridDay',
				firstDay: 'now',
				otherParam: '456',
			},
		}

		getYYYYMMDDFromDate
			.mockReturnValueOnce('first-day-param-of-date')

		const date = new Date(Date.UTC(2019, 11, 5, 12, 36, 48, 0))

		const navLinkDayClickFunction = navLinkDayClick(router, route)
		navLinkDayClickFunction(date)

		expect(getYYYYMMDDFromDate).toHaveBeenCalledTimes(1)
		expect(getYYYYMMDDFromDate).toHaveBeenNthCalledWith(1, date)

		expect(router.push.mock.calls.length).toEqual(1)
		expect(router.push.mock.calls[0][0]).toEqual({
			name: 'CalendarView',
			params: {
				otherParam: '456',
				view: 'timeGridDay',
				firstDay: 'first-day-param-of-date',
			}
		})
	})

	it('should not open a duplicate route', () => {
		const router = {
			push: jest.fn(),
		}
		const route = {
			name: 'CalendarView',
			params: {
				view: 'timeGridDay',
				firstDay: 'first-day-param-of-date',
				otherParam: '456',
			},
		}

		getYYYYMMDDFromDate
			.mockReturnValueOnce('first-day-param-of-date')

		const date = new Date(Date.UTC(2019, 11, 5, 12, 36, 48, 0))

		const navLinkDayClickFunction = navLinkDayClick(router, route)
		navLinkDayClickFunction(date)

		expect(getYYYYMMDDFromDate).toHaveBeenCalledTimes(1)
		expect(getYYYYMMDDFromDate).toHaveBeenNthCalledWith(1, date)

		expect(router.push.mock.calls.length).toEqual(0)
	})
})
