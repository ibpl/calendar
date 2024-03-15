/**
 * @copyright 2024 Grigory Vodyanov <scratchx@gmx.com>
 *
 * @author 2024 Grigory Vodyanov <scratchx@gmx.com>
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
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { AttendeeProperty, createFreeBusyRequest, DateTimeValue } from '@nextcloud/calendar-js'
import { findSchedulingOutbox } from './caldavService.js'
import freeBusyResourceEventSourceFunction from '../fullcalendar/eventSources/freeBusyResourceEventSourceFunction.js'
import getTimezoneManager from './timezoneDataProviderService.js'
import logger from '../utils/logger.js'

/**
 * Get the first available slot for an event using freebusy API
 *
 * @param {AttendeeProperty} organizer The organizer of the event
 * @param {AttendeeProperty[]} attendees Array of the event's attendees
 * @param {Date} start The start date and time of the event
 * @param {Date} end The end date and time of the event
 * @param timeZone Timezone of the user
 * @param timeZoneId
 * @return {Promise<>}
 */
export async function getBusySlots(organizer, attendees, start, end, timeZoneId) {

	let timezoneObject = getTimezoneManager().getTimezoneForId(timeZoneId)
	if (!timezoneObject) {
		timezoneObject = getTimezoneManager().getTimezoneForId('UTC')
		logger.error(`FreeBusyEventSource: Timezone ${timeZoneId} not found, falling back to UTC.`)
	}

	const startDateTime = DateTimeValue.fromJSDate(start, true)
	const endDateTime = DateTimeValue.fromJSDate(end, true)

	const organizerAsAttendee = new AttendeeProperty('ATTENDEE', organizer.email)
	const freeBusyComponent = createFreeBusyRequest(startDateTime, endDateTime, organizer, [organizerAsAttendee, ...attendees])
	const freeBusyICS = freeBusyComponent.toICS()

	let outbox
	try {
		outbox = await findSchedulingOutbox()
	} catch (error) {
		return { error }
	}

	let freeBusyData
	try {
		freeBusyData = await outbox.freeBusyRequest(freeBusyICS)
	} catch (error) {
		return { error }
	}
	const events = []
	for (const [uri, data] of Object.entries(freeBusyData)) {
		events.push(...freeBusyResourceEventSourceFunction(uri, data.calendarData, data.success, startDateTime, endDateTime, timezoneObject))
	}

	return { events }
}

/**
 * Get the first available slot for an event using freebusy API
 *
 * @param {AttendeeProperty} organizer The organizer of the event
 * @param {AttendeeProperty[]} attendees Array of the event's attendees
 * @param {Date} start The start date and time of the event
 * @param {Date} end The end date and time of the event
 * @param timeZoneId TimezoneId of the user
 * @return {Promise<[]>}
 */
export async function getFirstFreeSlot(organizer, attendees, start, end, timeZoneId) {
	let duration = getDurationInSeconds(start, end)
	if (duration === 0) {
		duration = 86400 // one day
	}

	// for now search slots only in the first five days
	const endSearchDate = new Date(start)
	endSearchDate.setDate(start.getDate() + 5)
	const eventResults = await getBusySlots(organizer, attendees, start, endSearchDate, timeZoneId)

	if (eventResults.error) {
		return [{ error: eventResults.error }]
	}

	const events = sortEvents(eventResults.events)

	console.log('EVENTS', events)

	let currentCheckedTime = start
	const currentCheckedTimeEnd = new Date(currentCheckedTime)
	currentCheckedTimeEnd.setSeconds(currentCheckedTime.getSeconds() + duration)
	const foundSlots = []

	// todo: make it 5
	for (let i = 0; (i < events.length + 1); i++) {
		foundSlots[i] = checkTimes(currentCheckedTime, duration, events)
		console.log('FOUND SLOTS', foundSlots[i], 'ITERATION', i)


		if (foundSlots[i].nextEvent !== undefined && foundSlots[i].nextEvent !== null) currentCheckedTime = new Date(foundSlots[i].nextEvent.end)
		// avoid repetitions caused by events blocking at first iteration of currentCheckedTime
		if (foundSlots[i]?.start === foundSlots[i - 1]?.start && foundSlots[i] !== undefined) {
			foundSlots[i].start = null
		}
		console.log('CURRENT CHECKED TIME', currentCheckedTime, 'NEXT EVENT', foundSlots[i].nextEvent)
	}

	let roundedSlots = []

	foundSlots.forEach((slot, index) => {
		const roundedTime = roundTime(slot.start, slot.end, slot.blockingEvent, slot.nextEvent, duration)
		console.log('ROUNDED TIME', roundedTime, 'INDEX', index)

		if (roundedTime !== null) {
			roundedSlots.push({
				start: roundedTime.start,
				end: roundedTime.end,
			})
		}
	})

	return roundedSlots
}

