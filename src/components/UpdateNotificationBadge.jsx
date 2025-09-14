import React from 'react';
import { Bell, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpdateNotificationBadge = ({ hasUpdate, updateInfo }) => {
    if (!hasUpdate) return null;

    const navigate = useNavigate();

    return (
        <div className="fixed top-4 right-4 z-40">
            <button
                onClick={() => {
                    navigate('/settings?tab=updatesoftware');
                }}
                className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 animate-pulse"
                title={`Update available: v${updateInfo?.version}`}
            >
                <Download className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">!</span>
                </span>
            </button>
        </div>
    );
};

export { UpdateNotificationBadge };