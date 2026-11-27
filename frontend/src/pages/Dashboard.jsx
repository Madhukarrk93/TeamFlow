import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboardData } from "../services/dashboardService";
import { Link } from "react-router-dom";

function Dashboard() {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardData();
        setStats(data);
      } catch (err) {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cards = [
    { title: "Total Projects", value: stats.totalProjects },
    { title: "Total Tasks", value: stats.totalTasks },
    { title: "Completed Tasks", value: stats.completedTasks },
    { title: "Pending Tasks", value: stats.pendingTasks },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>TeamFlow</h1>

        <div>
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <h2>Dashboard Overview</h2>
        <p>Welcome to your TeamFlow workspace.</p>
        <Link to="/projects" className="projects-link">
  View Projects
</Link>
<Link to="/tasks" className="projects-link">
  View Tasks
</Link>
        {loading && <p>Loading dashboard data...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="dashboard-cards">
            {cards.map((card) => (
              <div className="dashboard-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;