import {google} from 'googleapis';
import {resetEmail} from './password-reset.mjs';

export function gmailConfigured(){return ['GMAIL_CLIENT_ID','GMAIL_CLIENT_SECRET','GMAIL_REFRESH_TOKEN','GMAIL_SENDER_EMAIL'].every(name=>Boolean(process.env[name]?.trim()));}
export async function sendResetCode(email,code){
 if(!gmailConfigured())throw new Error('Gmail sending is not configured');
 const sender=resetEmail(process.env.GMAIL_SENDER_EMAIL),recipient=resetEmail(email);
 if(!/^\d{6}$/.test(code))throw new Error('Invalid verification code');
 const auth=new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID,process.env.GMAIL_CLIENT_SECRET);
 auth.setCredentials({refresh_token:process.env.GMAIL_REFRESH_TOKEN});
 // Never log this message, Google's request, or errors containing OAuth headers.
 const message=[`From: KUTA <${sender}>`,`To: ${recipient}`,'Subject: Your verification code','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','','Your verification code', '',code,'','This code expires in 10 minutes.','Enter it on the KUTA password-reset page to choose a new password.','If you did not request this code, you can ignore this email.'].join('\r\n');
 await google.gmail({version:'v1',auth}).users.messages.send({userId:'me',requestBody:{raw:Buffer.from(message).toString('base64url')}},{timeout:15000,retry:false});
}
