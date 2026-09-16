import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlannerAuthLayout } from "../components/PlannerAuthLayout";
import { PasswordField } from "../components/PasswordField";
import { createSession } from "../lib/auth";
import { useTheme } from "../lib/theme";

export function Register() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    createSession({
      email: email.trim() || "you@showroom.com",
      company: company.trim() || undefined,
      theme,
    });
    navigate("/app");
  };

  return (
    <PlannerAuthLayout
      title="Create your account"
      subtitle="Start from a room template, then plan, design, and prepare production."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="first">
              First name
            </label>
            <input
              className="form-input"
              type="text"
              id="first"
              name="first"
              placeholder="Alex"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="last">
              Last name
            </label>
            <input
              className="form-input"
              type="text"
              id="last"
              name="last"
              placeholder="Rivera"
              value={last}
              onChange={(e) => setLast(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="company">
            Company
          </label>
          <input
            className="form-input"
            type="text"
            id="company"
            name="company"
            placeholder="Showroom or dealer name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Work email
          </label>
          <input
            className="form-input"
            type="email"
            id="email"
            name="email"
            placeholder="you@showroom.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          value={password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          onChange={setPassword}
        />
        <p className="form-hint">By registering you agree to the terms of service.</p>
        <button type="submit" className="planner-auth-submit">
          Register
        </button>
      </form>
    </PlannerAuthLayout>
  );
}
