import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="nf-page">
      <div className="nf-content">
        <span className="nf-kanji">迷子</span>
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page Not Found</h1>
        <p className="nf-desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="nf-actions">
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
