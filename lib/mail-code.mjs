import {OAuth2Client} from 'google-auth-library';

export async function sendCode(email, code, purpose) {
  const {GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL} = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN ||
      !/^[^\s<>@]+@[^\s<>@]+$/.test(GMAIL_SENDER_EMAIL || '')) throw new Error('Mail configuration missing');
  const client = new OAuth2Client(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  client.setCredentials({refresh_token: GMAIL_REFRESH_TOKEN});
  const action = purpose === 'signup' ? 'sign-up' : 'password reset';
  const message = [
    'From: KUTA <' + GMAIL_SENDER_EMAIL + '>', 'To: ' + email,
    'Subject: Your KUTA ' + action + ' code', 'Content-Type: text/plain; charset=UTF-8', '',
    'Your KUTA ' + action + ' code is ' + code + '. It expires in 5 minutes.',
    'Enter it on the KUTA form where you requested it. If you did not request it, you can ignore this email.'
  ].join('\r\n');
  await client.request({method:'POST', url:'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    data:{raw:Buffer.from(message).toString('base64url')}, timeout:10000, retry:false});
}
