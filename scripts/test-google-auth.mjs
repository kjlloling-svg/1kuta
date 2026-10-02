import 'dotenv/config';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import ts from 'typescript';
import {OAuth2Client} from 'google-auth-library';
// Isolate identity tests from the user's database and from Google's network.
process.env.DATABASE_PATH=`data/google-test-${randomUUID()}.sqlite`;
const temp=new URL('../lib/.google-auth-test.mjs',import.meta.url);
const source=readFileSync(new URL('../lib/google-auth.ts',import.meta.url),'utf8').replace("import { env } from './local-env';","import {localDatabase} from '../scripts/local-database.mjs'; const env={DB:localDatabase};");
writeFileSync(temp,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const original=OAuth2Client.prototype.getFederatedSignonCertsAsync;
OAuth2Client.prototype.getFederatedSignonCertsAsync=async()=>({certs:{test:publicKey.export({type:'spki',format:'pem'})},format:'PEM'});
const now=Math.floor(Date.now()/1000),sub=randomUUID(),nonce=randomUUID();
const profile={iss:'https://accounts.google.com',aud:process.env.GOOGLE_CLIENT_ID,sub,email:'google-test@example.com',email_verified:true,name:'Google Reader',picture:'https://example.com/avatar.png',iat:now,exp:now+3600,nonce};
function token(changes={},key=privateKey){const input=[{alg:'RS256',kid:'test'}, {...profile,...changes}].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');return `${input}.${sign('RSA-SHA256',Buffer.from(input),key).toString('base64url')}`;}
try{
 const {verifyGoogleToken,saveGoogleUser}=await import(temp.href);
 const verified=await verifyGoogleToken(token(),nonce);assert.equal(verified.sub,sub);
 for(const claims of [{aud:'other-client'},{iss:'https://attacker.invalid'},{exp:now-1},{nonce:'other-browser'},{email_verified:false}])await assert.rejects(()=>verifyGoogleToken(token(claims),nonce));
 const other=generateKeyPairSync('rsa',{modulusLength:2048});await assert.rejects(()=>verifyGoogleToken(token({},other.privateKey),nonce));
 await assert.rejects(()=>verifyGoogleToken('invalid',nonce));
 console.log('PASS: signed token accepted; wrong signature, audience, issuer, expiry, nonce and unverified email rejected');
 const first=await saveGoogleUser(verified);assert.ok(first);assert.equal(await saveGoogleUser({...verified,name:'Updated Reader'}),first);
 assert.equal(await saveGoogleUser({...verified,sub:randomUUID()}),null);
 const {sqlite}=await import('./local-database.mjs');const user=sqlite.prepare('SELECT * FROM users WHERE id=?').get(first);
 assert.equal(user.role,'public');assert.equal(user.name,'Updated Reader');assert.equal(user.picture,profile.picture);assert.equal(user.google_sub,sub);
 console.log('PASS: stable Google sub, profile update, avatar storage, public role and email collision protection');
 sqlite.close();
}finally{
 OAuth2Client.prototype.getFederatedSignonCertsAsync=original;unlinkSync(temp);
 for(const suffix of ['', '-wal','-shm'])try{unlinkSync(process.env.DATABASE_PATH+suffix);}catch{}
}
