import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Context } from '../index';

const ProtectedRoute = observer(() => {
    const { store } = useContext(Context);
    return store.isAuth ? <Outlet /> : <Navigate to="/" replace />;
});

export default ProtectedRoute;
