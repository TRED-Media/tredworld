// Fixtures must never inherit a production API URL or transport from .env.
export function fixtureViteConfig(apiOrigin){
 const url=new URL(apiOrigin);if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Fixture API must use loopback');
 return {configFile:false,envDir:false,define:{'import.meta.env.VITE_GAME_API_URL':JSON.stringify(''),'import.meta.env.VITE_GAME_TRANSPORT':JSON.stringify('sse')},server:{host:'127.0.0.1',port:0,proxy:{'/api':{target:apiOrigin,changeOrigin:false}}}};
}
export async function isolateBrowser(context,origin,errors){
 const allowed=new URL(origin).origin;
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(['data:','blob:'].includes(url.protocol)||url.origin===allowed)return route.continue();errors.push('Blocked external fixture request: '+url.origin);return route.abort('blockedbyclient');});
}
