const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=/^\/(independent|prototype)\/(index\.html|app\.js|core\.js|style\.css)$|^\/data\/bank\.js$/;
http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!allowed.test(pathname)){res.writeHead(404);res.end('Not found');return;}
  const types={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
  fs.readFile(path.join(root,pathname),(err,bytes)=>{
    if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(pathname)]+'; charset=utf-8','Cache-Control':'no-store'});res.end(bytes);
  });
}).listen(8765,'0.0.0.0',()=>console.log('Scoped GUI preview on port 8765; only app assets are served.'));
