import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../utils/api';

const ProtectedRoute = () => {
    const [token, setToken] = useState(() => getToken());
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const on = () => setIsOnline(true);
        const off = () => setIsOnline(false);
        const authChanged = () => setToken(getToken());
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        window.addEventListener('storage', authChanged);
        window.addEventListener('auth:changed', authChanged);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
            window.removeEventListener('storage', authChanged);
            window.removeEventListener('auth:changed', authChanged);
        };
    }, []);

    if (!token) return <Navigate to="/login" replace />;
    const topPaddingClass = isOnline ? '' : 'pt-10';

    return (
        <>
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-yellow-950 font-bold text-center py-2 shadow-lg">
                    오프라인 상태예요. 인터넷이 연결되면 다시 시도할게요.
                </div>
            )}
            <div className={topPaddingClass}>
                <Outlet />
            </div>
        </>
    );
};

export default ProtectedRoute;
