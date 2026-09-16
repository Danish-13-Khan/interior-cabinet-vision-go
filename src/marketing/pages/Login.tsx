import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlannerAuthLayout } from "../components/PlannerAuthLayout";
import { PasswordField } from "../components/PasswordField";
import { createSession } from "../lib/auth";
import { useTheme } from "../lib/theme";

export function Login() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    createSession({
      email: email.trim() || "you@showroom.com",
      theme,
    });
    navigate("/app");
  };

  return (
    <PlannerAuthLayout
      title="Log in"
      subtitle="Open your cabinet jobs, room templates, and workflow home."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            className="form-input"
            type="email"
            id="email"
            name="email"
            placeholder="you@showroom.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          value={password}
          autoComplete="current-password"
          onChange={setPassword}
        />
        <button type="submit" className="planner-auth-submit">
          Log in
        </button>
      </form>
    </PlannerAuthLayout>
  );
}
