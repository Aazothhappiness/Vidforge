import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Minimize2, Maximize2, Trash2, Download, Search, Filter, BarChart3, Clock } from 'lucide-react';
import { VFLog } from '../types';
import { logger } from '../utils/logging';
import { getTracer } from '../lib/tracing';

interface ConsoleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function Console({ isVisible, onToggle }: ConsoleProps) {
  const [messages, setMessages] = useState<VFLog[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTracing, setShowTracing] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to logger
  useEffect(() => {
    const handleLogMessage = (log: VFLog) => {
      setMessages(prev => [...prev, log]);
    };
    
    logger.addListener(handleLogMessage);
    
    // Add initial message
    logger.info('workflow', 'VidForge console initialized');
    
    return () => {
      logger.removeListener(handleLogMessage);
    };
  }, []);

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const levelMatch = levelFilter === 'all' || msg.level === levelFilter;
    const categoryMatch = categoryFilter === 'all' || msg.cat === categoryFilter;
    const runMatch = selectedRunId === '' || msg.runId === selectedRunId;
    const searchMatch = searchTerm === '' || 
      msg.msg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.nodeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.runId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return levelMatch && categoryMatch && runMatch && searchMatch;
  });

  // Get unique categories and levels
  const categories = ['all', ...Array.from(new Set(messages.map(m => m.cat)))];
  const levels = ['all', ...Array.from(new Set(messages.map(m => m.level)))];
  const runIds = ['', ...Array.from(new Set(messages.map(m => m.runId).filter(Boolean)))];

  const clearMessages = () => {
    setMessages([]);
  };

  const exportLogs = () => {
    const logData = filteredMessages.map(msg => 
      `[${new Date(msg.ts).toISOString()}] [${msg.level.toUpperCase()}] [${msg.cat.toUpperCase()}] ${msg.nodeId ? `[${msg.nodeId}] ` : ''}${msg.msg}${msg.meta ? '\n' + JSON.stringify(msg.meta, null, 2) : ''}`
    ).join('\n\n');
    
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidforge-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLogsJSON = () => {
    const tracer = getTracer();
    const exportData = {
      logs: filteredMessages,
      trace: tracer?.exportTrace(),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidforge-trace-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMessage = (message: VFLog) => {
    const text = `[${new Date(message.ts).toISOString()}] [${message.level.toUpperCase()}] [${message.cat.toUpperCase()}] ${message.nodeId ? `[${message.nodeId}] ` : ''}${message.msg}${message.meta ? '\n' + JSON.stringify(message.meta, null, 2) : ''}`;
    navigator.clipboard.writeText(text);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500/10 border-l-red-500';
      case 'warn': return 'bg-yellow-500/10 border-l-yellow-500';
      case 'success': return 'bg-green-500/10 border-l-green-500';
      case 'info': return 'bg-blue-500/10 border-l-blue-500';
      case 'debug': return 'bg-gray-500/10 border-l-gray-500';
      default: return 'bg-white/5 border-l-white/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workflow': return 'text-purple-400';
      case 'config': return 'text-orange-400';
      case 'api': return 'text-cyan-400';
      case 'performance': return 'text-pink-400';
      case 'execution': return 'text-green-400';
      case 'data-flow': return 'text-blue-400';
      case 'auth': return 'text-red-400';
      case 'judge': return 'text-yellow-400';
      case 'media': return 'text-indigo-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/10 transition-all duration-300 ${
      isMinimized ? 'h-12' : 'h-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="font-medium">Console</span>
          <span className="text-xs text-gray-400">({filteredMessages.length} messages)</span>
          {messages.length !== filteredMessages.length && (
            <span className="text-xs text-orange-400">({messages.length} total)</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="flex items-center space-x-1">
            <Search className="w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-20 px-2 py-1 text-xs bg-black/50 border border-white/20 rounded focus:border-amber-500"
            />
          </div>
          
          {/* Run ID filter */}
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="px-2 py-1 text-xs bg-black/50 border border-white/20 rounded focus:border-amber-500"
          >
            <option value="">All runs</option>
            {runIds.slice(1).map(runId => (
              <option key={runId} value={runId}>
                {runId.substring(0, 12)}...
              </option>
            ))}
          </select>
          
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 text-xs rounded ${
              autoScroll ? 'bg-green-500 text-black' : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Auto-scroll"
          >
            Auto
          </button>
          
          {/* Level filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-black/50 border border-white/20 rounded focus:border-amber-500"
          >
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-black/50 border border-white/20 rounded focus:border-amber-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* Tracing toggle */}
          <button
            onClick={() => setShowTracing(!showTracing)}
            className={`p-1 rounded ${showTracing ? 'bg-purple-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            title="Show execution tracing"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          
          <button
            onClick={exportLogs}
            className="p-1 text-gray-400 hover:text-white"
            title="Export logs as text"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={exportLogsJSON}
            className="p-1 text-gray-400 hover:text-white"
            title="Export logs as JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={clearMessages}
            className="p-1 text-gray-400 hover:text-red-400"
            title="Clear console"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-white"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          {showTracing && (
            <div className="h-24 border-b border-white/10 p-2">
              <TracingGantt />
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs" style={{ maxHeight: showTracing ? 'calc(100% - 6rem)' : '100%' }}>
            {filteredMessages.map(message => (
              <div
                key={`${message.id}-${message.ts}`}
                className={`p-2 rounded border-l-2 cursor-pointer hover:bg-white/5 ${getLevelBg(message.level)}`}
                onClick={() => copyMessage(message)}
                title="Click to copy"
              >
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap font-mono">
                    {formatTimestamp(message.ts)}
                  </span>
                  <span className={`text-xs font-bold uppercase ${getLevelColor(message.level)} min-w-[3rem]`}>
                    {message.level}
                  </span>
                  <span className={`text-xs font-medium uppercase ${getCategoryColor(message.cat)} min-w-[4rem]`}>
                    {message.cat}
                  </span>
                  <span className="flex-1 text-gray-200 break-words">
                    {message.msg}
                  </span>
                  {message.nodeId && (
                    <span className="text-xs text-amber-400 bg-amber-400/20 px-1 py-0.5 rounded whitespace-nowrap">
                      {message.nodeId}
                    </span>
                  )}
                  {message.runId && (
                    <span className="text-xs text-purple-400 bg-purple-400/20 px-1 py-0.5 rounded whitespace-nowrap">
                      {message.runId.substring(0, 8)}
                    </span>
                  )}
                </div>
                {message.meta && (
                  <div className="mt-1 ml-20 text-xs text-gray-400">
                    <details className="cursor-pointer">
                      <summary className="hover:text-gray-300">
                        Metadata ({Object.keys(message.meta).length} fields)
                      </summary>
                      <pre className="mt-1 p-2 bg-black/30 rounded text-xs overflow-x-auto">
                        {JSON.stringify(message.meta, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
            
            {filteredMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages match the current filters</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      
      {/* Status bar */}
      {!isMinimized && (
        <div className="px-4 py-1 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Total: {messages.length}</span>
            <span>Filtered: {filteredMessages.length}</span>
            {selectedRunId && <span>Run: {selectedRunId.substring(0, 8)}...</span>}
            {searchTerm && <span>Search: "{searchTerm}"</span>}
          </div>
          <div className="flex items-center space-x-2">
            <span className={autoScroll ? 'text-green-400' : 'text-gray-500'}>
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </span>
            <span>
              {levelFilter !== 'all' && `Level: ${levelFilter}`}
              {categoryFilter !== 'all' && ` | Category: ${categoryFilter}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TracingGantt() {
  const tracer = getTracer();
  const spans = tracer?.getAllSpans() || [];
  
  if (spans.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Clock className="w-4 h-4 mr-2" />
        <span className="text-xs">No execution traces available</span>
      </div>
    );
  }

  const minTime = Math.min(...spans.map(s => s.startTime));
  const maxTime = Math.max(...spans.map(s => s.endTime || s.startTime));
  const totalDuration = maxTime - minTime;

  return (
    <div className="h-full">
      <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
        <span>Execution Timeline ({spans.length} spans)</span>
        <span>Total: {totalDuration}ms</span>
      </div>
      
      <div className="space-y-1 overflow-y-auto max-h-16">
        {spans.map(span => {
          const left = ((span.startTime - minTime) / totalDuration) * 100;
          const width = span.duration ? (span.duration / totalDuration) * 100 : 2;
          const color = span.status === 'completed' ? 'bg-green-400' : 
                      span.status === 'failed' ? 'bg-red-400' : 'bg-amber-400';
          
          return (
            <div key={span.spanId} className="relative h-4 bg-gray-700 rounded">
              <div
                className={`absolute h-full rounded ${color}`}
                style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                title={`${span.operation} (${span.duration || 0}ms)`}
              />
              <span className="absolute left-1 top-0 text-xs text-white truncate">
                {span.nodeId || span.operation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}