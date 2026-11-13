// Absolute http(s) URLs or site-relative paths only (blocks javascript: and protocol-relative URLs).
export const isSafeUrl = (v) => v === '' || /^\/(?!\/)/.test(v) || /^https?:\/\/\S+$/i.test(v)
