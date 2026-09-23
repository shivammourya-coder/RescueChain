import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { LanguageProvider } from "./context/LanguageContext";
import { DemoBar } from "./components/DemoBar";
import { OfflineBanner } from "./components/OfflineBanner";
import { Navbar } from "./components/Navbar";
import { AnimatedBackground } from "./components/AnimatedBackground";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { CitizenPage } from "./pages/CitizenPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VolunteerDashboard } from "./pages/VolunteerDashboard";
import { NgoDashboard } from "./pages/NgoDashboard";
import { AuthorityDashboard } from "./pages/AuthorityDashboard";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 relative">
              {/* Tactical Mesh & Ambient Animated Atmosphere */}
              <AnimatedBackground />

              {/* Top Presentation & Testing Deck for Hackathon Jury */}
              <DemoBar />

              {/* Offline Connectivity & Sync Alert Banner */}
              <OfflineBanner />

              {/* Application Main Navigation */}
              <Navbar />

              {/* Main Application Routes */}
              <main className="flex-1 relative z-10">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  
                  {/* Dedicated Citizen Portal: Report & Track with OTP Verification */}
                  <Route path="/citizen" element={<CitizenPage />} />
                  <Route path="/report" element={<CitizenPage />} />
                  <Route path="/track" element={<CitizenPage />} />
                  <Route path="/track/:code" element={<CitizenPage />} />
                  
                  {/* Responder Portals */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/volunteer" element={<VolunteerDashboard />} />
                  <Route path="/ngo" element={<NgoDashboard />} />
                  <Route path="/authority" element={<AuthorityDashboard />} />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}
