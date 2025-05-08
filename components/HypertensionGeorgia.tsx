import dynamic from 'next/dynamic';

// Create a completely client-side only component with NoSSR
const HypertensionMapWithNoSSR = dynamic(
  () => import('./HypertensionMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-mono text-primary-700">Loading map...</p>
      </div>
    )
  }
);

// This is a server component that renders the client component
export default function HypertensionGeorgia() {
  return (
    <div className="w-full h-[500px] flex flex-col bg-white rounded-xl border-l-4 border border-primary-500 shadow-sm overflow-hidden">
      <div className="bg-surface px-8 py-4 border-b border-primary-100">
        <h3 className="text-xl font-mono text-primary-700 font-bold">Hypertension Rate by County in Georgia</h3>
        <p className="text-neutral text-medium-contrast">2019-2023 Health Data</p>
      </div>
      <div className="flex-grow relative overflow-x-auto p-4">
        {/* Static placeholder that will be identical on server and client */}
        <div className="w-full h-full">
          <HypertensionMapWithNoSSR />
        </div>
      </div>
    </div>
  );
}
