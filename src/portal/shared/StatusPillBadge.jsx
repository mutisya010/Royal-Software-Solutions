import React from 'react';
import './portalShared.css';

/**
 * Standardized status pill badge across lists and details
 */
const StatusPillBadge = ({ status = 'PENDING', customLabel = null }) => {
    const s = String(status || '').toUpperCase();
    let variant = 'status-gray';

    if (['ACTIVE', 'ACCEPTED', 'COMPLETED', 'DELIVERED', 'WON', 'PAID', 'PUBLISHED', 'OPEN'].includes(s)) {
        variant = 'status-green';
    } else if (['PENDING', 'UNDER_REVIEW', 'NEGOTIATION', 'PROPOSAL', 'PROCESSING'].includes(s)) {
        variant = 'status-amber';
    } else if (['SENT', 'RESPONDED', 'QUOTED', 'QUALIFIED', 'DRAFT'].includes(s)) {
        variant = 'status-blue';
    } else if (['REJECTED', 'CANCELLED', 'LOST', 'FAILED', 'OVERDUE'].includes(s)) {
        variant = 'status-red';
    }

    const label = customLabel || status;

    return (
        <span className={`status-pill ${variant}`}>
            <span className="status-pill-dot" />
            <span>{label}</span>
        </span>
    );
};

export default StatusPillBadge;

