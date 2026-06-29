import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Calculator, HardDrive, Cpu, ShieldAlert, FolderOpen,
  Activity, Upload, RotateCcw, Film, Music, Folder, File,
} from 'lucide-react'
import ContextMenu from './components/ContextMenu'
import CalculatorApp from './components/CalculatorApp'
import DesktopDirectory from './components/DesktopDirectory'
import FolderContents from './components/FolderContents'
import Window from './components/Window'
import MemoryManagerApp from './components/MemoryManagerApp'
import DiskSchedulerApp from './components/DiskSchedulerApp'
import BankersAlgorithmApp from './components/BankersAlgorithmApp'
import TaskManagerApp from './components/TaskManagerApp'
import MediaPlayerApp from './components/MediaPlayerApp'
import useScheduler from './hooks/useScheduler'

// ─── Initial VFS ─────────────────────────────────────────────────────────────
const initialFileSystem = {
  id: 'root',
  name: 'Desktop',
  type: 'folder',
  children: [
    { id: 'file-sample-video', name: 'sample_video.mp4', type: 'file', extension: 'MP4', mediaType: 'video', blobUrl: null, burstTime: 12 },
    { id: 'file-sample-audio', name: 'sample_audio.mp3', type: 'file', extension: 'MP3', mediaType: 'audio', blobUrl: null, burstTime: 8 },
  ],
}

