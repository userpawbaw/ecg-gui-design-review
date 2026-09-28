// Parse `window.X = {json};<newline>…` data files (data/bank.js, data/extension.js).
// The JSON ends at the first ';' followed by a line end — LF or CRLF (Windows checkouts, O-005).
function parseDataFile(text){
 const start=text.indexOf('=')+1,end=text.search(/;\r?\n/);
 if(start<1||end<0)throw Error('data file: expected "window.X = {…};" followed by a line end');
 return JSON.parse(text.slice(start,end));
}
module.exports={parseDataFile};
