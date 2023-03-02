const getOAuth = require('./getOAuthToken.js');
const randomstring = require("randomstring");
const { sha256 } = require("js-sha256");

const CryptoJS = require("crypto-js");
const {v4} = require('uuid');


class Token {
    constructor(algorithm) {
        this.algorithm = algorithm;
    }

    #generateCodeVerifier() {
        return new Promise((resolve, reject) => {
            try {
                const code_verifier = randomstring.generate(128);
                resolve(code_verifier)
            }
            catch (err) {
                console.error('Code Verifier error : ' + err.message);
                reject(err);
            }
        });
    };

    #hashSHA256(code_verifier) {
        return new Promise((resolve, reject) => {
            try {
                const encodedWord = CryptoJS.enc.Utf8.parse(sha256(code_verifier));
                resolve(encodedWord);
            }
            catch (err) {
                reject(err);
            }
        });
    };

    async #generateCodeChallenge() {
        try {
            const codeVerifier = await this.#generateCodeVerifier();
            const encodedWord = await this.#hashSHA256(codeVerifier);
            const codeChallenge = CryptoJS.enc.Base64.stringify(encodedWord);
            return { codeChallenge, codeVerifier };

        } catch (err) {
            console.error('generateCodeChallenge error:', err);
            throw new Error(err);
        }
    };

    async generateCode() {
        try {
            const code_challenge = this.#generateCodeChallenge();
            return code_challenge;
        } catch (err) {
            console.error('generateToken error:', err);
            throw new Error(err);
        }

    };

    async getOAuthToken(args) {
        try {
            const oauthResp = await getOAuth(args);
            return oauthResp;
        }
        catch (err) {
            throw (err);
        }
    };

    async generateUUID(){
        return new Promise((resolve, reject) => {
            try{
                resolve(`${v4()}`);
            } 
            catch(err){
                reject(err);
                
            }
        });
    }

    // async generateBearerToken(){

    // }
};

module.exports = Token;
