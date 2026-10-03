// Keep the existing D1-shaped query interface; only the storage driver changes.
export const usesRemoteDatabase=()=>Boolean(process.env.VERCEL||process.env.TURSO_DATABASE_URL);
let databasePromise;
async function database(){
 if(!databasePromise){
  databasePromise=(async()=>{
   if(!usesRemoteDatabase())return (await import('../scripts/local-database.mjs')).localDatabase;
   const url=process.env.TURSO_DATABASE_URL,authToken=process.env.TURSO_AUTH_TOKEN;
   if(!url||!authToken)throw new Error('Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before running on Vercel.');
   if(!/^(libsql|https):\/\//.test(url))throw new Error('TURSO_DATABASE_URL must be a remote database URL.');
   const {createClient}=await import('@libsql/client/web');
   return createRemoteDatabase(createClient({url,authToken}));
  })().catch(error=>{databasePromise=undefined;throw error;});
 }
 return databasePromise;
}
export function createRemoteDatabase(client){
 const meta=result=>({meta:{changes:result.rowsAffected,last_row_id:Number(result.lastInsertRowid||0)}});
 class Statement{
  constructor(sql,values=[]){this.sql=sql;this.values=values;}
  bind(...values){return new Statement(this.sql,values);}
  async first(){const result=await client.execute({sql:this.sql,args:this.values});return result.rows[0]||null;}
  async all(){const result=await client.execute({sql:this.sql,args:this.values});return {results:result.rows};}
  async run(){return meta(await client.execute({sql:this.sql,args:this.values}));}
 }
 return {prepare:sql=>new Statement(sql),async batch(statements){return (await client.batch(statements.map(s=>({sql:s.sql,args:s.values})),'write')).map(meta);}};
}
class DeferredStatement{
 constructor(sql,values=[]){this.sql=sql;this.values=values;}
 bind(...values){return new DeferredStatement(this.sql,values);}
 async first(){return (await database()).prepare(this.sql).bind(...this.values).first();}
 async all(){return (await database()).prepare(this.sql).bind(...this.values).all();}
 async run(){return (await database()).prepare(this.sql).bind(...this.values).run();}
}
export const runtimeDatabase={prepare:sql=>new DeferredStatement(sql),async batch(statements){const db=await database();return db.batch(statements.map(s=>db.prepare(s.sql).bind(...s.values)));}};
