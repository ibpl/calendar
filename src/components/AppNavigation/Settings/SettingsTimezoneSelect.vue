<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<li class="settings-fieldset-interior-item settings-fieldset-interior-item--timezone">
		<TimezonePicker :additional-timezones="additionalTimezones"
			:value="timezone"
			@input="setTimezoneValue" />
	</li>
</template>

<script>
import {
	mapState,
} from 'vuex'

import { NcTimezonePicker as TimezonePicker } from '@nextcloud/vue'
import { detectTimezone } from '../../../services/timezoneDetectionService.js'
import {
	showInfo,
} from '@nextcloud/dialogs'

export default {
	name: 'SettingsTimezoneSelect',
	components: {
		TimezonePicker,
	},
	props: {
		isDisabled: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		...mapState({
			timezone: state => (state.settings.timezone || 'automatic'),
		}),
		/**
		 * Offer "Automatic" as an additional timezone
		 *
		 * @return {object[]}
		 */
		additionalTimezones() {
			return [{
				continent: this.$t('calendar', 'Automatic'),
				timezoneId: 'automatic',
				label: this.$t('calendar', 'Automatic ({detected})', {
					detected: detectTimezone(),
				}),
			}]
		},
	},
	methods: {
		/**
		 * Updates the timezone set by the user
		 *
		 * @param {string} timezoneId New timezoneId to save
		 */
		setTimezoneValue(timezoneId) {
			this.$store.dispatch('setTimezone', { timezoneId })
				.catch((error) => {
					console.error(error)
					showInfo(this.$t('calendar', 'New setting was not saved successfully.'))
				})
		},
	},
}
</script>
