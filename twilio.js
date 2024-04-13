// require('dotenv').config();
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_TOKEN;
// const verifySid = process.env.VERIFYSID;
// const client = require("twilio")(accountSid, authToken);
// module.exports = {
//     sendOtp(mobileNo) {
//         client.verify.v2.services(verifySid)
//             .verifications
//             .create({ to: '+91' + mobileNo, channel: 'sms' })
//             .then(verification => console.log(verification.sid))
//             .catch(error=>{
                
//                 console.log(error.message);
//             })
//     },
//     verifyOtp(mobileNo, otp) {
        
//         return client.verify.v2.services(verifySid)
//             .verificationChecks
//             .create({ to: '+91' + mobileNo, code: otp })
//             .then(verification_check => {
//                 console.log(verification_check.status)
//                 if (verification_check.status == 'approved') {
//                     return true
//                 } else {
//                     return false
//                 }
//             }).catch(()=>{
//                 console.log("Twilio error")
//             })
//     }
// }