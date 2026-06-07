const userService = require('../service/user-service');
const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/api-error');

class UserController {
    async registration(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()))
            }
            const {email, password} = req.body;
            const userData = await userService.registration(email, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(token);
        } catch (e) {
            next(e);
        }
    }

    async refresh(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            return res.json(users);
        } catch (e) {
            next(e);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const { firstName, lastName, phone } = req.body;
            const userId = req.user.id;
            const userDto = await userService.updateProfile(userId, firstName, lastName, phone);
            return res.json(userDto);
        } catch (e) {
            next(e);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            if (!newPassword || newPassword.length < 3) {
                return next(ApiError.BadRequest('Новый пароль должен содержать минимум 3 символа'));
            }
            await userService.changePassword(req.user.id, oldPassword, newPassword);
            return res.json({ message: 'Пароль успешно изменён' });
        } catch (e) {
            next(e);
        }
    }
}


module.exports = new UserController();
