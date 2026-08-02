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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            <span>OpenSearch Mirror Threat Intelligence Search</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-text search querying indexed IOC indicators and NVD CVE vulnerability records.
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'iocs' ? "Search IOCs by IP, domain, hash, or tag (e.g. 'botnet', '185.220')..." : "Search CVEs by ID or keyword (e.g. 'CVE-2024', 'remote code execution')..."}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setSearchType('iocs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${searchType === 'iocs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                IOCs Index
              </button>
              <button
                type="button"
                onClick={() => setSearchType('cves')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${searchType === 'cves' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                CVEs Index
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
            >
              <span>{loading ? 'Searching...' : 'Search Index'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Results Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl ${selectedRawItem ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">Executing OpenSearch query...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              {query ? 'No matching records found in OpenSearch mirror.' : 'Enter a search term above to query OpenSearch mirror.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">{searchType === 'iocs' ? 'Type / Value' : 'CVE ID'}</th>
                    <th className="py-3 px-4">{searchType === 'iocs' ? 'Source Feed' : 'CVSS Score'}</th>
                    <th className="py-3 px-4">{searchType === 'iocs' ? 'Tags' : 'Description'}</th>
                    <th className="py-3 px-4">Raw Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {results.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      onClick={() => setSelectedRawItem(item)}
                      className="hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        {searchType === 'iocs' ? (
                          <div>
                            <span className="text-blue-400 font-bold">{item.value}</span>
                            <span className="text-[10px] text-slate-500 block">Type: {item.type}</span>
                          </div>
                        ) : (
                          <span className="text-purple-400 font-bold">{item.cveId}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {searchType === 'iocs' ? (
                          item.source
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-bold ${item.cvssScore >= 9 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {item.cvssScore ?? 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 max-w-sm truncate">
                        {searchType === 'iocs' ? (
                          (item.tags || []).join(', ') || 'No tags'
                        ) : (
                          item.description
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        <button className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px]">
                          <Code className="w-3 h-3 text-blue-400" />
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
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">RAW OPENSEARCH PAYLOAD</span>
              <button onClick={() => setSelectedRawItem(null)} className="text-slate-400 hover:text-slate-200">
                Close
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-[11px] overflow-x-auto h-[380px] border border-slate-800">
              {JSON.stringify(selectedRawItem, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
