// SSE relay that imitates bunched arrivals (user PC with a board + DL methods): it forwards the bridge stream, but every
// PERIOD ms it holds events for HOLD ms and then flushes them together. Other paths (/fe, /…) are passed through.
// node burst_relay.cjs <listenPort> <bridgeBase> [period ms] [hold ms]
const http=require('node:http');const [L,B,PER,HOLD]=[Number(process.argv[2]||8790),process.argv[3]||'http://127.0.0.1:8765',Number(process.argv[4]||450),Number(process.argv[5]||180)];
const u=new URL(B);
http.createServer((req,res)=>{
 if(req.url.startsWith('/stream')){
  const up=http.get({host:u.hostname,port:u.port,path:req.url},r=>{res.writeHead(r.statusCode,r.headers);let held=[],t0=Date.now();
   r.setEncoding('utf8');let buf='';
   r.on('data',c=>{buf+=c;let i;while((i=buf.indexOf('\n\n'))>=0){const ev=buf.slice(0,i+2);buf=buf.slice(i+2);
     const ph=(Date.now()-t0)%PER;if(ph<HOLD)held.push(ev);else{if(held.length){res.write(held.join(''));held=[];}res.write(ev);}}});
   const iv=setInterval(()=>{const ph=(Date.now()-t0)%PER;if(ph>=HOLD&&held.length){res.write(held.join(''));held=[];}},5);
   r.on('end',()=>{clearInterval(iv);res.end();});req.on('close',()=>{clearInterval(iv);up.destroy();});});
  up.on('error',()=>res.end());return;}
 const up=http.request({host:u.hostname,port:u.port,path:req.url,method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
 req.pipe(up);up.on('error',()=>{res.writeHead(502);res.end();});
}).listen(L,'127.0.0.1',()=>console.log('relay',L,'→',B,'period',PER,'hold',HOLD));
