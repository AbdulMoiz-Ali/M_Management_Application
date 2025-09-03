import { useState, useEffect } from 'react';
import { authStorage } from '../services/authStorage';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);



    useEffect(() => {
        checkAuth();
    }, []);



    // Initialize - get current status without API call
    // useEffect(() => {
    //     licensecheck();
    // }, []);

    const initializeAuth = async () => {
        try {
            setLoading(true);
            const status = await authStorage.getLicenseStatus();

            setUser(prev => ({
                ...prev,
                isAccessGranted: status.accessGranted,
                deviceId: status.deviceId
            }));


        } catch (err) {
            setError(err.message);
            setUser(prev => ({
                ...prev,
                isAccessGranted: true
            }));
            // setUser({ isAccessGranted: true }); // Default allow on error
        } finally {
            setLoading(false);
        }
    };

    const licensecheck = async () => {
        try {
            setError(null);
            // Don't set loading here to avoid UI flicker

            const result = await authStorage.licensecheck();
            setUser(prev => ({
                ...prev,
                isAccessGranted: result.accessGranted,
                deviceId: result.deviceId
            }));
            // setUser({
            //     isAccessGranted: result.accessGranted,
            //     deviceId: result.deviceId
            // });

            return result;

        } catch (err) {
            setError(err.message);
            // Don't change auth state on error
            return {
                success: false,
                accessGranted: user?.isAccessGranted || true,
                error: err.message
            };
        }
    };

    const checkAuth = async () => {
        try {
            setLoading(true);
            const userInfo = await authStorage.getUserInfo();
            if (userInfo && userInfo.isAuthenticated) {
                setUser(userInfo);
            } else {
                setUser(null);
            }
        } catch (err) {
            setError(err.message);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            setError(null);
            setLoading(true);

            const result = await authStorage.login(credentials);

            if (result.success) {
                const userInfo = await authStorage.getUserInfo();
                setUser(userInfo);
                return { success: true, userInfo: userInfo, message: result.message };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };
    const logout = async () => {
        try {
            await authStorage.logout();
            setUser(null);
            setError(null);
            window.location.reload()

        } catch (err) {
            setError(err.message);
        }
    };

    const resetsoftware = async () => {
        try {
            const result = await authStorage.resetsoftware();
            if (result.success) {
                setUser(null);
                setError(null);
            } else {
                setError(result.error);
            }
            return result;
        } catch (err) {
            setError(err.message);
        }
    };

    const closeApp = async () => {
        try {
            await authStorage.closeApp();
        } catch (err) {
            setError(err.message);
        }
    };

    const changePassword = async (data) => {
        try {
            setError(null);
            const result = await authStorage.changePassword(data);


            if (result.success) {
                const userInfo = await authStorage.getUserInfo();
                setUser(userInfo);
            } else {
                setError(result.error);
            }

            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const sendemail = async (data) => {
        try {
            setError(null);
            const result = await authStorage.sendemail(data);


            if (result.success) {
                const userInfo = await authStorage.getUserInfo();
                setUser(userInfo);
            } else {
                setError(result.error);
            }

            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const changeUseremail = async (data) => {
        try {
            setError(null);
            const result = await authStorage.changeUseremail(data);

            if (result.success) {
                const userInfo = await authStorage.getUserInfo();
                setUser(userInfo);
            } else {
                setError(result.error);
            }

            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const basicInformation = async (data) => {
        try {
            setError(null);

            const result = await authStorage.basicInformation(data);
            if (result.success) {
                const userInfo = await authStorage.getUserInfo();
                setUser(userInfo);
            } else {
                setError(result.error);
            }

            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const additionalinfo = async (data) => {
        try {
            setError(null);

            const result = await authStorage.additionalinfo(data);
            if (result.success) {
                const userInfo = await authStorage.getUserInfo();
                setUser(userInfo);
            } else {
                setError(result.error);
            }

            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    return {
        user,
        loading,
        error,
        login,
        logout,
        changePassword,
        sendemail,
        changeUseremail,
        basicInformation,
        additionalinfo,
        resetsoftware,
        closeApp,
        refreshAuth: checkAuth,
        checkAuth,
        licensecheck,
        refreshAccessGranted: initializeAuth,
        clearError: () => setError(null)
    };
}