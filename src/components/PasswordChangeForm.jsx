import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Mail, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Mock MessageAlert component
const MessageAlert = ({ message, type }) => {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
        : type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';

    return (
        <div className={`p-3 rounded-lg ${bgColor} mb-4`}>
            {message}
        </div>
    );
};

const PasswordChangeForm = () => {
    const [passwordForm, setPasswordForm] = useState({
        newusername: '',
        newPassword: '',
        confirmPassword: '',
        pin: '',
        showNewPassword: false,
        showConfirmPassword: false
    });
    const { user, changePassword, sendemail } = useAuth();
    const [messages, setMessages] = useState({
        password: { type: '', text: '' },
        pin: { type: '', text: '' }
    });

    const [loading, setLoading] = useState({
        password: false,
        sendPin: false
    });

    const [pinStatus, setPinStatus] = useState({
        sent: false,
        verified: false,
        expiresAt: null,
        timeRemaining: 0
    });

    // Timer for PIN expiration
    useEffect(() => {
        let interval;
        if (pinStatus?.expiresAt) {
            interval = setInterval(() => {
                const now = new Date()?.getTime();
                const timeLeft = Math.max(0, pinStatus?.expiresAt - now);
                setPinStatus(prev => ({ ...prev, timeRemaining: timeLeft }));

                if (timeLeft === 0) {
                    setPinStatus(prev => ({
                        ...prev,
                        sent: false,
                        verified: false,
                        expiresAt: null
                    }));
                    setMessages(prev => ({
                        ...prev,
                        pin: { type: 'error', text: 'PIN has expired. Please request a new one.' }
                    }));
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [pinStatus?.expiresAt]);

    const handleSendPin = async () => {
        if (user?.email === 'example@gmail.com') {
            setMessages(prev => ({
                ...prev,
                pin: { type: 'error', text: 'Please update your email address first' }
            }));
            return;
        }

        setLoading(prev => ({ ...prev, sendPin: true }));
        setMessages(prev => ({ ...prev, pin: { type: '', text: '' } }));
        try {
            const result = await sendemail?.(user?.email);

            if (result?.success) {
                setPinStatus({
                    sent: true,
                    verified: false,
                    expiresAt: result?.expiresAt,
                    timeRemaining: result?.expiresAt - new Date()?.getTime()
                });
                setMessages(prev => ({
                    ...prev,
                    pin: { type: 'success', text: result?.message }
                }));
            } else {
                setMessages(prev => ({
                    ...prev,
                    pin: { type: 'error', text: result?.error }
                }));
            }
        } catch (error) {
            setMessages(prev => ({
                ...prev,
                pin: { type: 'error', text: error?.message }
            }));
        } finally {
            setLoading(prev => ({ ...prev, sendPin: false }));
        }
    };

    const handlePasswordChange = async (e) => {
        e?.preventDefault();

        if (passwordForm?.newPassword !== passwordForm?.confirmPassword) {
            setMessages(prev => ({
                ...prev,
                password: { type: 'error', text: 'New passwords do not match' }
            }));
            return;
        }

        if (passwordForm?.newPassword?.length < 6) {
            setMessages(prev => ({
                ...prev,
                password: { type: 'error', text: 'Password must be at least 6 characters long' }
            }));
            return;
        }

        setLoading(prev => ({ ...prev, password: true }));

        try {
            const data = {
                newusername: passwordForm?.newusername,
                newPassword: passwordForm?.newPassword,
                pin: passwordForm?.pin,
            };

            const result = await changePassword?.(data);

            if (result?.success) {
                setMessages(prev => ({
                    ...prev,
                    password: { type: 'success', text: result?.message }
                }));
                setPasswordForm({
                    newusername: '',
                    newPassword: '',
                    confirmPassword: '',
                    pin: '',
                    showNewPassword: false,
                    showConfirmPassword: false
                });
                setPinStatus({
                    sent: false,
                    verified: false,
                    expiresAt: null,
                    timeRemaining: 0
                });
            } else {
                setMessages(prev => ({
                    ...prev,
                    password: { type: 'error', text: result?.error }
                }));
            }
        } catch (error) {
            setMessages(prev => ({
                ...prev,
                password: { type: 'error', text: error?.message }
            }));
        } finally {
            setLoading(prev => ({ ...prev, password: false }));
        }
    };

    const formatTime = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds?.toString()?.padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>

            {/* Email PIN Section */}
            {user?.email && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Email Verification Required
                            </span>
                        </div>
                        {pinStatus?.sent && pinStatus?.timeRemaining > 0 && (
                            <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(pinStatus?.timeRemaining)}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        A verification PIN will be sent to: <strong>{user?.email}</strong>
                    </p>

                    <MessageAlert message={messages?.pin?.text} type={messages?.pin?.type} />

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={handleSendPin}
                            disabled={loading?.sendPin || (pinStatus?.sent && pinStatus?.timeRemaining > 0)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            {loading?.sendPin ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : pinStatus?.sent && pinStatus?.timeRemaining > 0 ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                <Mail className="h-4 w-4" />
                            )}
                            <span>
                                {loading?.sendPin ? 'Sending...' :
                                    pinStatus?.sent && pinStatus?.timeRemaining > 0 ? 'PIN Sent' : 'Send PIN'}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            <MessageAlert message={messages?.password?.text} type={messages?.password?.type} />

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New username
                        </label>
                        <input
                            type="text"
                            value={passwordForm?.newusername || ''}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newusername: e?.target?.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={passwordForm?.showNewPassword ? "text" : "password"}
                                value={passwordForm?.newPassword || ''}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e?.target?.value }))}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="New password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showNewPassword: !prev?.showNewPassword }))}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {passwordForm?.showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={passwordForm?.showConfirmPassword ? "text" : "password"}
                                value={passwordForm?.confirmPassword || ''}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e?.target?.value }))}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showConfirmPassword: !prev?.showConfirmPassword }))}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {passwordForm?.showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            PIN
                        </label>
                        <input
                            type="password"
                            value={passwordForm?.pin || ''}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, pin: e?.target?.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter 4-digit PIN"
                            required
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={loading?.password || (user?.email && (!pinStatus?.sent || pinStatus?.timeRemaining <= 0 || !passwordForm?.pin))}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                    {loading?.password ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    <span>Update Password</span>
                </button>
            </div>
        </div>
    );
};

export default PasswordChangeForm;