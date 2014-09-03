//jshint worker:true

self.addEventListener('message', flip);
function flip(evt){
  var msg = evt.data;
  var obj = false;
  if(msg.text){
    msg = msg.text;
    obj = true;
  }
  msg = msg.split('').reverse().join('');
  postMessage((obj) ? {text:msg} : msg);
}
