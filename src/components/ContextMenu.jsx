function ContextMenu({ x, y, itemId, parentFolderId, onNewFolder, onNewFile, onDelete, onRestore, onEmptyBin, onClose }) {
  return (
    <div
      className="xp-context-menu fixed z-[9999] min-w-40 rounded border border-[#7f9db9] bg-[#f0f4fb] p-1 shadow-[2px_2px_0_rgba(0,0,0,0.25)] flex flex-col text-[11px]"
      style={{ left: `${x}px`, top: `${y}px` }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {!itemId ? (
        <>
          <button type="button" className="text-left px-4 py-1 hover:bg-[#316ac5] hover:text-white" onClick={() => { onNewFolder(); onClose(); }}>
            New Folder
          </button>
          <button type="button" className="text-left px-4 py-1 hover:bg-[#316ac5] hover:text-white" onClick={() => { onNewFile(); onClose(); }}>
            New Text File
          </button>
        </>
      ) : itemId === 'recycle-bin' ? (
        <>
          <button type="button" className="text-left px-4 py-1 hover:bg-[#316ac5] hover:text-white" onClick={() => { onEmptyBin(); onClose(); }}>
            Empty Recycle Bin
          </button>
        </>
      ) : (
        <>
          {parentFolderId === 'recycle-bin' && (
            <button type="button" className="text-left px-4 py-1 hover:bg-[#316ac5] hover:text-white" onClick={() => { onRestore(); onClose(); }}>
              Restore
            </button>
          )}
          <button type="button" className="text-left px-4 py-1 hover:bg-[#316ac5] hover:text-white" onClick={() => { onDelete(); onClose(); }}>
            Delete
          </button>
        </>
      )}
    </div>
  )
}

export default ContextMenu
