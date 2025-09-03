import { Activity } from 'lucide-react';
import React from 'react';

export default function WelcomeBanner() {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Welcome back, Admin</h1>
                    <p className="text-blue-100 mt-1">
                        Here's what's happening with your business today
                    </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                    <Activity size={24} />
                </div>
            </div>
        </div>
    );
}