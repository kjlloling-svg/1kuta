import Link from '@/components/native-link';

export default function PaperNotFound() {
  return <main id="main" className="page-main wrap">
    <div className="state-card">
      <h1>Research paper not found</h1>
      <p>This record may have moved or may no longer be available.</p>
      <Link className="button button-outline" href="/research-papers">Back to research papers</Link>
    </div>
  </main>;
}
