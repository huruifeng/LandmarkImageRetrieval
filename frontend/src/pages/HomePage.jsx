import ImageBrowser from "../components/ImageBrowser";
import ResultsPanel from "../components/ResultsPanel";

export default function HomePage() {
  return (
    <div className="layout">
      <ImageBrowser />
      <ResultsPanel />
    </div>
  );
}
