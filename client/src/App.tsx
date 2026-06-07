import React, { FC, useContext, useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { Context } from './index';
import { observer } from 'mobx-react-lite';

const ParserPage = lazy(() => import('./components/ParserPage'));
const CartPage = lazy(() => import('./components/CartPage'));
const OrdersPage = lazy(() => import('./components/OrdersPage'));
const AccountPage = lazy(() => import('./components/AccountPage'));
const AdminPage = lazy(() => import('./components/AdminPage'));

const LoadingFallback = () => (
    <div className="loading-screen">
        <div className="spinner"></div>
    </div>
);

const App: FC = () => {
    const { store } = useContext(Context);
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        document.documentElement.dataset.theme = isDark ? 'dark' : '';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            store.checkAuth();
        }
        fetch('https://www.cbr-xml-daily.ru/daily_json.js')
            .then(r => r.json())
            .then(data => store.setUsdRate(Math.round(data.Valute.USD.Value)))
            .catch(() => {});
    }, [store]);

    if (store.isLoading) {
        return <LoadingFallback />;
    }

    const displayName = [store.user.firstName, store.user.lastName].filter(Boolean).join(' ');
    const avatarLetter = displayName
        ? displayName[0].toUpperCase()
        : store.user.email
        ? store.user.email[0].toUpperCase()
        : '?';

    return (
        <div className="dashboard">
            <nav className="dashboard__navbar">
                <span className="navbar__brand">GOAT Parser</span>

                {store.isAuth && (
                    <div className="navbar__tabs">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) => `navbar__tab${isActive ? ' navbar__tab--active' : ''}`}
                        >
                            Поиск
                        </NavLink>
                        <NavLink
                            to="/cart"
                            className={({ isActive }) => `navbar__tab${isActive ? ' navbar__tab--active' : ''}`}
                        >
                            Корзина
                        </NavLink>
                        <NavLink
                            to="/orders"
                            className={({ isActive }) => `navbar__tab${isActive ? ' navbar__tab--active' : ''}`}
                        >
                            Заказы
                        </NavLink>
                        {store.user.isAdmin && (
                            <NavLink
                                to="/admin"
                                className={({ isActive }) => `navbar__tab navbar__tab--admin${isActive ? ' navbar__tab--active' : ''}`}
                            >
                                Администратор
                            </NavLink>
                        )}
                    </div>
                )}

                <div className="navbar__user">
                    <button
                        className="theme-toggle"
                        onClick={() => setIsDark(d => !d)}
                        title={isDark ? 'Светлая тема' : 'Тёмная тема'}
                    >
                        {isDark ? '☀' : '☽'}
                    </button>
                    {store.isAuth ? (
                        <>
                            <div className="navbar__avatar">{avatarLetter}</div>
                            <NavLink
                                to="/account"
                                className="navbar__email navbar__email--clickable"
                                title="Настройки аккаунта"
                            >
                                {displayName || store.user.email}
                            </NavLink>
                            <button className="btn btn--danger" onClick={() => store.logout()}>
                                Выйти
                            </button>
                        </>
                    ) : (
                        <button className="btn btn--primary" onClick={() => store.setShowAuthModal(true)}>
                            Войти
                        </button>
                    )}
                </div>
            </nav>

            <div className="dashboard__content">
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<ParserPage />} />
                            <Route element={<ProtectedRoute />}>
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/orders" element={<OrdersPage />} />
                                <Route path="/account" element={<AccountPage />} />
                                {store.user.isAdmin && (
                                    <Route path="/admin" element={<AdminPage />} />
                                )}
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>

            {store.showAuthModal && (
                <AuthModal onClose={() => store.setShowAuthModal(false)} />
            )}
        </div>
    );
};

export default observer(App);
