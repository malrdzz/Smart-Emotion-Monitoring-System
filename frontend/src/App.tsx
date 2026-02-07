import { useState } from "react";
import { Navigation } from "./components/Navigation";
import { LandingPage } from "./components/LandingPage";
import { HomePage } from "./components/HomePage";
import { ChatbotPage } from "./components/ChatbotPage";
import { DashboardPage } from "./components/DashboardPage";
import { ProfilePage } from "./components/ProfilePage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { CheckinProvider } from "./contexts/CheckinContext";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  // 🔐 AUTH STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false); // New state to control showing auth pages
  const [authPage, setAuthPage] = useState<"login" | "register">("login");

  // 📄 APP PAGE STATE (after login)
  const [currentPage, setCurrentPage] = useState("home");

  const handleGetStarted = () => {
    setShowAuth(true);
    setAuthPage("login");
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
  };

  // 🔓 AFTER LOGIN PAGES
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={setCurrentPage} />;
      case "chatbot":
        return <ChatbotPage />;
      case "dashboard":
        return <DashboardPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      {/* 🔐 BEFORE LOGIN (PUBLIC AREA) */}
      {!isLoggedIn ? (
        !showAuth ? (
          // Landing page with Get Started button
          <LandingPage onGetStarted={handleGetStarted} />
        ) : authPage === "login" ? (
          <LoginPage
            onLoginSuccess={() => setIsLoggedIn(true)}
            onGoRegister={() => setAuthPage("register")}
            onBackToLanding={handleBackToLanding}
          />
        ) : (
          <RegisterPage
            onGoLogin={() => setAuthPage("login")}
            onBackToLanding={handleBackToLanding}
          />
        )
      ) : (
        // 🔓 AFTER LOGIN (PRIVATE AREA)
        <CheckinProvider>
          <div className="min-h-screen bg-background">
            <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
            {renderPage()}
          </div>
        </CheckinProvider>
      )}
    </AuthProvider>
  );
}
