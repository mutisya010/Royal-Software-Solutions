import React from 'react';
import './portalShared.css';

/**
 * Metric Summary Ribbon with vertical dividers
 * Directly inspired by the reference design in Reference Image 4
 *
 * items: Array of { label: string, value: string|number, trend?: string, trendType?: 'positive'|'neutral' }
 */
const StatSummaryRibbon = ({ items = [] }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="stat-summary-ribbon">
            {items.map((item, idx) => (
                <div key={idx} className="stat-ribbon-item">
                    <div className="stat-ribbon-value-row">
                        <span className="stat-ribbon-value">{item.value}</span>
                        {item.trend && (
                            <span className={`stat-ribbon-trend ${item.trendType === 'positive' ? 'positive' : 'neutral'}`}>
                                {item.trend}
                            </span>
                        )}
                    </div>
                    <span className="stat-ribbon-label">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default StatSummaryRibbon;

