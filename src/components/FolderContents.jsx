import { Folder, Film, Music, File } from 'lucide-react'

function ItemIcon({ item }) {
  if (item.type === 'folder') return <Folder size={16} className="text-yellow-500 fill-yellow-300 shrink-0" />
  const ext = (item.extension || '').toLowerCase()
  if (ext === 'mp4' || item.mediaType === 'video') return <Film size={16} className="text-blue-600 shrink-0" />
  if (ext === 'mp3' || item.mediaType === 'audio') return <Music size={16} className="text-purple-600 shrink-0" />
  return <File size={16} className="text-gray-500 shrink-0" />
}

function FolderContents({ folder, onOpenFolder, onOpenFile, onRenameItem, onDeleteItem, onRestoreItem }) {
  const children = folder?.children || []
  const isRecycleBin = folder?.id === 'recycle-bin'

  if (children.length === 0) {
    return <p className="text-xs text-slate-500 italic">This folder is empty.</p>
  }

  return (
    <ul className="space-y-1 w-[280px]">
      {children.map((item) => (
        <li key={item.id} className="flex items-center gap-2 group rounded border border-transparent hover:border-[#2f6ec8] hover:bg-[#dcebff] px-2 py-1">
          <ItemIcon item={item} />

          <button
            type="button"
            className="flex-1 text-left text-[12px] text-slate-800 min-w-0"
            onDoubleClick={() => {
              if (item.type === 'folder') onOpenFolder?.(item.id)
              else if (item.type === 'file') onOpenFile?.(item)
            }}
          >
            <span className="block truncate">{item.name}</span>
            <span className="text-[10px] text-slate-500">
              {item.type === 'folder' ? 'Folder' : (item.extension || 'File')}
            </span>
          </button>

          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
            {onRenameItem && !isRecycleBin && (
              <button
                type="button"
                className="rounded border border-[#9db6d3] bg-[#e6eef9] px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-[#d9e8fb]"
                onClick={() => onRenameItem(item.id)}
              >
                Rename
              </button>
            )}
            {onRestoreItem && isRecycleBin && (
              <button
                type="button"
                className="rounded border border-[#9db6d3] bg-[#e6eef9] px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-[#d9e8fb]"
                onClick={() => onRestoreItem(item.id)}
              >
                Restore
              </button>
            )}
            {onDeleteItem && (
              <button
                type="button"
                className="rounded border border-[#c49292] bg-[#fbe7e7] px-1.5 py-0.5 text-[10px] text-[#8a1f1f] hover:bg-[#f8d6d6]"
                onClick={() => onDeleteItem(item.id)}
              >
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default FolderContents
