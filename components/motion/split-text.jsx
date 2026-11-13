import { Fragment } from 'react'

// Wraps each word (or character) in a mask so GSAP can slide it up from below.
// Arabic is always split by word: splitting letters would break joined glyphs.
export function SplitText({ text, by = 'word', className = '', itemClassName = 'split-item' }) {
  const arabic = /[؀-ۿ]/.test(text)
  const words = String(text).split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          {by === 'char' && !arabic ? (
            <span className="mask" aria-hidden="true">
              {[...word].map((ch, ci) => <span key={ci} className={itemClassName}>{ch}</span>)}
            </span>
          ) : (
            <span className="mask" aria-hidden="true"><span className={itemClassName}>{word}</span></span>
          )}
          {wi < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  )
}
