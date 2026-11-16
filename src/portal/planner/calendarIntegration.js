/**
 * Google Calendar & iCalendar (.ics) integration utilities for Hybrid Planner
 */

/**
 * Format Date to UTC timestamp string required by Google Calendar & iCal (YYYYMMDDTHHmmssZ)
 */
export const formatCalendarTimestamp = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Generate 1-click Google Calendar web intent URL
 */
export const getGoogleCalendarUrl = (item) => {
    if (!item) return '';

    const start = formatCalendarTimestamp(item.start_time || item.due_date || new Date());
    let end = formatCalendarTimestamp(item.end_time);

    // If end time is missing, default to 1 hour after start
    if (!end && item.start_time) {
        const d = new Date(item.start_time);
        d.setHours(d.getHours() + 1);
        end = formatCalendarTimestamp(d);
    } else if (!end) {
        end = start;
    }

    const title = encodeURIComponent(item.title || 'Executive Meeting');

    let body = [];
    if (item.agenda) body.push(`Agenda:\n${item.agenda}`);
    if (item.objectives) body.push(`Objectives:\n${item.objectives}`);
    if (item.description) body.push(`Description:\n${item.description}`);
    if (item.meeting_link) body.push(`Meeting Link / Room: ${item.meeting_link}`);
    if (item.project_name) body.push(`Project: ${item.project_name}`);

    const details = encodeURIComponent(body.join('\n\n'));
    const location = encodeURIComponent(item.meeting_link || item.location_or_link || 'Executive Boardroom');

    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;

    // Add attendee emails if available
    const participantEmails = [];
    if (Array.isArray(item.participants)) {
        item.participants.forEach(p => {
            const email = p.user_details?.email || p.email;
            if (email && !participantEmails.includes(email)) {
                participantEmails.push(email);
            }
        });
    }
    if (participantEmails.length > 0) {
        url += `&add=${encodeURIComponent(participantEmails.join(','))}`;
    }

    return url;
};

/**
 * Open Google Calendar in a new tab
 */
export const openGoogleCalendar = (item) => {
    const url = getGoogleCalendarUrl(item);
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

/**
 * Generate RFC 5545 iCalendar (.ics) string
 */
export const generateIcsString = (item) => {
    const now = formatCalendarTimestamp(new Date());
    const start = formatCalendarTimestamp(item.start_time || item.due_date || new Date());
    let end = formatCalendarTimestamp(item.end_time);
    if (!end && item.start_time) {
        const d = new Date(item.start_time);
        d.setHours(d.getHours() + 1);
        end = formatCalendarTimestamp(d);
    } else if (!end) {
        end = start;
    }

    const title = (item.title || 'Meeting').replace(/\r?\n/g, ' ');
    const descParts = [];
    if (item.agenda) descParts.push(`Agenda: ${item.agenda}`);
    if (item.objectives) descParts.push(`Objectives: ${item.objectives}`);
    if (item.description) descParts.push(`Description: ${item.description}`);
    if (item.meeting_link) descParts.push(`Link: ${item.meeting_link}`);
    const description = descParts.join('\\n').replace(/,/g, '\\,');
    const location = (item.meeting_link || item.location_or_link || '').replace(/,/g, '\\,');

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Royal Software Solutions//Hybrid Planner//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:rss-meeting-${item.id || Date.now()}@royalsoftwares.co.ke`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    return lines.join('\r\n');
};

/**
 * Trigger download of .ics calendar file
 */
export const downloadIcsFile = (item) => {
    const icsContent = generateIcsString(item);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanTitle = (item.title || 'meeting').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40);
    link.href = url;
    link.setAttribute('download', `${cleanTitle}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Suggest a Google Meet link or instant video room URL
 */
export const generateMeetingLink = (title = 'sync') => {
    // If user wants a direct Google Meet creation link:
    // https://meet.google.com/new will create a brand new Google Meet room instantly in Chrome/Google Workspace
    return 'https://meet.google.com/new';
};
