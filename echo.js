//jshint worker:true

function echo(evt){
  var msg = evt.data;

  if(msg.useTransfer != null){
    self.transfer = msg.useTransfer;
    return;
  }

  if(!self.transfer){
    postMessage(msg);
  } else {
    switch (typeof msg){
        case 'string':
        case 'number':
          postMessage(msg);
          break;
        case 'object':
          if(msg.buffer){
            postMessage(msg.buffer,[msg.buffer]);
          } else if(msg.byteLength){
            postMessage(msg,[msg]);
          } else {
            postMessage(msg);
          }
          break;
    }
  }
}

self.addEventListener('message', echo);
