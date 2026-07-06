import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatPanel from "@/components/ChatPanel";
import { api } from "@/lib/api";
import * as sse from "@/lib/sse";

jest.mock("@/lib/api");
jest.mock("@/lib/sse");

const mockResume = { id: 1, user_id: "default", yaml_content: "cv:\n  name: Test", updated_at: "" };

test("renders chat input and send button", async () => {
  (api.getChatHistory as jest.Mock).mockResolvedValue([]);
  render(<ChatPanel masterResume={mockResume} onAction={jest.fn()} />);
  await waitFor(() => expect(screen.getByTestId("chat-input")).toBeInTheDocument());
  expect(screen.getByTestId("chat-send")).toBeInTheDocument();
});

test("displays message after send", async () => {
  (api.getChatHistory as jest.Mock).mockResolvedValue([]);
  async function* mockStream() {
    yield { event: "token", data: { delta: "Hello!" } };
    yield { event: "done", data: { result: { text: "Hello!", action: null } } };
  }
  (sse.readSseStream as jest.Mock).mockReturnValue(mockStream());
  render(<ChatPanel masterResume={mockResume} onAction={jest.fn()} />);
  await waitFor(() => screen.getByTestId("chat-input"));
  fireEvent.change(screen.getByTestId("chat-input"), { target: { value: "Hi" } });
  fireEvent.click(screen.getByTestId("chat-send"));
  await waitFor(() => expect(screen.getAllByTestId("chat-message").length).toBeGreaterThan(0));
});
