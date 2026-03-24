import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import HomePage from './pages/HomePage'
import GraphPage from './pages/GraphPage'

function Root() {
  const darkMode = useAppStore((s) => s.darkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return <Outlet />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'graph/:graphId', element: <GraphPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
