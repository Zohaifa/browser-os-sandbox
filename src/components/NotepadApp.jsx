import { useState, useEffect } from 'react'

export default function NotepadApp({ file, onSave }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    if (file && file.content !== undefined) {
      setContent(file.content)
    } else {
      setContent('')
    }
  }, [file])

  return (
    <div className="w-[500px] h-[350px] flex flex-col bg-white text-black font-[Tahoma,Verdana,sans-serif]">
      {/* Menu Bar */}
      <div className="flex bg-[#ece9d8] border-b border-[#d4d0c8] text-[11px] px-1 py-0.5 select-none">
        <button onClick={() => onSave(file.id, content)} className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer">
          File &gt; Save
        </button>
        <div className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer">Edit</div>
        <div className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer">Format</div>
        <div className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer">View</div>
        <div className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white cursor-pointer">Help</div>
      </div>
      
      {/* Text Area */}
      <textarea
        className="flex-1 w-full p-2 outline-none resize-none font-mono text-[13px]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}
