// Portable HTML export. The app runtime itself requires no Node or network.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'dist');
let html=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+fs.readFileSync(path.join(root,'prototype/style.css'),'utf8')+'</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,src)=>'<script>'+fs.readFileSync(path.resolve(root,'prototype',src),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
if(/<script[^>]+src=|<link[^>]+href=/.test(html))throw Error('External assets remain');
fs.mkdirSync(dest,{recursive:true});const target=path.join(dest,'ecg-signal-studio.html');fs.writeFileSync(target,html);
const receipt={file:'dist/ecg-signal-studio.html',bytes:Buffer.byteLength(html),sha256:crypto.createHash('sha256').update(html).digest('hex'),builtFrom:'prototype/ + data/bank.js + data/extension.js',externalAssets:0};
fs.writeFileSync(path.join(root,'verification/portable-build.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
