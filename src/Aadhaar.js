const getCookies = require('./utils/verifyCookies.js');
const img_to_text = require('./utils/img_to_text.js');
const generateCaptcha = require('./utils/generateCaptcha.js');
const Token = require('./utils/generateToken.js');
const generateOTP = require('./utils/generateOTP');
const eventEmitter = require('node:events');
const getProfile = require('./utils/getProfile.js');
const endpoints = require('../build/endpoints.js');

class Aadhaar extends eventEmitter {
    #proxy;
    #aadhaarNumber;
    #code_challenge;
    #code_verifier;
    #csrf;
    #uuid;
    #bearerToken;
    #sessionCookie;
    static #captchaLimit = { min: 5, max: 15 };
    static #maxCaptchaLimit = 7;
    static #currentCaptchaCount = 0;
    constructor({ aadhaarNumber, captchaLimit = 7, proxy = null }) {
        super();
        this.#proxy = proxy;
        if (captchaLimit > 15) {
            throw new Error(`Captcha limit cannot be less than ${Aadhaar.#captchaLimit.min} and greater than ${Aadhaar.#captchaLimit.max}`);
        }
        if (!aadhaarNumber) {
            throw new Error('Adhaar number needs to be passed as an argument')
        }
        Aadhaar.#maxCaptchaLimit = captchaLimit;
        this.#aadhaarNumber = aadhaarNumber;
    };

    static getMaxCaptchaLimit() {
        return Aadhaar.#maxCaptchaLimit;
    };

    static getCurrentCaptchaCount() {
        return Aadhaar.#currentCaptchaCount;
    };

    canGenerateCaptcha() {
        if (Aadhaar.getCurrentCaptchaCount() < Aadhaar.getMaxCaptchaLimit()) {
            return true;
        }
        return false;
    };

    async #setSessionCookie() {
        try {
            this.auth = new Token();
            const codeAuth = await this.auth.generateCode();
            this.#code_challenge = codeAuth.codeChallenge;
            this.#code_verifier = codeAuth.codeVerifier;
            this.oAuthUrl = (endpoints.getCookies.url).replace('codeChallenge', this.#code_challenge);
            const csrf_and_cookie = await getCookies(this.oAuthUrl, this.#proxy, endpoints.getCookies.headers);
            this.#sessionCookie = csrf_and_cookie.sessionCookie;
            this.#csrf = csrf_and_cookie.csrf;
            this.#uuid = await this.auth.generateUUID();
        }
        catch (err) {
            throw (err);
        }
    };

    async #getCaptcha() {
        try {
            if (this.canGenerateCaptcha()) {
                const captchaResponse = await generateCaptcha(endpoints.generateCaptcha.url, this.#sessionCookie, this.#proxy, endpoints.generateCaptcha.headers);
                Aadhaar.#currentCaptchaCount += 1;
                if (captchaResponse.sessionActive) {
                    const parsed = JSON.parse(captchaResponse.message);
                    const captcha = {
                        base64: parsed.imageBase64,
                        transactionId: parsed.transactionId
                    };

                    const captchaValue = await img_to_text(captcha.base64);
                    const otpStatus = await this.#getOTP(endpoints.generateOTP.url, captcha, captchaValue);
                    return { captchaValue, otpStatus };
                }
                else {
                    throw ('Session is not active!, source : ' + this.#sessionCookie);
                }
            }
            else {
                console.error('captcha generation limit exceeded, MaxLimit : ' + Aadhaar.getMaxCaptchaLimit());
                process.exit(0);
            }

        }
        catch (err) {
            throw (err);
        }
    };

    async #getOTP(url, captcha, captchaValue) {
        try {
            const otpResp = await generateOTP({
                url,
                sessionCookie: this.#sessionCookie,
                aadhaarNumber: this.#aadhaarNumber,
                captchaTransactionId: captcha.transactionId,
                captchaValue,
                headers: endpoints.generateOTP.headers
            }, this.#proxy);

            if (!otpResp.status && otpResp.message && otpResp.message.includes('Captcha')) {
                console.error(`captcha validation failed, validating captcha again, remaining Limit : ${Aadhaar.getMaxCaptchaLimit() - Aadhaar.getCurrentCaptchaCount()}`);
                this.#getCaptcha();
                return otpResp;
            }
            else if (otpResp.status) {
                this.emit('otp_generated');
                this.captchaValue = captchaValue;
                return { status: 'success', message: otpResp.message };
            }
            else {
                if (otpResp.message) {
                    throw (otpResp.message);
                }
                else {
                    throw ('an error occured while sending otp!');
                }
            }

        }
        catch (err) {
            throw (err);
        }
    };

    async authenticate(otp) {
        try {
            const args = {
                csrf: this.#csrf ? this.#csrf : console.error('csrf value not set'),
                captcha: this.captchaValue ? this.captchaValue : console.error('captcha value not set'),
                aadhaarNumber: this.#aadhaarNumber,
                otp,
                url: endpoints.getOauthToken.url,
                sessionCookie: this.#sessionCookie,
                code_verifier: this.#code_verifier,
                headers: endpoints.getOauthToken.headers
            };

            if (Object.values(args).some(value => value === null || value === undefined)) {
                throw ('an error occured because the value used to authenticate is null or undefined!');
            };
            const resp = await this.auth.getOAuthToken(args, this.#proxy);
            this.#bearerToken = resp.access_token;
            return resp;



        }
        catch (err) {
            throw (err);
        }

    };

    async getUserData() {
        try {
            const args = {
                url: endpoints.getProfile.url,
                id: this.#uuid,
                aadhaarNumber: this.#aadhaarNumber,
                bearerToken: this.#bearerToken,
                headers: endpoints.getProfile.headers
            };
            const userData = await getProfile(args);
            return userData;
        }
        catch (err) {
            throw (err);
        }
    }

    async start() {
        try {
            await this.#setSessionCookie();
            await this.#getCaptcha();
        }
        catch (err) {
            throw (err);
        }
    }
};

module.exports = Aadhaar;