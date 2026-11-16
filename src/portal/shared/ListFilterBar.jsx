import React from 'react';
import { Search, X } from 'lucide-react';
import './portalShared.css';

/**
 * Clean Search & Pill Filter Bar
 * Inspired by Reference Image 4
 *
 * searchPlaceholder: string
 * searchValue: string
 * onSearchChange: function
 * filterPills: Array of { id: string, label: string, count?: number }
 * activeFilter: string
 * onFilterChange: function
 * extraControls?: ReactNode
 */
const ListFilterBar = ({
    searchPlaceholder = 'Search records...',
    searchValue = '',
    onSearchChange,
    filterPills = [],
    activeFilter,
    onFilterChange,
    extraControls = null
}) => {
    return (
        <div className="list-filter-bar">
            <div className="filter-bar-left">
                {onSearchChange && (
                    <div className="filter-search-box">
                        <Search size={15} className="filter-search-icon" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="filter-search-input"
                        />
                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                style={{
                                    position: 'absolute',
                                    right: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {filterPills && filterPills.length > 0 && (
                    <div className="filter-pills-row">
                        {filterPills.map(pill => {
                            const isActive = activeFilter === pill.id;
                            return (
                                <button
                                    key={pill.id}
                                    type="button"
                                    onClick={() => onFilterChange && onFilterChange(pill.id)}
                                    className={`filter-pill-btn ${isActive ? 'active' : ''}`}
                                >
                                    <span>{pill.label}</span>
                                    {typeof pill.count === 'number' && (
                                        <span className="filter-pill-count">{pill.count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {extraControls && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {extraControls}
                </div>
            )}
        </div>
    );
};

export default ListFilterBar;

