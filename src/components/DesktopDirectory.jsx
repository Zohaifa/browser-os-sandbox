import { Folder, Film, Music, File } from 'lucide-react'

// Classic XP-style icon box: silver raised button look
function XpIconBox({ children, label }) {
  return (
    <div
      title={label}
      style={{
        width: 40,
        height: 40,
        background: 'linear-gradient(180deg,#f0ede4 0%,#ddd9ce 100%)',
        border: '2px solid',
        borderColor: '#ffffff #808080 #808080 #ffffff',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  )
}

function FileIcon({ item }) {
  if (item.type === 'folder') {
    // Keep the golden XP folder look — it's iconic
    return (
      <div style={{ width: 40, height: 40, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Folder body */}
        <div style={{
          position: 'absolute', bottom: 0, left: 2, right: 2, height: 26,
          background: 'linear-gradient(180deg,#ffd77a 0%,#e8ad44 100%)',
          border: '1px solid #995d0e',
          borderRadius: 2,
        }} />
        {/* Folder tab */}
        <div style={{
          position: 'absolute', top: 5, left: 4, width: 14, height: 8,
          background: 'linear-gradient(180deg,#ffe4a0 0%,#f0c261 100%)',
          border: '1px solid #995d0e',
          borderBottom: 'none',
          borderRadius: '3px 3px 0 0',
        }} />
      </div>
    )
  }

  const ext = (item.extension || '').toLowerCase()

  if (ext === 'mp4' || ext === 'webm' || item.mediaType === 'video') {
    return (
      <XpIconBox label="Video File">
        <Film size={22} color="#0a246a" />
      </XpIconBox>
    )
  }

  if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || item.mediaType === 'audio') {
    return (
      <XpIconBox label="Audio File">
        <Music size={22} color="#0a246a" />
      </XpIconBox>
    )
  }

  return (
    <XpIconBox label={item.name}>
      <File size={22} color="#666" />
    </XpIconBox>
  )
}

function DesktopDirectory({ rootFolder, onOpenFolder, onOpenFile, onShortcutContextMenu }) {
  const items = rootFolder.children || []

  return (
    <section className="absolute left-3 top-3 z-20 flex flex-col gap-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="group flex w-24 flex-col items-center gap-1.5 p-1 rounded border border-transparent hover:border-[#89b9ff]/60 hover:bg-[#1f63c7]/20"
          onDoubleClick={() => {
            if (item.type === 'folder') onOpenFolder(item.id)
            else if (item.type === 'file') onOpenFile?.(item)
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => onShortcutContextMenu(e, item.id)}
        >
          <FileIcon item={item} />
          <span className="text-[12px] text-white font-medium leading-tight text-center [text-shadow:1px_1px_2px_rgba(0,0,0,0.9)] break-all max-w-full">
            {item.name}
          </span>
        </button>
      ))}
    </section>
  )
}

export default DesktopDirectory
