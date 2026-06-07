const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

class UserService {
    async registration(email, password) {
        if (!password || password.length < 6) {
            throw ApiError.BadRequest('Пароль должен содержать минимум 6 символов');
        }
        const candidate = await UserModel.findByEmail(email);
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`);
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const user = await UserModel.create(email, hashPassword);
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto};
    }

    async login(email, password) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw ApiError.BadRequest('Пользователь с таким email не найден');
        }
        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto};
    }

    async logout(refreshToken) {
        await tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }
        const user = await UserModel.findById(userData.id);
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto};
    }

    async getAllUsers() {
        const users = await UserModel.findAll();
        return users.map(u => new UserDto(u));
    }

    async updateProfile(userId, firstName, lastName, phone) {
        const user = await UserModel.updateProfile(userId, firstName, lastName, phone);
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        return new UserDto(user);
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw ApiError.BadRequest('Неверный текущий пароль');
        }
        const hashed = await bcrypt.hash(newPassword, 3);
        await UserModel.updatePassword(userId, hashed);
    }
}

module.exports = new UserService();
