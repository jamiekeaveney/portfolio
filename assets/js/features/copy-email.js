/* Clipboard result is application state; hover/focus and every visual transition are CSS. */
(()=>{
 let clean=()=>{};
 function mount(page){
  clean();const abort=new AbortController();clean=()=>abort.abort();
  const buttons=new Set([...document.querySelectorAll('.nav-root [data-wf--super-button--variant^="copy-email"]'),...(page||document).querySelectorAll('[data-wf--super-button--variant^="copy-email"]')]);
  buttons.forEach(button=>{
   const email=button.querySelector('.btn_text')?.textContent.trim();if(!email)return;
   button.dataset.copyButton='';button.dataset.copyEmail=email;button.setAttribute('role','button');button.setAttribute('aria-label','Copy '+email+' to clipboard');button.setAttribute('data-barba-prevent','');
   let pending=false,epoch=0;
   const reset=()=>{epoch++;button.dataset.copyButton='';button.setAttribute('aria-label','Copy '+email+' to clipboard');};
   const copy=async event=>{event.preventDefault();event.stopPropagation();if(pending)return;pending=true;const token=epoch;
    try{await navigator.clipboard.writeText(email);if(token===epoch&&button.isConnected){button.dataset.copyButton='copied';button.setAttribute('aria-label','Email copied to clipboard');}}
    catch{button.setAttribute('aria-label','Copy unavailable. Email: '+email);}finally{pending=false;}
   };
   const opts={signal:abort.signal};button.addEventListener('click',copy,opts);button.addEventListener('keydown',e=>{if(e.key===' ')copy(e);},opts);
   button.addEventListener('pointerleave',reset,opts);button.addEventListener('blur',reset,opts);
  });
 }
 function boot(){mount(document.querySelector('[data-barba="container"]'));if(window.barba)barba.hooks.afterEnter(d=>mount(d.next.container));}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
