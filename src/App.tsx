import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { IssueReturn } from './pages/IssueReturn';
import { AddBook } from './pages/AddBook';
import { AddStudent } from './pages/AddStudent';
import { StudentProfile } from './pages/StudentProfile';
import LibraryOverview from "./pages/LibraryOverview";
import RegisteredStudents from "./pages/RegisteredStudents";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issue-return"
            element={
              <ProtectedRoute>
                <IssueReturn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-book"
            element={
              <ProtectedRoute>
                <AddBook />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-student"
            element={
              <ProtectedRoute>
                <AddStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-profile"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/library-details" 
            element={
              <ProtectedRoute>
                <LibraryOverview />
                </ProtectedRoute>
            } 
          />
          <Route 
            path="/students-list" 
            element={
              <ProtectedRoute>
                <RegisteredStudents/>
                </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
