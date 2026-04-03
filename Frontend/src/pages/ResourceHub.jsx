import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  Music,
  Book,
  Filter,
  ArrowLeft,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  deleteResource,
  downloadResourceSummary,
  fetchResource,
  fetchResources,
  uploadResource,
} from '../lib/auth';

const RESOURCE_TYPES = [
  { id: 'all', label: 'All Resources', icon: Layers },
  { id: 'pdf', label: 'PDF Notes', icon: FileText },
  { id: 'video', label: 'Video Lessons', icon: Video },
  { id: 'audio', label: 'Audio Material', icon: Music },
  { id: 'ebook', label: 'E-Books', icon: Book },
];

const FACULTIES = ["FOC", "FOB", "FOE", "FAS", "FOL"];
const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const SEMESTERS = ["Semester 1", "Semester 2"];

// Helper to get a random cover image based on type
function getPlaceholderCover(type) {
  const covers = {
    pdf: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=500&auto=format&fit=crop&q=60',
    video: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=500&auto=format&fit=crop&q=60',
    audio: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60',
    ebook: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60',
    all: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60'
  };
  return covers[type] || covers.all;
}

export function ResourceHub({ user }) {
  const [view, setView] = useState('explore'); // 'explore' or 'upload'
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Upload Form State
  const [formData, setFormData] = useState({
    subject: '',
    resourceType: 'pdf',
    faculty: user?.faculty || 'FOC',
    year: user?.year || 'Year 1',
    semester: user?.semester || 'Semester 1',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Load Resources
  async function loadResources() {
    setIsLoading(true);
    try {
      const typeParam = selectedType === 'all' ? '' : selectedType;
      const data = await fetchResources(search, typeParam);
      setResources(data.resources);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, [selectedType]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadResources();
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  // Handle Upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.subject) {
        setFormData(prev => ({ ...prev, subject: file.name.split('.')[0] }));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      await uploadResource(selectedFile, formData);
      setStatusMessage("Resource uploaded successfully!");
      setView('explore');
      setSelectedFile(null);
      setFormData({
        subject: '',
        resourceType: 'pdf',
        faculty: user?.faculty || 'FOC',
        year: user?.year || 'Year 1',
        semester: user?.semester || 'Semester 1',
        description: ''
      });
      loadResources();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const { blob, filename } = await downloadResourceSummary(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteResource(id);
      loadResources();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-wellness-blue/10 rounded-2xl">
              <BookOpen className="w-8 h-8 text-wellness-blue" />
            </div>
            Resource Hub
          </h1>
          <p className="mt-2 text-slate-500 font-medium flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Showing materials for {user?.faculty} • {user?.year} • {user?.semester}
          </p>
        </div>

        <button
          onClick={() => setView(view === 'explore' ? 'upload' : 'explore')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 ${
            view === 'explore' 
              ? 'bg-wellness-blue text-white hover:bg-wellness-blue/90' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {view === 'explore' ? (
            <>
              <Plus className="w-5 h-5" />
              Upload Resource
            </>
          ) : (
            <>
              <ArrowLeft className="w-5 h-5" />
              Back to Hub
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'explore' ? (
          <motion.div
            key="explore"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search resources, subjects, topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-wellness-blue/10 focus:border-wellness-blue outline-none transition-all font-medium"
                />
              </div>
              
              <div className="flex overflow-x-auto pb-2 gap-2 w-full lg:w-auto scrollbar-hide">
                {RESOURCE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all border ${
                      selectedType === type.id
                        ? 'bg-wellness-blue/10 border-wellness-blue text-wellness-blue'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-wellness-blue/30'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-wellness-blue" />
                <p className="text-slate-500 font-medium">Fetching the best resources for you...</p>
              </div>
            ) : resources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {resources.map((res) => (
                  <motion.div
                    layout
                    key={res.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 group flex flex-col h-full"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={res.thumbnailUrl || getPlaceholderCover(res.resourceType)}
                        alt={res.originalFileName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 backdrop-blur-md bg-white/30 p-2 rounded-xl border border-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => handleDelete(res.id)}
                           className="text-white hover:text-red-300"
                          >
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <p className="text-white text-xs font-medium line-clamp-2">
                          {res.description || "No additional description provided."}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 flex flex-col flex-grow text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                         {res.resourceType === 'video' && <Video className="w-4 h-4 text-wellness-blue" />}
                         {res.resourceType === 'audio' && <Music className="w-4 h-4 text-wellness-blue" />}
                         {res.resourceType === 'pdf' && <FileText className="w-4 h-4 text-wellness-blue" />}
                         {res.resourceType === 'ebook' && <Book className="w-4 h-4 text-wellness-blue" />}
                         <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                           {res.resourceType}
                         </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-6 group-hover:text-wellness-blue transition-colors leading-tight min-h-[3.5rem]">
                        {res.subject || res.originalFileName}
                      </h3>

                      <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-2">
                        <button
                          onClick={() => handleDownload(res.id, res.originalFileName)}
                          className="w-full bg-[#6EB544] hover:bg-[#5da038] text-white py-3 rounded-xl font-extrabold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                          <Download className="w-4 h-4 mt-[-2px]" />
                          Download
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Layers className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-2">Shelf is currently empty</h3>
                <p className="text-slate-400 font-medium">Be the first to share resources with your batchmates!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-wellness-blue p-8 flex items-center gap-4">
                 <div className="p-3 bg-white/20 rounded-2xl border border-white/30">
                   <UploadCloud className="w-8 h-8 text-white" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-extrabold text-white">Share Resource</h2>
                   <p className="text-white/70 font-medium">Upload material for your faculty & batch</p>
                 </div>
              </div>

              <form onSubmit={handleUpload} className="p-8 lg:p-12 space-y-8">
                {/* File Dropzone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative dashed-border-animate p-10 bg-slate-50 text-center cursor-pointer group rounded-3xl hover:bg-slate-100/50 transition-colors"
                >
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    onChange={handleFileSelect}
                    className="hidden" 
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-wellness-green-light/50 text-wellness-green rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-slate-700">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                       <div className="w-16 h-16 bg-white text-wellness-blue rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-slate-700 text-lg">Choose a file or drag it here</p>
                      <p className="text-slate-400 font-medium mt-1">PDF, Video (MP4), Audio (MP3), or E-Books</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Subject / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Operating Systems Final Prep"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-wellness-blue/10 outline-none font-medium transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Resource Category</label>
                    <div className="relative">
                      <select
                        value={formData.resourceType}
                        onChange={(e) => setFormData({...formData, resourceType: e.target.value})}
                        className="w-full appearance-none px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-wellness-blue/10 outline-none font-medium transition-all"
                      >
                        <option value="pdf">📄 PDF Notes</option>
                        <option value="video">🎥 Video Lesson</option>
                        <option value="audio">🔊 Audio Material</option>
                        <option value="ebook">📚 E-Book</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                   <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Faculty</label>
                    <select
                      value={formData.faculty}
                      onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-wellness-blue shadow-sm font-medium"
                    >
                      {FACULTIES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                   <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-wellness-blue shadow-sm font-medium"
                    >
                      {YEARS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                   <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-wellness-blue shadow-sm font-medium"
                    >
                      {SEMESTERS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what's in this resource..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-wellness-blue/10 outline-none font-medium transition-all resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-4 bg-peach-50 text-wellness-peach rounded-2xl flex items-center gap-3 font-medium text-sm border border-wellness-peach/20">
                     <Sparkles className="w-5 h-5 shrink-0" />
                     {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-wellness-blue text-white py-5 rounded-[2rem] font-extrabold text-lg shadow-xl shadow-wellness-blue/20 hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Uploading & Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      Confirm & Upload
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .dashed-border-animate {
          background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23CBD5E1' stroke-width='4' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e");
          border-radius: 24px;
        }
        
        .dashed-border-animate:hover {
          background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%236FA5A5' stroke-width='4' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e");
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
