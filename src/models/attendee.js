/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Creates a complete attendee object based on given props
 *
 * TODO:
 *  - we should eventually support delegatedFrom and delegatedTo
 *
 * @param {object} props The attendee properties already provided
 * @return {object}
 */
const getDefaultAttendeeObject = (props = {}) => Object.assign({}, {
	// The calendar-js attendee property
	attendeeProperty: null,
	// The display-name of the attendee
	commonName: null,
	// The calendar-user-type of the attendee
	calendarUserType: 'INDIVIDUAL',
	// The participation status of the attendee
	participationStatus: 'NEEDS-ACTION',
	// The role of the attendee
	role: 'REQ-PARTICIPANT',
	// The RSVP for the attendee
	rsvp: false,
	// The uri of the attendee
	uri: null,
	// Member address of the attendee
	member: null,
}, props)

/**
 * Maps a calendar-js attendee property to our attendee object
 *
 * @param {AttendeeProperty} attendeeProperty The calendar-js attendeeProperty to turn into a attendee object
 * @return {object}
 */
const mapAttendeePropertyToAttendeeObject = (attendeeProperty) => {
	return getDefaultAttendeeObject({
		attendeeProperty,
		commonName: attendeeProperty.commonName,
		calendarUserType: attendeeProperty.userType,
		participationStatus: attendeeProperty.participationStatus,
		role: attendeeProperty.role,
		rsvp: attendeeProperty.rsvp,
		uri: attendeeProperty.email,
		member: attendeeProperty.member,
	})
}

export {
	getDefaultAttendeeObject,
	mapAttendeePropertyToAttendeeObject,
}
