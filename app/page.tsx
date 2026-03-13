// BINARY ISOLATION TEST - Minimal page content
// Testing if crash is in MarketingHeader, page content, or MarketingFooter

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SpartanLab</h1>
        <p className="text-[#A5A5A5]">Binary isolation test - minimal page content</p>
      </div>
    </div>
  )
}
