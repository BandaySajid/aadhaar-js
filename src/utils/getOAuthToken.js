const proxyAxios = require('./axiosRequest');

const getOAuthToken = async ({ url, csrf, captcha, aadhaarNumber, otp, sessionCookie, code_verifier, headers }, proxy) => {
    const axiosInstance = proxyAxios(proxy);
    headers['Cookie'] = sessionCookie;
    const data = `_csrf=${csrf}&uid=${aadhaarNumber}&captcha=${captcha}&otp=${otp}&submit=Login`;
    try {
        const resp = await axiosInstance.post(url, data, {
            headers: {
                ...headers,
                "content-type": "application/x-www-form-urlencoded"
            },
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 || status <= 302; // Resolve only using this condition
            }
        }).catch((err) => {
            throw new Error(err);
        });

        if (resp.status === 302 && resp.headers.location) {
            const redirectUrl = resp.headers.location;
            const authResp = await axiosInstance.get(redirectUrl, {
                headers: {
                    ...headers
                },
                validateStatus: function (status) {
                    return status <= 303 || status >= 200; // Resolve only using this condition
                }
            }).catch((err) => {
                throw new Error(err);
            });

            if (authResp.request._header.includes('code')) {
                let nextHeaders = { ...headers };
                nextHeaders['Referer'] = 'https://tathya.uidai.gov.in/';
                const str = authResp.request._header;
                const nextRedUrl = 'https://myaadhaar.uidai.gov.in' + ((str.split('\n'))[0].split(' '))[1];
                const code = (str.split('\n')[0]).split(' ')[1].split('=')[1];
                const redirectResp = await axiosInstance.get(nextRedUrl, {
                    headers: nextHeaders
                }).catch((err) => {
                    throw new Error(err);
                });

                if (redirectResp.status === 200) {
                    let finalHeaders = { ...nextHeaders };
                    delete (finalHeaders['cookie']);
                    delete (finalHeaders['cache-control']);
                    delete (finalHeaders['sec-fetch-user']);
                    finalHeaders['Accept'] = 'application/json, text/plain, */*'
                    finalHeaders['Referer'] = 'https://myaadhaar.uidai.gov.in/';
                    finalHeaders['Sec-Fetch-Site'] = 'same-site';
                    finalHeaders['sec-fetch-mode'] = 'cors';
                    finalHeaders['Sec-Fetch-Dest'] = 'empty';
                    finalHeaders['Connection'] = 'keep-alive';
                    finalHeaders['Origin'] = 'https://myaadhaar.uidai.gov.in';
                    const finalTokenUrl = `https://tathya.uidai.gov.in/access/oauth/token?client_id=myAadhaar&grant_type=authorization_code&code_verifier=${code_verifier}&code=${code}`;

                    const finalResp = await axiosInstance.post(finalTokenUrl, {
                        headers
                    }).catch((err) => {
                        throw new Error(err);
                    });

                    return finalResp.data;


                }
            }
            else {
                throw new Error('abnormal behaviour while obtaining authorization code!');
            };

        }
        else {
            throw new Error("Login failed");
        }

    }
    catch (err) {
        if (err.response) {
            throw (err);
        }
        throw new Error(err.message);
    }
}

module.exports = getOAuthToken;