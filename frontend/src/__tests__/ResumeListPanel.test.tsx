import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResumeListPanel from "@/components/ResumeListPanel";
import { api } from "@/lib/api";

jest.mock("@/lib/api");
jest.mock("@/components/PdfPreview", () => ({
  __esModule: true,
  default: () => <div data-testid="pdf-preview-mock" />,
}));

const mockItems = [
  { id: 1, user_id: "default", name: "Resume A", job_description: "JD A", pdf_path: "1.pdf", created_at: "2026-01-02T00:00:00", updated_at: "2026-01-02T00:00:00" },
  { id: 2, user_id: "default", name: "Resume B", job_description: "JD B", pdf_path: "2.pdf", created_at: "2026-01-01T00:00:00", updated_at: "2026-01-01T00:00:00" },
];

test("renders resume list items", async () => {
  (api.listResumes as jest.Mock).mockResolvedValue({ items: mockItems, total: 2, page: 1, limit: 20 });
  render(<ResumeListPanel selected={null} onSelect={jest.fn()} />);
  await waitFor(() => expect(screen.getAllByTestId("resume-list-item")).toHaveLength(2));
});

test("sort buttons call api with correct sort field", async () => {
  (api.listResumes as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
  render(<ResumeListPanel selected={null} onSelect={jest.fn()} />);
  fireEvent.click(screen.getByTestId("sort-jd"));
  await waitFor(() => expect(api.listResumes).toHaveBeenCalledWith("jd", "desc"));
});
