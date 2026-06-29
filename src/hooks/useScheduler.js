import { useCallback, useEffect, useRef, useState } from "react";

// XP-style muted colors for Gantt (not rainbow)
const PROCESS_COLORS = [
    "#4472c4",
    "#ed7d31",
    "#70ad47",
    "#ffc000",
    "#5b9bd5",
    "#c55a11",
    "#375623",
    "#7030a0",
];
let _colorIdx = 0;
let _pid = 1;

function nextColor() {
    return PROCESS_COLORS[_colorIdx++ % PROCESS_COLORS.length];
}

export function createPCB(file, clockVal) {
    return {
        pid: _pid++,
        name: file.name,
        fileId: file.id,
        mediaType: file.mediaType || null,
        blobUrl: file.blobUrl || null,
        arrivalTime: clockVal,
        burstTime: file.burstTime || 10,
        remainingTime: file.burstTime || 10,
        state: "Ready",
        color: nextColor(),
        waitingTime: 0,
        startTime: null,
        completionTime: null,
        memoryReq: file.memoryReq || 20,
        inMemory: false,
        lastAccessTime: clockVal,
    };
}

export default function useScheduler() {
    // ── All mutable scheduler state lives in refs (no stale-closure issue) ──
    const queueRef = useRef([]); // ready/paused PCBs
    const runningRef = useRef(null); // currently running PCB
    const completedRef = useRef([]); // finished PCBs
    const ganttRef = useRef([]); // [{pid, name, color}] one per tick
    const clockRef = useRef(0);
    const rrCounterRef = useRef(0);
    const algorithmRef = useRef("fcfs");
    const rrQuantumRef = useRef(3);
    const activeRef = useRef(false); // true while processes exist
    const ramSizeRef = useRef(400); // 400MB total

    // Single state to trigger re-renders
    const [, forceRender] = useState(0);
    const rerender = useCallback(() => forceRender((n) => n + 1), []);

    // Exposed derived state (for React render)
    const [algorithm, _setAlgorithm] = useState("fcfs");
    const [rrQuantum, _setRrQuantum] = useState(3);
    const [ramSize, _setRamSize] = useState(400);

    const setAlgorithm = useCallback((alg) => {
        algorithmRef.current = alg;
        _setAlgorithm(alg);
    }, []);

    const setRrQuantum = useCallback((q) => {
        rrQuantumRef.current = q;
        _setRrQuantum(q);
    }, []);

    const setRamSize = useCallback((s) => {
        ramSizeRef.current = s;
        _setRamSize(s);
    }, []);

    // Helper to calculate currently used RAM
    const getUsedRam = useCallback(() => {
        let used = 0;
        if (runningRef.current?.inMemory) used += runningRef.current.memoryReq;
        for (const p of queueRef.current) {
            if (p.inMemory) used += p.memoryReq;
        }
        return used;
    }, []);

    // ── One long-lived interval ──
    useEffect(() => {
        const interval = setInterval(() => {
            if (!activeRef.current) return;

            clockRef.current += 1;
            const alg = algorithmRef.current;
            const quantum = rrQuantumRef.current;

            // Increment waiting time for all in queue
            queueRef.current = queueRef.current.map((p) => ({
                ...p,
                waitingTime: p.waitingTime + 1,
            }));

            let current = runningRef.current ? { ...runningRef.current } : null;

            if (alg === "fcfs") {
                if (!current && queueRef.current.length > 0) {
                    queueRef.current.sort(
                        (a, b) => a.arrivalTime - b.arrivalTime,
                    );
                    current = queueRef.current.shift();
                    current.startTime = current.startTime ?? clockRef.current;
                    current.state = "Running";
                }
            } else if (alg === "sjf") {
                if (!current && queueRef.current.length > 0) {
                    queueRef.current.sort((a, b) => {
                        if (a.burstTime === b.burstTime) return a.arrivalTime - b.arrivalTime;
                        return a.burstTime - b.burstTime;
                    });
                    current = queueRef.current.shift();
                    current.startTime = current.startTime ?? clockRef.current;
                    current.state = "Running";
                }
            } else if (alg === "srtf") {
                if (queueRef.current.length > 0) {
                    queueRef.current.sort((a, b) => {
                        if (a.remainingTime === b.remainingTime) return a.arrivalTime - b.arrivalTime;
                        return a.remainingTime - b.remainingTime;
                    });
                    if (current) {
                        if (queueRef.current[0].remainingTime < current.remainingTime) {
                            queueRef.current.push({ ...current, state: "Paused" });
                            current = queueRef.current.shift();
                            current.startTime = current.startTime ?? clockRef.current;
                            current.state = "Running";
                        }
                    } else {
                        current = queueRef.current.shift();
                        current.startTime = current.startTime ?? clockRef.current;
                        current.state = "Running";
                    }
                }
            } else {
                // Round Robin
                if (current) {
                    rrCounterRef.current += 1;
                    if (
                        rrCounterRef.current >= quantum &&
                        queueRef.current.length > 0
                    ) {
                        queueRef.current.push({ ...current, state: "Paused" });
                        current = queueRef.current.shift();
                        current.startTime =
                            current.startTime ?? clockRef.current;
                        current.state = "Running";
                        rrCounterRef.current = 0;
                    }
                } else if (queueRef.current.length > 0) {
                    current = queueRef.current.shift();
                    current.startTime = current.startTime ?? clockRef.current;
                    current.state = "Running";
                    rrCounterRef.current = 0;
                }
            }

            // ── Memory Management (Swapping) ──
            // If the current process wants to run, ensure it's in memory.
            if (current && !current.inMemory) {
                let used = (runningRef.current?.inMemory ? runningRef.current.memoryReq : 0);
                for (const p of queueRef.current) if (p.inMemory) used += p.memoryReq;
                
                // Swap out least recently used processes in the queue until we have enough space
                while (used + current.memoryReq > ramSizeRef.current) {
                    let oldest = null;
                    for (const p of queueRef.current) {
                        if (p.inMemory) {
                            if (!oldest || p.lastAccessTime < oldest.lastAccessTime) {
                                oldest = p;
                            }
                        }
                    }
                    if (!oldest) break; // Cannot free up more space (e.g. current process needs more than total RAM)
                    oldest.inMemory = false;
                    used -= oldest.memoryReq;
                }
                
                if (used + current.memoryReq <= ramSizeRef.current) {
                    current.inMemory = true;
                } else {
                    // Cannot fit into RAM even if empty (Memory Error)
                    // We'll mark it as failed and complete it.
                    current.state = "Memory Error";
                    current.remainingTime = 0;
                }
            }

            if (current) {
                current.lastAccessTime = clockRef.current;
                
                if (current.state !== "Memory Error") {
                    current.remainingTime -= 1;
                    ganttRef.current.push({
                        pid: current.pid,
                        name: current.name,
                        color: current.color,
                    });
                }

                if (current.remainingTime <= 0) {
                    completedRef.current.push({
                        ...current,
                        state: current.state === "Memory Error" ? "Failed (OOM)" : "Completed",
                        completionTime: clockRef.current,
                        inMemory: false,
                    });
                    current = null;
                    rrCounterRef.current = 0;
                }
            }

            runningRef.current = current;

            if (!current && queueRef.current.length === 0) {
                activeRef.current = false;
            }

            rerender();
        }, 1000);

        return () => clearInterval(interval);
    }, [rerender]); // empty-ish — runs forever, reads from refs

    const addProcess = useCallback(
        (file) => {
            const pcb = createPCB(file, clockRef.current);
            queueRef.current = [...queueRef.current, pcb];
            activeRef.current = true;
            rerender();
            return pcb; // return the new PCB so caller knows the pid
        },
        [rerender],
    );

    const terminateProcess = useCallback(
        (pid) => {
            if (runningRef.current?.pid === pid) {
                runningRef.current = null;
                rrCounterRef.current = 0;
            }
            queueRef.current = queueRef.current.filter((p) => p.pid !== pid);
            completedRef.current = completedRef.current.filter(
                (p) => p.pid !== pid,
            );
            if (!runningRef.current && queueRef.current.length === 0) {
                activeRef.current = false;
            }
            rerender();
        },
        [rerender],
    );

    const resetScheduler = useCallback(() => {
        queueRef.current = [];
        runningRef.current = null;
        completedRef.current = [];
        ganttRef.current = [];
        clockRef.current = 0;
        rrCounterRef.current = 0;
        activeRef.current = false;
        _pid = 1;
        _colorIdx = 0;
        rerender();
    }, [rerender]);

    const allProcesses = [
        ...(runningRef.current ? [runningRef.current] : []),
        ...queueRef.current,
        ...completedRef.current,
    ];

    const isDone =
        !runningRef.current &&
        queueRef.current.length === 0 &&
        completedRef.current.length > 0;

    const metrics = isDone
        ? (() => {
              const procs = completedRef.current;
              const n = procs.length;
              const totalTurnaround = procs.reduce(
                  (s, p) => s + (p.completionTime - p.arrivalTime),
                  0,
              );
              const totalWaiting = procs.reduce((s, p) => s + p.waitingTime, 0);
              const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);
              return {
                  avgTurnaround: (totalTurnaround / n).toFixed(2),
                  avgWaiting: (totalWaiting / n).toFixed(2),
                  cpuUtilization: Math.min(
                      100,
                      (totalBurst / (clockRef.current || 1)) * 100,
                  ).toFixed(1),
              };
          })()
        : null;

    return {
        algorithm,
        setAlgorithm,
        rrQuantum,
        setRrQuantum,
        ramSize,
        setRamSize,
        usedRam: getUsedRam(),
        virtualClock: clockRef.current,
        readyQueue: queueRef.current,
        runningProcess: runningRef.current,
        completedProcesses: completedRef.current,
        ganttLog: ganttRef.current,
        allProcesses,
        metrics,
        isRunning: activeRef.current,
        addProcess,
        terminateProcess,
        resetScheduler,
    };
}
