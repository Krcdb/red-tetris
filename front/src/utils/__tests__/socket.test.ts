import { describe, it, expect, vi, beforeEach } from "vitest";

// `front/src/test/setup.ts` globally mocks `../utils/socket`. Undo that here
// so we exercise the real module, but keep the `socket.io-client` mock so we
// don't open a network connection.
vi.unmock("../socket");

const { ioMock, fakeSocket } = vi.hoisted(() => {
  const fakeSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: false,
    id: "",
  };
  return { ioMock: vi.fn(() => fakeSocket), fakeSocket };
});

vi.mock("socket.io-client", () => ({ io: ioMock }));

describe("utils/socket", () => {
  beforeEach(() => {
    vi.resetModules();
    ioMock.mockClear();
    fakeSocket.on.mockClear();
  });

  it("creates a socket, assigns it to window.socket and registers lifecycle handlers", async () => {
    delete (window as unknown as { socket?: unknown }).socket;

    const mod = await import("../socket");

    expect(ioMock).toHaveBeenCalledTimes(1);
    const [url, opts] = ioMock.mock.calls[0] as unknown as [
      string,
      Record<string, unknown>,
    ];
    expect(typeof url).toBe("string");
    expect(url).toContain("://");
    expect(opts).toMatchObject({
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    expect(mod.default).toBe(fakeSocket);
    expect((window as unknown as { socket: unknown }).socket).toBe(fakeSocket);

    const events = fakeSocket.on.mock.calls.map(([name]) => name);
    expect(events).toContain("connect_error");
  });

  it("prefers window.__BACKEND_URL__ when present", async () => {
    (window as unknown as { __BACKEND_URL__?: string }).__BACKEND_URL__ =
      "http://example.test:1234";

    await import("../socket");

    expect(ioMock).toHaveBeenCalledWith(
      "http://example.test:1234",
      expect.objectContaining({ autoConnect: true }),
    );

    delete (window as unknown as { __BACKEND_URL__?: string }).__BACKEND_URL__;
  });

  it("registered handlers are callable without throwing", async () => {
    await import("../socket");

    const handlers = Object.fromEntries(fakeSocket.on.mock.calls) as Record<
      string,
      (arg?: unknown) => void
    >;

    expect(() => handlers.connect_error(new Error("boom"))).not.toThrow();
  });
});
