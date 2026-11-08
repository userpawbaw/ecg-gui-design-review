// 시험용 가짜 브리지(측정값 아님): 합성 심전도 + 잡음, 출력 3개. 250 Hz, 12 표본씩 48 ms.
const http=require('http');const clients=new Set();let i=0;
const ecg=t=>{const ph=(t*1.15)%1,g=(c,w,a)=>a*Math.exp(-(((ph-c)/w)**2));return g(.18,.025,.12)+g(.285,.008,-.12)+g(.30,.009,1.1)+g(.315,.008,-.25)+g(.55,.05,.3);};
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647-.5;};
const s=http.createServer((req,res)=>{const p=req.url.split('?')[0];
 if(p==='/fe'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({modes:{causal:{label:'인과 o1'},zerophase:{label:'블록 영위상'}},current:'causal'}));return;}
 if(p==='/stream'){res.writeHead(200,{'Content-Type':'text/event-stream'});clients.add(res);req.on('close',()=>clients.delete(res));return;}
 res.writeHead(404);res.end();});
setInterval(()=>{const n=12,fs=250,T=k=>(i+k)/fs;
 const clean=Array.from({length:n},(_,k)=>ecg(T(k))),noise=Array.from({length:n},(_,k)=>.12*Math.sin(2*Math.PI*60*T(k))+.06*rnd()+.15*Math.sin(2*Math.PI*.3*T(k)));
 const m={i,n,fs,raw:clean.map((v,k)=>2.3+v+noise[k]),ok:Array(n).fill(1),out:{M_FE:clean.map((v,k)=>v+.03*rnd()),M04:clean.map(v=>.97*v+.01*rnd()),M08:clean.map(v=>.99*v)},
  stat:{fe:'causal',lat_ms:36,lost:0,leadoff:0,bad:0,resync:0,qdrop:0,rtf:.2,gap_ms:48,src:'serial'}};
 i+=n;for(const c of clients)c.write('data: '+JSON.stringify(m)+'\n\n');},48);
s.listen(8765,'127.0.0.1',()=>console.log('bridge on 8765'));
