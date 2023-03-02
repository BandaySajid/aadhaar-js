const axios = require('axios').default;
const http = require('http');
const https = require('https');

module.exports = function (proxies) {
    let httpProxies = [];
    // let httpsProxies = [];
    let currentHttpProxyIndex = 0;
    // let currentHttpsProxyIndex = 0;

    if (proxies) {
        httpProxies = proxies.map(proxy => `${proxy.ip}:${parseInt(proxy.port)}`);
        // httpsProxies = proxies.https.map(proxy => `${proxy.ip}:${parseInt(proxy.port)}`);
    }

    const axiosInstance = axios.create({
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true }),
        proxy: false,
        retry: 3,
        retryDelay: (retryCount) => {
            return Math.pow(2, retryCount) * 1000;
        },
    });

    axiosInstance.interceptors.request.use((config) => {
        if (httpProxies.length > 0) {
            currentHttpProxyIndex = Math.ceil(Math.random() * httpProxies.length);
            config.proxy = {
                host: httpProxies[currentHttpProxyIndex].split(':')[0],
                port: httpProxies[currentHttpProxyIndex].split(':')[1],
            };
            console.log('using proxy', config.proxy)
        }
        // else if (httpsProxies.length > 0 && config.url.startsWith('https')) {
        //     currentHttpsProxyIndex = Math.ceil(Math.random() * httpsProxies.length);
        //     config.proxy = {
        //         host: httpsProxies[currentHttpsProxyIndex].split(':')[0],
        //         port: httpsProxies[currentHttpsProxyIndex].split(':')[1],
        //     };
        // } 
        return config;
    });

    axiosInstance.interceptors.response.use(null, (error) => {
        // Check if the error is caused by a proxy issue
        if (error && error.code === 'ECONNRESET') {
            // Determine the current proxy index
            let proxyIndex = -1;
            if (error.config && error.config.proxy && error.config.proxy.host) {
                // proxyIndex = httpsProxies.indexOf(
                //     `https://${error.config.proxy.host}:${error.config.proxy.port}`
                // );
                // if (proxyIndex === -1) {
                proxyIndex = httpProxies.indexOf(
                    `http://${error.config.proxy.host}:${error.config.proxy.port}`
                );
                // }
            }
            if (proxyIndex > -1) {
                // Increment the index of the current proxy to try the next one
                // if (
                //     httpsProxies.length > 0 &&
                //     error.config.url.startsWith('https') &&
                //     proxyIndex === currentHttpsProxyIndex
                // ) {
                //     currentHttpsProxyIndex = (currentHttpsProxyIndex + 1) % httpsProxies.length;
                //     console.log(`Switching to HTTPS proxy ${httpsProxies[currentHttpsProxyIndex]}`);
                // } 
                if (
                    httpProxies.length > 0 &&
                    (!error.config.url.startsWith('https') || proxyIndex === currentHttpProxyIndex)
                ) {
                    currentHttpProxyIndex = (currentHttpProxyIndex + 1) % httpProxies.length;
                    console.log(`Switching to HTTP proxy ${httpProxies[currentHttpProxyIndex]}`);
                }
                // Retry the request with the next proxy
                const newConfig = { ...error.config };
                delete newConfig.proxy;
                return axiosInstance.request(newConfig);
            }
        }
        return Promise.reject(error);
    });

    return axiosInstance;
};
