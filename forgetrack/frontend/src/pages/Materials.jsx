import { useState } from 'react';
import { Search, PlusCircle, FileText, Code, Video, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';

// Mock Data
const MOCK_MATERIALS = [
  {
    id: 1,
    date: "MAY 06, 2026",
    topic: "8-Layer AI Application Stack",
    month: "May 2026",
    links: [
      { type: "slide", label: "Lecture Deck", url: "#" },
      { type: "github", label: "Starter Repo", url: "#" },
      { type: "video", label: "Session Recording", url: "#" }
    ]
  },
  {
    id: 2,
    date: "MAY 04, 2026",
    topic: "Advanced RAG Pipelines",
    month: "May 2026",
    links: [
      { type: "slide", label: "Pipeline Diagrams", url: "#" },
      { type: "github", label: "LangChain Examples", url: "#" }
    ]
  },
  {
    id: 3,
    date: "MAY 02, 2026",
    topic: "Vector Databases Deep Dive",
    month: "May 2026",
    links: [
      { type: "slide", label: "Pinecone vs Milvus", url: "#" },
      { type: "doc", label: "Embedding Best Practices", url: "#" },
      { type: "video", label: "Session Recording", url: "#" }
    ]
  },
  {
    id: 4,
    date: "APR 29, 2026",
    topic: "Agentic Workflows Overview",
    month: "April 2026",
    links: [
      { type: "slide", label: "What is an Agent?", url: "#" },
      { type: "github", label: "AutoGPT Clone", url: "#" }
    ]
  },
  {
    id: 5,
    date: "APR 26, 2026",
    topic: "LLM Fine-tuning Basics",
    month: "April 2026",
    links: [
      { type: "slide", label: "PEFT & LoRA", url: "#" },
      { type: "video", label: "Session Recording", url: "#" }
    ]
  },
  {
    id: 6,
    date: "APR 22, 2026",
    topic: "Prompt Engineering Mastery",
    month: "April 2026",
    links: [
      { type: "slide", label: "Few-Shot & CoT", url: "#" },
      { type: "doc", label: "Prompt Cheatsheet", url: "#" }
    ]
  }
];

const MONTH_OPTIONS = ["All Time", "May 2026", "April 2026", "March 2026"];

const IconMap = {
  slide: <FileText className="w-4 h-4 text-[var(--accent-glow)]" />,
  doc: <FileText className="w-4 h-4 text-[var(--info-fg)]" />,
  github: <Code className="w-4 h-4 text-[var(--text-primary)]" />,
  video: <Video className="w-4 h-4 text-[var(--danger-fg)]" />
};

export function Materials() {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All Time");

  const filteredMaterials = MOCK_MATERIALS.filter(m => {
    const matchesSearch = m.topic.toLowerCase().includes(search.toLowerCase());
    const matchesMonth = selectedMonth === "All Time" || m.month === selectedMonth;
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
              {MONTH_OPTIONS.map(month => (
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
      {filteredMaterials.length > 0 ? (
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
                        {IconMap[link.type]}
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
