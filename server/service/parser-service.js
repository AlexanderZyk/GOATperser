const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ProductModel = require('../models/product-model');
const ApiError = require('../exceptions/api-error');

puppeteer.use(StealthPlugin());

const GOAT_APPAREL_CODES = {
    '100': 'XXS', '101': 'XS', '102': 'S', '103': 'M',
    '104': 'L', '105': 'XL', '106': '2XL', '107': '3XL',
    '108': '4XL', '109': '5XL',
};

// Коды GOAT для товаров без размера (аксессуары, часы, коллекционные и т.д.)
const isNonSizedCode = (s) => {
    const n = parseInt(s, 10);
    return !isNaN(n) && n >= 200;
};

const normalizeSize = (raw) => {
    if (!raw) return raw;
    const s = String(raw).trim();
    if (GOAT_APPAREL_CODES[s]) return GOAT_APPAREL_CODES[s];
    if (isNonSizedCode(s)) return 'OS';
    return s;
};

// Нормализуем GOAT CDN URL: убираем размер, фильтры и query-строку.
// https://image.goat.com/750x1000/filters:format(png):quality(100)/attachments/.../file.jpg?123
// -> https://image.goat.com/attachments/.../file.jpg
const normalizeGoatImg = (u) => {
    if (!u) return u;
    const m = u.match(/https:\/\/image\.goat\.com\/(?:\d+x\d+\/)?(?:filters:[^/]+\/)?(attachments\/[^?#"'\s\\]+)/);
    return m ? `https://image.goat.com/${m[1]}` : u.split('?')[0];
};

class ParserService {
    async parse(rawUrl) {
        let url;
        try {
            const parsed = new URL(rawUrl);
            url = `${parsed.origin}${parsed.pathname}`;
        } catch {
            throw ApiError.BadRequest('Некорректная ссылка. Убедитесь что URL начинается с https://');
        }

        if (!url.includes('goat.com')) {
            throw ApiError.BadRequest('Поддерживается только goat.com');
        }

        // Ссылка должна вести на конкретный товар, а не на категорию или главную
        const pathname = new URL(url).pathname.replace(/\/$/, '');
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length < 2 || pathname === '/sneakers' || pathname === '/apparel' || pathname === '/accessories') {
            throw ApiError.BadRequest('Ссылка ведёт на категорию, а не на конкретный товар. Откройте страницу товара и скопируйте её URL.');
        }

        const RETRIES = 3;
        for (let attempt = 1; attempt <= RETRIES; attempt++) {
            try {
                return await this._parseAttempt(url);
            } catch (err) {
                if (err.status) throw err; // ApiError — пробрасываем сразу без ретраев

                const msg = err.message || '';
                const isTimeout = msg.includes('TimeoutError') || msg.includes('timeout') || msg.includes('Timeout');
                const isConnectionError =
                    msg.includes('ERR_CONNECTION_CLOSED') ||
                    msg.includes('ERR_CONNECTION_RESET') ||
                    msg.includes('ERR_CONNECTION_REFUSED') ||
                    msg.includes('net::ERR_');

                if ((isConnectionError || isTimeout) && attempt < RETRIES) {
                    const delay = attempt * 3000 + Math.random() * 2000;
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }

                if (isTimeout) {
                    throw ApiError.BadRequest('Сервер GOAT не ответил вовремя. Попробуйте ещё раз через несколько секунд.');
                }
                if (isConnectionError) {
                    throw ApiError.BadRequest('Не удалось подключиться к GOAT. Проверьте интернет-соединение и попробуйте снова.');
                }
                throw ApiError.BadRequest('Не удалось получить данные о товаре. Попробуйте ещё раз.');
            }
        }
    }

    async _parseAttempt(url) {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--window-size=1440,900',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-pings',
                '--password-store=basic',
                '--use-mock-keychain',
            ],
        });

        try {
            const page = await browser.newPage();

            // Случайный user-agent из набора реальных браузеров
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            ];
            const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

            await page.setUserAgent(ua);
            await page.setViewport({
                width: 1440 + Math.floor(Math.random() * 100),
                height: 900 + Math.floor(Math.random() * 50),
            });
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            });

            // Перехватываем ответы GOAT API
            let apiProduct = null;
            let skuConditions = [];
            let extraImages = [];  // фото из product_template_pictures
            await page.setRequestInterception(true);
            page.on('request', req => req.continue());
            page.on('response', async res => {
                const resUrl = res.url();
                try {
                    if (
                        resUrl.includes('/api/v1/product_templates/') ||
                        resUrl.includes('/api/v1/products/')
                    ) {
                        const json = await res.json();
                        const pt =
                            json.product_template ||
                            json.productTemplate ||
                            json.product ||
                            json;
                        if (pt && (pt.name || pt.title)) apiProduct = pt;
                    }

                    // Все фото товара из отдельного эндпоинта
                    if (resUrl.includes('product_template_pictures')) {
                        const json = await res.json();
                        const pics =
                            json.product_template_pictures ||
                            json.productTemplatePictures ||
                            (Array.isArray(json) ? json : null);
                        if (pics && pics.length > 0) {
                            pics.forEach(p => {
                                const u = p.mainPictureUrl || p.main_picture_url || p.pictureUrl || p.picture_url || p.url;
                                const norm = normalizeGoatImg(u);
                                if (norm && !extraImages.includes(norm)) extraImages.push(norm);
                            });
                        }
                    }

                    // Цены по размерам
                    if (
                        resUrl.includes('sku_conditions') ||
                        resUrl.includes('listing_conditions') ||
                        resUrl.includes('product_variants') ||
                        resUrl.includes('sizings') ||
                        resUrl.includes('buy_bar_data') ||
                        resUrl.includes('lowest_prices') ||
                        resUrl.includes('market_data')
                    ) {
                        const json = await res.json();
                        const list =
                            json.sku_conditions ||
                            json.skuConditions ||
                            json.listing_conditions ||
                            json.listingConditions ||
                            json.product_variants ||
                            json.productVariants ||
                            json.sizings ||
                            json.lowest_prices ||
                            json.lowestPrices ||
                            (Array.isArray(json) ? json : null);
                        if (list && list.length > 0) skuConditions = list;
                    }
                } catch {}
            });

            // domcontentloaded менее агрессивен и реже триггерит Bot Fight Mode
            const navResponse = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            // Ждём подгрузки JS-рендера и API-запросов
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));

            // Проверяем HTTP-статус ответа
            const httpStatus = navResponse ? navResponse.status() : null;
            if (httpStatus === 404) {
                throw ApiError.BadRequest('Товар не найден на GOAT. Проверьте правильность ссылки.');
            }

            // Проверяем, не показал ли GOAT страницу блокировки / каптчу
            const pageTitle = await page.title();
            const blockedTitles = ['just a moment', 'access denied', '403', 'robot', 'captcha', 'attention required'];
            if (blockedTitles.some(t => pageTitle.toLowerCase().includes(t))) {
                throw ApiError.BadRequest('GOAT временно заблокировал запрос (защита от ботов). Подождите 1–2 минуты и попробуйте снова.');
            }

            const finalUrl = page.url();
            if (finalUrl.includes('/404') || finalUrl.includes('not-found')) {
                throw ApiError.BadRequest('Товар не найден. Проверьте правильность ссылки.');
            }

            // Проверяем текст страницы на признаки 404-контента
            const notFoundPhrases = [
                'this page could not be found',
                'page not found',
                'the page you requested could not be found',
            ];
            const bodyText = await page.evaluate(() =>
                document.body?.innerText?.toLowerCase() || ''
            );
            if (notFoundPhrases.some(p => bodyText.includes(p))) {
                throw ApiError.BadRequest('Товар не найден на GOAT. Проверьте правильность ссылки.');
            }

            // Прокручиваем карусель фото — GOAT грузит ракурсы лениво по клику
            await page.evaluate(async () => {
                // Ищем кнопку "следующее фото" по разным возможным селекторам
                const selectors = [
                    'button[aria-label*="next" i]',
                    'button[aria-label*="forward" i]',
                    'button[aria-label*="Next" i]',
                    '[class*="nextButton"]',
                    '[class*="next-button"]',
                    '[class*="carouselNext"]',
                    '[class*="carousel-next"]',
                    '[class*="SliderNext"]',
                    '[class*="arrow"][class*="right"]',
                    '[data-testid*="next"]',
                ];
                let btn = null;
                for (const sel of selectors) {
                    btn = document.querySelector(sel);
                    if (btn) break;
                }
                if (!btn) return;
                // Кликаем до 15 раз с паузой, чтобы все ракурсы загрузились
                for (let i = 0; i < 15; i++) {
                    btn.click();
                    await new Promise(r => setTimeout(r, 400));
                }
            });

            // Ждём загрузки всех lazy-фото и цен
            await new Promise(r => setTimeout(r, 2000));

            // --- Способ 1: __NEXT_DATA__ ---
            const nextData = await page.evaluate(() => {
                const el = document.getElementById('__NEXT_DATA__');
                return el ? JSON.parse(el.textContent) : null;
            });

            let product = null;

            if (nextData) {
                product = this._fromNextData(nextData, url);
            }

            // --- Способ 2: перехваченный API ---
            if ((!product || !product.name) && apiProduct) {
                product = this._fromApiObject(apiProduct, url);
            }

            // Обогащаем цены по размерам из skuConditions
            if (product && skuConditions.length > 0) {
                product = this._mergePrices(product, skuConditions);
            }

            // --- Способ 3: DOM + regex на весь HTML ---
            if (!product || !product.images || product.images.length === 0) {
                const domProduct = await this._fromDOM(page, url);
                if (!product) product = domProduct;
                else {
                    if (!product.images || product.images.length === 0) product.images = domProduct.images;
                    if (!product.sizes || product.sizes.length === 0) product.sizes = domProduct.sizes;
                    if (!product.name) product.name = domProduct.name;
                }
            }

            // Добавляем фото из product_template_pictures (разные ракурсы)
            if (product && extraImages.length > 0) {
                const existing = new Set(product.images);
                for (const img of extraImages) {
                    if (!existing.has(img)) {
                        product.images.push(img);
                        existing.add(img);
                    }
                }
                product.images = product.images.slice(0, 20);
            }

            if (!product || !product.name) {
                if (product && product.images && product.images.length > 0) {
                    throw ApiError.BadRequest('Не удалось получить название товара. Попробуйте обновить страницу GOAT и скопировать ссылку заново.');
                }
                throw ApiError.BadRequest('Не удалось получить данные о товаре. Убедитесь что ссылка ведёт на конкретный товар goat.com, а не на категорию или поиск.');
            }

            const saved = await ProductModel.upsert(
                product.url,
                product.name,
                product.brand || null,
                product.images || [],
                product.lowestPrice || null,
                product.sizes || []
            );

            return { ...product, id: saved.id };
        } finally {
            await browser.close();
        }
    }

    _fromNextData(data, url) {
        try {
            const props = data?.props?.pageProps;
            if (!props) return null;

            // GOAT использует разные ключи в зависимости от версии
            const pt =
                props.productTemplate ||
                props.product ||
                props.data?.productTemplate ||
                props.data?.product ||
                props.initialData?.productTemplate;

            if (!pt) return null;

            return this._fromApiObject(pt, url);
        } catch {
            return null;
        }
    }

    _fromApiObject(pt, url) {
        // Извлекаем изображения — GOAT использует разные форматы
        const images = [];

        const addImg = (u) => {
            if (!u || typeof u !== 'string' || !u.startsWith('http')) return;
            const norm = normalizeGoatImg(u);
            if (!images.includes(norm)) images.push(norm);
        };

        // Сначала ракурсы с фоном (productTemplateExternalPictures)
        const extPics = pt.productTemplateExternalPictures || pt.product_template_external_pictures || [];
        extPics.forEach(p => {
            addImg(p.mainPictureUrl || p.main_picture_url || p.pictureUrl || p.picture_url);
        });

        // Cutout-фото без фона добавляем только если ракурсов нет
        if (images.length === 0) {
            addImg(pt.main_picture_url || pt.mainPictureUrl);
            addImg(pt.picture_url || pt.pictureUrl);

            const picList = pt.pictures || pt.productPictures || pt.images || [];
            picList.forEach(p => {
                if (typeof p === 'string') addImg(p);
                else {
                    addImg(p.url || p.mainPictureUrl || p.main_picture_url || p.src);
                }
            });
        }

        // Если изображений нет — вытаскиваем все goat-URLs из JSON объекта
        if (images.length === 0) {
            const raw = JSON.stringify(pt);
            const matches = raw.match(/https:\/\/image\.goat\.com\/[^"\\]+/g) || [];
            matches.forEach(u => addImg(u.split('\\')[0]));
        }

        // Размеры
        const sizeList =
            pt.size_range ||
            pt.sizeRange ||
            pt.size_options ||
            pt.sizeOptions ||
            pt.available_sizes ||
            pt.availableSizes ||
            pt.variants ||
            pt.sizings ||
            [];

        const sizes = sizeList.map(s => {
            if (typeof s === 'string' || typeof s === 'number') {
                return { size: normalizeSize(String(s)), price: null };
            }
            const size = normalizeSize(
                s.presentation ||
                s.size ||
                s.value ||
                s.us_size ||
                s.usSize ||
                String(s)
            );
            const rawCents =
                s.lowest_price_cents ??
                s.lowestPriceCents ??
                s.price_cents ??
                s.priceCents;
            const priceCents = parseInt(rawCents, 10);
            const price = !isNaN(priceCents) && priceCents > 0
                ? `$${Math.round(priceCents / 100)}`
                : null;
            return { size, price };
        }).filter(s => s.size && s.size !== 'undefined');

        const rawLowest =
            pt.lowest_price_cents ??
            pt.lowestPriceCents ??
            pt.retail_price_cents ??
            pt.retailPriceCents;
        const lowestCents = parseInt(rawLowest, 10);
        const lowestPrice = !isNaN(lowestCents) && lowestCents > 0
            ? `$${Math.round(lowestCents / 100)}`
            : null;

        // Для товаров без размеров (аксессуары, парфюм и т.д.) — добавляем "OS"
        if (sizes.length === 0 && lowestPrice) {
            sizes.push({ size: 'OS', price: lowestPrice });
        }

        return {
            url,
            name: pt.name || pt.title,
            brand: pt.brand_name || pt.brandName || pt.brand,
            images: images.slice(0, 20),
            lowestPrice,
            sizes,
        };
    }

    _mergePrices(product, skuConditions) {
        // Нормализуем буквенный размер одежды к каноническому написанию
        const canonicalApparel = (s) => {
            if (!s) return s;
            const u = String(s).toUpperCase().trim();
            const aliases = {
                'XXL': '2XL', 'XXXL': '3XL', '3XL': '3XL',
                'XXXXL': '4XL', '4XL': '4XL',
                'XXXXXL': '5XL', '5XL': '5XL',
            };
            return aliases[u] !== undefined ? aliases[u] : u;
        };

        // Строим карту размер -> минимальная цена
        const priceMap = {};
        skuConditions.forEach(sku => {
            const rawSize =
                sku.sizeOption?.presentation ||
                sku.size_option?.presentation ||
                sku.size ||
                sku.presentation ||
                sku.us_size ||
                sku.usSize ||
                'OS';

            // Если это числовой GOAT-код — переводим через таблицу, иначе канонизируем
            const size = GOAT_APPAREL_CODES[String(rawSize)]
                ? GOAT_APPAREL_CODES[String(rawSize)]
                : isNonSizedCode(String(rawSize))
                    ? 'OS'
                    : canonicalApparel(rawSize);

            const priceFields = [
                sku.lowestPriceCents,
                sku.lowest_price_cents,
                sku.instantShipLowestPriceCents,
                sku.instant_ship_lowest_price_cents,
                sku.lastSoldPriceCents,
                sku.last_sold_price_cents,
                sku.priceCents,
                sku.price_cents,
            ];

            const extractCents = (val) => {
                if (val == null) return null;
                if (typeof val === 'object') {
                    return val.amountUsdCents ?? val.amount ?? val.value ?? null;
                }
                return val;
            };

            let minCents = null;
            for (const field of priceFields) {
                const c = parseInt(extractCents(field), 10);
                if (!isNaN(c) && c > 0) {
                    if (minCents === null || c < minCents) minCents = c;
                }
            }

            if (size && minCents !== null) {
                const sizeKey = String(size).trim();
                if (!priceMap[sizeKey] || minCents < priceMap[sizeKey]) {
                    priceMap[sizeKey] = minCents;
                }
            }
        });

        if (Object.keys(priceMap).length === 0) return product;

        // Если размеров не было — создаём из skuConditions
        if (!product.sizes || product.sizes.length === 0) {
            product.sizes = Object.entries(priceMap)
                .sort((a, b) => {
                    const na = parseFloat(a[0]);
                    const nb = parseFloat(b[0]);
                    if (isNaN(na) && isNaN(nb)) return a[0].localeCompare(b[0]);
                    if (isNaN(na)) return 1;
                    if (isNaN(nb)) return -1;
                    return na - nb;
                })
                .map(([size, cents]) => ({ size, price: `$${Math.round(cents / 100)}` }));
        } else {
            // Обогащаем существующие размеры ценами, нормализуя ключи с обеих сторон
            product.sizes = product.sizes.map(s => {
                const key = isNonSizedCode(String(s.size))
                    ? 'OS'
                    : canonicalApparel(s.size);
                return {
                    ...s,
                    price: priceMap[key]
                        ? `$${Math.round(priceMap[key] / 100)}`
                        : s.price,
                };
            });
        }

        // Финальный fallback: если цены так и не нашлись, но есть OS-цена или единственная цена
        const unpricedSizes = product.sizes.filter(s => !s.price);
        if (unpricedSizes.length > 0) {
            const fallbackCents = priceMap['OS'] ||
                (Object.keys(priceMap).length === 1 ? Object.values(priceMap)[0] : null);
            if (fallbackCents) {
                const fallbackPrice = `$${Math.round(fallbackCents / 100)}`;
                product.sizes = product.sizes.map(s => ({
                    ...s,
                    price: s.price || fallbackPrice,
                }));
            }
        }

        return product;
    }

    async _fromDOM(page, url) {
        const result = await page.evaluate((pageUrl) => {
            const normalize = (u) => {
                if (!u) return null;
                const m = u.match(/https:\/\/image\.goat\.com\/(?:\d+x\d+\/)?(?:filters:[^/]+\/)?(attachments\/[^?#"'\s\\]+)/);
                return m ? `https://image.goat.com/${m[1]}` : (u.startsWith('http') ? u.split('?')[0] : null);
            };

            const seen = new Set();
            const images = [];
            const addUrl = (u) => {
                const norm = normalize(u);
                if (norm && norm.includes('image.goat.com') && !norm.includes('avatar') && !seen.has(norm)) {
                    seen.add(norm);
                    images.push(norm);
                }
            };

            // Собираем URL из всех <img> тегов (src, srcset, data-src, data-srcset)
            document.querySelectorAll('img').forEach(img => {
                addUrl(img.src);
                addUrl(img.dataset.src);
                // srcset может содержать несколько URL с разными размерами — берём каждый
                const srcset = img.srcset || img.dataset.srcset || '';
                srcset.split(',').forEach(part => addUrl(part.trim().split(/\s+/)[0]));
            });

            // Дополнительно из <source> внутри <picture>
            document.querySelectorAll('source').forEach(src => {
                const srcset = src.srcset || '';
                srcset.split(',').forEach(part => addUrl(part.trim().split(/\s+/)[0]));
            });

            // Если ничего не нашли — fallback на regex по всему HTML
            if (images.length === 0) {
                const html = document.documentElement.innerHTML;
                const rawUrls = html.match(/https:\/\/image\.goat\.com\/[^"'\s\\]+/g) || [];
                rawUrls.forEach(addUrl);
            }

            const result_images = images.slice(0, 20);

            // Имя товара
            const name =
                document.querySelector('h1')?.textContent?.trim() ||
                document.querySelector('[class*="ProductName"], [class*="product-name"], [data-qa="product-name"]')?.textContent?.trim();

            // Бренд
            const brand =
                document.querySelector('[class*="BrandName"], [class*="brand-name"], [data-qa="brand-name"]')?.textContent?.trim();

            // Цена
            const priceEl = document.querySelector(
                '[class*="LowestAsk"], [class*="lowest-ask"], [data-qa="lowest-price"], [class*="Price"]'
            );
            const lowestPrice = priceEl?.textContent?.trim().replace(/[^\d$.,]/g, '') || null;

            // Размеры из DOM
            const sizeEls = [
                ...document.querySelectorAll(
                    '[class*="SizeButton"], [class*="size-button"], [class*="sizeButton"], [data-qa*="size"]'
                )
            ];
            const sizes = sizeEls
                .map(el => ({ size: el.textContent?.trim(), price: null }))
                .filter(s => s.size && s.size.length > 0 && s.size.length < 15);

            return { url: pageUrl, name, brand, images: result_images, lowestPrice, sizes };
        }, url);

        return result;
    }
}

module.exports = new ParserService();
