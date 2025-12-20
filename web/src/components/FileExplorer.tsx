'use client';

import { useState, useEffect } from 'react';

interface FileItem {
  path: string;
  type: 'file' | 'dir';
}

interface FileList {
  files: FileItem[];
}

export default function FileExplorer({ baseUrl }: { baseUrl: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    fetch(`${baseUrl}/project/files`)
      .then(res => res.json())
      .then((data: FileList) => setFiles(data.files))
      .catch(console.error);
  }, [baseUrl]);

  const loadFile = (path: string) => {
    fetch(`${baseUrl}/file/${encodeURIComponent(path)}`)
      .then(res => res.json())
      .then(data => {
        setSelectedFile(path);
        setFileContent(data.content);
      })
      .catch(console.error);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Files</h2>
        <ul>
          {files.map(file => (
            <li key={file.path} className="mb-2">
              {file.type === 'file' ? (
                <button
                  onClick={() => loadFile(file.path)}
                  className="text-blue-500 hover:underline"
                >
                  {file.path}
                </button>
              ) : (
                <span>{file.path}/</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/3 p-4">
        {selectedFile ? (
          <>
            <h3 className="text-lg font-bold mb-4">{selectedFile}</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {fileContent}
            </pre>
          </>
        ) : (
          <p>Select a file to view its content.</p>
        )}
      </div>
    </div>
  );
}