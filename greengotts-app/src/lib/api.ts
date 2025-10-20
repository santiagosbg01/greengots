// API client for Greengotts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; database: string }>> {
    return this.request('/health');
  }

  // Authentication
  async getAuthUrl(): Promise<ApiResponse<{ url: string }>> {
    return this.request('/api/auth/google');
  }

  // User management
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/api/user/me');
  }

  // Teams
  async getTeams(): Promise<ApiResponse<any[]>> {
    return this.request('/api/teams');
  }

  async createTeam(team: any): Promise<ApiResponse<any>> {
    return this.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  }

  // Budgets
  async getBudgets(teamId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/teams/${teamId}/budgets`);
  }

  async createBudget(teamId: string, budget: any): Promise<ApiResponse<any>> {
    return this.request(`/api/teams/${teamId}/budgets`, {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