let _wSerial = 0
const mkId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const desktopRef = useRef(null)
  const importRef = useRef(null)

  // ── File System ──────────────────────────────────────────────────────────
  const [fileSystem, setFileSystem] = useState(initialFileSystem)

  const updateNode = (tree, id, fn) => {
    if (tree.id === id) return fn(tree)
    if (!tree.children) return tree
    let changed = false
    const next = tree.children.map(c => { const u = updateNode(c, id, fn); if (u !== c) changed = true; return u })
    return changed ? { ...tree, children: next } : tree
  }

  const removeNode = (tree, id) => {
    if (!tree.children) return tree
    let changed = false
    const next = tree.children
      .filter(c => { const k = c.id !== id; if (!k) changed = true; return k })
      .map(c => { const u = removeNode(c, id); if (u !== c) changed = true; return u })
    return changed ? { ...tree, children: next } : tree
  }

  const collectFolderIds = (node) => {
    if (!node || node.type !== 'folder') return []
    return [node.id, ...(node.children || []).flatMap(c => c.type === 'folder' ? collectFolderIds(c) : [])]
  }

  const folderMap = useMemo(() => {
    const byId = new Map(), itemById = new Map()
    const visit = (node, path = []) => {
      itemById.set(node.id, node)
      if (node.type === 'folder') {
        byId.set(node.id, { ...node, fullPath: [...path, node.name] })
        ;(node.children || []).forEach(c => visit(c, [...path, node.name]))
      }
    }
    visit(fileSystem)
    return { byId, itemById }
  }, [fileSystem])

  // ── Windows ──────────────────────────────────────────────────────────────
  // Use a ref mirror so closures always see fresh window list
  const windowsRef = useRef([])
  const [windows, _setWindows] = useState([])
  const setWindows = useCallback((updater) => {
    _setWindows(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      windowsRef.current = next
      return next
    })
  }, [])

  const [windowOrder, setWindowOrder] = useState([])

  const focusWindow = useCallback((id) => {
    setWindowOrder(o => [...o.filter(i => i !== id), id])
  }, [])

  // Track media windows the user explicitly closed so we don't reopen them
  const closedMediaPids = useRef(new Set())

  const closeWindow = useCallback((id) => {
    setWindows(prev => {
      const win = prev.find(w => w.id === id)
      if (win?.kind === 'media') closedMediaPids.current.add(win.pid)
      return prev.filter(w => w.id !== id)
    })
    setWindowOrder(o => o.filter(i => i !== id))
  }, [setWindows])

  // Cleanup window order when windows list shrinks
  useEffect(() => {
    setWindowOrder(o => {
      const live = new Set(windows.map(w => w.id))
      return o.filter(id => live.has(id))
    })
  }, [windows])

  // Open an app window (singleton per kind)
  const openAppWindow = useCallback((kind, title, ix = 120, iy = 80) => {
    setIsStartOpen(false)
    const existing = windowsRef.current.find(w => w.kind === kind)
    if (existing) {
      setWindowOrder(o => {
        if (o[o.length - 1] === existing.id) return o
        return [...o.filter(i => i !== existing.id), existing.id]
      })
      return
    }
    const id = `${kind}-${++_wSerial}`
    setWindows(prev => {
      if (prev.find(w => w.kind === kind)) return prev
      return [...prev, { id, kind, title, initialPosition: { x: ix, y: iy } }]
    })
    setWindowOrder(o => {
      if (o.includes(id)) return o
      return [...o, id]
    })
  }, [setWindows])

  // Open a folder window
  const openFolderWindow = useCallback((folderId) => {
    setIsStartOpen(false)
    const folder = folderMap.byId.get(folderId)
    if (!folder) return
    const existing = windowsRef.current.find(w => w.kind === 'folder' && w.folderId === folderId)
    if (existing) {
      setWindowOrder(o => {
        if (o[o.length - 1] === existing.id) return o
        return [...o.filter(i => i !== existing.id), existing.id]
      })
      return
    }
    const id = `folder-${folderId}-${++_wSerial}`
    setWindows(prev => {
      if (prev.find(w => w.kind === 'folder' && w.folderId === folderId)) return prev
      const offset = prev.length * 22
      return [...prev, { id, kind: 'folder', folderId, title: folder.name, initialPosition: { x: 80 + offset, y: 60 + offset } }]
    })
    setWindowOrder(o => {
      if (o.includes(id)) return o
      return [...o, id]
    })
  }, [folderMap, setWindows])

  // Remove windows for deleted folders
  useEffect(() => {
    setWindows(prev => prev.filter(w => w.kind !== 'folder' || folderMap.byId.has(w.folderId)))
  }, [folderMap, setWindows])

  const zById = useMemo(() => {
    const m = new Map()
    windowOrder.forEach((id, idx) => m.set(id, 30 + idx))
    return m
  }, [windowOrder])

  // ── Scheduler ────────────────────────────────────────────────────────────
  const scheduler = useScheduler()
  const mediaPlayerRefs = useRef({})   // pid → React ref object

  // Play/pause media on scheduler process changes
  const prevRunningPid = useRef(null)
  useEffect(() => {
    const newPid = scheduler.runningProcess?.pid ?? null
    const oldPid = prevRunningPid.current
    if (oldPid !== null && oldPid !== newPid) {
      mediaPlayerRefs.current[oldPid]?.current?.pause()
    }
    if (newPid !== null && newPid !== oldPid) {
      mediaPlayerRefs.current[newPid]?.current?.play()
    }
    prevRunningPid.current = newPid
  }, [scheduler.runningProcess?.pid])

  // Open a media player window for a new process (don't reopen manually closed ones)
  const openMediaWindow = useCallback((process) => {
    if (closedMediaPids.current.has(process.pid)) return
    const id = `media-${process.pid}`
    if (windowsRef.current.find(w => w.id === id)) return
    
    if (!mediaPlayerRefs.current[process.pid]) {
      mediaPlayerRefs.current[process.pid] = { current: null }
    }
    
    setWindows(prev => {
      if (prev.find(w => w.id === id)) return prev
      const offset = prev.length * 20
      return [...prev, { id, kind: 'media', pid: process.pid, title: `P${process.pid}: ${process.name}`, initialPosition: { x: 180 + offset, y: 80 + offset } }]
    })
    
    setWindowOrder(o => {
      if (o.includes(id)) return o
      return [...o, id]
    })
  }, [setWindows])

  // Auto-open media windows for new processes
  useEffect(() => {
    scheduler.allProcesses.forEach(p => openMediaWindow(p))
  }, [scheduler.allProcesses.length, openMediaWindow]) // eslint-disable-line

  // Handle double-click on media file: prompt burst time, create PCB
  const handleOpenFile = useCallback((file) => {
    const raw = window.prompt(`Set burst time (seconds) for "${file.name}":`, String(file.burstTime || 10))
    if (raw === null) return
    const bt = parseInt(raw, 10)
    if (isNaN(bt) || bt <= 0) { window.alert('Please enter a positive number.'); return }
    scheduler.addProcess({ ...file, burstTime: bt })
  }, [scheduler])

  // Handle End Task from Task Manager
  const handleTerminate = useCallback((pid) => {
    scheduler.terminateProcess(pid)
    closedMediaPids.current.add(pid)
    const id = `media-${pid}`
    setWindows(prev => prev.filter(w => w.id !== id))
    setWindowOrder(o => o.filter(i => i !== id))
    if (mediaPlayerRefs.current[pid]) {
      mediaPlayerRefs.current[pid].current?.pause()
      delete mediaPlayerRefs.current[pid]
    }
  }, [scheduler, setWindows])

  // Handle reset: also clear all media windows and refs
  const handleReset = useCallback(() => {
    scheduler.resetScheduler()
    closedMediaPids.current.clear()
    mediaPlayerRefs.current = {}
    prevRunningPid.current = null
    setWindows(prev => prev.filter(w => w.kind !== 'media'))
    setWindowOrder(o => {
      const mediaIds = new Set(windowsRef.current.filter(w => w.kind === 'media').map(w => w.id))
      return o.filter(id => !mediaIds.has(id))
    })
  }, [scheduler, setWindows])

  // ── Context Menu ─────────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState(null)
  const closeContextMenu = () => setContextMenu(null)

  // ── Start Menu ───────────────────────────────────────────────────────────
  const [isStartOpen, setIsStartOpen] = useState(false)

  useEffect(() => {
    const onDown = (e) => {
      closeContextMenu()
      if (!e.target.closest('.xp-start-button') && !e.target.closest('.xp-start-menu')) {
        setIsStartOpen(false)
      }
    }
    const onKey = (e) => { if (e.key === 'Escape') { closeContextMenu(); setIsStartOpen(false) } }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey) }
  }, [])

  // ── VFS Operations ───────────────────────────────────────────────────────
  const createFolderIn = (pid) => {
    const name = window.prompt('Folder name:', 'New Folder')
    if (!name?.trim()) return
    setFileSystem(prev => updateNode(prev, pid, n => ({ ...n, children: [...(n.children || []), { id: mkId('f'), name: name.trim(), type: 'folder', children: [] }] })))
  }

  const createFileIn = (pid) => {
    const name = window.prompt('File name:', 'New File.txt')
    if (!name?.trim()) return
    const fn = name.trim(), ext = fn.includes('.') ? fn.split('.').pop().toUpperCase() : 'TXT'
    setFileSystem(prev => updateNode(prev, pid, n => ({ ...n, children: [...(n.children || []), { id: mkId('x'), name: fn, type: 'file', extension: ext }] })))
  }

  const renameItem = (itemId) => {
    const item = folderMap.itemById.get(itemId)
    if (!item) return
    const name = window.prompt('Rename:', item.name)
    if (!name?.trim()) return
    const clean = name.trim()
    setFileSystem(prev => updateNode(prev, itemId, n => ({ ...n, name: clean, extension: n.type === 'file' ? (clean.includes('.') ? clean.split('.').pop().toUpperCase() : n.extension) : n.extension })))
  }

  const deleteItem = (itemId) => {
    const item = folderMap.itemById.get(itemId)
    if (!item || !window.confirm(`Delete "${item.name}"?`)) return
    const deadFolders = item.type === 'folder' ? collectFolderIds(item) : []
    setFileSystem(prev => removeNode(prev, itemId))
    if (deadFolders.length) {
      setWindows(prev => prev.filter(w => !(w.kind === 'folder' && deadFolders.includes(w.folderId))))
    }
  }

  // ── Import Media ─────────────────────────────────────────────────────────
  const handleImport = (e) => {
    Array.from(e.target.files || []).forEach(file => {
      const blobUrl = URL.createObjectURL(file)
      const ext = file.name.split('.').pop()?.toUpperCase() || ''
      const mediaType = ['mp4', 'webm', 'ogg', 'mov'].includes(ext.toLowerCase()) ? 'video' : 'audio'
      setFileSystem(prev => ({ ...prev, children: [...prev.children, { id: mkId('imp'), name: file.name, type: 'file', extension: ext, mediaType, blobUrl, burstTime: 10 }] }))
    })
    e.target.value = ''
  }

  // ── Clock ────────────────────────────────────────────────────────────────
  const [clockStr, setClockStr] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  useEffect(() => {
    const t = setInterval(() => setClockStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 15000)
    return () => clearInterval(t)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Desktop app shortcuts config (right-side)
  const SHORTCUTS = [
    { kind: 'task-manager',   title: 'Task Manager',          icon: <Activity size={20} />, label: 'Task\nManager', x: 60,  y: 60  },
    { kind: 'memory-manager', title: 'Memory Manager',        icon: <Cpu size={20} />,      label: 'Memory\nManager', x: 100, y: 100 },
    { kind: 'disk-scheduler', title: 'Disk Defragmenter',     icon: <HardDrive size={20} />, label: 'Disk\nDefrag', x: 150, y: 120 },
    { kind: 'bankers-app',    title: 'Deadlock Control',      icon: <ShieldAlert size={20} />, label: 'Deadlock\nCMD', x: 200, y: 80  },
    { kind: 'calculator',     title: 'Calculator',            icon: <Calculator size={20} />, label: 'Calculator', x: 360, y: 84  },
  ]

  // Start Menu programs list (all apps)
  const START_APPS = [
    { kind: 'memory-manager', title: 'Memory Manager',    sub: 'Page Replacement Simulator', icon: <Cpu size={22} />,        x: 100, y: 80  },
    { kind: 'disk-scheduler', title: 'Disk Defragmenter', sub: 'Scheduling Visualizer',       icon: <HardDrive size={22} />,  x: 150, y: 100 },
    { kind: 'bankers-app',    title: "Deadlock Control",  sub: "Banker's Algorithm",          icon: <ShieldAlert size={22} />, x: 200, y: 80  },
    { kind: 'task-manager',   title: 'Task Manager',      sub: 'CPU Scheduler',               icon: <Activity size={22} />,   x: 60,  y: 60  },
    { kind: 'calculator',     title: 'Calculator',        sub: 'Standard Calculator',         icon: <Calculator size={22} />, x: 360, y: 84  },
  ]

  // Window icon lookup
  function WIcon({ w }) {
    if (w.kind === 'folder')        return <FolderOpen size={13} />
    if (w.kind === 'calculator')    return <Calculator size={13} />
    if (w.kind === 'memory-manager') return <Cpu size={13} />
    if (w.kind === 'disk-scheduler') return <HardDrive size={13} />
    if (w.kind === 'bankers-app')   return <ShieldAlert size={13} />
    if (w.kind === 'task-manager')  return <Activity size={13} />
    if (w.kind === 'media') {
      const p = scheduler.allProcesses.find(p => p.pid === w.pid)
      return p?.mediaType === 'video' ? <Film size={13} /> : <Music size={13} />
    }
    return <File size={13} />
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen overflow-hidden select-none">

      {/* ── Desktop ── */}
      <main
        ref={desktopRef}
        className="xp-desktop relative h-[calc(100%-42px)] w-full overflow-hidden"
        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, parentFolderId: 'root' }) }}
        onClick={() => setIsStartOpen(false)}
      >
        {/* VFS icons (left side) */}
        <DesktopDirectory
          rootFolder={fileSystem}
          onOpenFolder={openFolderWindow}
          onOpenFile={handleOpenFile}
          onShortcutContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, parentFolderId: 'root' }) }}
        />

        {/* App shortcuts (right side) */}
        <section className="absolute right-3 top-3 z-20 flex flex-col gap-5">
          {SHORTCUTS.map(app => (
            <button
              key={app.kind}
              onClick={() => openAppWindow(app.kind, app.title, app.x, app.y)}
              className="group flex w-22 flex-col items-center gap-1 p-1 rounded border border-transparent hover:border-[#89b9ff]/60 hover:bg-[#1f63c7]/20"
            >
              <div className="w-9 h-9 bg-[#d4d0c8] border-2 border-[#ffffff] border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[#0a246a] shadow-sm group-hover:border-b-[#0831d9] group-hover:border-r-[#0831d9]">
                {app.icon}
              </div>
              <span className="text-[11px] text-white font-medium leading-tight text-center [text-shadow:1px_1px_2px_rgba(0,0,0,0.9)] whitespace-pre-line">{app.label}</span>
            </button>
          ))}
        </section>

        {/* ── Windows ── */}
        {windows.map(w => {
          const process = w.kind === 'media' ? scheduler.allProcesses.find(p => p.pid === w.pid) : null
          if (w.kind === 'media' && !process) return null

          if (w.kind === 'media' && !mediaPlayerRefs.current[w.pid]) {
            mediaPlayerRefs.current[w.pid] = { current: null }
          }

          return (
            <Window
              key={w.id}
              id={w.id}
              title={w.kind === 'folder' ? (folderMap.byId.get(w.folderId)?.name || w.title) : w.title}
              desktopRef={desktopRef}
              initialPosition={w.initialPosition}
              zIndex={zById.get(w.id) ?? 30}
              onClose={closeWindow}
              onFocus={focusWindow}
            >
              {w.kind === 'folder' ? (
                <FolderContents folder={folderMap.byId.get(w.folderId)} onOpenFolder={openFolderWindow} onOpenFile={handleOpenFile} onRenameItem={renameItem} onDeleteItem={deleteItem} />
              ) : w.kind === 'calculator' ? (
                <CalculatorApp />
              ) : w.kind === 'memory-manager' ? (
                <MemoryManagerApp />
              ) : w.kind === 'disk-scheduler' ? (
                <DiskSchedulerApp />
              ) : w.kind === 'bankers-app' ? (
                <BankersAlgorithmApp />
              ) : w.kind === 'task-manager' ? (
                <TaskManagerApp
                  allProcesses={scheduler.allProcesses}
                  ganttLog={scheduler.ganttLog}
                  virtualClock={scheduler.virtualClock}
                  metrics={scheduler.metrics}
                  runningProcess={scheduler.runningProcess}
                  onTerminate={handleTerminate}
                />
              ) : w.kind === 'media' ? (
                <MediaPlayerApp
                  ref={el => { if (mediaPlayerRefs.current[w.pid]) mediaPlayerRefs.current[w.pid].current = el }}
                  process={process}
                />
              ) : null}
            </Window>
          )
        })}

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onNewFolder={() => createFolderIn(contextMenu.parentFolderId)}
            onNewFile={() => createFileIn(contextMenu.parentFolderId)}
            onClose={closeContextMenu}
          />
        )}
      </main>

      {/* ── Windows XP Start Menu ── */}
      {isStartOpen && (
        <div
          className="xp-start-menu absolute left-0 bottom-[42px] z-[9999] flex flex-col rounded-tr-[10px] overflow-hidden"
          style={{
            width: 420,
            border: '2px solid #0831d9',
            boxShadow: '4px 0 8px rgba(0,0,0,0.5), 0 -4px 8px rgba(0,0,0,0.3)',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(180deg,#1e6bce 0%,#1452c6 50%,#113da0 100%)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 4, border: '2px solid rgba(255,255,255,0.7)', overflow: 'hidden', background: 'white', flexShrink: 0 }}>
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=XPUser" alt="user" style={{ width: '100%', height: '100%' }} />
            </div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 14, fontFamily: 'Tahoma, sans-serif', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>Administrator</span>
          </div>

          {/* Body — two columns */}
          <div style={{ display: 'flex', background: 'white', height: 320 }}>

            {/* Left: Programs */}
            <div style={{ width: '55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #d4d0c8', overflowY: 'auto' }}>
              <div style={{ padding: '4px 8px', fontSize: 10, color: '#666', fontFamily: 'Tahoma', fontStyle: 'italic', borderBottom: '1px solid #e0ddd5' }}>
                All Programs
              </div>
              {START_APPS.map(app => (
                <button
                  key={app.kind}
                  onClick={() => openAppWindow(app.kind, app.title, app.x, app.y)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Tahoma, sans-serif' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2f71cd'; e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'black' }}
                >
                  <div style={{ width: 28, height: 28, background: '#d4d0c8', border: '1px solid #808080', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0a246a' }}>
                    {app.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                    <span style={{ fontSize: 12, fontWeight: 'bold' }}>{app.title}</span>
                    {app.sub && <span style={{ fontSize: 10, opacity: 0.7 }}>{app.sub}</span>}
                  </div>
                </button>
              ))}

              <div style={{ margin: '4px 8px', borderTop: '1px solid #d4d0c8' }} />

              <button
                onClick={() => openFolderWindow('root')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Tahoma, sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2f71cd'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'black' }}
              >
                <div style={{ width: 28, height: 28, background: '#d4d0c8', border: '1px solid #808080', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0a246a' }}>
                  <Folder size={18} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>Open Desktop</span>
              </button>
            </div>

            {/* Right: Places */}
            <div style={{ width: '45%', background: '#d3e5fa', borderLeft: '1px solid #84b5ed', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '4px 8px', fontSize: 10, color: '#002b5e', fontFamily: 'Tahoma', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #84b5ed' }}>
                Places
              </div>
              {[
                { label: 'My Documents',  icon: <FolderOpen size={18} />,  action: () => openFolderWindow('root') },
                { label: 'Task Manager', icon: <Activity size={18} />,    action: () => openAppWindow('task-manager', 'Task Manager', 60, 60) },
              ].map(({ label, icon, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Tahoma, sans-serif', color: '#002b5e' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2f71cd'; e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#002b5e' }}
                >
                  {icon}
                  <span style={{ fontSize: 12, fontWeight: 'bold' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: 'linear-gradient(180deg,#1e6bce 0%,#1452c6 50%,#113da0 100%)', padding: '5px 10px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #0831d9' }}>
            <button
              onClick={() => setIsStartOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'white', background: 'none', border: '1px solid rgba(255,255,255,0.4)', padding: '3px 10px', cursor: 'pointer', fontFamily: 'Tahoma', fontSize: 11, fontWeight: 'bold', borderRadius: 2 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Log Off
            </button>
          </div>
        </div>
      )}

      {/* ── Taskbar ── */}
      <footer className="xp-taskbar relative z-50 flex h-[42px] items-center justify-between pr-1.5">
        {/* Start Button */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setIsStartOpen(s => !s) }}
          className="xp-start-button inline-flex items-center gap-1.5 rounded-r-[14px] px-5 text-sm font-bold italic text-white h-full"
        >
          {/* Windows XP 4-colour flag */}
          <span className="not-italic flex shrink-0" style={{ width: 16, height: 16, gap: 1, flexWrap: 'wrap' }}>
            <span style={{ width: 7, height: 7, background: '#e74c3c', borderRadius: 1 }} />
            <span style={{ width: 7, height: 7, background: '#2ecc71', borderRadius: 1 }} />
            <span style={{ width: 7, height: 7, background: '#3498db', borderRadius: 1 }} />
            <span style={{ width: 7, height: 7, background: '#f1c40f', borderRadius: 1 }} />
          </span>
          <span className="drop-shadow-md pr-1">start</span>
        </button>

        {/* Open window buttons */}
        <div className="flex-1 flex px-2 gap-1 overflow-x-auto items-center h-full py-1.5">
          {windows.map(w => (
            <button
              key={w.id}
              onClick={() => focusWindow(w.id)}
              className={`max-w-[160px] flex-1 truncate px-2 h-full text-[11px] text-white rounded-sm border ${
                windowOrder[windowOrder.length - 1] === w.id
                  ? 'bg-[#1b5cc9] border-[#0f43ab] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] font-bold'
                  : 'bg-[#3f8af2] border-[#89b9ff] hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]'
              } text-left flex items-center gap-1`}
            >
              <WIcon w={w} />
              <span className="truncate">{w.title}</span>
            </button>
          ))}
        </div>

        {/* Scheduler controls */}
        <div className="flex items-center gap-1.5 px-1.5 border-l border-[#89b9ff]/50 h-full py-1.5">
          <select
            value={scheduler.algorithm}
            onChange={e => scheduler.setAlgorithm(e.target.value)}
            className="text-[10px] bg-[#1a4ba5] text-white border border-[#89b9ff] px-1 py-0.5 h-full rounded-none"
          >
            <option value="fcfs">FCFS</option>
            <option value="rr">Round Robin</option>
          </select>
          {scheduler.algorithm === 'rr' && (
            <div className="flex items-center gap-0.5 text-[10px] text-white">
              <span>Q=</span>
              <input
                type="number" min={1} max={10}
                value={scheduler.rrQuantum}
                onChange={e => scheduler.setRrQuantum(Number(e.target.value))}
                className="w-8 bg-[#1a4ba5] text-white border border-[#89b9ff] text-center px-0.5"
              />
            </div>
          )}
          <button onClick={handleReset} title="Reset Scheduler" className="text-white hover:text-yellow-300">
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Import Media */}
        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1 text-[10px] text-white border border-[#89b9ff] px-2 py-0.5 hover:brightness-110 bg-[#1a4ba5] mx-1"
        >
          <Upload size={11} /> Import
        </button>
        <input ref={importRef} type="file" accept=".mp4,.mp3,.webm,.ogg,.wav" multiple className="hidden" onChange={handleImport} />

        {/* Clock */}
        <div className="xp-clock px-3 py-1 text-[11px] text-white/95 flex items-center h-[28px] mr-1">
          {clockStr}
        </div>
      </footer>
    </div>
  )
}
