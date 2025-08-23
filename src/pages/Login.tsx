import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Briefcase } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Connexion
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in successfully');
      } else {
        // Inscription
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered successfully');
      }
      
      // Redirection vers le dashboard
      navigate('/');
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Messages d'erreur en français
      switch (error.code) {
        case 'auth/user-not-found':
          setError('Aucun compte trouvé avec cette adresse email');
          break;
        case 'auth/wrong-password':
          setError('Mot de passe incorrect');
          break;
        case 'auth/email-already-in-use':
          setError('Cette adresse email est déjà utilisée');
          break;
        case 'auth/weak-password':
          setError('Le mot de passe est trop faible');
          break;
        case 'auth/invalid-email':
          setError('Adresse email invalide');
          break;
        case 'auth/too-many-requests':
          setError('Trop de tentatives. Veuillez réessayer plus tard');
          break;
        case 'auth/invalid-credential':
          setError('Email ou mot de passe incorrect');
          break;
        default:
          setError('Une erreur est survenue. Veuillez réessayer');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-soft mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">ImportPro</h1>
          <p className="text-sm sm:text-base text-neutral-600">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* Form */}
        <div className="card-elevated p-6 sm:p-8 mobile-card-stack">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mobile-form-stack">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11 touch-input"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11 touch-input"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors touch-target"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only for registration) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-11 touch-input"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                <p className="text-error-700 text-xs sm:text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3 touch-target"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLogin ? 'Se connecter' : 'Créer un compte'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-neutral-600 text-xs sm:text-sm">
              {isLogin ? "Vous n'avez pas de compte ?" : 'Vous avez déjà un compte ?'}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 text-primary-600 hover:text-primary-700 font-medium transition-colors touch-target"
              >
                {isLogin ? 'Créer un compte' : 'Se connecter'}
              </button>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs sm:text-sm font-medium mb-2">Compte de démonstration :</p>
            <p className="text-blue-700 text-xs mobile-text-xs">Email: admin@importpro.com</p>
            <p className="text-blue-700 text-xs mobile-text-xs">Mot de passe: demo123</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-neutral-500 text-xs sm:text-sm mobile-text-xs">
            © 2024 ImportPro. Système de gestion des devis d'importation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;