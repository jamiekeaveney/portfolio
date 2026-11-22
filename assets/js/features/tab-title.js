(() => {
  const messages = ['Back in a frame.', 'Holding this frame.', 'Paused on a good bit.', 'Roll it back.', 'See you in the next cut.'];
  let index = 0, awayTitle;
  try { index = Number(sessionStorage.getItem('jk-away-index')) || 0; } catch {}
  const title = document.querySelector('title');
  if (!title) return;
  let pageTitle = document.title;
  let away = false;
  function leave() {
    if (away) return;
    pageTitle = document.title;
    awayTitle = messages[index % messages.length];
    index = (index + 1) % messages.length;
    try { sessionStorage.setItem('jk-away-index', String(index)); } catch {}
    away = true;
    document.title = awayTitle;
  }
  function returnToPage() {
    if (document.hidden) return;
    if (away && document.title === awayTitle) document.title = pageTitle;
    away = false;
  }
  new MutationObserver(() => {
    if (document.title === awayTitle) return;
    pageTitle = document.title;
    if (away) document.title = awayTitle;
  }).observe(title, {childList:true, characterData:true, subtree:true});
  window.addEventListener('blur', leave);
  window.addEventListener('focus', returnToPage);
  document.addEventListener('visibilitychange', () => document.hidden ? leave() : returnToPage());
  window.addEventListener('pageshow', returnToPage);
  if (document.hidden) leave();
})();
