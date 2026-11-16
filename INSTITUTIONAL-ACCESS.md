# KUTA sign-in and administrator setup

KUTA sends a six-digit code from its own Gmail mailbox when a student signs up or resets a password. Students use their school email and password to sign in. A code proves that the student can open that mailbox. The student's email password is never needed by KUTA.

## Set up the live site

1. **Required — Find the existing sender.** This is the mailbox students will see in the From line. On the KUTA computer, open PowerShell and enter the following lines.

   ```powershell
   Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
   notepad .env.gmail.local
   ```

   You should see four entries named `GMAIL_SENDER_EMAIL`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN`. The last three let KUTA send mail with the sender's permission. Google accepted the saved permission during implementation. Keep the file private. If Notepad asks to create a new file, cancel and check the folder. If a value is missing or Google later withdraws permission, follow “Reconnect the sender” below.

2. **Required — Add the sender settings to Vercel.** Vercel runs the live website and needs its own private copy of the four settings. Sign in to [Vercel](https://vercel.com/dashboard), open the **1kuta** project, then **Settings → Environment Variables**. Search for each of the four names from step 1. For a missing entry, choose **Add New**, paste its name, and paste only the value from the private file, without surrounding quotes. Choose **Production**, then **Save**. If it already exists but needs updating, use **… → Edit**. Use **Sensitive** for secrets if offered. Keep secrets out of GitHub, screenshots, and chat.

   You should see the four names assigned to Production. Also check that the existing `SESSION_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `BLOB_READ_WRITE_TOKEN` are present. These protect sign-ins, connect the database, and access private paper files. Keep their existing values. If a database setting is missing, open the private file `.env.vercel.local` in the same project folder and copy the matching value, or ask the project owner. If Save is unavailable, ask the Vercel project owner to make the change. [Vercel instructions](https://vercel.com/docs/environment-variables/managing-environment-variables)

3. **Required — Publish the updated website.** The public site needs the new code as well as the settings. If the update has already reached the project's production branch, open **Vercel → 1kuta → Deployments**, select that version, choose **… → Redeploy**, and confirm. If the code is still only on this computer, first publish the reviewed account changes to the GitHub branch connected to Production. In GitHub Desktop, select the KUTA repository and its production branch, review the **Changes** list, select only the intended files, enter a summary, choose **Commit**, then **Push origin**. If other unfinished work shares a file, have the project maintainer separate the changes before pushing.

   In Vercel you should see **Ready** for the new production deployment. Open [KUTA sign-in](https://kutaslsu.vercel.app/login). It should show **Institutional email**, **Password**, and **Forgot password?**. If it still shows a Google button, check the deployment's source commit and Production label. If the build failed, open its **Build Logs**. Redeploying an older version alone cannot install this update. [Vercel deployment instructions](https://vercel.com/docs/deployments/managing-deployments)

4. **Required — Verify one real school account.** This checks the website, database, and email delivery together. On the live sign-in page choose **Create an account**. Enter your full name, choose your program, enter an address you control ending exactly in `@slsu.edu.ph`, choose a KUTA password, and select **Send verification code**. Open the school inbox, enter the newest six-digit code on the same form, and select **Verify code**. Then choose **Sign in** and enter that email and password.

   Expect **Email verified** followed by successful sign-in. KUTA automatically creates two small tables in the existing database: `institutional_codes` for temporary verification requests and `institutional_accounts` for verified accounts and programs. Only successful verification creates or activates a user. You do not need to edit tables. If the form reports a service error, check the production database settings and that the database permission allows writes and table creation. If sign-up says it could not send the code, check the sender settings and redeploy. If it says it sent the code, check Spam and follow step 6.

5. **Required for an administrator — Grant the role privately.** An administrator is a verified user whose database role is set to **admin**. New users start as students. First have the intended administrator complete step 4 on the live site. On the KUTA computer, open PowerShell and enter:

   ```powershell
   Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
   npm run admin:grant
   ```

   At the prompt, type their **verified SLSU email** and press Enter. Expect **Administrator access granted**. Have them sign in or refresh and open the [research dashboard](https://kutaslsu.vercel.app/admin). They should see the record and publication controls. Download is shown on papers with an attachment. If the command reports no verified account, check the spelling and confirm they verified on the live site. If PowerShell reports a missing project file, repeat the first line. If the database connection fails, check `.env.vercel.local`. Repeat this step for each new administrator. Earlier SLSU accounts retain their existing role after they complete the new sign-up with the same address. Personal email addresses cannot be promoted or used to sign in.

6. **Optional — Address spam or blocked delivery.** Google hosting the recipient's inbox does not guarantee inbox placement. In the recipient's Gmail, open **More → Spam**. If you see the KUTA message, open it and choose **Report not spam**. Confirm its From address matches step 1. If the sender is a school mailbox and messages repeatedly go missing, give campus IT the sender and recipient addresses and time of the attempt. Ask them to check email delivery logs, quarantine, and the sender domain's SPF and DKIM settings. These are records that tell receiving mail servers which senders the school authorizes. For a sender ending in `@gmail.com`, Google manages the sender domain. Success means a fresh message arrives and its code works before expiry. [Google sender guidance](https://support.google.com/mail/answer/81126)

7. **Optional — Try it on your computer first.** In PowerShell, open the project folder as in step 5, run `npm run seed`, then `npm start`. Open [local sign-in](http://localhost:3000/login). The local server automatically reads the private Gmail sender file. You should see the same forms. This uses your computer's database and sends real email. For local administrator setup use `npm run admin:grant -- --local`. If the page cannot open, keep the PowerShell window running and check the address it prints. If packages are missing, run `npm ci` in the project folder using Node.js 24, then try again.

## Reconnect the sender only if needed

1. **Required only if replacing or reconnecting the sender — Choose a mailbox you control.** Use the existing sender if possible. To use a new institutional mailbox, ask the SLSU account administrator to create or assign it. Sign in to [Gmail](https://mail.google.com) as that sender and confirm the inbox opens. If access is denied, resolve mailbox access with its owner before continuing.

2. **Required only if the Gmail connection needs creating — Enable sending.** Open [Google Cloud Console](https://console.cloud.google.com), use the project selector at the top, and select the existing KUTA mail project. Go to **APIs & Services → Library**, search **Gmail API**, open it, and choose **Enable**. **Manage** means it is already enabled. If you cannot enable it, ask the Google Cloud project owner. In **Google Auth Platform → Branding**, complete any first-time setup with the app name KUTA and your support email. Under **Audience**, use **Internal** when the project and sender belong to the same school organization. If you use **External** with **Testing**, add the sender under **Test users**. Google's external testing permission for sending mail normally expires after seven days. For ongoing use, arrange production approval with the project owner, then grant fresh permission. [Google token rules](https://developers.google.com/identity/protocols/oauth2#expiration)

3. **Required only to generate new sender credentials — Create or open the mail connection.** Open **Google Auth Platform → Clients**. Choose the existing Gmail sending client, or select **Create client → Web application**, enter **KUTA email sender**, and add `https://developers.google.com/oauthplayground` under **Authorized redirect URIs**. Save. Under **Data Access → Add or remove scopes**, add the Gmail permission `https://www.googleapis.com/auth/gmail.send` and save if your project requests scope configuration. The client page provides a client ID and a client secret. Save the secret when Google displays it. If the old secret is unavailable, use the client's option to create a new one. [Google credential setup](https://developers.google.com/workspace/guides/create-credentials)

4. **Required only to renew sending permission — Authorize that mailbox.** Open [Google's OAuth Playground](https://developers.google.com/oauthplayground/), a Google tool for granting a website permission. Choose the settings gear, **Use your own OAuth credentials**, and enter that mail client's ID and secret. Choose **Offline** access and the consent prompt. Close settings. In Step 1 enter `https://www.googleapis.com/auth/gmail.send` and choose **Authorize APIs**. Select the sender mailbox and approve. In Step 2 choose **Exchange authorization code for tokens**. Copy the **Refresh token** to the private file in setup step 1. Set the client ID, client secret, and sender email there to the matching values. Update the four Vercel settings, redeploy, and test a new sign-up. If Google reports a redirect mismatch, check the exact redirect address from the previous step. If school policy blocks consent, ask campus IT to approve the mail client. [Google Gmail authorization guide](https://developers.google.com/workspace/gmail/api/auth/web-server)

## Try the access rules yourself

| Try this | What you should see |
|---|---|
| Open KUTA in a private browser window and browse papers. Choose Abstract or Cite. | Browsing works. Either button opens sign-in with a Create an account link. After sign-in, you return to the selected paper. |
| Sign up with a real SLSU email, including uppercase letters or surrounding spaces. | KUTA uses the trimmed lowercase address. The code arrives there. Sign-in only works after verification. |
| Use an address ending in gmail.com, a school subdomain, or slsu.edu.ph.example on any account form. | KUTA asks for an institutional address ending in @slsu.edu.ph. |
| Enter five incorrect six-digit codes, then the correct one. | The request is exhausted. Request a fresh code. |
| Wait five minutes before entering a code, or try using a verified code again. | The code is rejected. |
| Try to resend immediately, then after 60 seconds. | Resend becomes available after one minute. Only the newest code for that request works. |
| Sign in with a wrong password, then the correct one. | The wrong password fails. The correct one signs you in without an email code. |
| Use Forgot password with a registered school address and then a different, unregistered school address. | Both show the same message. Only the registered mailbox receives a reset code. |
| Request a reset, verify the code, enter a new password, then sign in. | The new password works. The old password and earlier signed-in sessions stop working. |
| Compare a guest, signed-in student, and administrator on a paper with a PDF. | Only the administrator sees full-paper and download controls and can change publication status in the dashboard. Only signed-in users can see the abstract and cite. |
