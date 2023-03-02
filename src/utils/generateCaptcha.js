const proxyAxios = require('./axiosRequest');

const generateCaptcha = async (url, sessionCookie, proxy, headers) => {
    const axiosInstance = proxyAxios(proxy);
    headers['Cookie'] = sessionCookie;
    try {
        const resp = await axiosInstance.get(url, {
            headers
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
module.exports = generateCaptcha;