import React, { FC, useContext, useState, useEffect } from 'react';
import { Context } from '../index';
import AccountService from '../services/AccountService';
import { observer } from 'mobx-react-lite';

const AccountPage: FC = () => {
    const { store } = useContext(Context);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [profileStatus, setProfileStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [profileMsg, setProfileMsg] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passStatus, setPassStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [passMsg, setPassMsg] = useState('');
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        setFirstName(store.user.firstName || '');
        setLastName(store.user.lastName || '');
        setPhone(store.user.phone || '');
    }, [store.user]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileStatus('idle');
        try {
            const res = await AccountService.updateProfile(firstName, lastName, phone);
            store.setUser({ ...store.user, ...res.data });
            setProfileStatus('success');
            setProfileMsg('Данные сохранены');
        } catch (err: any) {
            setProfileStatus('error');
            setProfileMsg(err.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setProfileLoading(false);
            setTimeout(() => setProfileStatus('idle'), 3000);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPassStatus('error');
            setPassMsg('Пароли не совпадают');
            return;
        }
        if (newPassword.length < 3) {
            setPassStatus('error');
            setPassMsg('Пароль должен быть не менее 3 символов');
            return;
        }
        setPassLoading(true);
        setPassStatus('idle');
        try {
            await AccountService.changePassword(oldPassword, newPassword);
            setPassStatus('success');
            setPassMsg('Пароль успешно изменён');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPassStatus('error');
            setPassMsg(err.response?.data?.message || 'Ошибка смены пароля');
        } finally {
            setPassLoading(false);
            setTimeout(() => setPassStatus('idle'), 3000);
        }
    };

    const avatarLetter = store.user.email ? store.user.email[0].toUpperCase() : '?';
    const displayName = [store.user.firstName, store.user.lastName].filter(Boolean).join(' ');

    return (
        <div className="account-page">
            <div className="account-header">
                <div className="account-avatar">{avatarLetter}</div>
                <div className="account-header__info">
                    {displayName && <div className="account-header__name">{displayName}</div>}
                    <div className="account-header__email">{store.user.email}</div>
                </div>
            </div>

            <div className="account-sections">
                {/* Профиль */}
                <div className="account-card">
                    <div className="account-card__title">Личные данные</div>
                    <form className="account-form" onSubmit={handleProfileSave}>
                        <div className="account-form__row">
                            <div className="form-group">
                                <label>Имя</label>
                                <input
                                    type="text"
                                    placeholder="Введите имя"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    maxLength={100}
                                />
                            </div>
                            <div className="form-group">
                                <label>Фамилия</label>
                                <input
                                    type="text"
                                    placeholder="Введите фамилию"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    maxLength={100}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Номер телефона</label>
                            <input
                                type="tel"
                                placeholder="+7 (999) 000-00-00"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                maxLength={30}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={store.user.email} disabled className="input--disabled" />
                        </div>
                        {profileStatus !== 'idle' && (
                            <div className={`alert alert--${profileStatus === 'success' ? 'success' : 'error'}`}>
                                {profileMsg}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="btn btn--primary account-form__submit"
                            disabled={profileLoading}
                        >
                            {profileLoading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </form>
                </div>

                {/* Смена пароля */}
                <div className="account-card">
                    <div className="account-card__title">Смена пароля</div>
                    <form className="account-form" onSubmit={handlePasswordSave}>
                        <div className="form-group">
                            <label>Текущий пароль</label>
                            <input
                                type="password"
                                placeholder="Введите текущий пароль"
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="account-form__row">
                            <div className="form-group">
                                <label>Новый пароль</label>
                                <input
                                    type="password"
                                    placeholder="Минимум 6 символов"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Подтвердите пароль</label>
                                <input
                                    type="password"
                                    placeholder="Повторите пароль"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {passStatus !== 'idle' && (
                            <div className={`alert alert--${passStatus === 'success' ? 'success' : 'error'}`}>
                                {passMsg}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="btn btn--primary account-form__submit"
                            disabled={passLoading}
                        >
                            {passLoading ? 'Сохранение...' : 'Изменить пароль'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default observer(AccountPage);
