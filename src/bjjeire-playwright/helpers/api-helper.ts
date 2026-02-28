import type { APIRequestContext } from '@playwright/test';

export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  async get<T>(path: string): Promise<T> {
    const response = await this.request.get(path);
    if (!response.ok()) {
      throw new Error(`GET ${path} failed: ${response.status()} ${response.statusText()}`);
    }
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await this.request.post(path, { data: body });
    if (!response.ok()) {
      throw new Error(`POST ${path} failed: ${response.status()} ${response.statusText()}`);
    }
    return response.json() as Promise<T>;
  }

  async delete(path: string): Promise<void> {
    const response = await this.request.delete(path);
    if (!response.ok()) {
      throw new Error(`DELETE ${path} failed: ${response.status()} ${response.statusText()}`);
    }
  }
}
