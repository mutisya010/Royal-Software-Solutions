import React from 'react';
import './portalShared.css';

/**
 * Standardized Page Header across all list and management workspaces
 */
const ListPageHeader = ({
    title,
    subtitle,
    primaryAction, // { label, icon: Icon, onClick }
    secondaryActions = [] // Array of { label, icon: Icon, onClick }
}) => {
    return (
        <div className="portal-page-header">
            <div className="portal-page-header-left">
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </div>

            <div className="portal-page-header-actions">
                {secondaryActions.map((sec, idx) => {
                    const SecIcon = sec.icon;
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={sec.onClick}
                            className="btn-secondary-outline"
                        >
                            {SecIcon && <SecIcon size={15} />}
                            <span>{sec.label}</span>
                        </button>
                    );
                })}

                {primaryAction && (
                    <button
                        type="button"
                        onClick={primaryAction.onClick}
                        className="btn-primary-teal"
                    >
                        {primaryAction.icon && <primaryAction.icon size={16} />}
                        <span>{primaryAction.label}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ListPageHeader;

