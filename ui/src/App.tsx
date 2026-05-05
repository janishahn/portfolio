import { BrowserRouter, Route, Routes } from "react-router-dom"
import HomePage from "@/pages/Home"
import ThesisPage from "@/pages/Thesis"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/thesis" element={<ThesisPage />} />
      </Routes>
    </BrowserRouter>
  )
}
