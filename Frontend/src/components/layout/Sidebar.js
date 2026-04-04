import { NavLink } from 'react-router-dom';
import { FaChartLine, FaListCheck, FaRegClock } from 'react-icons/fa6';

const navItems = [
  { label: 'Dashboard', to: '/', icon: FaChartLine, end: true },
  { label: 'Focus Timer', to: '/focus', icon: FaRegClock },
  { label: 'Tasks', to: '/tasks', icon: FaListCheck },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">M</div>
        <div>
          <strong>MindMate</strong>
          <span>Student workspace</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
