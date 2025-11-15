import React, { useState } from 'react';
import { FileText, Database, BookOpen, Clock, CheckCircle, Activity, Download, Trash2, Plus, Eye, X } from 'lucide-react';

const DocumentsPage = ({ uploadedDocs, onDocumentDelete }) => {
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  const handleViewDocument = (doc) => {
    if (doc.r2Url) {
      // Open R2 document in new tab (original file)
      window.open(doc.r2Url, '_blank');
    } else {
      // Fallback to local viewer for local files
      setViewingDoc(doc);
      setLoadingContent(true);
      
      try {
        setDocContent(`Document: ${doc.name}\n\nThis document has been processed and is ready for AI analysis.\n\nFile Details:\n- Size: ${doc.size}\n- Pages: ${doc.pages}\n- Uploaded: ${doc.uploaded}\n- Status: ${doc.status}\n- Storage: ${doc.storageType || 'local'}\n\nYou can ask questions about this document in the Chat section.`);
      } catch (error) {
        setDocContent('Error loading document content.');
      } finally {
        setLoadingContent(false);
      }
    }
  };
  return (
    <div className="space-y-4 sm:space-y-8 h-full min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-140px)]">
      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gray-900 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">{viewingDoc.name}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{viewingDoc.size} • {viewingDoc.pages} pages</p>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] sm:max-h-[70vh]">
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <pre className="text-gray-300 whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed">
                  {docContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">
            My Documents
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">{uploadedDocs.length} documents ready for analysis</p>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-center">
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>Upload New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 pb-4 sm:pb-0">
        {uploadedDocs.map((doc) => (
          <div key={doc.id} className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div className="flex items-start sm:items-center space-x-3 sm:space-x-6 flex-1 w-full sm:w-auto">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl sm:rounded-2xl flex-shrink-0">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 truncate">{doc.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-gray-400 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{doc.size}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{doc.pages} pages</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate">{doc.uploaded}</span>
                    </div>
                    {doc.storageType && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${
                          doc.storageType === 'r2' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {doc.storageType === 'r2' ? '☁️ Cloud' : '💾 Local'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
                {doc.status === 'processed' ? (
                  <div className="flex items-center gap-1 sm:gap-2 bg-green-500/20 text-green-400 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2 bg-yellow-500/20 text-yellow-400 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                    <span className="hidden sm:inline">Processing...</span>
                  </div>
                )}
                <button 
                  onClick={() => handleViewDocument(doc)}
                  className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-110 touch-manipulation"
                  title={doc.r2Url ? "Open original document" : "View document details"}
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="bg-green-500/20 hover:bg-green-500/40 text-green-400 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-110 touch-manipulation">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={() => onDocumentDelete(doc.id)}
                  className="bg-gradient-to-r from-red-400 to-pink-500 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl hover:shadow-lg transform hover:scale-110 transition-all duration-300 touch-manipulation"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsPage;