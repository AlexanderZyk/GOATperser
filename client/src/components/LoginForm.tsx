import React, {FC, useContext, useState} from 'react';
import {Context} from "../index";
import {observer} from "mobx-react-lite";

const LoginForm: FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const {store} = useContext(Context);

    const handleSubmit = () => {
        if (tab === 'login') {
            store.login(email, password);
        } else {
            store.registration(email, password);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const avatarLetter = email ? email[0].toUpperCase() : '?';

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__header">
                    <div className="auth-card__logo">
                        <span style={{color: '#fff', fontWeight: 700}}>A</span>
                    </div>
                    <h1 className="auth-card__title">
                        {tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
                    </h1>
                    <p className="auth-card__subtitle">
                        {tab === 'login' ? 'Войдите в свой аккаунт' : 'Зарегистрируйтесь бесплатно'}
                    </p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tabs__btn ${tab === 'login' ? 'auth-tabs__btn--active' : ''}`}
                        onClick={() => { setTab('login'); store.setError(''); }}
                    >
                        Вход
                    </button>
                    <button
                        className={`auth-tabs__btn ${tab === 'register' ? 'auth-tabs__btn--active' : ''}`}
                        onClick={() => { setTab('register'); store.setError(''); }}
                    >
                        Регистрация
                    </button>
                </div>

                <div className="auth-form">
                    {store.error && (
                        <div className="alert alert--error">{store.error}</div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="form-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            placeholder="Минимум 6 символов"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <button className="btn btn--primary" onClick={handleSubmit}>
                        {tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default observer(LoginForm);
