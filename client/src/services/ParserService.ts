import $api from '../http';
import { AxiosResponse } from 'axios';
import { IProduct } from '../models/IProduct';

export default class ParserService {
    static parse(url: string): Promise<AxiosResponse<IProduct>> {
        return $api.post<IProduct>('/parse', { url });
    }
}
