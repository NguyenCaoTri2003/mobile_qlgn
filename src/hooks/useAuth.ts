import { useEffect, useState } from "react";
import { authService } from "../services/auth.service";

export default function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const u = await authService.getUser();
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return {
    user,
    loading,
    reload: loadUser
  };
}