import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "../../styles/planner-auth.css";

type PlannerAuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function PlannerAuthLayout({
  title,
  subtitle,
  children,
  footer,
}: PlannerAuthLayoutProps) {
  return (
    <div className="planner-auth">
      <header className="planner-auth-bar">
        <Link to="/">Cabinet Planner</Link>
      </header>
      <main className="planner-auth-main">
        <div className="planner-auth-card">
          <h1>{title}</h1>
          <p className="planner-auth-sub">{subtitle}</p>
          {children}
          <p className="planner-auth-footer">{footer}</p>
        </div>
      </main>
    </div>
  );
}
