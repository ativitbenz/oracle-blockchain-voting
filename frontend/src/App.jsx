import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components";
import {
  Home,
  PollDetail,
  PublicPollVoting,
  PrivatePollVoting,
  VoteConfirmation,
  AdminDashboard,
  BlockchainAnalysis,
} from "./pages";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/poll/:id" element={<PollDetail />} />

            {/* Public poll voting - no email required */}
            <Route path="/poll/:id/vote" element={<PublicPollVoting />} />

            {/* Private poll voting - requires email parameter */}
            <Route path="/vote/:id" element={<PrivatePollVoting />} />

            <Route
              path="/poll/:id/confirmation"
              element={<VoteConfirmation />}
            />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/blockchain" element={<BlockchainAnalysis />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
