import { BrowserRouter, Route, Routes } from "react-router-dom"
import Navbar from "@/components/Navbar"
import { ThemeProvider } from "@/components/theme-provider"
import HomePage from "@/pages/Home"
import ThesisPage from "@/pages/Thesis"

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/thesis" element={<ThesisPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
