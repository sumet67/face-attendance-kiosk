import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Settings, ShieldCheck, RefreshCw, LogIn, 
  LogOut, Trash2, LayoutDashboard, Users, History, 
  Monitor, CheckCircle2
} from 'lucide-react';

// --- CONFIGURATION ---
const ADMIN_PASSWORD = "1234";

/**
 * สำคัญ: นำ URL ที่ได้จากการ Deploy Google Apps Script มาวางในเครื่องหมายคำพูดด้านล่าง
 * หากยังไม่มี ให้เว้นเป็น "" ไว้ก่อน แอปจะยังทำงานได้ในโหมด Local
 */
const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxPbpA884oIpm4Tgsgb7QAFiFTLbCRssObYcW86unZ5LAdwP_pMbu_6kQGfj70ziED7Yw/exec"; 

const App = () => {
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

  // ฟังก์ชันดึงข้อมูลจาก Sheets
  const fetchDataFromSheets = async () => {
    if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.trim() === "") {
      console.log("No Google Sheet URL provided. Running in local mode.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const response = await fetch(GOOGLE_SHEET_WEBAPP_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data) {
        setEmployeeData(data.employees || []);
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // ฟังก์ชันส่งข้อมูลไป Sheets
  const postToSheets = async (payload) => {
    if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.trim() === "") {
      console.warn("Cannot post: No Web App URL defined.");
      return;
    }
    
    try {
      await fetch(GOOGLE_SHEET_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // หน่วงเวลาเล็กน้อยก่อนดึงข้อมูลใหม่เพื่อให้ฝั่ง Server ประมวลผลเสร็จ
      setTimeout(fetchDataFromSheets, 2500);
    } catch (error) {
      console.error("Post Error:", error);
    }
  };

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
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } 
      })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => {
        console.error("Camera access denied or not found:", err);
      });
    }
  };

  const handleRecord = async (status) => {
    if (!identifiedUser && employeeData.length > 0) return;
    
    const userName = identifiedUser || "Unknown User";
    const newLogEntry = {
      action: 'addLog',
      name: userName,
      date: currentTime.toLocaleDateString('th-TH'),
      time: currentTime.toLocaleTimeString('th-TH', { hour12: false }),
      status: status,
      id: Date.now(),
      note: currentTime.getHours() >= 9 && status === 'IN' ? 'สาย' : 'ปกติ'
    };

    // แสดง Feedback ที่หน้าจอทันที
    setLastLog({ ...newLogEntry, status });
    setIdentifiedUser(null);
    
    // ส่งข้อมูลไป Cloud
    await postToSheets(newLogEntry);
    
    // เคลียร์หน้าจอ Success หลัง 4 วินาที
    setTimeout(() => setLastLog(null), 4000);
  };

  const registerEmployee = async () => {
    if (!newName.trim()) return;
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

  // --- UI COMPONENTS ---

  if (appMode === 'kiosk') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden text-slate-200">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
        </div>

        {/* Header Section */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">FaceAuth <span className="text-indigo-400">Scan</span></h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] uppercase">Cloud Attendance System</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-mono font-bold text-white leading-none tabular-nums">
              {currentTime.toLocaleTimeString('th-TH', { hour12: false })}
            </p>
            <p className="text-xs font-bold text-indigo-400 mt-2 uppercase tracking-wider">
              {currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative w-full max-w-6xl z-10 flex flex-col lg:flex-row gap-10 items-stretch pb-16">
          <div className="flex-1 space-y-6">
            <div className="bg-black rounded-[3rem] overflow-hidden shadow-2xl aspect-video relative border-[12px] border-slate-900 group">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              
              {isModelLoading && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-20">
                  <RefreshCw className="animate-spin text-indigo-500 mb-6" size={56} />
                  <p className="text-sm font-black tracking-[0.2em] uppercase">Initializing Cloud AI...</p>
                </div>
              )}

              {lastLog && (
                <div className={`absolute inset-0 ${lastLog.status === 'IN' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} backdrop-blur-sm flex flex-col items-center justify-center text-white z-30 animate-in fade-in zoom-in duration-300 text-center px-8`}>
                  <div className="bg-white/20 p-6 rounded-full mb-6">
                    <CheckCircle2 size={80} className="animate-bounce" />
                  </div>
                  <h2 className="text-6xl font-black mb-3 uppercase tracking-tighter">
                    {lastLog.status === 'IN' ? 'Check In!' : 'Check Out!'}
                  </h2>
                  <p className="text-2xl font-bold opacity-90">{lastLog.name}</p>
                  <p className="text-lg opacity-70 mt-1">{lastLog.time} • Recorded to Sheets</p>
                </div>
              )}
            </div>

            {/* Face Identity Info */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 flex items-center justify-between shadow-xl">
               <div className="flex items-center gap-6">
                  <div className={`p-5 rounded-3xl transition-colors duration-500 ${identifiedUser ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                    <Camera size={40} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Status</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">{identifiedUser || 'Scanning...'}</h3>
                  </div>
               </div>
               {!identifiedUser && employeeData.length > 0 && (
                 <select 
                  onChange={(e) => setIdentifiedUser(e.target.value)}
                  className="bg-slate-800/80 border border-white/10 rounded-2xl px-6 py-4 text-white text-base font-bold outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                 >
                   <option value="">เลือกชื่อ (Manual)</option>
                   {employeeData.map(e => <option key={e.id} value={e.label}>{e.label}</option>)}
                 </select>
               )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            <button 
              onClick={() => handleRecord('IN')} 
              disabled={!identifiedUser || lastLog} 
              className="flex-1 py-10 rounded-[3rem] bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white transition-all shadow-2xl active:scale-95 flex flex-col items-center justify-center gap-4"
            >
              <LogIn size={54} />
              <span className="text-3xl font-black uppercase tracking-tighter">Check In</span>
            </button>
            <button 
              onClick={() => handleRecord('OUT')} 
              disabled={!identifiedUser || lastLog} 
              className="flex-1 py-10 rounded-[3rem] bg-rose-500 hover:bg-rose-400 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white transition-all shadow-2xl active:scale-95 flex flex-col items-center justify-center gap-4"
            >
              <LogOut size={54} />
              <span className="text-3xl font-black uppercase tracking-tighter">Check Out</span>
            </button>
          </div>
        </div>

        {/* Footer Settings Link */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
          <button onClick={() => setShowExitConfirm(true)} className="flex items-center gap-3 px-10 py-4 bg-white/5 hover:bg-white/10 text-slate-500 rounded-full border border-white/5 backdrop-blur-md transition-all">
            <Settings size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Admin Panel</span>
          </button>
        </div>

        {/* Password Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-[3rem] p-12 max-w-sm w-full border border-white/10 shadow-2xl">
              <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Enter Admin PIN</p>
              <input 
                type="password" 
                placeholder="••••"
                autoFocus
                maxLength={4}
                className="w-full p-6 bg-slate-800 border border-slate-700 rounded-3xl text-white font-black text-center text-5xl mb-10 outline-none focus:border-indigo-500"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => {setShowExitConfirm(false); setPassInput('');}} className="py-5 text-slate-400 font-black uppercase text-xs tracking-widest">Cancel</button>
                <button onClick={() => { if (passInput === ADMIN_PASSWORD) { setAppMode('admin'); setShowExitConfirm(false); setPassInput(''); } }} className="py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Verify</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- ADMIN MODE UI ---
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-700 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-4 border-b border-slate-800">
          <div className="bg-indigo-500 p-2.5 rounded-xl text-white shadow-lg"><LayoutDashboard size={24} /></div>
          <span className="font-black text-white tracking-tight text-lg uppercase">Admin Console</span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <History size={20} /> ประวัติการเข้างาน
          </button>
          <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'directory' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users size={20} /> รายชื่อพนักงาน
          </button>
          <div className="pt-8 pb-4"><div className="h-px bg-slate-800"></div></div>
          <button onClick={() => setAppMode('kiosk')} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm bg-slate-800 text-indigo-400 hover:bg-slate-700">
            <Monitor size={20} /> เปิดหน้า Kiosk
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex justify-between items-center shrink-0 shadow-sm z-10">
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
            {activeTab === 'overview' ? 'Google Sheets Dashboard' : 'Employee Directory'}
          </h2>
          <button onClick={fetchDataFromSheets} className="group flex items-center gap-3 px-6 py-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-full transition-all border border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest">Refresh Sheets</span>
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
          {activeTab === 'overview' ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">พนักงาน</th>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">วันที่</th>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">เวลาเข้า (IN)</th>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">เวลาออก (OUT)</th>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length > 0 ? logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 font-black text-xs uppercase">{log.name?.charAt(0)}</div>
                            <span className="font-bold text-slate-700">{log.name}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-500 font-medium">{log.date}</td>
                      <td className="px-8 py-5 text-sm font-mono text-emerald-600 font-bold">{log.checkIn || '--:--'}</td>
                      <td className="px-8 py-5 text-sm font-mono text-rose-600 font-bold">{log.checkOut || '--:--'}</td>
                      <td className="px-8 py-5">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase inline-block ${log.checkOut ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                            {log.checkOut ? 'เสร็จสิ้น' : 'กำลังทำงาน'}
                         </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">ไม่พบข้อมูลใน Google Sheets</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
               <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl flex gap-6 items-center">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">ลงทะเบียนพนักงานใหม่</p>
                    <input 
                      type="text" 
                      placeholder="พิมพ์ชื่อ-นามสกุล..." 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:border-indigo-500" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                    />
                  </div>
                  <button onClick={registerEmployee} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-14 mt-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-indigo-600/30">
                    Add to Sheets
                  </button>
               </div>
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                           <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase">ชื่อพนักงาน</th>
                           <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase text-right">จัดการ</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {employeeData.length > 0 ? employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                             <td className="px-10 py-5"><span className="font-bold text-slate-700 text-lg">{emp.label}</span></td>
                             <td className="px-10 py-5 text-right"><button className="p-3 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={20} /></button></td>
                          </tr>
                        )) : (
                          <tr><td colSpan="2" className="p-10 text-center text-slate-400 italic">ไม่มีรายชื่อพนักงาน</td></tr>
                        )}
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
