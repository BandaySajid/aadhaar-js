const Tesseract = require('tesseract.js');
const { Buffer } = require('node:buffer');
const extractText = async (base64ImageData) => {
    try {
        const buf = Buffer.from(base64ImageData, 'base64');
        const imageText = (await Tesseract.recognize(buf, 'eng')).data.text.trim();
        return imageText.replaceAll('\n', '').replaceAll(' ', '');
    }
    catch (err) {
        return err;
    }
};

module.exports = extractText;