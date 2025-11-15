import React, { useState } from 'react';
import { FileText, Database, BookOpen, Clock, CheckCircle, Activity, Download, Trash2, Plus, Eye, X } from 'lucide-react';

const DocumentsPage = ({ uploadedDocs, onDocumentDelete }) => {
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  const handleViewDocument = async (doc) => {
    setViewingDoc(doc);
    setLoadingContent(true);
    
    try {
      // For now, show a preview message since we don't have document content API
      setDocContent(`Document: ${doc.name}\n\nThis document has been processed and is ready for AI analysis.\n\nFile Details:\n- Size: ${doc.size}\n- Pages: ${doc.pages}\n- Uploaded: ${doc.uploaded}\n- Status: ${doc.status}\n\nYou can ask questions about this document in the Chat section.`);
    } catch (error) {
      setDocContent('Error loading document content.');
    } finally {
      setLoadingContent(false);
    }
  };
  return (
    <div className="space-y-8">
      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-white">{viewingDoc.name}</h3>
                <p className="text-gray-400 text-sm">{viewingDoc.size} • {viewingDoc.pages} pages</p>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {docContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-white mb-2">
            My Documents
          </h1>
          <p className="text-gray-400 text-lg">{uploadedDocs.length} documents ready for analysis</p>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3">
          <Plus className="w-6 h-6" />
          <span>Upload New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {uploadedDocs.map((doc) => (
          <div key={doc.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 flex-1">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{doc.name}</h3>
                  <div className="flex items-center gap-6 text-gray-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span>{doc.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{doc.pages} pages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{doc.uploaded}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {doc.status === 'processed' ? (
                  <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-xl font-bold">
                    <CheckCircle className="w-5 h-5" />
                    <span>Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl font-bold">
                    <Activity className="w-5 h-5 animate-pulse" />
                    <span>Processing...</span>
                  </div>
                )}
                <button 
                  onClick={() => handleViewDocument(doc)}
                  className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
                  title="View document"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button className="bg-green-500/20 hover:bg-green-500/40 text-green-400 p-3 rounded-xl transition-all duration-300 transform hover:scale-110">
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onDocumentDelete(doc.id)}
                  className="bg-gradient-to-r from-red-400 to-pink-500 text-white p-3 rounded-xl hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                >
                  <Trash2 className="w-5 h-5" />
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