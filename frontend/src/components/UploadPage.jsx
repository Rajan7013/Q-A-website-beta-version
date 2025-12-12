import React, { useState } from 'react';
import { Upload, FileText, File, FileCheck, FilePlus } from 'lucide-react';
import { uploadDocument } from '../utils/api';

const UploadPage = ({ onDocumentUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadDocument(file, (progress) => {
        setUploadProgress(progress);
      });

      onDocumentUpload(result.document);
      alert('Document uploaded successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Upload failed: ${errorMsg}`);
      console.error('Upload error:', error.response || error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white">
          Upload Your Documents
        </h1>
        <p className="text-xl text-gray-400">PDF, DOCX, PPTX, TXT - We analyze them all!</p>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border-2 border-dashed border-white/20 hover:border-purple-500 transition-all duration-300">
        <div className="text-center space-y-6">
          <div className="inline-block p-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl">
            <Upload className="w-16 h-16 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
            </h3>
            <p className="text-gray-400">
              Support for PDF, DOCX, PPTX, TXT files • Max 50MB per file
            </p>
            {uploading && (
              <div className="mt-6 bg-white/10 rounded-full h-4 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
            {!uploading && (
              <label className="mt-6 inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white px-10 py-4 rounded-2xl font-bold cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                Choose Files
                <input type="file" onChange={handleFileSelect} className="hidden" accept=".pdf,.docx,.pptx,.txt" />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: FileText, title: 'PDF Documents', desc: 'Research papers, textbooks, guides', color: 'from-red-400 to-pink-500' },
          { icon: File, title: 'Word Documents', desc: 'Notes, essays, assignments', color: 'from-blue-400 to-cyan-500' },
          { icon: FileCheck, title: 'Presentations', desc: 'Slides, lecture notes', color: 'from-green-400 to-emerald-500' },
          { icon: FilePlus, title: 'Text Files', desc: 'Code, plain text', color: 'from-purple-400 to-pink-500' }
        ].map((type, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${type.color} p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300`}>
            <type.icon className="w-10 h-10 mb-3" />
            <h3 className="text-lg font-bold mb-2">{type.title}</h3>
            <p className="text-sm text-white/80">{type.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadPage;