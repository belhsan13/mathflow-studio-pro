export function useRouter() {
  return {
    push: (url) => { window.location.href = url; },
    replace: (url) => { window.location.replace(url); },
    refresh: () => {},
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    prefetch: () => Promise.resolve()
  };
}

export function usePathname() {
  return window.location.pathname;
}

export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}

export function redirect(url) {
  window.location.href = url;
}
