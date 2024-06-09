<template>
	<NcDialog v-if="showDialog"
		size="large"
		:name="t('calendar', 'Availability of rooms')"
		@closing="handleClose">
		<div class="modal__content__header">
			<h2>{{ t('calendar', 'Find a room') }}</h2>
			<div>
				<div v-for="room in rooms" :key="room.id" class="rooms">
					<p>{{ room.displayname }}</p>
					<NcButton @click="openRoomAvailability(room)">
						{{ t('calendar', 'Check room availability') }}
					</NcButton>
				</div>
			</div>
			<RoomAvailabilityModal v-if="showRoomAvailabilityModal"
				:show="showRoomAvailabilityModal"
				:start-date="calendarObjectInstance.startDate"
				:end-date="calendarObjectInstance.endDate"
				:rooms="selectedRooms"
				:calendar-object-instance="calendarObjectInstance"
				:organizer="currentUserPrincipalAsAttendee"
				@close="closeFreeBusy" />
		</div>
	</NcDialog>
</template>

<script>
import { NcButton, NcDialog } from '@nextcloud/vue'
import RoomAvailabilityModal from './RoomAvailabilityModal.vue'
import { mapAttendeePropertyToAttendeeObject } from '../../../models/attendee.js'

export default {
	name: 'RoomAvailabilityList',
	components: {
		NcButton,
		NcDialog,
		RoomAvailabilityModal,
	},
	props: {
		calendarObjectInstance: {
			type: Object,
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
	},
	data() {
		return {
			showRoomAvailabilityModal: false,
			showDialog: true,
			selectedRooms: [],
		}
	},
	computed: {
		rooms() {
			return this.$store.getters.getRoomPrincipals
		},
		/**
		 * Return the current user principal as a ORGANIZER attendee object.
		 *
		 * @return {object}
		 */
		currentUserPrincipalAsAttendee() {
			const attendee = this.$store.getters.getCurrentUserPrincipal.toAttendeeProperty(true)
			return mapAttendeePropertyToAttendeeObject(attendee)
		},
	},
	methods: {
		openRoomAvailability(room) {
			this.selectedRooms = [room]
			this.showRoomAvailabilityModal = true
		},
		handleClose() {
			this.showDialog = false
		},
		closeFreeBusy() {
			this.showRoomAvailabilityModal = false
		},
	},
}
</script>
<style scoped lang="scss">
.icon-close {
	display: block;
	height: 100%;
}
.modal__content {
	padding: 50px;
	//when the calendar is open, it's cut at the bottom, adding a margin fixes it
	margin-bottom: 95px;
	&__actions{
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		&__select{
			width: 260px;
		}
		&__date{
			display: flex;
			justify-content: space-between;
			align-items: center;
			& > *{
				margin-left: 5px;
			}
		}
	}
	&__header{
		h3{
			font-weight: 500;
		}
		margin-bottom: 20px;
		&__attendees{
			&__user-bubble{
				margin-right: 5px;
			}
		}
	}
	&__footer{
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 20px;
		&__title{
			h3{
				font-weight: 500;
			}
			&__timezone{
				color: var(--color-text-lighter);
			}
		}
	}
}
:deep(.vs__search ) {
	text-overflow: ellipsis;
}
:deep(.mx-input) {
	height: 38px !important;
}
</style>
<style lang="scss">
.blocking-event-free-busy {
	// Show the blocking event above any other blocks, especially the *blocked for all* one
	z-index: 3 !important;
}

.free-busy-block {
	opacity: 0.7 !important;
}
.rooms {
	display: flex;
}
</style>
