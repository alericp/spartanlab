// BINARY ISOLATION TEST - Minimal page content
// Cache invalidation build marker

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SpartanLab</h1>
        <p className="text-xl text-amber-500 font-mono mb-4">CURRENT BUILD TEST - 2024-CACHE-CLEAR</p>
        <p className="text-[#A5A5A5]">If you see this, the new build is being served.</p>
        <p className="text-[#666] text-sm mt-4">Clear browser cache or use incognito if you see old UI.</p>
      </div>
    </div>
  )
}
