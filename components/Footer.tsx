export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-3 text-center bg-white/80 backdrop-blur-sm border-t border-gray-100">
      <a
        href="https://buymeacoffee.com/bmoggach"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors"
      >
        <span>☕</span>
        <span>Buy me a coffee</span>
      </a>
    </footer>
  );
}
