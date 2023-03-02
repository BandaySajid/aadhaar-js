const proxyAxios = require('./axiosRequest');

const getCookies = async (url, proxy, headers) => {
    const axiosInstance = proxyAxios(proxy);
    try {
        const resp = await axiosInstance.get(url, {
            headers,
        });
        const sessionCookie = (resp.headers['set-cookie'])[0].split(';')[0];
        try {
            const nextResp = await axiosInstance.get(url, {
                headers: {
                    ...headers,
                    "Cookie": sessionCookie
                }
            });

            if (nextResp.data) {
                const html = nextResp.data;
                const sliced = html.slice(html.indexOf('_csrf'), html.indexOf('_csrf') + 55);
                const csrf = sliced.split('=')[1].split('"')[1];
                return {sessionCookie, csrf};
            }
            return sessionCookie
        }
        catch (err) {
            throw(err);
        }
    } catch (err) {
        if(err.response){
            throw(err);
        }
        throw new Error(err.message);
    }
};

module.exports = getCookies;