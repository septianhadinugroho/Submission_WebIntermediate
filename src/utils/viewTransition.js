export function initViewTransitions() {
  if (!document.startViewTransition) {
    document.startViewTransition = (callback) => {
      callback();
      return {
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        finished: Promise.resolve()
      };
    };
  }

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (href && href.startsWith('#/')) {
      e.preventDefault();
      navigateWithTransition(href);
    }
  });

  patchRouterNavigate();

  document.body.classList.add('fade-in');
}

export function navigateWithTransition(url, transitionType = 'fade-in') {
  document.body.className = transitionType;
  
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      window.location.href = url;
    });
  } else {
    window.location.href = url;
  }
}

function patchRouterNavigate() {
  const originalNavigate = window.Router?.prototype?.navigate;
  
  if (originalNavigate) {
    window.Router.prototype.navigate = function(url) {
      navigateWithTransition(url);
    };
  } else {
    console.warn('Could not patch Router.navigate. Programmatic navigation will not use View Transitions.');
  }
}

export function applyTransitionType(fromPath, toPath) {
  let transitionType = 'fade-in';
  
  if (toPath.split('/').length > fromPath.split('/').length) {
    transitionType = 'slide-left';
  }

  else if (toPath.split('/').length < fromPath.split('/').length) {
    transitionType = 'slide-right';
  }
  
  return transitionType;
}