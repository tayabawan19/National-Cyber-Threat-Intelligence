import React, { useState } from 'react';
import { Search, Database, FileCode, ShieldAlert, ArrowRight, ExternalLink, Code } from 'lucide-react';

export const SearchView: React.FC<{ token: string }> = ({ token }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'iocs' | 'cves'>('iocs');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRawItem, setSelectedRawItem] = useState<any | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const endpoint = searchType === 'iocs' ? `/iocs/search?q=${encodeURIComponent(query)}` : `/cves/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('Search failed', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-terminal-green">
      {/* Top Header */}
      <div className="soc-card p-6 rounded-xl border border-terminal-border bg-[#0a0f0a]/90 space-y-4 font-mono">
        <div>
          <h2 className="text-sm font-bold font-mono text-terminal-green flex items-center gap-2 text-glow-green">
            <Search className="w-5 h-5 text-terminal-green" />
            <span>OPENSEARCH MIRROR THREAT INTELLIGENCE SEARCH</span>
          </h2>
          <p className="text-xs text-terminal-green-dim mt-0.5 font-mono">
            Full-text search querying indexed IOC indicators and NVD CVE vulnerability records.
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 font-mono">
          <div className="flex-1 relative font-mono">
            <Search className="w-4 h-4 text-terminal-green absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'iocs' ? "Search IOCs by IP, domain, hash, or tag (e.g. 'botnet', '185.220')..." : "Search CVEs by ID or keyword (e.g. 'CVE-2024', 'remote code execution')..."}
              className="w-full bg-[#050705] border border-terminal-border rounded-lg pl-10 pr-4 py-2.5 text-xs text-terminal-green placeholder-terminal-muted focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 font-mono">
            <div className="flex rounded-lg bg-[#050705] p-1 border border-terminal-border font-mono">
              <button
                type="button"
                onClick={() => setSearchType('iocs')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition ${searchType === 'iocs' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                IOCs Index
              </button>
              <button
                type="button"
                onClick={() => setSearchType('cves')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition ${searchType === 'cves' ? 'bg-terminal-green-dark text-terminal-green border border-terminal-border glow-green' : 'text-terminal-green-dim hover:text-terminal-green'}`}
              >
                CVEs Index
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-terminal-green-dark hover:bg-terminal-border text-terminal-green text-xs font-mono font-bold shadow-lg transition flex items-center gap-2 border border-terminal-border"
            >
              <span>{loading ? 'Searching...' : 'Search Index'}</span>
              <ArrowRight className="w-4 h-4 text-terminal-green" />
            </button>
          </div>
        </form>
      </div>

      {/* Results Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        <div className={`soc-card rounded-xl border border-terminal-border bg-[#0a0f0a]/90 overflow-hidden shadow-2xl ${selectedRawItem ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="text-center py-16 text-terminal-muted font-mono text-xs">Executing OpenSearch query...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-terminal-muted font-mono text-xs">
              {query ? 'No matching records found in OpenSearch mirror.' : 'Enter a search term above to query OpenSearch mirror.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#050705] text-terminal-green-dim font-mono uppercase text-[10px] border-b border-terminal-border">
                  <tr>
                    <th className="py-3.5 px-4">{searchType === 'iocs' ? 'Type / Value' : 'CVE ID'}</th>
                    <th className="py-3.5 px-4">{searchType === 'iocs' ? 'Source Feed' : 'CVSS Score'}</th>
                    <th className="py-3.5 px-4">{searchType === 'iocs' ? 'Tags' : 'Description'}</th>
                    <th className="py-3.5 px-4">Raw Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/80 font-mono">
                  {results.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      onClick={() => setSelectedRawItem(item)}
                      className={`hover:bg-terminal-surface cursor-pointer transition ${selectedRawItem?.id === item.id ? 'bg-terminal-green-dark/60 border-l-4 border-terminal-green' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        {searchType === 'iocs' ? (
                          <div>
                            <span className="text-terminal-green font-bold text-glow-green">{item.value}</span>
                            <span className="text-[10px] text-terminal-green-dim block">Type: {item.type}</span>
                          </div>
                        ) : (
                          <span className="text-purple-400 font-bold">{item.cveId}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-terminal-green">
                        {searchType === 'iocs' ? (
                          item.source
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-bold ${item.cvssScore >= 9 ? 'bg-red-950/80 text-red-400 border border-red-500/40' : 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/40'}`}>
                            {item.cvssScore ?? 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-terminal-green-dim max-w-sm truncate">
                        {searchType === 'iocs' ? (
                          (item.tags || []).join(', ') || 'No tags'
                        ) : (
                          item.description
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-terminal-green-dim">
                        <button className="p-1.5 rounded bg-terminal-green-dark hover:bg-terminal-border text-terminal-green flex items-center gap-1 text-[10px] font-mono font-bold border border-terminal-border">
                          <Code className="w-3 h-3 text-terminal-green" />
                          <span>View JSON</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Raw Item JSON Inspector */}
        {selectedRawItem && (
          <div className="soc-card p-5 rounded-xl border border-terminal-border bg-[#0a0f0a] shadow-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-terminal-border">
              <span className="text-[10px] font-bold text-terminal-green uppercase tracking-wider text-glow-green">RAW OPENSEARCH PAYLOAD</span>
              <button onClick={() => setSelectedRawItem(null)} className="text-terminal-green-dim hover:text-terminal-green font-mono">
                Close
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#050705] text-terminal-green text-[11px] overflow-x-auto h-[380px] border border-terminal-border font-mono glow-green">
              {JSON.stringify(selectedRawItem, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
