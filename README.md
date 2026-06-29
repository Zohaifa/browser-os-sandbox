# Browser OS Sandbox

A web-based simulated desktop operating system environment built with React. This project demonstrates core OS concepts such as CPU scheduling, virtual memory management, and file systems, wrapped in a classic, interactive windowed graphical user interface reminiscent of Windows XP.

## Features

### Virtual Desktop Interface
- **Window Management**: Fully draggable and resizable application windows with maximize/minimize functionality.
- **Draggable Desktop**: Icons and files on the desktop can be freely dragged, arranged, and placed via an underlying coordinate system.
- **Taskbar & Start Menu**: Classic UI elements for launching applications and managing running processes.

### CPU Scheduling Simulator
- Supports multiple CPU scheduling algorithms to process simulated workloads:
  - **FCFS** (First Come, First Serve)
  - **RR** (Round Robin)
  - **SJF** (Shortest Job First)
  - **SRTF** (Shortest Remaining Time First - Preemptive)
- Processes have defined "burst times" and execute in real-time on a virtual clock.

### Memory Management & Swapping
- Simulates a **400MB RAM** capacity limit.
- **Dynamic Swapping**: If a newly launched process requires more memory than is currently available, the OS triggers a *Page Fault* and automatically swaps out older or paused processes to a virtual Disk to make room, using an LRU (Least Recently Used) approach.
- Processes swapped to disk wait in a suspended state until memory frees up and they are paged back in.

### Virtual File System (VFS)
- A fully nested, hierarchical file system supporting folders, text files, and media files.
- **Recycle Bin**: Safely delete files and restore them later, just like a native OS.
- **Persistence**: File structures, icon positions, and saved text files are saved to your browser's `localStorage` to survive page reloads.

### Simulated Applications
- **Task Manager**: Monitor CPU queues, view memory usage bars, see exactly which processes are in RAM versus Swapped to Disk, and force-terminate tasks.
- **Notepad**: A fully functional text editor for creating and modifying `.txt` files within the VFS.
- **Media Player**: Simulates audio and video playback while the CPU scheduler manages its processing time.
- **Banker's Algorithm / Deadlock Control**: Interactive simulator demonstrating resource allocation and deadlock avoidance.
- **Calculator**: A basic standard calculator utility.

## Tech Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS & Vanilla CSS Variables
- **Icons**: Lucide-React

## How to Run Locally

1. Clone the repository and navigate into the project directory:
   ```bash
   cd browser-os-sandbox
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the provided localhost URL in your browser to boot up the OS!
