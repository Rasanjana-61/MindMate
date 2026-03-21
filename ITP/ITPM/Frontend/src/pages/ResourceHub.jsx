import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  deleteResource,
  downloadResourceSummary,
  fetchResource,
  fetchResources,
  regenerateResource,
  uploadResource,
} from '../lib/auth';

function formatDateLabel(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ResourceHub() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [expandedSections, setExpandedSections] = useState({
    keyPoints: true,
    definitions: true,
    keywords: false,
  });
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);

  async function loadResources(nextSearch = search) {
    setIsLoadingList(true);

    try {
      const data = await fetchResources(nextSearch);
      setResources(data.resources);

      if (!selectedResourceId && data.resources.length) {
        setSelectedResourceId(data.resources[0].id);
      }

      if (selectedResourceId && !data.resources.some((item) => item.id === selectedResourceId)) {
        setSelectedResourceId(data.resources[0]?.id || '');
        setSelectedResource(data.resources[0] || null);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoadingList(false);
    }
  }

  async function loadResource(resourceId) {
    if (!resourceId) {
      setSelectedResource(null);
      return;
    }

    setIsLoadingResource(true);

    try {
      const data = await fetchResource(resourceId);
      setSelectedResource(data.resource);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoadingResource(false);
    }
  }

  useEffect(() => {
    loadResources('');
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadResources(search);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadResource(selectedResourceId);
  }, [selectedResourceId]);

  const selectedTags = useMemo(() => selectedResource?.tags || [], [selectedResource]);

  function toggleSection(section) {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  async function handleFileSelection(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');
    setSelectedFileName(file.name);
    setUploadState('uploading');

    try {
      setUploadState('processing');
      const response = await uploadResource(file, subject);
      setStatusMessage(response.message);
      setUploadState('done');
      setSubject('');
      setSelectedFileName('');
      await loadResources(search);
      setSelectedResourceId(response.resource.id);
      setSelectedResource(response.resource);
    } catch (error) {
      setErrorMessage(error.message);
      setUploadState('idle');
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleRegenerate() {
    if (!selectedResource) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const response = await regenerateResource(selectedResource.id, { subject: selectedResource.subject });
      setSelectedResource(response.resource);
      setStatusMessage(response.message);
      await loadResources(search);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedResource) {
      return;
    }

    setErrorMessage('');
    setStatusMessage('');

    try {
      await deleteResource(selectedResource.id);
      setStatusMessage('Resource deleted successfully.');
      const deletedId = selectedResource.id;
      setSelectedResource(null);
      setSelectedResourceId('');
      await loadResources(search);
      if (selectedResourceId === deletedId) {
        const nextResource = resources.find((item) => item.id !== deletedId);
        setSelectedResourceId(nextResource?.id || '');
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDownload() {
    if (!selectedResource) {
      return;
    }

    try {
      const { blob, filename } = await downloadResourceSummary(selectedResource.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="relative mb-8 max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-wellness-text-muted" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search summaries, subjects, tags, or keywords..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-wellness-border rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-wellness-blue/10 focus:border-wellness-blue text-sm transition-all font-medium"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {uploadState === 'uploading' || uploadState === 'processing' ? (
            <div className="card p-16 text-center flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-wellness-blue-light/30 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-wellness-blue-light rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-wellness-blue animate-pulse" />
                  </div>
                  <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#6B9FD4" strokeWidth="2" strokeDasharray="75 225" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-wellness-text mb-3">
                  {uploadState === 'uploading' ? 'Uploading document...' : 'AI is analyzing your document...'}
                </h3>
                <p className="text-base text-wellness-text-sec max-w-md mx-auto font-medium leading-relaxed">
                  {selectedFileName || 'Your file'} is being processed into an exam-focused summary with key points, definitions, keywords, and topic tags.
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-8 border-t-4 border-t-wellness-blue shadow-md">
              <div
                className="p-10 dashed-border-animate bg-wellness-blue-light/10 text-center hover:bg-wellness-blue-light/20 transition-colors cursor-pointer group rounded-3xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-wellness-blue shadow-md group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-wellness-text mb-3">Drop your notes, PDFs, or documents here</h3>
                <p className="text-base text-wellness-text-sec mb-6 font-medium">
                  or <span className="text-wellness-blue font-bold hover:underline">click to browse</span>
                </p>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-wellness-border shadow-sm">
                  <FileText className="w-4 h-4 text-wellness-text-muted" />
                  <p className="text-xs font-bold text-wellness-text-muted uppercase tracking-wider">Supported: PDF, DOCX, TXT up to 10MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileSelection} />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-wellness-text mb-2">Subject or module label</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Optional, for example Biology or CS Fundamentals"
                  className="w-full px-4 py-3 bg-wellness-bg border border-transparent rounded-xl focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/20 outline-none text-sm transition-all shadow-sm"
                />
              </div>

              {statusMessage ? (
                <div className="mt-4 rounded-2xl border border-wellness-green/30 bg-wellness-green-light/40 px-4 py-3 text-sm text-wellness-green">
                  {statusMessage}
                </div>
              ) : null}
              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-wellness-peach/30 bg-wellness-peach-light/30 px-4 py-3 text-sm text-wellness-peach">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          )}

          {isLoadingResource ? (
            <div className="card p-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 animate-spin text-wellness-blue mb-4" />
              <p className="text-sm text-wellness-text-sec">Loading summary...</p>
            </div>
          ) : selectedResource ? (
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-wellness-blue-light/50 to-white p-8 border-b border-wellness-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <FileText className="w-6 h-6 text-wellness-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-wellness-text">{selectedResource.originalFileName}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-wellness-green-light text-wellness-green text-xs font-bold rounded-md">
                      {selectedResource.subject || 'General'}
                    </span>
                    {selectedTags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-wellness-peach-light/50 text-wellness-peach text-xs font-bold rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleRegenerate} disabled={isSubmitting} className="btn-secondary flex items-center gap-2 text-sm">
                    <RefreshCcw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button type="button" onClick={handleDownload} className="btn-primary flex items-center gap-2 text-sm shadow-md shadow-wellness-blue/20">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl border border-wellness-peach/20 text-wellness-peach hover:bg-wellness-peach-light/30 transition-colors flex items-center gap-2 text-sm font-medium">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 bg-wellness-bg/30">
                <div className="bg-white border border-wellness-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-wellness-text mb-3">Concise Summary</h3>
                  <p className="text-base text-wellness-text-sec font-medium leading-relaxed">{selectedResource.summary}</p>
                </div>

                <div className="bg-white border border-wellness-border rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => toggleSection('keyPoints')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                    <h3 className="text-lg font-bold text-wellness-text flex items-center gap-3">
                      <div className="bg-wellness-peach-light/50 p-1.5 rounded-lg">📌</div>
                      Key Points
                    </h3>
                    {expandedSections.keyPoints ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>
                  {expandedSections.keyPoints ? (
                    <div className="p-6 pt-0 border-t border-wellness-border/50">
                      <ul className="space-y-4 mt-4">
                        {selectedResource.keyPoints.map((point) => (
                          <li key={point} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-wellness-blue mt-2 shrink-0" />
                            <span className="text-base text-wellness-text-sec font-medium leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="bg-white border border-wellness-border rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => toggleSection('definitions')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                    <h3 className="text-lg font-bold text-wellness-text flex items-center gap-3">
                      <div className="bg-wellness-blue-light p-1.5 rounded-lg">📖</div>
                      Important Definitions
                    </h3>
                    {expandedSections.definitions ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>
                  {expandedSections.definitions ? (
                    <div className="p-6 pt-0 border-t border-wellness-border/50 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {selectedResource.definitions.map((item) => (
                        <div key={`${item.term}-${item.definition}`} className="bg-wellness-bg/50 p-4 rounded-xl border border-wellness-border/50">
                          <span className="font-bold text-wellness-blue text-sm block mb-1">{item.term}</span>
                          <p className="text-sm text-wellness-text-sec font-medium leading-relaxed">{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="bg-white border border-wellness-border rounded-2xl overflow-hidden shadow-sm">
                  <button type="button" onClick={() => toggleSection('keywords')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                    <h3 className="text-lg font-bold text-wellness-text flex items-center gap-3">
                      <div className="bg-wellness-green-light p-1.5 rounded-lg">🔑</div>
                      Keywords
                    </h3>
                    {expandedSections.keywords ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>
                  {expandedSections.keywords ? (
                    <div className="p-6 pt-0 border-t border-wellness-border/50 mt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedResource.keywords.map((keyword) => (
                          <span key={keyword} className="px-3 py-1.5 bg-wellness-bg border border-wellness-border text-wellness-text-sec text-xs font-bold rounded-lg">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-16 text-center text-sm text-wellness-text-sec">
              Upload a document to generate your first AI summary.
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 bg-gradient-to-b from-white to-wellness-bg/50">
            <h3 className="font-bold text-wellness-text mb-5 flex items-center gap-2 text-lg">
              <div className="bg-wellness-blue-light p-1.5 rounded-lg text-wellness-blue">
                <BookOpen className="w-5 h-5" />
              </div>
              Stored Summaries
            </h3>

            <div className="space-y-4">
              {isLoadingList ? (
                <div className="text-sm text-wellness-text-sec">Loading resources...</div>
              ) : resources.length ? (
                resources.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => setSelectedResourceId(resource.id)}
                    className={`w-full text-left p-4 bg-white border rounded-xl transition-all group ${
                      selectedResourceId === resource.id
                        ? 'border-wellness-blue shadow-md'
                        : 'border-wellness-border hover:border-wellness-blue/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-wellness-bg p-2 rounded-lg group-hover:bg-wellness-blue-light transition-colors shrink-0">
                        <FileText className="w-5 h-5 text-wellness-text-muted group-hover:text-wellness-blue transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-wellness-text line-clamp-1 mb-1 group-hover:text-wellness-blue transition-colors">
                          {resource.originalFileName}
                        </p>
                        <p className="text-[10px] font-bold text-wellness-text-muted uppercase tracking-wider mb-2">
                          {formatDateLabel(resource.createdAt)}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-wellness-bg text-wellness-text-sec rounded-md border border-wellness-border/50">
                            {resource.subject || 'General'}
                          </span>
                          {resource.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] font-bold px-2 py-0.5 bg-wellness-bg text-wellness-text-sec rounded-md border border-wellness-border/50">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-wellness-text-sec">No summaries saved yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
