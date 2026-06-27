function FolderContents({ folder, onOpenFolder, onRenameItem, onDeleteItem }) {
  const children = folder?.children || []

  if (children.length === 0) {
    return <p className="text-xs text-slate-600">This folder is empty.</p>
  }

  return (
    <ul className="space-y-1.5">
      {children.map((item) => (
        <li key={item.id}>
          {item.type === 'folder' ? (
            <button
              type="button"
              onClick={() => onOpenFolder(item.id)}
              className="flex w-full items-center gap-2 rounded border border-transparent px-2 py-1 text-left text-[12px] text-slate-800 hover:border-[#2f6ec8] hover:bg-[#dcebff]"
            >
              <span className="xp-folder-icon small" aria-hidden="true" />
              <span>{item.name}</span>
              <span className="ml-auto text-[10px] text-slate-500">Folder</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded px-2 py-1 text-[12px] text-slate-800">
              <span className="inline-block h-4 w-3 rounded-sm border border-slate-400 bg-white" aria-hidden="true" />
              <span>{item.name}</span>
              <span className="ml-auto text-[10px] text-slate-500">{item.extension || 'File'}</span>
            </div>
          )}

          <div className="mt-1 flex gap-1.5 pl-1">
            <button
              type="button"
              className="rounded border border-[#9db6d3] bg-[#e6eef9] px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-[#d9e8fb]"
              onClick={() => onRenameItem(item.id)}
            >
              Rename
            </button>
            <button
              type="button"
              className="rounded border border-[#c49292] bg-[#fbe7e7] px-1.5 py-0.5 text-[10px] text-[#8a1f1f] hover:bg-[#f8d6d6]"
              onClick={() => onDeleteItem(item.id)}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default FolderContents
