function ContextMenu({ x, y, onNewFolder, onNewFile, onClose }) {
  return (
    <div
      className="xp-context-menu fixed z-[9999] min-w-40 rounded border border-[#7f9db9] bg-[#f0f4fb] p-1 shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
      style={{ left: `${x}px`, top: `${y}px` }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="xp-context-item"
        onClick={() => {
          onNewFolder()
          onClose()
        }}
      >
        New Folder
      </button>
      <button
        type="button"
        className="xp-context-item"
        onClick={() => {
          onNewFile()
          onClose()
        }}
      >
        New File
      </button>
    </div>
  )
}

export default ContextMenu
