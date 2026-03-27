// Setup global mocks for all tests

// Mock Next.js server modules
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => ({
        _body: data,
        status: init?.status ?? 200,
        json: async () => data,
      }),
    },
    NextRequest: class NextRequest {
      private _body: unknown
      constructor(_url: string, init?: { body?: string }) {
        try {
          this._body = init?.body ? JSON.parse(init.body) : {}
        } catch {
          this._body = {}
        }
      }
      async json() { return this._body }
    },
  }
})
