import React, { FC, useContext, useState } from 'react';
import { Context } from '../index';
import { observer } from 'mobx-react-lite';

const AuthModal: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { store } = useContext(Context);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tab, setTab] = useState<'login' | 'register'>('login');

    const handleSubmit = async () => {
        if (tab === 'login') {
            await store.login(email, password);
        } else {
            await store.registration(email, password);
        }
        if (store.isAuth) onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <button className="modal__close" onClick={onClose}>✕</button>

                <div className="auth-card__header" style={{ padding: '0 0 16px' }}>
                    <div className="auth-card__logo">
                        <span style={{ color: '#fff', fontWeight: 700 }}>A</span>
                    </div>
                    <h2 className="auth-card__title" style={{ fontSize: 20 }}>
                        Войдите, чтобы добавить в корзину
                    </h2>
                </div>

                <div className="auth-tabs" style={{ margin: '0 0 16px' }}>
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

                {store.error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{store.error}</div>}

                <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label>Пароль</label>
                    <input
                        type="password"
                        placeholder="Минимум 6 символов"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>
                <button className="btn btn--primary" onClick={handleSubmit}>
                    {tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </div>
        </div>
    );
};

export default observer(AuthModal);
