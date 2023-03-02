const proxyAxios = require('./axiosRequest');

const generateOTP = async ({ url, sessionCookie, captchaValue, captchaTransactionId, aadhaarNumber, headers }, proxy) => {
    const axiosInstance = proxyAxios(proxy);
    headers['Cookie'] = sessionCookie
    const data = { uid: aadhaarNumber.toString('utf-8'), captcha: captchaValue, captchaTxnId: captchaTransactionId }
    try {
        const resp = await axiosInstance.post(url, data, {
            headers
        }).catch((err)=>{
            throw new Error(err);
        });

        return resp.data;
    }
    catch (err) {
        if (err.response) {
            throw (err);
        }
        throw new Error(err.message);
    }
};

module.exports = generateOTP;