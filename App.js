import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, UserCheck, UserX, Settings, ShieldCheck, 
  Clock, UserPlus, Database, RefreshCw, LogIn, 
  LogOut, Trash2, Download, ChevronRight, LayoutDashboard,
  Users, History, AlertCircle, Monitor, LogOut as LogoutIcon,
  Maximize, CheckCircle2, XCircle
} from 'lucide-react';

// --- CONFIGURATION ---
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'face-auth-split-v1';
const ADMIN_PASSWORD = "1234";

const App = () => {
  // --- STATES ---
  const [appMode, setAppMode] = useState('kiosk'); // 'kiosk' (Scanning System) or 'admin' (Dashboard)
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

  const videoRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadLocalData();
    const loader = setTimeout(() => {
      setIsModelLoading(false);
      startVideo();
    }, 1500);
    return () => {
      clearInterval(timer);
      clearTimeout(loader);
    };
  }, [appMode]); // Restart video when switching modes

  const loadLocalData = () => {
    const savedEmployees = localStorage.getItem(`${APP_ID}_employees`);
    if (savedEmployees) setEmployeeData(JSON.parse(savedEmployees));
    const savedLogs = localStorage.getItem(`${APP_ID}_logs`);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Camera error:", err));
  };

  const handleRecord = (status) => {
    if (!identifiedUser && employeeData.length > 0) return;
    
    const userName = identifiedUser || "Unknown User";
    const newLog = {
      name: userName,
      date: currentTime.toLocaleDateString('th-TH'),
      time: currentTime.toLocaleTimeString('th-TH', { hour12: false }),
      status: status,
      id: Date.now(),
      note: currentTime.getHours() >= 9 && status === 'IN' ? 'สาย' : 'ปกติ'
    };

    const updatedLogs = [newLog, ...logs].slice(0, 100);
    setLogs(updatedLogs);
    localStorage.setItem(`${APP_ID}_logs`, JSON.stringify(updatedLogs));
    
    // Show Feedback
    setLastLog(newLog);
    setIdentifiedUser(null);
    setTimeout(() => setLastLog(null), 4000);
  };

  const registerEmployee = () => {
    if (!newName) return;
    const newEntry = { label: newName, id: Date.now(), role: 'พนักงาน', joined: new Date().toLocaleDateString('th-TH') };
    const updated = [...employeeData, newEntry];
    setEmployeeData(updated);
    localStorage.setItem(`${APP_ID}_employees`, JSON.stringify(updated));
    setNewName('');
  };

  const clearAllData = () => {
    if (window.confirm("ยืนยันการล้างข้อมูลทั้งหมด?")) {
      localStorage.clear();
      setEmployeeData([]);
      setLogs([]);
    }
  };

  // --- RENDER KIOSK MODE (Scanning System) ---
  if (appMode === 'kiosk') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        </div>

        {/* Header */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">FaceAuth <span className="text-indigo-400">Scan</span></h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em]">KIOSK TERMINAL</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-white leading-none">{currentTime.toLocaleTimeString('th-TH', { hour12: false })}</p>
            <p className="text-xs font-bold text-indigo-400 mt-1 uppercase">{currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        {/* Main Scanner Section */}
        <div className="relative w-full max-w-5xl z-10 flex flex-col lg:flex-row gap-8 items-center pb-20">
          
          {/* กล้องสแกน */}
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-black rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] aspect-video relative border-8 border-slate-900 group">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover grayscale-[20%]" />
              
              {/* HUD Overlays */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-indigo-500/20 rounded-full animate-pulse"></div>
                <div className="absolute w-72 h-72 border-t-4 border-l-4 border-indigo-500 rounded-tl-3xl top-1/2 left-1/2 -translate-x-[110%] -translate-y-[110%]"></div>
                <div className="absolute w-72 h-72 border-b-4 border-r-4 border-indigo-500 rounded-br-3xl top-1/2 left-1/2 translate-x-[10%] translate-y-[10%]"></div>
              </div>

              {isModelLoading && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-20">
                  <RefreshCw className="animate-spin text-indigo-500 mb-4" size={48} />
                  <p className="text-sm font-black tracking-widest uppercase">กำลังเริ่มต้นระบบ AI...</p>
                </div>
              )}

              {/* Success Feedback Overlay */}
              {lastLog && (
                <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white z-30 animate-in fade-in duration-300">
                  <CheckCircle2 size={100} className="mb-4 animate-bounce" />
                  <h2 className="text-5xl font-black mb-2 uppercase">บันทึกสำเร็จ</h2>
                  <p className="text-xl font-bold opacity-80">{lastLog.name} • {lastLog.time}</p>
                  <p className="mt-4 px-6 py-2 bg-white/20 rounded-full text-sm font-bold tracking-widest uppercase">{lastLog.status === 'IN' ? 'เข้างาน' : 'ออกงาน'}</p>
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
                    <h3 className="text-2xl font-black text-white">{identifiedUser ? identifiedUser : 'รอการสแกนใบหน้า...'}</h3>
                  </div>
               </div>
               {!identifiedUser && employeeData.length > 0 && (
                 <select 
                  onChange={(e) => setIdentifiedUser(e.target.value)}
                  className="bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                 >
                   <option value="">เลือกชื่อ (Manual)</option>
                   {employeeData.map(e => <option key={e.id} value={e.label}>{e.label}</option>)}
                 </select>
               )}
            </div>
          </div>

          {/* ปุ่มกด Check In / Out */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <button 
              onClick={() => handleRecord('IN')}
              disabled={!identifiedUser || lastLog}
              className="flex-1 py-12 rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:opacity-50 text-white transition-all shadow-xl active:scale-95 group relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col items-center gap-2">
                <LogIn size={48} className="group-hover:translate-y-[-5px] transition-transform" />
                <span className="text-3xl font-black uppercase tracking-tighter">เข้างาน</span>
                <span className="text-xs font-bold opacity-60 tracking-widest uppercase">CHECK-IN</span>
              </div>
            </button>
            <button 
              onClick={() => handleRecord('OUT')}
              disabled={!identifiedUser || lastLog}
              className="flex-1 py-12 rounded-[2.5rem] bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:opacity-50 text-white transition-all shadow-xl active:scale-95 group relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col items-center gap-2">
                <LogOut size={48} className="group-hover:translate-y-[-5px] transition-transform" />
                <span className="text-3xl font-black uppercase tracking-tighter">ออกงาน</span>
                <span className="text-xs font-bold opacity-60 tracking-widest uppercase">CHECK-OUT</span>
              </div>
            </button>
          </div>
        </div>

        {/* Exit Admin Button - Positioned at absolute bottom center */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50">
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all rounded-full border border-white/5 backdrop-blur-sm"
          >
            <Settings size={14} className="opacity-50" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Exit Kiosk System</span>
          </button>
        </div>

        {/* Exit Authentication Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 max-w-sm w-full border border-white/10 shadow-2xl">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="text-indigo-500" size={32} />
                </div>
                <h3 className="text-white text-xl font-black uppercase tracking-tight">ยืนยันรหัสผ่านแอดมิน</h3>
                <p className="text-slate-500 text-xs font-bold mt-1">กรุณาระบุรหัสเพื่อเข้าสู่ Dashboard</p>
              </div>
              
              <input 
                type="password" 
                placeholder="0000"
                autoFocus
                className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-center text-3xl tracking-[0.6em] mb-8 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
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
                <button 
                  onClick={() => {setShowExitConfirm(false); setPassInput('');}} 
                  className="py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={() => {
                    if (passInput === ADMIN_PASSWORD) {
                      setAppMode('admin');
                      setShowExitConfirm(false);
                      setPassInput('');
                    } else {
                      alert("รหัสผ่านไม่ถูกต้อง");
                    }
                  }}
                  className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  ยืนยัน
                </button>
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
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg text-white">
            <LayoutDashboard size={20} />
          </div>
          <span className="font-bold text-white tracking-tight">Admin Dashboard</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800'}`}>
            <History size={18} /> ภาพรวมระบบ
          </button>
          <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800'}`}>
            <Users size={18} /> รายชื่อพนักงาน
          </button>
          <div className="h-4"></div>
          <button onClick={() => setAppMode('kiosk')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm bg-slate-800 text-indigo-400 hover:bg-slate-700">
            <Monitor size={18} /> เปิดหน้าจอ Scan
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
          v1.5.0-split-mode
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800 capitalize tracking-tight">{activeTab === 'overview' ? 'สรุปการเข้างาน' : 'ฐานข้อมูลพนักงาน'}</h2>
          <div className="flex items-center gap-6">
            <p className="text-sm font-bold text-slate-400">{currentTime.toLocaleDateString('th-TH')}</p>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ShieldCheck size={16} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">พนักงานทั้งหมด</p>
                  <p className="text-4xl font-black text-slate-800">{employeeData.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">มาทำงานวันนี้</p>
                  <p className="text-4xl font-black text-emerald-600">{new Set(logs.filter(l => l.date === currentTime.toLocaleDateString('th-TH')).map(l => l.name)).size}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">มาสายวันนี้</p>
                  <p className="text-4xl font-black text-amber-500">{logs.filter(l => l.date === currentTime.toLocaleDateString('th-TH') && l.note === 'สาย').length}</p>
                </div>
              </div>

              {/* Log Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 font-bold text-slate-800">ประวัติการบันทึกเวลา</div>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">ชื่อพนักงาน</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">วันที่</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">เวลา</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">สถานะ</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">{log.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{log.date}</td>
                          <td className="px-6 py-4 text-sm font-mono text-slate-600">{log.time}</td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest uppercase ${log.status === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {log.status === 'IN' ? 'CHECK-IN' : 'CHECK-OUT'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={`text-[10px] font-bold ${log.note === 'สาย' ? 'text-amber-500' : 'text-slate-400'}`}>{log.note}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'directory' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
               <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">เพิ่มพนักงานใหม่</h3>
                    <p className="text-sm text-slate-500">ลงทะเบียนชื่อเพื่อใช้ในระบบสแกนอัตลักษณ์ใบหน้า</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                     <input 
                      type="text" 
                      placeholder="ชื่อ-นามสกุล..." 
                      className="flex-1 md:w-64 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                     />
                     <button onClick={registerEmployee} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                        เพิ่มชื่อ
                     </button>
                  </div>
               </div>

               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">พนักงาน</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ตำแหน่ง</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50">
                             <td className="px-8 py-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{emp.label.charAt(0)}</div>
                                <span className="font-bold text-slate-700">{emp.label}</span>
                             </td>
                             <td className="px-8 py-4 text-sm text-slate-500 font-medium">{emp.role}</td>
                             <td className="px-8 py-4 text-right">
                                <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                   <Trash2 size={16} />
                                </button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               
               <button onClick={clearAllData} className="w-full py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all">
                  ล้างข้อมูลระบบทั้งหมด (Hard Reset)
               </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
