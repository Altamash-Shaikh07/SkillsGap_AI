export default function Roadmap({ appState }) {
  const roadmap = appState?.roadmapData;

  if (!roadmap) {
    return (
      <div className="text-white text-center mt-20">
        No roadmap found ❌
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Your Roadmap 🚀
        </h1>

        <div className="card p-6 whitespace-pre-wrap">
          {roadmap}
        </div>

      </div>
    </div>
  );
}