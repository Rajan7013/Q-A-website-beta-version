import React from 'react';
import { FileText, Database, BookOpen, Clock, CheckCircle, Activity, Eye, Trash2, Plus } from 'lucide-react';
import { getDocumentUrl } from '../utils/api';

const DocumentsPage = ({ uploadedDocs, onDocumentDelete }) => {
  const handleViewDocument = async (docId) => {
    try {
      const url = await getDocumentUrl(docId);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to view document:', error);
      alert('Could not open document. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
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
                  <h3 className="text-xl font-bold text-white mb-2">{doc.name || doc.filename}</h3>
                  <div className="flex items-center gap-6 text-gray-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span>{doc.size || (doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{doc.pages || doc.pageCount} pages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{doc.uploaded || new Date(doc.createdAt).toLocaleDateString()}</span>
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
                  onClick={() => handleViewDocument(doc.id)}
                  className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 p-3 rounded-xl transition-all duration-300 transform hover:scale-110"
                  title="View Document"
                >
                  <Eye className="w-5 h-5" />
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