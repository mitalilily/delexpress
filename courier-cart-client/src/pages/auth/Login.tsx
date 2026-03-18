import LoginForm from '../../components/auth/LoginForm'
import FullScreenLoader from '../../components/UI/loader/FullScreenLoader'
import { useAuth } from '../../context/auth/AuthContext'

export default function Login() {
  const { loading } = useAuth()

  if (loading) return <FullScreenLoader />

  return <LoginForm />
}
