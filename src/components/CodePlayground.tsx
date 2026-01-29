"use client";

import { useState } from "react";
import { Play, Copy, Download, RotateCcw } from "lucide-react";

const LANGUAGE_OPTIONS = [
  { id: "javascript", name: "JavaScript", ext: "js" },
  { id: "typescript", name: "TypeScript", ext: "ts" },
  { id: "python", name: "Python", ext: "py" },
  { id: "html", name: "HTML", ext: "html" },
  { id: "css", name: "CSS", ext: "css" },
];

const DEFAULT_CODE = {
  javascript: `// JavaScript playground
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`,
  typescript: `// TypeScript playground
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
}

const user: User = { name: 'Sashi', age: 25 };
console.log(greet(user));`,
  python: `# Python playground
def greet(name):
    return f"Hello, {name}!"

print(greet('World'))`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Playground</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a simple HTML example.</p>
</body>
</html>`,
  css: `/* CSS playground */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  color: #f5f5f5;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.card {
  background: #1c1c1c;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
}`
};

export function CodePlayground() {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODE[selectedLanguage as keyof typeof DEFAULT_CODE]);
  const [output, setOutput] = useState("");

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCode(DEFAULT_CODE[language as keyof typeof DEFAULT_CODE]);
    setOutput("");
  };

  const handleRunCode = () => {
    if (selectedLanguage === "javascript") {
      try {
        // Create a simple console.log capture
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(arg => String(arg)).join(' '));
        };

        // Execute the code
        eval(code);
        
        // Restore console.log
        console.log = originalLog;
        
        setOutput(logs.join('\\n') || 'Code executed successfully (no output)');
      } catch (error) {
        setOutput('Error: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      setOutput('Code execution not available for ' + selectedLanguage + '. This is a simple editor for now.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleReset = () => {
    setCode(DEFAULT_CODE[selectedLanguage as keyof typeof DEFAULT_CODE]);
    setOutput("");
  };

  const handleDownload = () => {
    const language = LANGUAGE_OPTIONS.find(lang => lang.id === selectedLanguage);
    const filename = 'playground.' + (language?.ext || 'txt');
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((language) => (
            <button
              key={language.id}
              onClick={() => handleLanguageChange(language.id)}
              className={'px-3 py-1.5 text-xs rounded transition-colors ' + (
                selectedLanguage === language.id
                  ? 'bg-[#1c1c1c] text-[#f5f5f5] border border-[#333]'
                  : 'text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616]'
              )}
            >
              {language.name}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616] rounded transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616] rounded transition-colors"
          >
            <Copy size={14} />
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616] rounded transition-colors"
          >
            <Download size={14} />
            Download
          </button>
          {selectedLanguage === "javascript" && (
            <button
              onClick={handleRunCode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
            >
              <Play size={14} />
              Run
            </button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#f5f5f5]">Code Editor</h3>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[400px] p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-sm font-mono text-[#f5f5f5] placeholder-[#525252] resize-none focus:outline-none focus:border-[#333] transition-colors"
            placeholder={'Enter your ' + selectedLanguage + ' code here...'}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#f5f5f5]">Output</h3>
          <div className="h-[400px] p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
            {output ? (
              <pre className="text-sm font-mono text-[#f5f5f5] whitespace-pre-wrap">
                {output}
              </pre>
            ) : (
              <p className="text-sm text-[#525252]">
                {selectedLanguage === "javascript" 
                  ? "Click 'Run' to execute your JavaScript code"
                  : "Output will appear here"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
        <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">Playground Features</h3>
        <ul className="text-xs text-[#737373] space-y-1">
          <li>• Multi-language support with syntax switching</li>
          <li>• JavaScript execution with console output capture</li>
          <li>• Copy and download your code</li>
          <li>• Reset to default templates</li>
          <li>• Future: Monaco Editor integration for advanced features</li>
        </ul>
      </div>
    </div>
  );
}