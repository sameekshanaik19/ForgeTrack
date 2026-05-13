import { useState, useEffect } from 'react';
import { Search, PlusCircle, FileText, Code, Video, ExternalLink, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const IconMap = {
  slides: <FileText className="w-4 h-4 text-[var(--accent-glow)]" />,
  doc: <FileText className="w-4 h-4 text-[var(--info-fg)]" />,
  github: <Code className="w-4 h-4 text-[var(--text-primary)]" />,
  recording: <Video className="w-4 h-4 text-[var(--danger-fg)]" />,
  other: <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)]" />
};

export function Materials() {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All Time");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select(`
          id,
          title,
          type,
          url,
          sessions (
            id,
            date,
            topic
          )
        `)
        .order('id', { ascending: false });

      if (data) {
        // Group by session
        const grouped = data.reduce((acc, item) => {
          const sessionId = item.sessions.id;
          if (!acc[sessionId]) {
            const date = new Date(item.sessions.date);
            acc[sessionId] = {
              id: sessionId,
              date: date.toLocaleDateString('en-US', { month: 'SHORT', day: '2-digit', year: 'numeric' }).toUpperCase(),
              topic: item.sessions.topic,
              monthYear: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              links: []
            };
          }
          acc[sessionId].links.push({
            type: item.type,
            label: item.title,
            url: item.url
          });
          return acc;
        }, {});

        setMaterials(Object.values(grouped));
      }
      setLoading(false);
    }

    fetchMaterials();
  }, []);

  const monthOptions = ["All Time", ...new Set(materials.map(m => m.monthYear))];

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.topic.toLowerCase().includes(search.toLowerCase());
    const matchesMonth = selectedMonth === "All Time" || m.monthYear === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="w-full relative pb-24">
      {/* Header & Filter Bar */}
      <header className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-h1">Materials Library</h1>
          
          <button className="flex items-center gap-2 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-[var(--radius-md)] px-4 py-2 font-medium text-sm hover:bg-[#E5E5E7] transition-colors shadow-lg">
            <PlusCircle className="w-4 h-4" />
            Add Material
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search by topic..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          <div className="relative w-48">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] py-2 pl-9 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors"
            >
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
      </header>

      {/* Materials Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[var(--accent-glow)] animate-spin mb-4" />
          <p className="text-body text-[var(--text-secondary)]">Loading materials library...</p>
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(material => (
            <div key={material.id} className="card flex flex-col h-full border border-[var(--border-strong)] hover:border-[var(--accent-glow-soft)] transition-colors group">
              <div className="mb-6">
                <div className="text-caption font-mono text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
                  {material.date}
                </div>
                <h3 className="text-h3 font-display leading-tight">{material.topic}</h3>
              </div>
              
              <div className="mt-auto space-y-2 pt-6 border-t border-[var(--border-subtle)]">
                {material.links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-raised)] transition-colors border border-[var(--border-subtle)] hover:border-[var(--border-default)] group/link"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                        {IconMap[link.type] || IconMap.other}
                      </div>
                      <span className="text-body-sm font-medium text-[var(--text-primary)]">{link.label}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="card py-24 flex flex-col items-center justify-center text-center border-dashed border-[var(--border-strong)] bg-transparent">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-raised)] flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-h2 mb-2">No Materials Found</h2>
          <p className="text-body text-[var(--text-secondary)] max-w-sm mb-8">
            We couldn't find any materials matching your search criteria.
          </p>
          <button 
            onClick={() => {
              setSearch("");
              setSelectedMonth("All Time");
            }}
            className="bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-6 py-3 font-medium hover:bg-[var(--bg-surface-inset)] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
