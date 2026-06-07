import {IUser} from "../models/IUser";
import {IProduct} from "../models/IProduct";
import {makeAutoObservable} from "mobx";
import AuthService from "../services/AuthService";
import axios from 'axios';
import {AuthResponse} from "../models/response/AuthResponse";
import {API_URL} from "../http";

export default class Store {
    user = {} as IUser;
    isAuth = false;
    isLoading = false;
    error = '';
    usdRate = 90;
    showAuthModal = false;
    parsedProduct: IProduct | null = null;
    parsedUrl = '';

    constructor() {
        makeAutoObservable(this);
    }

    setAuth(bool: boolean) {
        this.isAuth = bool;
    }

    setUser(user: IUser) {
        this.user = user;
    }

    setLoading(bool: boolean) {
        this.isLoading = bool;
    }

    setError(message: string) {
        this.error = message;
    }

    setUsdRate(rate: number) {
        this.usdRate = rate;
    }

    setShowAuthModal(show: boolean) {
        this.showAuthModal = show;
    }

    setParsedProduct(product: IProduct | null) {
        this.parsedProduct = product;
    }

    setParsedUrl(url: string) {
        this.parsedUrl = url;
    }

    async login(email: string, password: string) {
        try {
            this.setError('');
            const response = await AuthService.login(email, password);
            localStorage.setItem('token', response.data.accessToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        } catch (e: any) {
            this.setError(e.response?.data?.message || 'Ошибка входа');
        }
    }

    async registration(email: string, password: string) {
        try {
            this.setError('');
            const response = await AuthService.registration(email, password);
            localStorage.setItem('token', response.data.accessToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        } catch (e: any) {
            this.setError(e.response?.data?.message || 'Ошибка регистрации');
        }
    }

    async logout() {
        try {
            await AuthService.logout();
            localStorage.removeItem('token');
            this.setAuth(false);
            this.setUser({} as IUser);
        } catch (e: any) {
            this.setError(e.response?.data?.message || 'Ошибка выхода');
        }
    }

    async checkAuth() {
        this.setLoading(true);
        try {
            const response = await axios.get<AuthResponse>(`${API_URL}/refresh`, {withCredentials: true});
            localStorage.setItem('token', response.data.accessToken);
            this.setAuth(true);
            this.setUser(response.data.user);
        } catch (e: any) {
            console.log(e.response?.data?.message);
        } finally {
            this.setLoading(false);
        }
    }
}
