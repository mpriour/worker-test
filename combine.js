//jshint worker:true

function combine(evt){
  var msg = evt.data;
  var s = msg.from || 1;
  var e = msg.to || msg.value;
  var inst = msg.insturment;
  var c = e,
      ts = now(),
      te;
  while(--e >= s){
    c += e;
  }
  te = now();
  if(inst){
    postMessage({result:c, duration: te-ts});
  } else {
    postMessage(c);
  }
}

var now = (self.performance) ? self.performance.now : (function(){return +(new Date());});

self.addEventListener('message', combine);
