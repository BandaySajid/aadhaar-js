const proxyAxios = require('./axiosRequest');

const getProfile = async ({url, id, bearerToken, aadhaarNumber, headers}) => {
    const axiosInstance = proxyAxios(null);
    headers['authorization'] = `Bearer ${bearerToken}`;
    headers['x-request-id'] = id;

    const data = {
        uidNumber: aadhaarNumber,
    };
    try {
        const resp = await axiosInstance.post(url, data, {
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
module.exports = getProfile;