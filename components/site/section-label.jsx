// Section marker styled like a code comment: "// 01 · about".
export function SectionLabel({ index, children, className = '' }) {
  return (
    <p className={`t-mono flex items-center gap-2 text-mute ${className}`} dir="ltr">
      <span className="text-faint">{'//'}</span>
      <span className="text-accent">{String(index).padStart(2, '0')}</span>
      <span className="text-faint">·</span>
      <span className="text-syn-purple">{children}</span>
    </p>
  )
}
