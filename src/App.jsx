import { useEffect, useMemo, useRef, useState } from 'react'
import ContextMenu from './components/ContextMenu'
import DesktopDirectory from './components/DesktopDirectory'
import FolderContents from './components/FolderContents'
import Window from './components/Window'

const initialFileSystem = {
  id: 'root',
  name: 'Desktop',
  type: 'folder',
  children: [
    {
      id: 'projects',
      name: 'Projects',
      type: 'folder',
      children: [
        {
          id: 'browser-os',
          name: 'Browser OS',
          type: 'folder',
          children: [
            { id: 'roadmap', name: 'roadmap.md', type: 'file', extension: 'MD' },
            { id: 'notes', name: 'notes.txt', type: 'file', extension: 'TXT' },
          ],
        },
        { id: 'ideas', name: 'ideas.doc', type: 'file', extension: 'DOC' },
      ],
    },
    {
      id: 'media',
      name: 'Media',
      type: 'folder',
      children: [
        { id: 'wallpaper', name: 'wallpaper.jpg', type: 'file', extension: 'JPG' },
        { id: 'audio', name: 'startup.wav', type: 'file', extension: 'WAV' },
      ],
    },
    {
      id: 'documents',
      name: 'Documents',
      type: 'folder',
      children: [
        {
          id: 'work',
          name: 'Work',
          type: 'folder',
          children: [
            { id: 'report', name: 'report.pdf', type: 'file', extension: 'PDF' },
          ],
        },
      ],
    },
  ],
}

