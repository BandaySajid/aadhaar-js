Aadhaar-JS Library
Aadhaar-JS is a JavaScript library that allows developers to easily retrieve a user's Aadhaar data for authentication, KYC (Know Your Customer), and other purposes. The library provides a simple and secure way to access Aadhaar data.
It is currently under development.

USAGE
`(async function () {
    try {
        const Aadhaar = require('aadhaar-js');
        const myAdhaar = new Aadhaar({ aadhaarNumber: '817442021574' });
        const { stdin: input, stdout: output } = require('process');
        const readline = require('readline/promises');


        await myAdhaar.start();
        myAdhaar.on('otp_generated', async () => {
            console.log('otp generated event');
            const rl = await readline.createInterface({ input, output });
            const otp = await rl.question('enter the otp : ');
            try {
                console.log('your entered otp is : ' + otp);
                const status = await myAdhaar.authenticate(otp);
                console.log(status);
                const data = await myAdhaar.getUserData();
                console.log(data);
            }
            catch (err) {
                console.log('you have probably entered a wrong otp');
            }
            await rl.close();
        })
    }
    catch (err) {
        console.log(err.message);
    }
})();
`
