
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Initializing Experience</h1>
      <p className="text-slate-500 font-medium max-w-xs">Connecting your components and preparing the live preview...</p>
    </div>
  );
}