/**
 *
 * @param start
 * @param end
 */
function getDurationInSeconds(start, end) {
	// convert dates to UTC to account for daylight saving time
	const startUTC = new Date(start).toUTCString()
	const endUTC = new Date(end).toUTCString()

	const durationMs = new Date(endUTC) - new Date(startUTC)
	// convert milliseconds to seconds
	return Math.floor(durationMs / 1000)
}

/**
 *
 * @param currentCheckedTime
 * @param currentCheckedTimeEnd
 * @param blockingEvent
 * @param nextEvent
 * @param duration
 */
function roundTime(currentCheckedTime, currentCheckedTimeEnd, blockingEvent, nextEvent, duration) {
	if (currentCheckedTime === null || nextEvent === undefined) return null
	if (!blockingEvent) return { start: currentCheckedTime, end: currentCheckedTimeEnd }

	// make sure that difference between currentCheckedTime and blockingEvent.end is at least 15 minutes
	if ((currentCheckedTime - new Date(blockingEvent.end)) / (1000 * 60) < 15) {
		currentCheckedTime.setMinutes(currentCheckedTime.getMinutes() + 15)
	}

	// needed to fix edge case errors
	if ((currentCheckedTime - new Date(blockingEvent.end)) / (1000 * 60) > 15) {
		currentCheckedTime.setMinutes(currentCheckedTime.getMinutes() - 15)
	}

	// round to the nearest 30 minutes
	if (currentCheckedTime.getMinutes() < 30) {
		currentCheckedTime.setMinutes(30)
	} else {
		currentCheckedTime.setMinutes(0)
		currentCheckedTime.setHours(currentCheckedTime.getHours() + 1)
	}

	// update currentCheckedTimeEnd again since currentCheckedTime was updated
	currentCheckedTimeEnd = new Date(currentCheckedTime)
	currentCheckedTimeEnd.setSeconds(currentCheckedTime.getSeconds() + duration)


	// if the rounding of the the event doesn't conflict with the start of the next one
	console.log('NEXT EVENT IN ROUND TIME', new Date(nextEvent.start), 'CURRENT CHECKED TIME END', currentCheckedTimeEnd, 'BOOL', currentCheckedTimeEnd > new Date(nextEvent.start))
	if (currentCheckedTimeEnd > new Date(nextEvent.start)) {
		return null
	}

	return { start: currentCheckedTime, end: currentCheckedTimeEnd }
}

/**
 *
 * @param currentCheckedTime
 * @param duration
 * @param events
 */
function checkTimes(currentCheckedTime, duration, events) {
	let slotIsBusy = false
	let blockingEvent = null
	let nextEvent = null
	let currentCheckedTimeEnd = new Date(currentCheckedTime)
	currentCheckedTimeEnd.setSeconds(currentCheckedTime.getSeconds() + duration)

	// loop every 5 minutes since start date
	// check if there are no events in the duration starting from that minute
	while (true) {
		events.every(
			(event) => {
				slotIsBusy = false

				const eventStart = new Date(event.start)
				const eventEnd = new Date(event.end)

				currentCheckedTimeEnd = new Date(currentCheckedTime)
				currentCheckedTimeEnd.setSeconds(currentCheckedTime.getSeconds() + duration)

				// start of event is within the range that we are checking
				if (eventStart >= currentCheckedTime && eventStart <= currentCheckedTimeEnd) {
					slotIsBusy = true
					blockingEvent = event
					return false
				}

				// end of event is within range that we are checking
				if (eventEnd >= currentCheckedTime && eventEnd <= currentCheckedTimeEnd) {
					slotIsBusy = true
					blockingEvent = event
					return false
				}

				// range that we are checking is within ends of event
				if (eventStart <= currentCheckedTime && eventEnd >= currentCheckedTimeEnd) {
					slotIsBusy = true
					blockingEvent = event
					return false
				}
				return true
			},
		)

		if (slotIsBusy) {
			currentCheckedTime.setMinutes(currentCheckedTime.getMinutes() + 5)
		} else break
	}

	console.log('BLOCKING EVENT', blockingEvent)

	if (blockingEvent !== null) {
		const blockingIndex = events.findIndex((event) => event === blockingEvent)
		console.log('BLOCKING INDEX', blockingIndex)

		nextEvent = events[blockingIndex + 1]
		console.log('NEXT EVENT IN CHECK TIMES', nextEvent)
	} else {
		if (events.length > 0) nextEvent = events[0]
	}

	return { start: currentCheckedTime, end: currentCheckedTimeEnd, nextEvent, blockingEvent }
}

//make a function that sorts a list of objects by the "start" property
function sortEvents(events) {
	return events.sort((a, b) => new Date(a.start) - new Date(b.start))
}
