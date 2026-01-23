import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import { SocketProvider } from './context/socketContext';
import Navbar from './components/Navbar';
import Home from './components/activity/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import SearchBooks from './components/books/SearchBooks';
import Libraries from './components/library/Libraries';
import BookDetails from './components/books/BookDetails';
import ReadingStats from './components/profile/ReadingStats';
import Profile from './components/profile/Profile';
import EditProfile from './components/profile/EditProfile';
import AddCustomBook from './components/books/AddCustomBook';
import Discover from './components/activity/Discover';
import Settings from './components/settings/Settings';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import BrowseByGenre from './components/books/BrowseByGenre';
import BrowseLists from './components/books/BrowseLists';
import ListDetail from './components/books/ListDetail';
import UserSearch from './components/social/UserSearch';
import Friends from './components/social/Friends';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import MessagesLayout from './components/messaging/MessagesLayout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchBooks />} />
              <Route path="/browse" element={<BrowseByGenre />} />
              <Route path="/book/*" element={<BookDetails />} />
              <Route path="/add-book" element={<AddCustomBook />} />
              <Route path="/lists/browse" element={<BrowseLists />} />
              <Route path="/lists/:listId" element={<ListDetail />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/libraries" element={<Libraries />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/profile/:username/edit" element={<EditProfile />} />
              <Route path="/stats" element={<ReadingStats />} />
              <Route path="/users" element={<UserSearch />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/messages" element={<MessagesLayout />} />
              <Route path="/messages/:userId" element={<MessagesLayout />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;