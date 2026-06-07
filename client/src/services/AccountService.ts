import $api from '../http';
import { IUser } from '../models/IUser';
import { AxiosResponse } from 'axios';

export default class AccountService {
    static async updateProfile(firstName: string, lastName: string, phone: string): Promise<AxiosResponse<IUser>> {
        return $api.put<IUser>('/profile', { firstName, lastName, phone });
    }

    static async changePassword(oldPassword: string, newPassword: string): Promise<AxiosResponse<{ message: string }>> {
        return $api.put<{ message: string }>('/password', { oldPassword, newPassword });
    }
}
