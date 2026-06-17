import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import UploadZone from '../components/UploadZone';
import DocumentCard from '../components/DocumentCard';
import { LogOut, User, FolderOpen, FileText, Sparkles } from 'lucide-react';

const DashboardPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  const fetchDocuments = async () => {
    try {
      const res = await client.get('/documents/');
      setDocuments(res.data);
    } catch (err) {
      console.error("Error fetching documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteSuccess = (deletedId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== deletedId));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-950/40 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/10">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              SmartDoc Q&A
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <User className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-slate-350">{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Zone & Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-2">Upload Document</h2>
            <p className="text-xs text-slate-400 mb-6">Upload PDFs, DOCX, or text files. The AI parser will automatically index and prepare the text content for question answering.</p>
            <UploadZone onUploadSuccess={fetchDocuments} />
          </div>
        </div>

        {/* Documents Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-6">
            <FolderOpen className="w-5 h-5 text-brand-400" />
            <h2 className="text-xl font-extrabold text-slate-200">My Library</h2>
            <span className="bg-slate-800/80 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-700/60 ml-2">
              {documents.length}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 h-[200px] animate-pulse flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-slate-800 rounded-xl mb-4" />
                    <div className="h-4 bg-slate-800 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-800 rounded w-1/3" />
                  </div>
                  <div className="h-9 bg-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-350 text-base">No documents yet</h3>
              <p className="text-xs text-slate-500 max-w-[285px] mt-1.5 leading-relaxed">
                Drag and drop a PDF, Word document, or plain text file into the upload zone to start chatting.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {documents.map(doc => (
                <div key={doc.id}>
                  <DocumentCard doc={doc} onDeleteSuccess={handleDeleteSuccess} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
