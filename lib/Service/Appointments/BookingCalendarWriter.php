<?php

declare(strict_types=1);

/**
 * Calendar App
 *
 * @copyright 2021 Anna Larch <anna.larch@gmx.net>
 *
 * @author Anna Larch <anna.larch@gmx.net>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Calendar\Service\Appointments;

use DateTimeImmutable;
use OCA\Calendar\AppInfo\Application;
use OCA\Calendar\Db\AppointmentConfig;
use OCP\Calendar\Exceptions\CalendarException;
use OCP\Calendar\ICreateFromString;
use OCP\Calendar\IManager;
use OCP\IConfig;
use OCP\IL10N;
use OCP\IUserManager;
use OCP\Security\ISecureRandom;
use RuntimeException;
use Sabre\VObject\Component;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\TimeZoneUtil;
use function abs;

class BookingCalendarWriter {
	/** @var IConfig */
	private $config;

	/** @var IManager */
	private $manager;

	/** @var IUserManager */
	private $userManager;

	/** @var ISecureRandom */
	private $random;
	/** @var IL10N */
	private $l10n;

	public function __construct(IConfig $config,
		IManager $manager,
		IUserManager $userManager,
		ISecureRandom $random,
		IL10N $l10n) {
		$this->config = $config;
		$this->manager = $manager;
		$this->userManager = $userManager;
		$this->random = $random;
		$this->l10n = $l10n;
	}

	private function secondsToIso8601Duration(int $secs): string {
		$day = 24 * 60 * 60;
		$hour = 60 * 60;
		$minute = 60;
		if ($secs % $day === 0) {
			return 'PT' . $secs / $day . 'S';
		}
		if ($secs % $hour === 0) {
			return 'PT' . $secs / $hour . 'H';
		}
		if ($secs % $minute === 0) {
			return 'PT' . $secs / $minute . 'M';
		}
		return 'PT' . $secs . 'S';
	}

	/**
	 * @param AppointmentConfig $config
	 * @param DateTimeImmutable $start
	 * @param string $displayName
	 * @param string $email
	 * @param string|null $description
	 *
	 * @return string
	 * @throws RuntimeException
	 */
	public function write(AppointmentConfig $config, DateTimeImmutable $start, string $displayName, string $email, string $timezone, ?string $description = null) : string {
		$calendar = current($this->manager->getCalendarsForPrincipal($config->getPrincipalUri(), [$config->getTargetCalendarUri()]));
		if (!($calendar instanceof ICreateFromString)) {
			throw new RuntimeException('Could not find a public writable calendar for this principal');
		}

		$organizer = $this->userManager->get($config->getUserId());
		if ($organizer === null) {
			throw new RuntimeException('Organizer not registered user for this instance');
		}

		$vcalendar = new VCalendar([
			'CALSCALE' => 'GREGORIAN',
			'VERSION' => '2.0',
			'VEVENT' => [
				// TRANSLATORS Title for event appoinment, first the attendee name, then the appointment name
				'SUMMARY' => $this->l10n->t('%1$s - %2$s', [$displayName, $config->getName()]),
				'STATUS' => 'CONFIRMED',
				'DTSTART' => $start,
				'DTEND' => $start->setTimestamp($start->getTimestamp() + ($config->getLength()))
			]
		]);

		$end = $start->getTimestamp() + $config->getLength();
		$tz = $this->generateVtimezone($timezone, $start->getTimestamp(), $end);
		if($tz) {
			$vcalendar->add($tz);
		}

		if (!empty($description)) {
			$vcalendar->VEVENT->add('DESCRIPTION', $description);
		}

		$vcalendar->VEVENT->add(
			'ORGANIZER',
			'mailto:' . $organizer->getEMailAddress(),
			[
				'CN' => $organizer->getDisplayName(),
				'CUTYPE' => 'INDIVIDUAL',
				'PARTSTAT' => 'ACCEPTED'
			]
		);

		$vcalendar->VEVENT->add(
			'ATTENDEE',
			'mailto:' . $organizer->getEMailAddress(),
			[
				'CN' => $organizer->getDisplayName(),
				'CUTYPE' => 'INDIVIDUAL',
				'RSVP' => 'TRUE',
				'ROLE' => 'REQ-PARTICIPANT',
				'PARTSTAT' => 'ACCEPTED'
			]
		);

		$vcalendar->VEVENT->add('ATTENDEE',
			'mailto:' . $email,
			[
				'CN' => $displayName,
				'CUTYPE' => 'INDIVIDUAL',
				'RSVP' => 'TRUE',
				'ROLE' => 'REQ-PARTICIPANT',
				'PARTSTAT' => 'ACCEPTED'
			]
		);

		$defaultReminder = $this->config->getUserValue(
			$config->getUserId(),
			Application::APP_ID,
			'defaultReminder',
			'none'
		);
		if ($defaultReminder !== 'none') {
			$alarm = $vcalendar->createComponent('VALARM');
			$alarm->add($vcalendar->createProperty('TRIGGER', '-' . $this->secondsToIso8601Duration(abs((int) $defaultReminder)), ['RELATED' => 'START']));
			$alarm->add($vcalendar->createProperty('ACTION', 'DISPLAY'));
			$vcalendar->VEVENT->add($alarm);
		}

		if ($config->getLocation() !== null) {
			$vcalendar->VEVENT->add('LOCATION', $config->getLocation());
		}

		$vcalendar->VEVENT->add('X-NC-APPOINTMENT', $config->getToken());

		$filename = $this->random->generate(32, ISecureRandom::CHAR_ALPHANUMERIC);

		try {
			$calendar->createFromString($filename . '.ics', $vcalendar->serialize());
		} catch (CalendarException $e) {
			throw new RuntimeException('Could not write event  for appointment config id ' . $config->getId(). ' to calendar: ' . $e->getMessage(), 0, $e);
		}

		if ($config->getPreparationDuration() !== 0) {
			$string = $this->l10n->t('Prepare for %s', [$config->getName()]);
			$prepStart = $start->setTimestamp($start->getTimestamp() - $config->getPreparationDuration());
			$prepCalendar = new VCalendar([
				'CALSCALE' => 'GREGORIAN',
				'VERSION' => '2.0',
				'VEVENT' => [
					'SUMMARY' => $string,
					'STATUS' => 'CONFIRMED',
					'DTSTART' => $prepStart,
					'DTEND' => $start
				]
			]);
			$tz = $this->generateVtimezone($timezone, $prepStart->getTimestamp(), $start->getTimestamp());
			if($tz) {
				$prepCalendar->add($tz);
			}

			$prepCalendar->VEVENT->add('RELATED-TO', $vcalendar->VEVENT->{'UID'});
			$prepCalendar->VEVENT->add('RELTYPE', 'PARENT');
			$prepCalendar->VEVENT->add('X-NC-PRE-APPOINTMENT', $config->getToken());

			$prepFileName = $this->random->generate(32, ISecureRandom::CHAR_ALPHANUMERIC);

			try {
				$calendar->createFromString($prepFileName . '.ics', $prepCalendar->serialize());
			} catch (CalendarException $e) {
				throw new RuntimeException('Could not write event  for appointment config id ' . $config->getId(). ' to calendar: ' . $e->getMessage(), 0, $e);
			}
		}

		if ($config->getFollowupDuration() !== 0) {
			$string = $this->l10n->t('Follow up for %s', [$config->getName()]);
			$followupStart = $start->setTimestamp($start->getTimestamp() + $config->getLength());
			$followUpEnd = $followupStart->setTimestamp($followupStart->getTimestamp() + $config->getFollowupDuration());
			$followUpCalendar = new VCalendar([
				'CALSCALE' => 'GREGORIAN',
				'VERSION' => '2.0',
				'VEVENT' => [
					'SUMMARY' => $string,
					'STATUS' => 'CONFIRMED',
					'DTSTART' => $followupStart,
					'DTEND' => $followUpEnd
				]
			]);

			$tz = $this->generateVtimezone($timezone, $followupStart->getTimestamp(), $followUpEnd->getTimestamp());
			if($tz) {
				$followUpCalendar->add($tz);
			}

			$followUpCalendar->VEVENT->add('RELATED-TO', $vcalendar->VEVENT->{'UID'});
			$followUpCalendar->VEVENT->add('RELTYPE', 'PARENT');
			$followUpCalendar->VEVENT->add('X-NC-POST-APPOINTMENT', $config->getToken());

			$followUpFilename = $this->random->generate(32, ISecureRandom::CHAR_ALPHANUMERIC);

			try {
				$calendar->createFromString($followUpFilename . '.ics', $followUpCalendar->serialize());
			} catch (CalendarException $e) {
				throw new RuntimeException('Could not write event  for appointment config id ' . $config->getId(). ' to calendar: ' . $e->getMessage(), 0, $e);
			}
		}
		return $vcalendar->serialize();
	}

	/**
	 * Returns a VTIMEZONE component for a Olson timezone identifier
	 * with daylight transitions covering the given date range.
	 *
	 * @link https://gist.github.com/thomascube/47ff7d530244c669825736b10877a200
	 *
	 * @param string $timezone Timezone
	 * @param integer $from Unix timestamp with first date/time in this timezone
	 * @param integer $to Unix timestap with last date/time in this timezone
	 *
	 * @return null|Component A Sabre\VObject\Component object representing a VTIMEZONE definition
	 *               or null if no timezone information is available
	 */
	private function generateVtimezone($timezone, $from, $to): ?Component {
		try {
			$tz = new \DateTimeZone($timezone);
		}
		catch (\Exception $e) {
			return null;
		}

		// get all transitions for one year back/ahead
		$year = 86400 * 360;
		$transitions = $tz->getTransitions($from - $year, $to + $year);

		$vcalendar = new VCalendar();
		$vtimezone = $vcalendar->createComponent('VTIMEZONE');
		$vtimezone->TZID = $timezone;

		$standard = $daylightStart = null;
		foreach ($transitions as $i => $trans) {
			$component = null;

			// skip the first entry...
			if ($i == 0) {
				// ... but remember the offset for the next TZOFFSETFROM value
				$tzfrom = $trans['offset'] / 3600;
				continue;
			}

			// daylight saving time definition
			if ($trans['isdst']) {
				$daylightDefinition = $trans['ts'];
				$daylightStart = $vcalendar->createComponent('DAYLIGHT');
				$component = $daylightStart;
			}
			// standard time definition
			else {
				$standardDefinition = $trans['ts'];
				$standard = $vcalendar->createComponent('STANDARD');
				$component = $standard;
			}

			if ($component) {
				$date = new \DateTime($trans['time']);
				$offset = $trans['offset'] / 3600;

				$component->DTSTART = $date->format('Ymd\THis');
				$component->TZOFFSETFROM = sprintf('%s%02d%02d', $tzfrom >= 0 ? '+' : '-', abs(floor($tzfrom)), ($tzfrom - floor($tzfrom)) * 60);
				$component->TZOFFSETTO   = sprintf('%s%02d%02d', $offset >= 0 ? '+' : '-', abs(floor($offset)), ($offset - floor($offset)) * 60);

				// add abbreviated timezone name if available
				if (!empty($trans['abbr'])) {
					$component->TZNAME = $trans['abbr'];
				}

				$tzfrom = $offset;
				$vtimezone->add($component);
			}

			// we covered the entire date range
			if ($standard && $daylightStart && min($standardDefinition, $daylightDefinition) < $from && max($standardDefinition, $daylightDefinition) > $to) {
				break;
			}
		}

		// add X-MICROSOFT-CDO-TZID if available
		$microsoftExchangeMap = array_flip(TimeZoneUtil::$microsoftExchangeMap);
		if (array_key_exists($tz->getName(), $microsoftExchangeMap)) {
			$vtimezone->add('X-MICROSOFT-CDO-TZID', $microsoftExchangeMap[$tz->getName()]);
		}

		return $vtimezone;
	}
}
