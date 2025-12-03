import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import styles from './MainLayout.module.css'

function MainLayout(): React.JSX.Element {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
