
/**
 * ZERO-DEPENDENCY SUPABASE CLIENT (REST Edition)
 * Works even when disk is full (ENOSPC) and libraries cannot be installed.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

class SupabaseRestClient {
  private url: string;
  private key: string;
  private session: any = null;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('supabase_rest_session');
      if (savedSession) this.session = JSON.parse(savedSession);
    }
  }

  get auth() {
    return {
      signUp: async ({ email, password }: any) => {
        const res = await fetch(`${this.url}/auth/v1/signup`, {
          method: 'POST',
          headers: { 'apikey': this.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error_description || data.msg || 'Signup failed');
        return { data, error: null };
      },
      signInWithPassword: async ({ email, password }: any) => {
        const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': this.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');
        this.session = data;
        localStorage.setItem('supabase_rest_session', JSON.stringify(data));
        return { data, error: null };
      },
      signOut: async () => {
        this.session = null;
        localStorage.removeItem('supabase_rest_session');
      },
      updateUser: async ({ password, email, data, current_password }: any) => {
        const payload: any = {};
        if (password) payload.password = password;
        if (email) payload.email = email;
        if (data) payload.data = data;
        if (current_password) payload.current_password = current_password;

        const executeRequest = async (token: string) => {
          return await fetch(`${this.url}/auth/v1/user`, {
            method: 'PUT',
            headers: { 
              'apikey': this.key, 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        };

        let res = await executeRequest(this.session?.access_token);
        let responseData = await res.json();

        // Handle Expired Token
        if (!res.ok && responseData.code === 401) {
          console.warn('[Supabase] Auth token expired during update, refreshing...');
          const newSession = await this.refreshSession();
          if (newSession) {
            res = await executeRequest(newSession.access_token);
            responseData = await res.json();
          }
        }

        if (!res.ok) throw new Error(responseData.error_description || responseData.msg || 'User update failed');
        return { data: responseData, error: null };
      },
      getSession: async () => ({ data: { session: this.session }, error: null }),
      onAuthStateChange: (callback: any) => {
        // Simple mock for auth state changes
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    };
  }

  private async refreshSession() {
    if (!this.session?.refresh_token) return null;
    try {
      const res = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'apikey': this.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.session.refresh_token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Refresh failed');
      this.session = data;
      localStorage.setItem('supabase_rest_session', JSON.stringify(data));
      return data;
    } catch (err) {
      this.session = null;
      localStorage.removeItem('supabase_rest_session');
      return null;
    }
  }

  private getHeaders() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.session?.access_token || this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  from(table: string) {
    const baseUrl = `${this.url}/rest/v1/${table}`;

    const request = async (url: string, options: any): Promise<any> => {
      let res = await fetch(url, options);
      let data = await res.json();

      // Handle JWT Expired (PGRST303)
      if (!res.ok && data.code === 'PGRST303') {
        console.warn('[Supabase] JWT Expired, attempting refresh...');
        const newSession = await this.refreshSession();
        if (newSession) {
          options.headers = this.getHeaders(); // Update headers with new token
          res = await fetch(url, options);
          data = await res.json();
        } else {
          window.location.href = '/auth'; // Force re-login if refresh fails
        }
      }
      return { data, error: res.ok ? null : data, status: res.status };
    };

    return {
      select: (query: string = '*') => {
        return {
          eq: async (column: string, value: any) => {
            return await request(`${baseUrl}?${column}=eq.${value}`, { headers: this.getHeaders() });
          },
          order: (column: string, { ascending }: any) => {
             return {
                eq: async (col: string, val: any) => {
                  return await request(`${baseUrl}?${col}=eq.${val}&order=${column}.${ascending ? 'asc' : 'desc'}`, { headers: this.getHeaders() });
                }
             }
          }
        };
      },
      insert: async (values: any[]) => {
        const headers = this.getHeaders();
        return await request(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(values)
        });
      },
      update: (values: any) => {
        return {
          eq: async (column: string, value: any) => {
            return await request(`${baseUrl}?${column}=eq.${value}`, {
              method: 'PATCH',
              headers: this.getHeaders(),
              body: JSON.stringify(values)
            });
          }
        };
      },
      delete: () => {
        return {
          eq: async (column: string, value: any) => {
            const res = await fetch(`${baseUrl}?${column}=eq.${value}`, {
              method: 'DELETE',
              headers: this.getHeaders()
            });
            return { error: res.ok ? null : await res.json() };
          }
        };
      }
    };
  }
}

export const supabase = new SupabaseRestClient(supabaseUrl, supabaseAnonKey);
