import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  switchToOther: () => void;
}

export const LoginModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  switchToOther,
}) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      showToast("Welcome back! Logged in successfully.", "success");
      onClose();
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log in" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-dark mb-2">Welcome to StayNest</h2>
        
        {error && (
          <div className="p-3 bg-brand/10 border border-brand/20 text-brand text-xs rounded-airbnb">
            {error}
          </div>
        )}

        <Input
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <Button type="submit" variant="brand" fullWidth isLoading={loading} className="mt-2">
          Continue
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-gray"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">or</span>
          <div className="flex-grow border-t border-border-gray"></div>
        </div>

        <p className="text-sm text-muted text-center">
          First time here?{" "}
          <button
            type="button"
            onClick={switchToOther}
            className="text-dark font-bold hover:underline"
            disabled={loading}
          >
            Create an account
          </button>
        </p>
      </form>
    </Modal>
  );
};

export const RegisterModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  switchToOther,
}) => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guest" | "host">("guest");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ name, email, password, role });
      showToast(`Welcome! Account registered successfully as ${role}.`, "success");
      onClose();
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please check your inputs.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign up" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-dark mb-2">Create your account</h2>

        {error && (
          <div className="p-3 bg-brand/10 border border-brand/20 text-brand text-xs rounded-airbnb">
            {error}
          </div>
        )}

        <Input
          type="text"
          label="Full Name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />

        <Input
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-dark uppercase">I want to register as a</label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              type="button"
              onClick={() => setRole("guest")}
              className={`py-3 px-4 border rounded-airbnb text-sm font-semibold transition-all ${
                role === "guest"
                  ? "border-dark bg-dark text-white"
                  : "border-border-gray hover:border-dark text-dark"
              }`}
              disabled={loading}
            >
              Guest (to Book)
            </button>
            <button
              type="button"
              onClick={() => setRole("host")}
              className={`py-3 px-4 border rounded-airbnb text-sm font-semibold transition-all ${
                role === "host"
                  ? "border-dark bg-dark text-white"
                  : "border-border-gray hover:border-dark text-dark"
              }`}
              disabled={loading}
            >
              Host (to Rent)
            </button>
          </div>
        </div>

        <Button type="submit" variant="brand" fullWidth isLoading={loading} className="mt-2">
          Agree & Continue
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-gray"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">or</span>
          <div className="flex-grow border-t border-border-gray"></div>
        </div>

        <p className="text-sm text-muted text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={switchToOther}
            className="text-dark font-bold hover:underline"
            disabled={loading}
          >
            Log in
          </button>
        </p>
      </form>
    </Modal>
  );
};
