const params=new URLSearchParams(location.hash.slice(1));
history.replaceState(null,'',location.pathname);
if(window.opener){
  window.opener.postMessage({type:'tdsp:portfolio-x',code:params.get('code'),error:params.get('error')},location.origin);
  document.getElementById('status').textContent='Return to Portfolio to continue.';
}else document.getElementById('status').textContent='Open Portfolio and start X sign-in again.';
