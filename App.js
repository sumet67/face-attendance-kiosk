import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Settings, ShieldCheck, RefreshCw, LogIn, 
  LogOut, Trash2, LayoutDashboard, Users, History, 
  Monitor, CheckCircle2
} from 'lucide-react';

// --- CONFIGURATION ---
const ADMIN_PASSWORD = "1234";

/** * แทนที่ URL นี้ด้วย Web App URL ที่ได้จาก Google Apps Script 
 * (ดูวิธีทำในไฟล์ Deployment Guide)
 */
const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxVMyemmEH-mgyFqaHfLFEbFmBrT5dbKAy5N0sSKSbMUNIUMs_zQqxIn0TYvioqWugOEA/exec"; 

const App = () => {
  // --- STATES ---
  const [appMode, setAppMode] = useState('kiosk');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [identifiedUser, setIdentifiedUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [newName, setNewName] = useState('');
  const [lastLog, setLastLog] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const videoRef = useRef(null);

  // --- GOOGLE SHEETS SYNC ---
  const fetchDataFromSheets = async () => {
    if (!GOOGLE_SHEET_WEBAPP_URL) return;
    setIsSyncing(true);
    try {
      const response = await fetch(GOOGLE_SHEET_WEBAPP_URL);
      const data = await response.json();
      setEmployeeData(data.employees || []);
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching from Google Sheets:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const postToSheets = async (payload) => {
    if (!GOOGLE_SHEET_WEBAPP_URL) return;
    try {
      await fetch(GOOGLE_SHEET_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Error posting to Google Sheets:", error);
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchDataFromSheets();
    const loader = setTimeout(() => {
      setIsModelLoading(false);
      startVideo();
    }, 1500);
    return () => {
      clearInterval(timer);
      clearTimeout(loader);
    };
  }, [appMode]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Camera error:", err));
  };

  const handleRecord = async (status) => {
    if (!identifiedUser && employeeData.length > 0) return;
    
    const userName = identifiedUser || "Unknown User";
    const newLog = {
      action: 'addLog',
      name: userName,
      date: currentTime.toLocaleDateString('th-TH'),
      time: currentTime.toLocaleTimeString('th-TH', { hour12: false }),
      status: status,
      id: Date.now(),
      note: currentTime.getHours() >= 9 && status === 'IN' ? 'สาย' : 'ปกติ'
    };

    // Optimistic Update
    setLogs(prev => [newLog, ...prev]);
    setLastLog(newLog);
    setIdentifiedUser(null);
    
    // Sync to Google Sheets
    await postToSheets(newLog);
    
    setTimeout(() => setLastLog(null), 4000);
  };

  const registerEmployee = async () => {
    if (!newName) return;
    const newEntry = { 
      action: 'addEmployee',
      label: newName, 
      id: Date.now(), 
      role: 'พนักงาน', 
      joined: new Date().toLocaleDateString('th-TH') 
    };
    
    setEmployeeData(prev => [...prev, newEntry]);
    await postToSheets(newEntry);
    setNewName('');
  };

  // --- RENDER KIOSK MODE ---
  if (appMode === 'kiosk') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        </div>

        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">FaceAuth <span className="text-indigo-400">Scan</span></h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em]">CLOUD TERMINAL</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-white leading-none">{currentTime.toLocaleTimeString('th-TH', { hour12: false })}</p>
            <p className="text-xs font-bold text-indigo-400 mt-1 uppercase">{currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        <div className="relative w-full max-w-5xl z-10 flex flex-col lg:flex-row gap-8 items-center pb-20">
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-black rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] aspect-video relative border-8 border-slate-900 group">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover grayscale-[20%]" />
              {isModelLoading && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-20">
                  <RefreshCw className="animate-spin text-indigo-500 mb-4" size={48} />
                  <p className="text-sm font-black tracking-widest uppercase">กำลังเชื่อมต่อระบบ Cloud...</p>
                </div>
              )}
              {lastLog && (
                <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white z-30 animate-in fade-in duration-300 text-center px-4">
                  <CheckCircle2 size={100} className="mb-4 animate-bounce" />
                  <h2 className="text-5xl font-black mb-2 uppercase">บันทึกสำเร็จ</h2>
                  <p className="text-xl font-bold opacity-80">{lastLog.name} • {lastLog.time}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${identifiedUser ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <Camera size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">การตรวจจับใบหน้า</p>
                    <h3 className="text-2xl font-black text-white">{identifiedUser || 'รอการสแกนใบหน้า...'}</h3>
                  </div>
               </div>
               {!identifiedUser && employeeData.length > 0 && (
                 <select 
                  onChange={(e) => setIdentifiedUser(e.target.value)}
                  className="bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-sm font-bold outline-none"
                 >
                   <option value="">เลือกชื่อ (Manual)</option>
                   {employeeData.map(e => <option key={e.id} value={e.label}>{e.label}</option>)}
                 </select>
               )}
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <button onClick={() => handleRecord('IN')} disabled={!identifiedUser || lastLog} className="flex-1 py-12 rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-white transition-all shadow-xl active:scale-95 group">
              <div className="flex flex-col items-center gap-2">
                <LogIn size={48} />
                <span className="text-3xl font-black uppercase">เข้างาน</span>
              </div>
            </button>
            <button onClick={() => handleRecord('OUT')} disabled={!identifiedUser || lastLog} className="flex-1 py-12 rounded-[2.5rem] bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 text-white transition-all shadow-xl active:scale-95 group">
              <div className="flex flex-col items-center gap-2">
                <LogOut size={48} />
                <span className="text-3xl font-black uppercase">ออกงาน</span>
              </div>
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50">
          <button onClick={() => setShowExitConfirm(true)} className="flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all rounded-full border border-white/5 backdrop-blur-sm">
            <Settings size={14} className="opacity-50" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Exit Kiosk System</span>
          </button>
        </div>

        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 max-w-sm w-full border border-white/10">
              <input 
                type="password" 
                placeholder="0000"
                autoFocus
                className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-center text-3xl tracking-[0.6em] mb-8 outline-none"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passInput === ADMIN_PASSWORD) {
                    setAppMode('admin');
                    setShowExitConfirm(false);
                    setPassInput('');
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => {setShowExitConfirm(false); setPassInput('');}} className="py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">ยกเลิก</button>
                <button onClick={() => { if (passInput === ADMIN_PASSWORD) { setAppMode('admin'); setShowExitConfirm(false); setPassInput(''); } }} className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">ยืนยัน</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER ADMIN DASHBOARD ---
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-700 overflow-hidden font-sans">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg text-white"><LayoutDashboard size={20} /></div>
          <span className="font-bold text-white tracking-tight">Admin Sheet Console</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <History size={18} /> สรุปเวลา (Sheets)
          </button>
          <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'directory' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <Users size={18} /> จัดการพนักงาน
          </button>
          <div className="h-4"></div>
          <button onClick={() => setAppMode('kiosk')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm bg-slate-800 text-indigo-400 hover:bg-slate-700">
            <Monitor size={18} /> กลับหน้า Kiosk
          </button>
        </nav>
        <div className="p-4 bg-slate-950 text-[10px] text-center">
            {isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'Cloud Connected'}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab === 'overview' ? 'บันทึกจาก Google Sheets' : 'รายชื่อใน Cloud'}</h2>
          <button onClick={fetchDataFromSheets} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">ชื่อ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">วันที่</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">เวลา</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-700">{log.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{log.date}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{log.time}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest uppercase ${log.status === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {log.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'directory' && (
            <div className="max-w-4xl mx-auto space-y-6">
               <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex gap-4">
                  <input 
                    type="text" 
                    placeholder="ชื่อพนักงานใหม่..." 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button onClick={registerEmployee} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
                     เพิ่มรายชื่อไปที่ Cloud
                  </button>
               </div>
               <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                     <tbody className="divide-y divide-slate-100">
                        {employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50">
                             <td className="px-8 py-4 font-bold text-slate-700">{emp.label}</td>
                             <td className="px-8 py-4 text-sm text-slate-500">{emp.joined}</td>
                             <td className="px-8 py-4 text-right">
                                <button className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
