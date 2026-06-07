const parserService = require('../service/parser-service');

class ParserController {
    async parse(req, res, next) {
        try {
            const { url } = req.body;
            if (!url) return next(require('../exceptions/api-error').BadRequest('Укажите ссылку'));
            const product = await parserService.parse(url);
            return res.json(product);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new ParserController();