function App() {
  const desktopRef = useRef(null)
  const [fileSystem, setFileSystem] = useState(initialFileSystem)
  const [windows, setWindows] = useState([])
  const [windowOrder, setWindowOrder] = useState([])
  const [contextMenu, setContextMenu] = useState(null)

  const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const updateNodeInTree = (tree, targetId, updater) => {
    if (tree.id === targetId) {
      return updater(tree)
    }

    if (!tree.children) {
      return tree
    }

    let changed = false
    const nextChildren = tree.children.map((child) => {
      const updatedChild = updateNodeInTree(child, targetId, updater)
      if (updatedChild !== child) {
        changed = true
      }
      return updatedChild
    })

    return changed ? { ...tree, children: nextChildren } : tree
  }

  const removeNodeFromTree = (tree, targetId) => {
    if (!tree.children) {
      return tree
    }

    let changed = false
    const nextChildren = tree.children
      .filter((child) => {
        const keep = child.id !== targetId
        if (!keep) {
          changed = true
        }
        return keep
      })
      .map((child) => {
        const updatedChild = removeNodeFromTree(child, targetId)
        if (updatedChild !== child) {
          changed = true
        }
        return updatedChild
      })

    return changed ? { ...tree, children: nextChildren } : tree
  }

  const collectFolderIds = (node) => {
    if (!node || node.type !== 'folder') {
      return []
    }

    return [
      node.id,
      ...(node.children || []).flatMap((child) =>
        child.type === 'folder' ? collectFolderIds(child) : [],
      ),
    ]
  }

  const closeMenu = () => setContextMenu(null)

  useEffect(() => {
    const handlePointerDown = () => closeMenu()
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const folderMap = useMemo(() => {
    const byId = new Map()
    const itemById = new Map()

    const visit = (node, path = []) => {
      itemById.set(node.id, node)
      if (node.type === 'folder') {
        const fullPath = [...path, node.name]
        byId.set(node.id, { ...node, fullPath })
        ;(node.children || []).forEach((child) => visit(child, fullPath))
      }
    }

    visit(fileSystem)
    return { byId, itemById }
  }, [fileSystem])

  const openDummyWindow = () => {
    const id = `window-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const offset = windows.length * 26
    const nextWindow = {
      id,
      title: `My Computer ${windows.length + 1}`,
      initialPosition: {
        x: 52 + offset,
        y: 46 + offset,
      },
      body: 'This is a dummy XP-style window for testing drag, focus, and close behavior.',
    }

    setWindows((prev) => [...prev, nextWindow])
    setWindowOrder((prev) => [...prev, id])
  }

  const openFolderWindow = (folderId) => {
    const folder = folderMap.byId.get(folderId)

    if (!folder) {
      return
    }

    const existingWindow = windows.find(
      (windowItem) => windowItem.kind === 'folder' && windowItem.folderId === folderId,
    )

    if (existingWindow) {
      setWindowOrder((prev) => {
        const withoutTarget = prev.filter((item) => item !== existingWindow.id)
        return [...withoutTarget, existingWindow.id]
      })
      return
    }

    const id = `folder-window-${folderId}-${Date.now()}`
    const offset = windows.length * 24
    const nextWindow = {
      id,
      kind: 'folder',
      folderId,
      title: folder.name,
      initialPosition: {
        x: 80 + offset,
        y: 60 + offset,
      },
    }

    setWindows((prev) => [...prev, nextWindow])
    setWindowOrder((prev) => [...prev, id])
  }

  const closeWindow = (id) => {
    setWindows((prev) => prev.filter((item) => item.id !== id))
    setWindowOrder((prev) => prev.filter((item) => item !== id))
  }

  const createFolderIn = (parentFolderId) => {
    const name = window.prompt('Folder name:', 'New Folder')
    if (!name || !name.trim()) {
      return
    }

    const nextFolder = {
      id: createId('folder'),
      name: name.trim(),
      type: 'folder',
      children: [],
    }

    setFileSystem((previous) =>
      updateNodeInTree(previous, parentFolderId, (node) => ({
        ...node,
        children: [...(node.children || []), nextFolder],
      })),
    )
  }

  const createFileIn = (parentFolderId) => {
    const name = window.prompt('File name:', 'New File.txt')
    if (!name || !name.trim()) {
      return
    }

    const fileName = name.trim()
    const extension = fileName.includes('.') ? fileName.split('.').pop().toUpperCase() : 'TXT'

    const nextFile = {
      id: createId('file'),
      name: fileName,
      type: 'file',
      extension,
    }

    setFileSystem((previous) =>
      updateNodeInTree(previous, parentFolderId, (node) => ({
        ...node,
        children: [...(node.children || []), nextFile],
      })),
    )
  }

  const renameItem = (itemId) => {
    const item = folderMap.itemById.get(itemId)
    if (!item) {
      return
    }

    const nextName = window.prompt('Rename item:', item.name)
    if (!nextName || !nextName.trim()) {
      return
    }

    const cleanName = nextName.trim()
    setFileSystem((previous) =>
      updateNodeInTree(previous, itemId, (node) => ({
        ...node,
        name: cleanName,
        extension:
          node.type === 'file'
            ? cleanName.includes('.')
              ? cleanName.split('.').pop().toUpperCase()
              : node.extension
            : node.extension,
      })),
    )
  }

  const deleteItem = (itemId) => {
    const item = folderMap.itemById.get(itemId)
    if (!item) {
      return
    }

    const shouldDelete = window.confirm(`Delete ${item.name}?`)
    if (!shouldDelete) {
      return
    }

    const removedFolderIds = item.type === 'folder' ? collectFolderIds(item) : []
    setFileSystem((previous) => removeNodeFromTree(previous, itemId))

    if (removedFolderIds.length > 0) {
      const removedWindowIds = new Set(
        windows
          .filter(
            (windowItem) =>
              windowItem.kind === 'folder' && removedFolderIds.includes(windowItem.folderId),
          )
          .map((windowItem) => windowItem.id),
      )

      setWindows((previous) =>
        previous.filter(
          (windowItem) =>
            !(windowItem.kind === 'folder' && removedFolderIds.includes(windowItem.folderId)),
        ),
      )
      setWindowOrder((previous) => previous.filter((windowId) => !removedWindowIds.has(windowId)))
    }
  }

  const focusWindow = (id) => {
    setWindowOrder((prev) => {
      const withoutTarget = prev.filter((item) => item !== id)
      return [...withoutTarget, id]
    })
  }

  const zById = useMemo(() => {
    const zMap = new Map()
    windowOrder.forEach((id, index) => {
      zMap.set(id, 30 + index)
    })
    return zMap
  }, [windowOrder])

  useEffect(() => {
    setWindows((previous) =>
      previous.filter(
        (windowItem) =>
          windowItem.kind !== 'folder' || folderMap.byId.has(windowItem.folderId),
      ),
    )
  }, [folderMap])

  useEffect(() => {
    setWindowOrder((previous) => {
      const liveIds = new Set(windows.map((item) => item.id))
      return previous.filter((id) => liveIds.has(id))
    })
  }, [windows])

  return (
    <div className="h-screen w-screen overflow-hidden select-none">
      <main
        ref={desktopRef}
        className="xp-desktop relative h-[calc(100%-42px)] w-full overflow-hidden"
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setContextMenu({ x: event.clientX, y: event.clientY, parentFolderId: 'root' })
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_90%_24%,rgba(132,213,255,0.28),transparent_34%)]" />

        <DesktopDirectory
          rootFolder={fileSystem}
          onOpenFolder={openFolderWindow}
          onShortcutContextMenu={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setContextMenu({ x: event.clientX, y: event.clientY, parentFolderId: 'root' })
          }}
        />

        {windows.length === 0 && (
          <div className="pointer-events-none absolute left-6 top-8 w-[min(34rem,92vw)] rounded-md border border-sky-100/40 bg-white/20 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-[1px]">
            <p className="text-xs tracking-wide">Windows XP Sandbox</p>
            <p className="mt-1 text-sm">Click a folder icon to open it in a window.</p>
          </div>
        )}

        {windows.map((windowItem) => (
          <Window
            key={windowItem.id}
            id={windowItem.id}
            title={
              windowItem.kind === 'folder'
                ? folderMap.byId.get(windowItem.folderId)?.name || windowItem.title
                : windowItem.title
            }
            desktopRef={desktopRef}
            initialPosition={windowItem.initialPosition}
            zIndex={zById.get(windowItem.id) ?? 30}
            onClose={closeWindow}
            onFocus={focusWindow}
            onContentContextMenu={(event) => {
              if (windowItem.kind !== 'folder') {
                return
              }

              event.preventDefault()
              event.stopPropagation()
              setContextMenu({
                x: event.clientX,
                y: event.clientY,
                parentFolderId: windowItem.folderId,
              })
            }}
          >
            {windowItem.kind === 'folder' ? (
              <>
                <div className="mb-2 border-b border-[#d8d1ba] pb-1 text-[11px] text-slate-500">
                  {(folderMap.byId.get(windowItem.folderId)?.fullPath || []).join(' > ')}
                </div>
                <FolderContents
                  folder={folderMap.byId.get(windowItem.folderId)}
                  onOpenFolder={openFolderWindow}
                  onRenameItem={renameItem}
                  onDeleteItem={deleteItem}
                />
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-slate-700">{windowItem.body}</p>
            )}
          </Window>
        ))}
      </main>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onNewFolder={() => createFolderIn(contextMenu.parentFolderId)}
          onNewFile={() => createFileIn(contextMenu.parentFolderId)}
          onClose={closeMenu}
        />
      )}

      <footer className="xp-taskbar relative z-50 flex h-10.5 items-center justify-between px-1.5">
        <button
          type="button"
          onClick={openDummyWindow}
          className="xp-start-button inline-flex items-center gap-1.5 rounded-r-xl px-5 py-1.5 text-sm font-bold text-white"
        >
          <span className="inline-block h-4 w-4 rounded-full bg-white/90" />
          Start
        </button>

        <button
          type="button"
          onClick={() => openFolderWindow('documents')}
          className="xp-quick-launch rounded px-3 py-1 text-xs font-semibold text-slate-100"
        >
          Open Documents
        </button>

        <div className="xp-clock rounded px-3 py-1 text-xs text-white/95">FS Ready</div>
      </footer>
    </div>
  )
}

export default App
