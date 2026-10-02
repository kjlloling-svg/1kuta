-- Optional fictional record for local QA. Never classify it as verified.
INSERT OR IGNORE INTO research_papers (slug,title,abstract,keywords,year,program_id,paper_type,department,full_text,status,created_at,updated_at)
SELECT 'demo-digital-archiving-2024','Sample Study: Digital Archiving Practices in Higher Education Institutions',
'This fictional demonstration abstract illustrates how a KUTA research record could summarize archiving practices. It is not a report of real findings.',
'["Digital archiving","Higher education","Technology"]',2024,id,'Research Paper','Computer Technology',
'Demo placeholder: introduce the research question.',
'demo','2024-01-01T00:00:00.000Z','2024-01-01T00:00:00.000Z'
FROM programs WHERE slug='bsit-computer-technology';
INSERT INTO authors (name,given_name,family_name)
SELECT 'Alexis Dela Cruz','Alexis','Dela Cruz' WHERE NOT EXISTS (SELECT 1 FROM research_paper_authors pa JOIN research_papers p ON p.id=pa.paper_id WHERE p.slug='demo-digital-archiving-2024');
INSERT OR IGNORE INTO research_paper_authors (paper_id,author_id,position)
SELECT p.id,a.id,0 FROM research_papers p JOIN authors a ON a.name='Alexis Dela Cruz' WHERE p.slug='demo-digital-archiving-2024' ORDER BY a.id DESC LIMIT 1;

