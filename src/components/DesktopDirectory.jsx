function DesktopDirectory({ rootFolder, onOpenFolder, onShortcutContextMenu }) {
  const desktopFolders = (rootFolder.children || []).filter((item) => item.type === 'folder')

  return (
    <section className="xp-folder-grid absolute left-3 top-3 z-20">
      {desktopFolders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className="xp-folder-shortcut flex w-20 flex-col items-center gap-1 rounded p-1 text-center"
          onClick={() => onOpenFolder(folder.id)}
          onContextMenu={(event) => onShortcutContextMenu(event, folder.id)}
        >
          <span className="xp-folder-icon" aria-hidden="true" />
          <span className="text-[11px] leading-tight text-white [text-shadow:1px_1px_1px_rgba(0,0,0,0.7)]">
            {folder.name}
          </span>
        </button>
      ))}
    </section>
  )
}

export default DesktopDirectory
